import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; memberId: string; vaccinationId: string }> }
) {
  try {
    const { practiceId, memberId, vaccinationId } = await params
    const body = await request.json()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("vaccination_records")
      .update(body)
      .eq("id", vaccinationId)
      .eq("team_member_id", memberId)
      .eq("practice_id", practiceId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ vaccination: data })
  } catch (error) {
    console.error("Error updating vaccination:", error)
    return NextResponse.json({ error: "Failed to update vaccination" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; memberId: string; vaccinationId: string }> }
) {
  try {
    const { practiceId, memberId, vaccinationId } = await params
    const supabase = await createClient()

    const { error } = await supabase
      .from("vaccination_records")
      .delete()
      .eq("id", vaccinationId)
      .eq("team_member_id", memberId)
      .eq("practice_id", practiceId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting vaccination:", error)
    return NextResponse.json({ error: "Failed to delete vaccination" }, { status: 500 })
  }
}
