import { createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { safeSupabaseQuery } from "@/lib/supabase/safe-query"

export async function GET(request: NextRequest, { params }: { params: { practiceId: string } }) {
  try {
    const { practiceId } = params

    if (!practiceId) {
      return NextResponse.json({ error: "Practice ID is required" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    const { data: members, error } = await safeSupabaseQuery(
      () =>
        supabase
          .from("team_members")
          .select(`
        id,
        user_id,
        role,
        department,
        status,
        joined_date,
        created_at,
        first_name,
        last_name,
        email,
        users(id, name, email, avatar, is_active, first_name, last_name, role)
      `)
          .eq("practice_id", String(practiceId))
          .eq("status", "active"),
      { data: [], error: null },
    )

    if (error) {
      console.error("[v0] Team members GET error:", error.message)
      return NextResponse.json({ teamMembers: [] })
    }

    if (!members || !Array.isArray(members)) {
      return NextResponse.json({ teamMembers: [] })
    }

    const filteredMembers = members.filter((member: any) => {
      if (member.user_id && member.users) {
        return member.users.is_active && member.users.role !== "superadmin"
      }
      return true
    })

    const userIds = filteredMembers.map((m: any) => m.user_id).filter(Boolean)
    let teamAssignments: any[] = []

    if (userIds.length > 0) {
      const { data: assignments } = await safeSupabaseQuery(
        () => supabase.from("team_assignments").select("user_id, team_id").in("user_id", userIds),
        { data: [], error: null },
      )

      teamAssignments = assignments || []
    }

    const teamMembers = filteredMembers.map((member: any) => ({
      id: member.user_id || member.id,
      name: member.users?.name || `${member.first_name || ""} ${member.last_name || ""}`.trim(),
      email: member.users?.email || member.email || "",
      role: member.role || "user",
      avatar: member.users?.avatar || null,
      practiceId: practiceId,
      isActive: member.status === "active",
      userIsActive: member.users?.is_active ?? true,
      joinedAt: member.joined_date || member.created_at || new Date().toISOString(),
      permissions: [],
      lastActive: new Date().toISOString(),
      teamIds: teamAssignments.filter((ta: any) => ta.user_id === member.user_id).map((ta: any) => ta.team_id) || [],
    }))

    return NextResponse.json(teamMembers || [])
  } catch (error) {
    console.error("[v0] Team GET exception:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json([])
  }
}
