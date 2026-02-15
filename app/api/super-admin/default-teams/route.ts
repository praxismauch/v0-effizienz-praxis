import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET /api/super-admin/default-teams - Get all default teams
export async function GET() {
  try {
    const supabase = await createAdminClient()

    const { data: defaultTeams, error } = await supabase
      .from("default_teams")
      .select("*")
      .order("display_order", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching default teams:", error)

      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        return NextResponse.json(
          {
            error:
              "Die Tabelle 'default_teams' existiert nicht. Bitte führen Sie das SQL-Script 070_create_teams_tables.sql aus.",
            code: "TABLE_NOT_FOUND",
            defaultTeams: [],
          },
          { status: 200 },
        )
      }

      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Count how many practices have each default team
    const { data: practices } = await supabase.from("practices").select("id").is("deleted_at", null)

    const practiceCount = practices?.length || 0

    // For each default team, check how many practices have it
    const enrichedTeams = await Promise.all(
      (defaultTeams || []).map(async (dt) => {
        const { count } = await supabase.from("teams").select("*", { count: "exact", head: true }).eq("name", dt.name)

        return {
          ...dt,
          practiceCount: count || 0,
          totalPractices: practiceCount,
          syncStatus: count === practiceCount ? "synced" : count === 0 ? "not_synced" : "partial",
        }
      }),
    )

    return NextResponse.json({ defaultTeams: enrichedTeams })
  } catch (error) {
    console.error("[v0] Error in GET /api/super-admin/default-teams:", error)
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 })
  }
}

// PATCH /api/super-admin/default-teams - Reorder default teams
export async function PATCH(request: Request) {
  try {
    const supabase = await createAdminClient()
    const body = await request.json()
    const { reorder } = body

    if (!reorder || !Array.isArray(reorder)) {
      return NextResponse.json({ error: "Invalid reorder data" }, { status: 400 })
    }

    // Update each team's display_order
    for (const item of reorder) {
      const { error } = await supabase
        .from("default_teams")
        .update({ display_order: item.display_order, updated_at: new Date().toISOString() })
        .eq("id", item.id)

      if (error) {
        console.error(`[v0] Error updating order for team ${item.id}:`, error)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in PATCH /api/super-admin/default-teams:", error)
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 })
  }
}

// POST /api/super-admin/default-teams - Create a new default team
export async function POST(request: Request) {
  try {
    const supabase = await createAdminClient()

    const body = await request.json()
    const { name, color, description, display_order, syncToPractices = true } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name ist erforderlich" }, { status: 400 })
    }

    // Create default team
    const { data, error } = await supabase
      .from("default_teams")
      .insert({
        name: name.trim(),
        color: color || "#64748b",
        description: description || "",
        display_order: display_order || 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating default team:", error)

      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        return NextResponse.json(
          {
            error:
              "Die Tabelle 'default_teams' existiert nicht. Bitte führen Sie das SQL-Script 070_create_teams_tables.sql aus.",
            code: "TABLE_NOT_FOUND",
          },
          { status: 500 },
        )
      }

      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Sync to all practices if requested
    let syncedCount = 0
    if (syncToPractices) {
      const { data: practices } = await supabase.from("practices").select("id").is("deleted_at", null)

      if (practices && practices.length > 0) {
        const teamInserts = practices.map((practice) => ({
          practice_id: practice.id,
          name: data.name,
          color: data.color,
          description: data.description,
          is_active: true,
          is_default: true,
          created_at: new Date().toISOString(),
        }))

        const { error: insertError } = await supabase.from("teams").insert(teamInserts)
        if (!insertError) {
          syncedCount = practices.length
        }
      }
    }

    return NextResponse.json({
      team: data,
      syncedCount,
      message: syncedCount > 0 ? `Team erstellt und zu ${syncedCount} Praxen hinzugefügt` : "Team erstellt",
    })
  } catch (error) {
    console.error("[v0] Error in POST /api/super-admin/default-teams:", error)
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 })
  }
}
