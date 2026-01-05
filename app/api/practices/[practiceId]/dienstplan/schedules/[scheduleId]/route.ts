import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; scheduleId: string }> },
) {
  try {
    const { practiceId, scheduleId } = await params
    const body = await request.json()
    const supabase = await createClient()

    // First, save to history
    const { data: existing } = await supabase.from("shift_schedules").select("*").eq("id", scheduleId).single()

    if (existing) {
      await supabase.from("shift_schedules_history").insert({
        shift_id: scheduleId,
        team_member_id: existing.team_member_id,
        shift_type_id: existing.shift_type_id,
        shift_date: existing.shift_date,
        start_time: existing.start_time,
        end_time: existing.end_time,
        break_minutes: existing.break_minutes,
        status: existing.status,
        notes: existing.notes,
        changed_by: body.changed_by,
        change_reason: body.change_reason,
      })
    }

    // Update the schedule
    const { data: schedule, error } = await supabase
      .from("shift_schedules")
      .update({
        team_member_id: body.team_member_id,
        shift_type_id: body.shift_type_id,
        shift_date: body.shift_date,
        start_time: body.start_time,
        end_time: body.end_time,
        break_minutes: body.break_minutes,
        status: body.status,
        notes: body.notes,
        version: (existing?.version || 0) + 1,
        previous_version_id: scheduleId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", scheduleId)
      .eq("practice_id", practiceId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ schedule })
  } catch (error) {
    console.error("Error updating schedule:", error)
    return NextResponse.json({ error: "Failed to update schedule" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; scheduleId: string }> },
) {
  try {
    const { practiceId, scheduleId } = await params
    const supabase = await createClient()

    // Soft delete by setting status to cancelled
    const { error } = await supabase
      .from("shift_schedules")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", scheduleId)
      .eq("practice_id", practiceId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting schedule:", error)
    return NextResponse.json({ error: "Failed to delete schedule" }, { status: 500 })
  }
}
