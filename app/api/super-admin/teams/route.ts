import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { isSuperAdminRole } from "@/lib/auth-utils"

// GET /api/super-admin/teams - Get all teams across all practices with statistics
export async function GET() {
  try {
    const supabase = await createClient()

    // Get current user and check authorization
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })
    }

    // Get user role from database
    const { data: userData, error: userDataError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userDataError || !userData) {
      return NextResponse.json({ error: "Benutzer nicht gefunden" }, { status: 404 })
    }

    if (!isSuperAdminRole(userData.role)) {
      return NextResponse.json({ error: "Keine Berechtigung - Nur Super-Admins" }, { status: 403 })
    }

    // Fetch all teams with practice info and member counts
    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .select(`
        id,
        practice_id,
        name,
        description,
        color,
        is_active,
        is_default,
        created_at,
        updated_at
      `)
      .order("name", { ascending: true })

    if (teamsError) {
      console.error("[v0] Error fetching teams:", teamsError)

      if (teamsError.code === "42P01" || teamsError.message?.includes("does not exist")) {
        return NextResponse.json({
          teams: [],
          stats: {
            total: 0,
            active: 0,
            inactive: 0,
            defaultTeams: 0,
            practicesWithTeams: 0,
            totalMembers: 0,
          },
          error:
            "Die Tabelle 'teams' existiert nicht. Bitte führen Sie das SQL-Script 070_create_teams_tables.sql aus.",
          code: "TABLE_NOT_FOUND",
        })
      }

      return NextResponse.json({ error: teamsError.message }, { status: 500 })
    }

    // Fetch practices for mapping
    const { data: practices } = await supabase.from("practices").select("id, name, color").is("deleted_at", null)

    const practiceMap = new Map(practices?.map((p) => [p.id, p]) || [])

    // Fetch team member counts from team_assignments
    const { data: teamAssignments } = await supabase.from("team_assignments").select("team_id, user_id")

    const memberCounts = new Map<string, number>()
    teamAssignments?.forEach((ta) => {
      const count = memberCounts.get(ta.team_id) || 0
      memberCounts.set(ta.team_id, count + 1)
    })

    // Build response with enriched data
    const enrichedTeams =
      teams?.map((team) => ({
        ...team,
        practice: practiceMap.get(team.practice_id) || null,
        memberCount: memberCounts.get(team.id) || 0,
      })) || []

    // Calculate statistics
    const stats = {
      total: enrichedTeams.length,
      active: enrichedTeams.filter((t) => t.is_active).length,
      inactive: enrichedTeams.filter((t) => !t.is_active).length,
      defaultTeams: enrichedTeams.filter((t) => t.is_default).length,
      practicesWithTeams: new Set(enrichedTeams.map((t) => t.practice_id)).size,
      totalMembers: Array.from(memberCounts.values()).reduce((a, b) => a + b, 0),
    }

    return NextResponse.json({
      teams: enrichedTeams,
      stats,
    })
  } catch (error) {
    console.error("[v0] Error in GET /api/super-admin/teams:", error)
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 })
  }
}
