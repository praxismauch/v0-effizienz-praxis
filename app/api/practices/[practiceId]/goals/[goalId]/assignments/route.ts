import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; goalId: string }> },
) {
  const { practiceId, goalId } = await params
  const supabase = await createAdminClient()

  try {
    const { data: assignments, error: assignmentsError } = await supabase
      .from("goal_assignments")
      .select("*")
      .eq("goal_id", goalId)

    if (assignmentsError) {
      if (assignmentsError.code === "42P01" || assignmentsError.message?.includes("does not exist")) {
        // Table doesn't exist - return empty assignments
        return NextResponse.json({ assignments: [] })
      }
      return NextResponse.json(
        { error: assignmentsError.message || "Failed to fetch goal assignments" },
        { status: 500 },
      )
    }

    if (!assignments || assignments.length === 0) {
      return NextResponse.json({ assignments: [] })
    }

    const teamMemberIds = assignments.map((a: any) => a.team_member_id)

    if (teamMemberIds.length === 0) {
      return NextResponse.json({ assignments: [] })
    }

    const { data: teamMembers, error: teamMembersError } = await supabase
      .from("team_members")
      .select("id, user_id, practice_id, first_name, last_name, users(first_name, last_name, is_active, role)")
      .in("id", teamMemberIds)

    if (teamMembersError) {
      return NextResponse.json({ error: teamMembersError.message || "Failed to fetch team members" }, { status: 500 })
    }

    const activeTeamMembers = (teamMembers || []).filter((tm: any) => {
      if (tm.user_id && tm.users) {
        return tm.users.is_active && tm.users.role !== "superadmin"
      }
      return true
    })

    const userIds = activeTeamMembers?.map((tm: any) => tm.user_id).filter(Boolean) || []

    let usersData: any[] = []
    if (userIds.length > 0) {
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id, first_name, last_name, email, avatar")
        .in("id", userIds)

      if (usersError) {
        return NextResponse.json({ error: usersError.message || "Failed to fetch users" }, { status: 500 })
      }

      usersData = users || []
    }

    const enrichedAssignments = (assignments || []).map((assignment: any) => {
      const teamMember = (activeTeamMembers || []).find((tm: any) => tm.id === assignment.team_member_id)
      const user = teamMember?.users || null

      return {
        ...assignment,
        team_members: teamMember
          ? {
              ...teamMember,
              users: user
                ? user
                : {
                    first_name: teamMember.first_name,
                    last_name: teamMember.last_name,
                    is_active: true,
                    role: "user",
                  },
            }
          : null,
      }
    })

    return NextResponse.json({ assignments: enrichedAssignments })
  } catch (error: any) {
    console.error("Error fetching goal assignments:", error)
    const errorMessage = error?.message || error?.toString() || "Failed to fetch goal assignments"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; goalId: string }> },
) {
  const { practiceId, goalId } = await params
  const supabase = await createAdminClient()

  try {
    const body = await request.json()
    const { teamMemberIds, assignedBy } = body

    // If no team members provided, delete all existing assignments and return
    if (!teamMemberIds || teamMemberIds.length === 0) {
      const { error: deleteError } = await supabase.from("goal_assignments").delete().eq("goal_id", goalId)
      if (deleteError && deleteError.code !== "42P01" && !deleteError.message?.includes("does not exist")) {
        throw deleteError
      }
      return NextResponse.json({ success: true, assignedCount: 0, cleared: true })
    }

    let actualTeamMemberIds: string[] = []

    const { data: allMembers, error: allMembersError } = await supabase
      .from("team_members")
      .select("id, practice_id, user_id, first_name, last_name, status")
      .eq("practice_id", practiceId)
      .eq("status", "active")

    if (allMembersError) {
      throw allMembersError
    }

    const validMembers = allMembers?.filter(
      (m: any) =>
        m.first_name &&
        m.last_name &&
        m.first_name.trim() !== "" &&
        m.last_name.trim() !== "" &&
        m.first_name.toLowerCase() !== "null" &&
        m.last_name.toLowerCase() !== "null",
    )

    const matchingByUserId = validMembers?.filter((m: any) => teamMemberIds.includes(m.user_id)) || []
    const matchingById = validMembers?.filter((m: any) => teamMemberIds.includes(m.id)) || []

    if (matchingByUserId.length > 0) {
      actualTeamMemberIds = matchingByUserId.map((m: any) => m.id)

      const validUserIds = new Set(matchingByUserId.map((m: any) => m.user_id))
      const invalidIds = teamMemberIds.filter((id: string) => !validUserIds.has(id))

      if (invalidIds.length > 0) {
        return NextResponse.json(
          {
            error: "Some users are not team members in this practice",
            invalidIds,
            validUserIds: Array.from(validUserIds),
            allMembersInPractice: validMembers?.map((m: any) => ({ id: m.id, user_id: m.user_id })) || [],
            message: `Die folgenden Benutzer-IDs sind keine Teammitglieder: ${invalidIds.join(", ")}`,
          },
          { status: 400 },
        )
      }
    } else if (matchingById.length > 0) {
      actualTeamMemberIds = teamMemberIds

      const validTeamMemberIds = new Set(matchingById.map((m: any) => m.id))
      const invalidIds = teamMemberIds.filter((id: string) => !validTeamMemberIds.has(id))

      if (invalidIds.length > 0) {
        return NextResponse.json(
          {
            error: "Some team members do not exist in this practice",
            invalidIds,
            validIds: Array.from(validTeamMemberIds),
            allMembersInPractice: validMembers?.map((m: any) => ({ id: m.id, user_id: m.user_id })) || [],
            message: `Die folgenden Team-Mitglied-IDs existieren nicht: ${invalidIds.join(", ")}`,
          },
          { status: 400 },
        )
      }
    } else {
      return NextResponse.json(
        {
          error: "None of the provided IDs match team members in this practice",
          invalidIds: teamMemberIds,
          allMembersInPractice: validMembers?.map((m: any) => ({ id: m.id, user_id: m.user_id })) || [],
          message: "Keine der angegebenen IDs sind Teammitglieder in dieser Praxis",
        },
        { status: 400 },
      )
    }

    const { error: deleteError } = await supabase.from("goal_assignments").delete().eq("goal_id", goalId)

    if (deleteError && deleteError.code !== "42P01" && !deleteError.message?.includes("does not exist")) {
      throw deleteError
    }

    if (actualTeamMemberIds.length > 0) {
      const assignments = actualTeamMemberIds.map((teamMemberId: string) => ({
        goal_id: goalId,
        team_member_id: teamMemberId,
        assigned_by: assignedBy,
      }))

      const { error: insertError } = await supabase.from("goal_assignments").insert(assignments).select()

      if (insertError) {
        if (insertError.code === "42P01" || insertError.message?.includes("does not exist")) {
          return NextResponse.json({
            success: true,
            assignedCount: 0,
            warning: "goal_assignments table does not exist - assignments not saved",
          })
        }
        throw insertError
      }
    }

    return NextResponse.json({ success: true, assignedCount: actualTeamMemberIds.length })
  } catch (error: any) {
    console.error("Error managing goal assignments:", error)
    const errorMessage = error?.message || error?.toString() || "Failed to manage goal assignments"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
