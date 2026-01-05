import { createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { isRateLimitError } from "@/lib/supabase/safe-query"

async function syncDefaultTeamsForPractice(supabase: any, practiceId: string) {
  try {
    // Fetch default teams from super admin
    const { data: defaultTeams, error: defaultTeamsError } = await supabase
      .from("default_teams")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true })

    if (defaultTeamsError || !defaultTeams || defaultTeams.length === 0) {
      return []
    }

    // Insert default teams for this practice
    const teamsToInsert = defaultTeams.map((dt: any) => ({
      practice_id: practiceId,
      name: dt.name,
      description: dt.description || "",
      color: dt.color || "#64748b",
      is_active: true,
    }))

    const { data: insertedTeams, error: insertError } = await supabase.from("teams").insert(teamsToInsert).select()

    if (insertError) {
      console.error("[v0] Error inserting default teams:", insertError)
      return []
    }

    return insertedTeams || []
  } catch (error) {
    console.error("[v0] Error syncing default teams:", error)
    return []
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params

    let supabase
    try {
      supabase = await createAdminClient()
    } catch (clientError) {
      if (isRateLimitError(clientError)) {
        return NextResponse.json([])
      }
      throw clientError
    }

    const practiceIdText = String(practiceId)

    let teams = null
    let error = null
    try {
      const result = await supabase
        .from("teams")
        .select(`
          id,
          name,
          description,
          color,
          is_active,
          created_at,
          team_assignments!left(user_id)
        `)
        .eq("practice_id", practiceIdText)
        .order("name")

      teams = result.data
      error = result.error
    } catch (queryError) {
      if (isRateLimitError(queryError)) {
        return NextResponse.json([])
      }
      return NextResponse.json([])
    }

    if (error) {
      const errorStr = JSON.stringify(error)
      if (
        errorStr.includes("Too Many") ||
        errorStr.includes("SyntaxError") ||
        (error as any)?.message?.includes("Too Many") ||
        (error as any)?.name === "SyntaxError"
      ) {
        return NextResponse.json([])
      }
      return NextResponse.json([])
    }

    if (!teams || teams.length === 0) {
      const syncedTeams = await syncDefaultTeamsForPractice(supabase, practiceIdText)
      if (syncedTeams.length > 0) {
        // Re-fetch to get proper structure with team_assignments
        const { data: newTeams } = await supabase
          .from("teams")
          .select(`
            id,
            name,
            description,
            color,
            is_active,
            created_at,
            team_assignments!left(user_id)
          `)
          .eq("practice_id", practiceIdText)
          .order("name")

        teams = newTeams
      }
    }

    const teamsWithCount =
      teams?.map((team: any) => ({
        id: team.id,
        name: team.name,
        description: team.description || "",
        color: team.color || "#64748b",
        isActive: team.is_active,
        createdAt: team.created_at,
        memberCount: Array.isArray(team.team_assignments) ? team.team_assignments.length : 0,
      })) || []

    return NextResponse.json(teamsWithCount)
  } catch (error) {
    if (isRateLimitError(error)) {
      return NextResponse.json([])
    }
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createAdminClient()
    const body = await request.json()

    const practiceIdText = String(practiceId)

    const { data, error } = await supabase
      .from("teams")
      .insert({
        practice_id: practiceIdText,
        name: body.name,
        description: body.description,
        color: body.color,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Failed to create team" }, { status: 500 })
  }
}
