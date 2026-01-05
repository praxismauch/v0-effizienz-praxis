import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const body = await request.json()
    const { planId, sourceDay, targetDay, deleteExisting } = body

    const supabase = await createAdminClient()

    // Delete existing entries if requested
    if (deleteExisting) {
      const { error: deleteError } = await supabase
        .from("staffing_plan")
        .delete()
        .eq("practice_id", practiceId)
        .eq("plan_id", planId)
        .eq("day_of_week", targetDay)

      if (deleteError) {
        console.error("[v0] Error deleting existing entries:", deleteError)
        throw deleteError
      }
    }

    // Get source day entries
    const { data: sourceEntries, error: sourceError } = await supabase
      .from("staffing_plan")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("plan_id", planId)
      .eq("day_of_week", sourceDay)

    if (sourceError) throw sourceError

    if (!sourceEntries || sourceEntries.length === 0) {
      return NextResponse.json({ error: "No entries to duplicate" }, { status: 400 })
    }

    // Prepare bulk insert data
    const newEntries = sourceEntries.map((entry, index) => ({
      practice_id: practiceId,
      plan_id: planId,
      day_of_week: targetDay,
      time_slot: entry.time_slot,
      team_id: entry.team_id,
      hours: entry.hours,
      name: entry.name,
      notes: entry.notes,
      calculate_from_timespan: entry.calculate_from_timespan,
      start_time: entry.start_time,
      end_time: entry.end_time,
      display_order: index + 1,
      updated_at: new Date().toISOString(),
    }))

    // Bulk insert all entries at once
    const { data: insertedData, error: insertError } = await supabase
      .from("staffing_plan")
      .insert(newEntries)
      .select(`*, team:teams(id, name, color)`)

    if (insertError) {
      console.error("[v0] Error inserting duplicated entries:", insertError)
      throw insertError
    }

    return NextResponse.json({
      success: true,
      count: insertedData?.length || 0,
      entries: insertedData,
    })
  } catch (error: any) {
    console.error("[v0] Duplicate day API error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
