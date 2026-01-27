import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

// POST: Remove team member from a team
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

    const practiceIdStr = String(practiceId) || "1"
    const memberIdStr = String(memberId)
    const supabase = await createAdminClient()

    let teamMember = null

    // First try to find by user_id
    const { data: byUserId } = await supabase
      .from("team_members")
      .select("id, user_id, first_name, last_name")
      .eq("practice_id", practiceIdStr)
      .eq("user_id", memberIdStr)
      .is("deleted_at", null)
      .maybeSingle()

    if (byUserId) {
      teamMember = byUserId
    } else {
      // Then try to find by id
      const { data: byId } = await supabase
        .from("team_members")
        .select("id, user_id, first_name, last_name")
        .eq("practice_id", practiceIdStr)
        .eq("id", memberIdStr)
        .is("deleted_at", null)
        .maybeSingle()

      teamMember = byId
    }

    if (!teamMember) {
      return NextResponse.json({ error: "Team-Mitglied nicht gefunden" }, { status: 404 })
    }

    // Check if team_member has a user_id
    if (!teamMember.user_id) {
      return NextResponse.json({ error: "Dieses Mitglied hat keinen verknüpften Benutzer" }, { status: 400 })
    }

    // Find and delete the assignment (user_id in team_assignments = users.id)
    const { data: deletedAssignment, error: deleteError } = await supabase
      .from("team_assignments")
      .delete()
      .eq("team_id", teamId)
      .eq("user_id", teamMember.user_id)
      .select()
      .maybeSingle()

    if (deleteError) {
      console.error("Error deleting assignment:", deleteError)
      return NextResponse.json(
        { error: "Fehler beim Entfernen aus dem Team", details: deleteError.message },
        { status: 500 },
      )
    }

    if (!deletedAssignment) {
      return NextResponse.json({ message: "Mitglied war nicht diesem Team zugewiesen" }, { status: 200 })
    }

    return NextResponse.json({
      message: "Erfolgreich aus dem Team entfernt",
      deletedAssignment,
      teamMember: {
        id: teamMember.id,
        name: `${teamMember.first_name || ""} ${teamMember.last_name || ""}`.trim(),
      },
    })
  } catch (error) {
    console.error("Unassign error:", error)
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 })
  }
}
