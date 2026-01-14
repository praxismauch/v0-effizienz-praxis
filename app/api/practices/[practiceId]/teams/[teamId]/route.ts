import { createAdminClient } from "@/lib/supabase/admin"
import { type NextRequest, NextResponse } from "next/server"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; teamId: string }> },
) {
  try {
    const { practiceId, teamId } = await params
    const supabase = createAdminClient()
    const body = await request.json()

    const practiceIdText = String(practiceId)
    const teamIdText = String(teamId)

    const { data, error } = await supabase
      .from("teams")
      .update({
        name: body.name,
        description: body.description,
        color: body.color,
        is_active: body.isActive,
      })
      .eq("id", teamIdText)
      .eq("practice_id", practiceIdText)
      .is("deleted_at", null)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating team:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error updating team:", error)
    return NextResponse.json({ error: "Failed to update team" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; teamId: string }> },
) {
  try {
    const { practiceId, teamId } = await params
    const supabase = createAdminClient()

    const practiceIdText = String(practiceId)
    const teamIdText = String(teamId)

    await supabase.from("team_assignments").update({ deleted_at: new Date().toISOString() }).eq("team_id", teamIdText)

    const { error } = await supabase
      .from("teams")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", teamIdText)
      .eq("practice_id", practiceIdText)

    if (error) {
      console.error("[v0] Error deleting team:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting team:", error)
    return NextResponse.json({ error: "Failed to delete team" }, { status: 500 })
  }
}
