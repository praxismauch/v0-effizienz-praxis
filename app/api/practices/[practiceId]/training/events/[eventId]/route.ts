import { getApiClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ practiceId: string; eventId: string }> }
) {
  try {
    const { practiceId, eventId } = await params
    const body = await request.json()

    const supabase = await getApiClient()

    const allowedFields = [
      "title", "description", "event_type", "start_date", "end_date",
      "start_time", "end_time", "location", "is_online", "meeting_link",
      "max_participants", "cost_per_person", "is_mandatory", "status",
      "trainer", "category", "training_type", "notes"
    ]

    const updateData: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    const { data, error } = await supabase
      .from("training_events")
      .update(updateData)
      .eq("id", eventId)
      .eq("practice_id", practiceId)
      .select()
      .single()

    if (error) {
      console.error("Error updating event:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ event: data })
  } catch (error) {
    console.error("Error in event PATCH:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ practiceId: string; eventId: string }> }
) {
  try {
    const { practiceId, eventId } = await params

    const supabase = await getApiClient()

    const { error } = await supabase
      .from("training_events")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", eventId)
      .eq("practice_id", practiceId)

    if (error) {
      console.error("Error deleting event:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in event DELETE:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
