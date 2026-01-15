import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ practiceId: string; id: string }> }) {
  try {
    const { practiceId, id } = await params
    const supabase = await createAdminClient()
    const body = await request.json()

    const updateData = {
      position_title: body.position_title,
      department: body.department || null,
      user_id: body.user_id === "none" ? null : body.user_id || null,
      reports_to_position_id: body.reports_to_position_id === "none" ? null : body.reports_to_position_id || null,
      level: body.level || 0,
      display_order: body.display_order || 0,
      updated_at: new Date().toISOString(),
    }

    const { data: position, error } = await supabase
      .from("org_chart_positions")
      .update(updateData)
      .eq("id", id)
      .eq("practice_id", practiceId)
      .is("deleted_at", null)
      .select()
      .single()

    if (error) {
      console.error("Error updating org chart position:", error)
      return NextResponse.json({ error: error.message || "Failed to update position" }, { status: 500 })
    }

    if (!position) {
      return NextResponse.json({ error: "Position not found" }, { status: 404 })
    }

    return NextResponse.json(position)
  } catch (error) {
    console.error("Error updating org chart position:", error)
    return NextResponse.json({ error: "Failed to update position" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; id: string }> },
) {
  try {
    const { practiceId, id } = await params
    const supabase = await createAdminClient()

    const { error } = await supabase
      .from("org_chart_positions")
      .update({
        is_active: false,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("practice_id", practiceId)
      .is("deleted_at", null)

    if (error) {
      console.error("Error deleting org chart position:", error)
      return NextResponse.json({ error: "Failed to delete position" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting org chart position:", error)
    return NextResponse.json({ error: "Failed to delete position" }, { status: 500 })
  }
}
