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

    // Get open time blocks
    const userIds = teamMembers.map((m) => m.user_id).filter(Boolean)

    const { data: activeBlocks } = await supabase
      .from("time_blocks")
      .select("*")
      .in("user_id", userIds)
      .eq("practice_id", practiceId)
      .eq("is_open", true)
      .order("start_time", { ascending: false })

    // Get active breaks
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

    // Combine
    const members = teamMembers.map((member) => {
      const activeBlock = (activeBlocks || []).find((b) => b.user_id === member.user_id)
      const activeBreak = activeBlock
        ? activeBreaks.find((br: any) => br.time_block_id === activeBlock.id)
        : null

      return {
        ...member,
        activeBlock: activeBlock || null,
        activeBreak: activeBreak || null,
        status: activeBreak ? "break" : activeBlock ? "working" : "idle",
      }
    })

    return NextResponse.json({ members })
  } catch (error) {
    return handleApiError(error)
  }
}
