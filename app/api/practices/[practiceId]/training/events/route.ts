import { getApiClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

function isRateLimitError(error: unknown): boolean {
  if (!error) return false
  const errorString = String(error)
  return (
    error instanceof SyntaxError ||
    errorString.includes("Too Many") ||
    errorString.includes("Unexpected token") ||
    errorString.includes("is not valid JSON")
  )
}

export async function GET(request: Request, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params

    if (!practiceId) {
      return NextResponse.json({ error: "Practice ID is required" }, { status: 400 })
    }

    let supabase
    try {
      supabase = await getApiClient()
    } catch (err) {
      if (isRateLimitError(err)) {
        return NextResponse.json({ events: [] })
      }
      throw err
    }

    const { data, error } = await supabase
      .from("training_events")
      .select("*")
      .eq("practice_id", practiceId)
      .is("deleted_at", null)
      .order("start_date", { ascending: true })

    if (error) {
      if (isRateLimitError(error)) {
        return NextResponse.json({ events: [] })
      }
      console.error("Error fetching events:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ events: data || [] })
  } catch (error) {
    if (isRateLimitError(error)) {
      return NextResponse.json({ events: [] })
    }
    console.error("Error in events GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const body = await request.json()

    if (!practiceId) {
      return NextResponse.json({ error: "Practice ID is required" }, { status: 400 })
    }

    const createdBy = body.created_by || body.createdBy
    if (!createdBy) {
      return NextResponse.json({ error: "created_by is required" }, { status: 400 })
    }

    let supabase
    try {
      supabase = await getApiClient()
    } catch (err) {
      if (isRateLimitError(err)) {
        return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 })
      }
      throw err
    }

    const { data, error } = await supabase
      .from("training_events")
      .insert({
        practice_id: practiceId,
        title: body.title,
        description: body.description || null,
        event_type: body.event_type || null,
        start_date: body.start_date || body.startDate,
        end_date: body.end_date || body.endDate,
        start_time: body.start_time || body.startTime || null,
        end_time: body.end_time || body.endTime || null,
        location: body.location || null,
        is_online: body.is_online || body.isOnline || false,
        meeting_link: body.meeting_link || body.meetingLink || null,
        max_participants: body.max_participants || body.maxParticipants || null,
        cost_per_person: body.cost_per_person || body.costPerPerson || null,
        is_mandatory: body.is_mandatory || false,
        status: body.status || "geplant",
        trainer: body.trainer || null,
        category: body.category || null,
        training_type: body.training_type || null,
        notes: body.notes || null,
        created_by: createdBy,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating event:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ event: data })
  } catch (error) {
    console.error("Error in events POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
