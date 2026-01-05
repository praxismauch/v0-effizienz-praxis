import { createAdminClient } from "@/lib/supabase/admin"
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
      supabase = await createAdminClient()
    } catch (err) {
      if (isRateLimitError(err)) {
        return NextResponse.json({ events: [] })
      }
      throw err
    }

    const { data, error } = await supabase
      .from("training_events")
      .select(`
        *,
        training_course:training_courses(id, name, category),
        registrations:training_event_registrations(
          id,
          team_member_id,
          status,
          team_member:team_members(id, first_name, last_name)
        )
      `)
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
      supabase = await createAdminClient()
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
        training_course_id: body.training_course_id || body.trainingCourseId || null,
        title: body.title,
        description: body.description,
        start_date: body.start_date || body.startDate,
        end_date: body.end_date || body.endDate,
        start_time: body.start_time || body.startTime || null,
        end_time: body.end_time || body.endTime || null,
        location: body.location,
        is_online: body.is_online || body.isOnline || false,
        meeting_link: body.meeting_link || body.meetingLink || null,
        max_participants: body.max_participants || body.maxParticipants || null,
        registration_deadline: body.registration_deadline || body.registrationDeadline || null,
        cost_per_person: body.cost_per_person || body.costPerPerson || null,
        currency: body.currency || "EUR",
        notes: body.notes,
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
