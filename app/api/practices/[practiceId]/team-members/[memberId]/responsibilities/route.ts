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
      .select("id, user_id")
      .eq("id", memberId)
      .single()

    if (memberError) {
      console.error("[v0] Error fetching team member:", memberError)
      throw memberError
    }

    const authUserId = teamMemberData?.user_id
    console.log("[v0] Team member ID:", memberId, "Auth user ID:", authUserId)
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

    // Build a lookup map of all team members to check both team_member.id and user_id
    const { data: allTeamMembers } = await adminClient
      .from("team_members")
      .select("id, user_id")
      .eq("practice_id", practiceId)
    
    // Create bidirectional lookup: team_member.id <-> user_id
    const teamMemberIdToUserId = new Map<string, string>()
    const userIdToTeamMemberId = new Map<string, string>()
    allTeamMembers?.forEach((tm: any) => {
      if (tm.user_id) {
        teamMemberIdToUserId.set(tm.id, tm.user_id)
        userIdToTeamMemberId.set(tm.user_id, tm.id)
      }
    })
    
    // Filter responsibilities assigned to this member
    // responsible_user_id can be either team_member.id OR auth.user_id depending on how it was saved
    console.log("[v0] Checking responsibilities for member. Member ID:", memberId, "Auth User ID:", authUserId)
    console.log("[v0] Member team IDs:", memberTeamIds)
    console.log("[v0] Total responsibilities to check:", allResponsibilities?.length || 0)
    console.log("[v0] Team member lookup map size:", allTeamMembers?.length || 0)
    
    // Debug: Log first 5 responsibilities to see what IDs they contain
    if (allResponsibilities && allResponsibilities.length > 0) {
      console.log("[v0] Sample responsibilities:")
      allResponsibilities.slice(0, 5).forEach((r: any, i: number) => {
        console.log(`[v0]   ${i+1}. "${r.name}" - responsible_user_id: ${r.responsible_user_id}, deputy: ${r.deputy_user_id}, team_member_ids: ${JSON.stringify(r.team_member_ids)}`)
      })
    }
    
    const responsibilities = (allResponsibilities || []).map((resp: any) => {
      const teamMemberIds = resp.team_member_ids || []
      const assignedTeams = resp.assigned_teams || []

      let assignmentType: "direct" | "team_member" | "team" | "deputy" | undefined
      let assignmentTeamName: string | undefined

      // Check if this member is the responsible person
      // responsible_user_id could be team_member.id OR auth user_id - check both
      const respUserId = resp.responsible_user_id
      const deputyUserId = resp.deputy_user_id
      
      // Convert respUserId to check against both memberId and authUserId
      const respIsTeamMemberId = respUserId === memberId
      const respIsAuthUserId = respUserId === authUserId
      // Also check if respUserId is another team member's user_id that matches our memberId
      const respMatchesViaLookup = respUserId && (
        userIdToTeamMemberId.get(respUserId) === memberId ||
        teamMemberIdToUserId.get(respUserId) === authUserId
      )
      
      const isDirectResponsible = respIsTeamMemberId || respIsAuthUserId || respMatchesViaLookup
      
      // Check team_member_ids array (could contain either type of ID)
      const isInTeamMembers = teamMemberIds.includes(memberId) || 
        (authUserId && teamMemberIds.includes(authUserId)) ||
        teamMemberIds.some((id: string) => userIdToTeamMemberId.get(id) === memberId || teamMemberIdToUserId.get(id) === authUserId)
      
      const isInTeam = assignedTeams.some((teamId: string) => memberTeamIds.includes(teamId))
      
      // Check deputy similarly
      const deputyIsTeamMemberId = deputyUserId === memberId
      const deputyIsAuthUserId = deputyUserId === authUserId
      const deputyMatchesViaLookup = deputyUserId && (
        userIdToTeamMemberId.get(deputyUserId) === memberId ||
        teamMemberIdToUserId.get(deputyUserId) === authUserId
      )
      const isDeputy = deputyIsTeamMemberId || deputyIsAuthUserId || deputyMatchesViaLookup
      
      if (isDirectResponsible) {
        assignmentType = "direct"
        console.log(`[v0] MATCH (direct): "${resp.name}" - respUserId=${respUserId} matches memberId=${memberId} or authUserId=${authUserId}`)
      } else if (isInTeamMembers) {
        assignmentType = "team_member"
        console.log(`[v0] MATCH (team_member): "${resp.name}"`)
      } else if (isInTeam) {
        assignmentType = "team"
        console.log(`[v0] MATCH (team): "${resp.name}"`)
      } else if (isDeputy) {
        assignmentType = "deputy"
        console.log(`[v0] MATCH (deputy): "${resp.name}"`)
      }

      return {
        ...resp,
        assignment_type: assignmentType,
        assignment_team_name: assignmentTeamName,
      }
    }).filter((resp: any) => resp.assignment_type)
    
    console.log("[v0] Final matched responsibilities count:", responsibilities.length, "for member", memberId)

    return NextResponse.json(responsibilities)
  } catch (error: any) {
    console.error("[v0] Error fetching team member responsibilities:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch responsibilities" },
      { status: 500 }
    )
  }
}
