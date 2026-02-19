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

    // First, save current state to history
    const { data: existing } = await supabase.from("shift_schedules").select("*").eq("id", scheduleId).single()

    if (existing) {
      await supabase.from("shift_schedules_history").insert({
        shift_schedule_id: scheduleId,
        practice_id: practiceId,
        team_member_id: existing.team_member_id,
        shift_type_id: existing.shift_type_id,
        shift_date: existing.shift_date,
        start_time: existing.start_time,
        end_time: existing.end_time,
        break_minutes: existing.break_minutes,
        status: existing.status,
        notes: existing.notes,
        changed_by: body.changed_by || null,
        change_type: "update",
      })
    }

    // Update the schedule - only set columns that exist
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }
    if (body.team_member_id !== undefined) updateData.team_member_id = body.team_member_id
    if (body.shift_type_id !== undefined) updateData.shift_type_id = body.shift_type_id
    if (body.shift_date !== undefined) updateData.shift_date = body.shift_date
    if (body.start_time !== undefined) updateData.start_time = body.start_time
    if (body.end_time !== undefined) updateData.end_time = body.end_time
    if (body.break_minutes !== undefined) updateData.break_minutes = body.break_minutes
    if (body.status !== undefined) updateData.status = body.status
    if (body.notes !== undefined) updateData.notes = body.notes

    const { data: schedule, error } = await supabase
      .from("shift_schedules")
      .update(updateData)
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
