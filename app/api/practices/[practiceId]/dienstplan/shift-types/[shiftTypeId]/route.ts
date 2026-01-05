import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; shiftTypeId: string }> },
) {
  try {
    const { practiceId, shiftTypeId } = await params
    const body = await request.json()
    const supabase = await createClient()

    const { data: shiftType, error } = await supabase
      .from("shift_types")
      .update({
        name: body.name,
        short_name: body.short_name,
        start_time: body.start_time,
        end_time: body.end_time,
        break_minutes: body.break_minutes,
        color: body.color,
        description: body.description,
        min_staff: body.min_staff,
        max_staff: body.max_staff,
        is_active: body.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", shiftTypeId)
      .eq("practice_id", practiceId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ shiftType })
  } catch (error) {
    console.error("Error updating shift type:", error)
    return NextResponse.json({ error: "Failed to update shift type" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; shiftTypeId: string }> },
) {
  try {
    const { practiceId, shiftTypeId } = await params
    const supabase = await createClient()

    const { error } = await supabase.from("shift_types").delete().eq("id", shiftTypeId).eq("practice_id", practiceId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting shift type:", error)
    return NextResponse.json({ error: "Failed to delete shift type" }, { status: 500 })
  }
}
