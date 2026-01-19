import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin-client"

// PATCH - Update arbeitsmittel assignment
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; memberId: string; assignmentId: string }> }
) {
  try {
    const { practiceId, memberId, assignmentId } = await params
    const body = await request.json()
    const supabase = await createAdminClient()

    const { data, error } = await supabase
      .from("team_member_arbeitsmittel")
      .update({
        expected_return_date: body.expected_return_date,
        actual_return_date: body.actual_return_date,
        description: body.description,
        status: body.status,
        notes: body.notes,
        signature_data: body.signature_data,
        signed_at: body.signed_at,
      })
      .eq("id", assignmentId)
      .eq("team_member_id", memberId)
      .eq("practice_id", practiceId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[v0] Error updating arbeitsmittel assignment:", error)
    return NextResponse.json({ error: error.message || "Failed to update assignment" }, { status: 500 })
  }
}

// DELETE - Delete arbeitsmittel assignment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; memberId: string; assignmentId: string }> }
) {
  try {
    const { practiceId, memberId, assignmentId } = await params
    const supabase = await createAdminClient()

    const { error } = await supabase
      .from("team_member_arbeitsmittel")
      .delete()
      .eq("id", assignmentId)
      .eq("team_member_id", memberId)
      .eq("practice_id", practiceId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Error deleting arbeitsmittel assignment:", error)
    return NextResponse.json({ error: error.message || "Failed to delete assignment" }, { status: 500 })
  }
}
