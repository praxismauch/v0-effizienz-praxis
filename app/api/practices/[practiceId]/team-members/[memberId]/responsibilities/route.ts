import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server"

// GET - Fetch responsibilities for a specific team member
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; memberId: string }> }
) {
  try {
    const { practiceId, memberId } = await params
    const supabase = await createClient()
    const adminClient = await createAdminClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] Fetching responsibilities for member:", memberId, "in practice:", practiceId)

    // Get team member's user_id
    const { data: teamMemberData, error: memberError } = await adminClient
      .from("team_members")
      .select("user_id")
      .eq("id", memberId)
      .single()

    if (memberError) throw memberError

    const authUserId = teamMemberData?.user_id
    let memberTeamIds: string[] = []

    // Get team assignments
    if (authUserId) {
      const { data: teamAssignments } = await adminClient
        .from("team_assignments")
        .select("team_id, teams(id, name, color)")
        .eq("user_id", authUserId)

      memberTeamIds = teamAssignments?.map((ta: any) => ta.team_id) || []
    }

    // Fetch all responsibilities for the practice
    const { data: allResponsibilities, error: respError } = await adminClient
      .from("responsibilities")
      .select("*")
      .eq("practice_id", practiceId)
      .order("name")

    if (respError) throw respError

    // Filter responsibilities assigned to this member
    // responsible_user_id can be either team_member.id OR auth.user_id depending on how it was saved
    const responsibilities = (allResponsibilities || []).map((resp: any) => {
      const teamMemberIds = resp.team_member_ids || []
      const assignedTeams = resp.assigned_teams || []

      let assignmentType: "direct" | "team_member" | "team" | "deputy" | undefined
      let assignmentTeamName: string | undefined

      // Check if this member is the responsible person
      // responsible_user_id could be team_member.id or auth user_id
      if (resp.responsible_user_id === memberId || resp.responsible_user_id === authUserId) {
        assignmentType = "direct"
      } else if (teamMemberIds.includes(memberId)) {
        assignmentType = "team_member"
      } else if (assignedTeams.some((teamId: string) => memberTeamIds.includes(teamId))) {
        assignmentType = "team"
      } else if (resp.deputy_user_id === memberId || resp.deputy_user_id === authUserId) {
        assignmentType = "deputy"
      }

      return {
        ...resp,
        assignment_type: assignmentType,
        assignment_team_name: assignmentTeamName,
      }
    }).filter((resp: any) => resp.assignment_type)

    return NextResponse.json(responsibilities)
  } catch (error: any) {
    console.error("[v0] Error fetching team member responsibilities:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch responsibilities" },
      { status: 500 }
    )
  }
}
