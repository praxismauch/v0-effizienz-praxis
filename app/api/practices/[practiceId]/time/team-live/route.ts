import { requirePracticeAccess, handleApiError } from "@/lib/api-helpers"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string }> }
) {
  try {
    const { practiceId } = await params
    if (!practiceId) {
      return NextResponse.json({ error: "Practice ID required" }, { status: 400 })
    }

    const { adminClient: supabase } = await requirePracticeAccess(practiceId)

    // Get active team members
    const { data: teamMembers, error: teamError } = await supabase
      .from("team_members")
      .select("id, user_id, first_name, last_name, email")
      .eq("practice_id", practiceId)
      .eq("status", "active")

    if (teamError) {
      console.error("[API] Error fetching team members:", teamError)
      return NextResponse.json({ error: teamError.message }, { status: 500 })
    }

    if (!teamMembers || teamMembers.length === 0) {
      return NextResponse.json({ members: [] })
    }

    const userIds = teamMembers.map((m) => m.user_id).filter(Boolean)
    const today = new Date().toISOString().split("T")[0]

    // Get open (active) time blocks
    const { data: activeBlocks } = await supabase
      .from("time_blocks")
      .select("*")
      .in("user_id", userIds)
      .eq("practice_id", practiceId)
      .eq("is_open", true)
      .order("start_time", { ascending: false })

    // Get all of today's completed blocks for calculating today_minutes
    const { data: todayBlocks } = await supabase
      .from("time_blocks")
      .select("*")
      .in("user_id", userIds)
      .eq("practice_id", practiceId)
      .eq("date", today)

    // Get active breaks for open blocks
    const blockIds = (activeBlocks || []).map((b) => b.id)
    let activeBreaks: Record<string, unknown>[] = []

    if (blockIds.length > 0) {
      const { data: breaks } = await supabase
        .from("time_block_breaks")
        .select("*")
        .in("time_block_id", blockIds)
        .is("end_time", null)

      activeBreaks = breaks || []
    }

    // Combine data for each member
    const members = teamMembers.map((member) => {
      const activeBlock = (activeBlocks || []).find((b) => b.user_id === member.user_id)
      const activeBreak = activeBlock
        ? activeBreaks.find((br: any) => br.time_block_id === activeBlock.id)
        : null

      // Calculate completed minutes from closed blocks today only
      const memberTodayBlocks = (todayBlocks || []).filter((b) => b.user_id === member.user_id)
      let completedMinutes = 0
      for (const block of memberTodayBlocks) {
        if (!block.is_open && block.net_minutes) {
          completedMinutes += block.net_minutes
        }
      }

      // Map to the shape expected by TeamLiveTab
      const currentStatus = activeBreak ? "break" : activeBlock ? "working" : "absent"

      // start_time is already stored as a full ISO timestamp (e.g. "2026-02-22T16:43:00.000Z")
      const clockInTime = activeBlock?.start_time || null

      return {
        id: member.id,
        first_name: member.first_name,
        last_name: member.last_name,
        email: member.email,
        avatar_url: (member as any).avatar_url || null,
        current_status: currentStatus,
        current_location: activeBlock?.work_location || null,
        today_minutes: completedMinutes,
        completed_minutes: completedMinutes,
        clock_in_time: clockInTime,
        break_minutes: activeBlock?.break_minutes || 0,
      }
    })

    return NextResponse.json({ members })
  } catch (error) {
    return handleApiError(error)
  }
}
