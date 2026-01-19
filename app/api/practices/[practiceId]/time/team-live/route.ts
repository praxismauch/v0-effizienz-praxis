import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string }> }
) {
  try {
    const { practiceId } = await params
    const supabase = await createAdminClient()

    // Get all team members for this practice
    const { data: teamMembers, error: teamError } = await supabase
      .from("team_members")
      .select("id, user_id, first_name, last_name, email, avatar_url")
      .eq("practice_id", practiceId)
      .eq("status", "active")

    if (teamError) {
      console.error("[v0] Error fetching team members:", teamError)
      return NextResponse.json(
        { error: "Failed to fetch team members", details: teamError.message },
        { status: 500 }
      )
    }

    if (!teamMembers || teamMembers.length === 0) {
      return NextResponse.json({ teamStatus: [] })
    }

    // Get active time blocks for each team member
    const userIds = teamMembers.map((m) => m.user_id).filter(Boolean)
    
    const { data: activeBlocks, error: blocksError } = await supabase
      .from("time_blocks")
      .select("*, time_block_breaks(*)")
      .in("user_id", userIds)
      .eq("practice_id", practiceId)
      .is("end_time", null)
      .order("start_time", { ascending: false })

    if (blocksError) {
      console.error("[v0] Error fetching active blocks:", blocksError)
      return NextResponse.json(
        { error: "Failed to fetch active blocks", details: blocksError.message },
        { status: 500 }
      )
    }

    // Combine team members with their active blocks
    const teamStatus = teamMembers.map((member) => {
      const activeBlock = activeBlocks?.find((b) => b.user_id === member.user_id)
      const activeBreak = activeBlock?.time_block_breaks?.find(
        (br: any) => !br.end_time
      )

      return {
        ...member,
        activeBlock: activeBlock || null,
        activeBreak: activeBreak || null,
        status: activeBreak ? "break" : activeBlock ? "working" : "idle",
      }
    })

    return NextResponse.json({ teamStatus })
  } catch (error) {
    console.error("[v0] Error in team-live API:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
