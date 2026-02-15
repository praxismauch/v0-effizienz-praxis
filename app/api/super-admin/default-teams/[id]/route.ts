import { createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/super-admin/default-teams/[id] - Get a specific default team
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params
    const id = String(resolvedParams.id)

    if (!id) {
      return NextResponse.json({ error: "Ungültige Team-ID" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    const { data, error } = await supabase.from("default_teams").select("*").eq("id", id).maybeSingle()

    if (error) {
      console.error("[v0] Error fetching default team:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Team nicht gefunden" }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error in GET /api/super-admin/default-teams/[id]:", error)
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 })
  }
}

// PUT /api/super-admin/default-teams/[id] - Update a default team (alias for PATCH)
export async function PUT(request: NextRequest, props: RouteParams) {
  return PATCH(request, props)
}

// PATCH /api/super-admin/default-teams/[id] - Update a default team
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params
    const id = String(resolvedParams.id)

    if (!id) {
      return NextResponse.json({ error: "Ungültige Team-ID" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    const body = await request.json()
    const { name, color, description, display_order, is_active, syncChanges = true } = body

    // Get current team data for sync comparison
    const { data: currentTeam } = await supabase.from("default_teams").select("name, color").eq("id", id).single()

    // Update default team
    const { data, error } = await supabase
      .from("default_teams")
      .update({
        ...(name !== undefined && { name }),
        ...(color !== undefined && { color }),
        ...(description !== undefined && { description }),
        ...(display_order !== undefined && { display_order }),
        ...(is_active !== undefined && { is_active }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating default team:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Sync changes to practice teams if requested
    let syncedCount = 0
    if (syncChanges && currentTeam) {
      const updates: any = {}
      if (name !== undefined && name !== currentTeam.name) updates.name = name
      if (color !== undefined && color !== currentTeam.color) updates.color = color
      if (description !== undefined) updates.description = description
      if (is_active !== undefined) updates.is_active = is_active

      if (Object.keys(updates).length > 0) {
        updates.updated_at = new Date().toISOString()

        const { data: updatedTeams } = await supabase
          .from("teams")
          .update(updates)
          .eq("name", currentTeam.name)
          .eq("is_default", true)
          .select("id")

        syncedCount = updatedTeams?.length || 0
      }
    }

    return NextResponse.json({
      team: data,
      syncedCount,
      message:
        syncedCount > 0 ? `Team aktualisiert und ${syncedCount} Praxis-Teams synchronisiert` : "Team aktualisiert",
    })
  } catch (error) {
    console.error("[v0] Error in PATCH /api/super-admin/default-teams/[id]:", error)
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 })
  }
}

// DELETE /api/super-admin/default-teams/[id] - Delete a default team
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params
    const id = String(resolvedParams.id)

    if (!id) {
      return NextResponse.json({ error: "Ungültige Team-ID" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // Get team name before deletion for syncing
    const { data: defaultTeam } = await supabase.from("default_teams").select("name").eq("id", id).maybeSingle()

    if (!defaultTeam) {
      return NextResponse.json({ error: "Team nicht gefunden" }, { status: 404 })
    }

    // Delete from default_teams
    const { error } = await supabase.from("default_teams").delete().eq("id", id)

    if (error) {
      console.error("[v0] Error deleting default team:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Delete from all practices (only default teams with same name)
    let deletedFromPractices = 0
    const { data: practiceTeams } = await supabase
      .from("teams")
      .select("id, practice_id")
      .eq("name", defaultTeam.name)
      .eq("is_default", true)

    if (practiceTeams && practiceTeams.length > 0) {
      for (const team of practiceTeams) {
        // First delete team_assignments
        await supabase.from("team_assignments").delete().eq("team_id", team.id)

        // Then delete the team
        const { error: deleteError } = await supabase.from("teams").delete().eq("id", team.id)

        if (!deleteError) {
          deletedFromPractices++
        }
      }
    }

    return NextResponse.json({
      success: true,
      deletedFromPractices,
      message:
        deletedFromPractices > 0 ? `Team gelöscht und aus ${deletedFromPractices} Praxen entfernt` : "Team gelöscht",
    })
  } catch (error) {
    console.error("[v0] Error in DELETE /api/super-admin/default-teams/[id]:", error)
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 })
  }
}
