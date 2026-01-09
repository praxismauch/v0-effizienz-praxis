import { type NextRequest, NextResponse } from "next/server"
import { isRateLimitError } from "@/lib/supabase/safe-query"
import { requirePracticeAccess, handleApiError } from "@/lib/api-helpers"

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

    const teamsToInsert = defaultTeams.map((dt: any, index: number) => ({
      practice_id: practiceId,
      name: dt.name,
      description: dt.description || "",
      color: dt.color || "#64748b",
      is_active: true,
      sort_order: dt.display_order ?? index,
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
      const access = await requirePracticeAccess(practiceId)
      supabase = access.adminClient
    } catch (error) {
      return handleApiError(error)
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
          sort_order,
          created_at,
          team_assignments!left(user_id)
        `)
        .eq("practice_id", practiceIdText)
        .order("sort_order", { ascending: true, nullsFirst: false })
        .order("name", { ascending: true })

      teams = result.data
      error = result.error
    } catch (queryError) {
      if (isRateLimitError(queryError)) {
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
            sort_order,
            created_at,
            team_assignments!left(user_id)
          `)
          .eq("practice_id", practiceIdText)
          .order("sort_order", { ascending: true, nullsFirst: false })
          .order("name", { ascending: true })

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
        sortOrder: team.sort_order ?? 0,
        createdAt: team.created_at,
        memberCount: Array.isArray(team.team_assignments) ? team.team_assignments.length : 0,
      })) || []

    return NextResponse.json(teamsWithCount)
  } catch (error) {
    if (isRateLimitError(error)) {
      return NextResponse.json([])
    }
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const { adminClient: supabase } = await requirePracticeAccess(practiceId)
    const body = await request.json()

    const practiceIdText = String(practiceId)

    const { data: existingTeams } = await supabase
      .from("teams")
      .select("sort_order")
      .eq("practice_id", practiceIdText)
      .order("sort_order", { ascending: false })
      .limit(1)

    const maxSortOrder = existingTeams?.[0]?.sort_order ?? -1
    const newSortOrder = maxSortOrder + 1

    const { data, error } = await supabase
      .from("teams")
      .insert({
        practice_id: practiceIdText,
        name: body.name,
        description: body.description,
        color: body.color,
        is_active: true,
        sort_order: newSortOrder,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const { adminClient: supabase } = await requirePracticeAccess(practiceId)
    const body = await request.json()

    const practiceIdText = String(practiceId)

    // Expect body to be { teamIds: string[] } - array of team IDs in new order
    const { teamIds } = body

    if (!Array.isArray(teamIds)) {
      return NextResponse.json({ error: "teamIds must be an array" }, { status: 400 })
    }

    // Update each team's sort_order based on its position in the array
    const updates = teamIds.map((teamId: string, index: number) =>
      supabase.from("teams").update({ sort_order: index }).eq("id", teamId).eq("practice_id", practiceIdText),
    )

    await Promise.all(updates)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error reordering teams:", error)
    return handleApiError(error)
  }
}
