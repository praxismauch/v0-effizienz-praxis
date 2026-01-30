import { type NextRequest, NextResponse } from "next/server"
import { isRateLimitError } from "@/lib/supabase/safe-query"
import Logger from "@/lib/logger"
import { requirePracticeAccess, handleApiError } from "@/lib/api-helpers"

const HARDCODED_PRACTICE_ID = "1"

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params

    const { adminClient: supabase } = await requirePracticeAccess(practiceId)

    const effectivePracticeId =
      practiceId && practiceId !== "undefined" && practiceId !== "0" ? String(practiceId) : HARDCODED_PRACTICE_ID

    Logger.info("calendar-events-api", "Fetching calendar events", { practiceId: effectivePracticeId })

    if (!practiceId || practiceId === "undefined") {
      return NextResponse.json({ events: [] }, { status: 200 })
    }

    let calendarData, calendarError

    try {
      const [calendarResult] = await Promise.all([
        // Regular calendar events - now includes all event types
        supabase
          .from("calendar_events")
          .select("*")
          .eq("practice_id", effectivePracticeId)
          .is("deleted_at", null)
          .order("start_time", { ascending: true }),
      ])

      calendarData = calendarResult.data
      calendarError = calendarResult.error
    } catch (supabaseError: any) {
      if (isRateLimitError(supabaseError)) {
        Logger.warn("calendar-events-api", "Rate limited during query")
        return NextResponse.json({ events: [] }, { status: 200 })
      }
      Logger.error("calendar-events-api", "Supabase query error", {
        error: supabaseError.message,
        code: supabaseError.code,
        practiceId: effectivePracticeId,
      })
      return NextResponse.json({ events: [] }, { status: 200 })
    }

    if (calendarError) {
      Logger.warn("calendar-events-api", "Error fetching calendar events", {
        error: calendarError.message,
        code: calendarError.code,
        practiceId: effectivePracticeId,
      })
    }

    // Transform calendar events from database format to app format
    const calendarEvents = (calendarData || []).map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      startDate: event.start_date,
      endDate: event.end_date,
      startTime: event.start_time,
      endTime: event.end_time,
      type: event.type,
      priority: event.priority,
      createdBy: event.created_by,
      createdAt: event.created_at,
      practiceId: event.practice_id,
      isAllDay: event.is_all_day,
      attendees: event.attendees,
      location: event.location,
      recurrenceType: event.recurrence_type,
      recurrenceEndDate: event.recurrence_end_date,
      isRecurringInstance: event.is_recurring_instance,
      parentEventId: event.parent_event_id,
      lastGeneratedDate: event.last_generated_date,
    }))

    const allEvents = [...calendarEvents].sort((a, b) => {
      const dateA = new Date(a.startDate + "T" + (a.startTime || "00:00"))
      const dateB = new Date(b.startDate + "T" + (b.startTime || "00:00"))
      return dateA.getTime() - dateB.getTime()
    })

    Logger.info("calendar-events-api", "Returning calendar events", {
      totalCount: allEvents.length,
      calendarCount: calendarEvents.length,
    })

    return NextResponse.json({ events: allEvents })
  } catch (error: any) {
    console.log("[v0] calendar-events GET error:", error.message, error.status)
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params

    const { adminClient: supabase, user } = await requirePracticeAccess(practiceId)

    const effectivePracticeId =
      practiceId && practiceId !== "undefined" && practiceId !== "0" ? String(practiceId) : HARDCODED_PRACTICE_ID

    const body = await request.json()

    if (!body.title || body.title.trim() === "") {
      return NextResponse.json({ error: "Titel ist erforderlich" }, { status: 400 })
    }

    const userId = user.id

    const eventType = body.type || "meeting"

    const eventData = {
      title: body.title.trim(),
      description: body.description || null,
      start_date: body.startDate,
      end_date: body.endDate || body.startDate,
      start_time: body.startTime || null,
      end_time: body.endTime || null,
      type: eventType,
      priority: body.priority || "medium",
      created_by: userId,
      practice_id: effectivePracticeId,
      is_all_day: body.isAllDay || false,
      attendees: body.attendees || [],
      location: body.location || null,
      recurrence_type: body.recurrenceType || "none",
      recurrence_end_date: body.recurrenceEndDate || null,
    }

    let insertedEvent, insertError
    try {
      const result = await supabase.from("calendar_events").insert(eventData).select().single()
      insertedEvent = result.data
      insertError = result.error
    } catch (insertException: any) {
      if (isRateLimitError(insertException)) {
        return NextResponse.json({ error: "Zu viele Anfragen. Bitte versuchen Sie es später erneut." }, { status: 429 })
      }
      throw insertException
    }

    if (insertError) {
      Logger.error("calendar-events-api", "Error creating calendar event", {
        error: insertError.message,
        code: insertError.code,
        details: insertError.details,
      })
      return NextResponse.json({ error: `Fehler beim Erstellen: ${insertError.message}` }, { status: 500 })
    }

    const event = {
      id: insertedEvent.id,
      title: insertedEvent.title,
      description: insertedEvent.description,
      startDate: insertedEvent.start_date,
      endDate: insertedEvent.end_date,
      startTime: insertedEvent.start_time,
      endTime: insertedEvent.end_time,
      type: insertedEvent.type,
      priority: insertedEvent.priority,
      createdBy: insertedEvent.created_by,
      createdAt: insertedEvent.created_at,
      practiceId: insertedEvent.practice_id,
      isAllDay: insertedEvent.is_all_day,
      attendees: insertedEvent.attendees,
      location: insertedEvent.location,
      recurrenceType: insertedEvent.recurrence_type,
      recurrenceEndDate: insertedEvent.recurrence_end_date,
    }

    return NextResponse.json({ event })
  } catch (error: any) {
    return handleApiError(error)
  }
}
