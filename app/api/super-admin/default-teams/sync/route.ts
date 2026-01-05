import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { isSuperAdminRole } from "@/lib/auth-utils"

// POST /api/super-admin/default-teams/sync - Sync all default teams to all practices
export async function POST() {
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

    // Check if user is super admin
    if (!isSuperAdminRole(userData.role)) {
      return NextResponse.json({ error: "Keine Berechtigung - Nur Super-Admins" }, { status: 403 })
    }

    // Get all active default teams
    const { data: defaultTeams, error: teamsError } = await supabase
      .from("default_teams")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true })

    if (teamsError) {
      return NextResponse.json({ error: teamsError.message }, { status: 500 })
    }

    // Get all active practices
    const { data: practices, error: practicesError } = await supabase
      .from("practices")
      .select("id, name")
      .is("deleted_at", null)

    if (practicesError) {
      return NextResponse.json({ error: practicesError.message }, { status: 500 })
    }

    let createdCount = 0
    let updatedCount = 0
    const errors: string[] = []

    for (const practice of practices || []) {
      for (const defaultTeam of defaultTeams || []) {
        // Check if team already exists for this practice
        const { data: existingTeam } = await supabase
          .from("teams")
          .select("id, color, description, is_active")
          .eq("practice_id", practice.id)
          .eq("name", defaultTeam.name)
          .maybeSingle()

        if (!existingTeam) {
          // Create new team
          const { error: insertError } = await supabase.from("teams").insert({
            practice_id: practice.id,
            name: defaultTeam.name,
            color: defaultTeam.color || "#64748b",
            description: defaultTeam.description || "",
            is_active: true,
            is_default: true,
            created_at: new Date().toISOString(),
          })

          if (insertError) {
            errors.push(`Fehler bei Praxis ${practice.name}: ${insertError.message}`)
          } else {
            createdCount++
          }
        } else {
          // Update existing team if color or description changed
          const needsUpdate =
            existingTeam.color !== defaultTeam.color ||
            existingTeam.description !== defaultTeam.description ||
            existingTeam.is_active !== defaultTeam.is_active

          if (needsUpdate) {
            const { error: updateError } = await supabase
              .from("teams")
              .update({
                color: defaultTeam.color,
                description: defaultTeam.description,
                is_active: defaultTeam.is_active,
                is_default: true,
                updated_at: new Date().toISOString(),
              })
              .eq("id", existingTeam.id)

            if (updateError) {
              errors.push(`Fehler beim Update in Praxis ${practice.name}: ${updateError.message}`)
            } else {
              updatedCount++
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      message: `${createdCount} Teams erstellt, ${updatedCount} Teams aktualisiert`,
      createdCount,
      updatedCount,
      practiceCount: practices?.length || 0,
      defaultTeamCount: defaultTeams?.length || 0,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error("[v0] Error in POST /api/super-admin/default-teams/sync:", error)
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 })
  }
}
