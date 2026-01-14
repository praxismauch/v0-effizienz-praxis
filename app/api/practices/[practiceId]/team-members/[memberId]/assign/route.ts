import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

// POST: Assign team member to a team
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; memberId: string }> },
) {
  try {
    const { practiceId, memberId } = await params
    const { teamId } = await request.json()

    if (!practiceId || !memberId || !teamId) {
      return NextResponse.json({ error: "practiceId, memberId und teamId sind erforderlich" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Step 1: Get the team_member and their user_id
    const { data: teamMember, error: memberError } = await supabase
      .from("team_members")
      .select("id, user_id, first_name, last_name")
      .eq("id", memberId)
      .eq("practice_id", practiceId)
      .is("deleted_at", null)
      .single()

    if (memberError || !teamMember) {
      return NextResponse.json({ error: "Team-Mitglied nicht gefunden" }, { status: 404 })
    }

    // Step 2: Check if team_member has a user_id (required for team_assignments)
    if (!teamMember.user_id) {
      return NextResponse.json(
        { error: "Dieses Mitglied hat keinen verknüpften Benutzer und kann keinem Team zugewiesen werden" },
        { status: 400 },
      )
    }

    // Step 3: Verify the team exists
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .select("id, name")
      .eq("id", teamId)
      .eq("practice_id", practiceId)
      .is("deleted_at", null)
      .single()

    if (teamError || !team) {
      return NextResponse.json({ error: "Team nicht gefunden" }, { status: 404 })
    }

    // Step 4: Check if assignment already exists
    const { data: existingAssignment } = await supabase
      .from("team_assignments")
      .select("id")
      .eq("team_id", teamId)
      .eq("user_id", teamMember.user_id)
      .maybeSingle()

    if (existingAssignment) {
      return NextResponse.json(
        { message: "Mitglied ist bereits diesem Team zugewiesen", assignment: existingAssignment },
        { status: 200 },
      )
    }

    // Step 5: Create the assignment (user_id references users.id, not team_members.id)
    const { data: assignment, error: assignError } = await supabase
      .from("team_assignments")
      .insert({
        id: crypto.randomUUID(),
        team_id: teamId,
        user_id: teamMember.user_id, // This is users.id, not team_members.id!
        practice_id: practiceId,
        assigned_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (assignError) {
      console.error("Error creating assignment:", assignError)
      return NextResponse.json(
        { error: "Fehler beim Zuweisen zum Team", details: assignError.message },
        { status: 500 },
      )
    }

    return NextResponse.json({
      message: "Erfolgreich zum Team zugewiesen",
      assignment,
      teamMember: {
        id: teamMember.id,
        name: `${teamMember.first_name || ""} ${teamMember.last_name || ""}`.trim(),
      },
      team: {
        id: team.id,
        name: team.name,
      },
    })
  } catch (error) {
    console.error("Assign error:", error)
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 })
  }
}
