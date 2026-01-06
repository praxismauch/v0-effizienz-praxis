import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; availabilityId: string }> },
) {
  try {
    const { practiceId, availabilityId } = await params
    const body = await request.json()
    const supabase = await createClient()

    const { data: availability, error } = await supabase
      .from("employee_availability")
      .update({
        day_of_week: body.day_of_week,
        specific_date: body.specific_date,
        availability_type: body.availability_type,
        start_time: body.start_time,
        end_time: body.end_time,
        notes: body.notes,
        is_recurring: body.is_recurring,
        valid_from: body.valid_from,
        valid_until: body.valid_until,
        updated_at: new Date().toISOString(),
      })
      .eq("id", availabilityId)
      .eq("practice_id", practiceId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ availability })
  } catch (error) {
    console.error("Error updating availability:", error)
    return NextResponse.json({ error: "Failed to update availability" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; availabilityId: string }> },
) {
  try {
    const { practiceId, availabilityId } = await params
    const supabase = await createClient()

    const { error } = await supabase
      .from("employee_availability")
      .delete()
      .eq("id", availabilityId)
      .eq("practice_id", practiceId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting availability:", error)
    return NextResponse.json({ error: "Failed to delete availability" }, { status: 500 })
  }
}
