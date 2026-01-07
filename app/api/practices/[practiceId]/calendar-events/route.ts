import { type NextRequest, NextResponse } from "next/server"
import { isRateLimitError } from "@/lib/supabase/safe-query"
import Logger from "@/lib/logger"
import { requirePracticeAccess, handleApiError } from "@/lib/api-helpers"

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params

    const { adminClient: supabase } = await requirePracticeAccess(practiceId)

    Logger.info("calendar-events-api", "Fetching calendar events", { practiceId })

    if (!practiceId || practiceId === "undefined") {
      return NextResponse.json({ events: [] }, { status: 200 })
    }

    let calendarData, calendarError
    let interviewsData, interviewsError
    let trainingEventsData, trainingEventsError

    try {
      const [calendarResult, interviewsResult, trainingResult] = await Promise.all([
        // Regular calendar events
        supabase
          .from("calendar_events")
          .select("*")
          .eq("practice_id", practiceId)
          .is("deleted_at", null)
          .order("start_date", { ascending: true }),

        // Interviews with candidate info via applications
        supabase
          .from("interviews")
          .select(`
            *,
            application:applications(
              candidate:candidates(first_name, last_name, email)
            )
          `)
          .eq("practice_id", practiceId)
          .is("deleted_at", null)
          .not("scheduled_date", "is", null)
          .order("scheduled_date", { ascending: true }),

        // Training events (Fortbildungen)
        supabase
          .from("training_events")
          .select(`
            *,
            training_course:training_courses(name, category)
          `)
          .eq("practice_id", practiceId)
          .is("deleted_at", null)
          .order("start_date", { ascending: true }),
      ])

      calendarData = calendarResult.data
      calendarError = calendarResult.error
      interviewsData = interviewsResult.data
      interviewsError = interviewsResult.error
      trainingEventsData = trainingResult.data
      trainingEventsError = trainingResult.error
    } catch (supabaseError: any) {
      if (isRateLimitError(supabaseError)) {
        Logger.warn("calendar-events-api", "Rate limited during query")
        return NextResponse.json({ events: [] }, { status: 200 })
      }
      Logger.error("calendar-events-api", "Supabase query error", {
        error: supabaseError.message,
        code: supabaseError.code,
        practiceId,
      })
      return NextResponse.json({ events: [] }, { status: 200 })
    }

    if (calendarError) {
      Logger.warn("calendar-events-api", "Error fetching calendar events", {
        error: calendarError.message,
        code: calendarError.code,
        practiceId,
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

    const interviewEvents = (interviewsData || []).map((interview) => {
      const candidate = interview.application?.candidate
      const candidateName = candidate
        ? `${candidate.first_name || ""} ${candidate.last_name || ""}`.trim()
        : "Unbekannt"

      // Calculate end time based on duration
      let endTime = interview.scheduled_time
      if (interview.scheduled_time && interview.duration_minutes) {
        const [hours, minutes] = interview.scheduled_time.split(":").map(Number)
        const totalMinutes = hours * 60 + minutes + interview.duration_minutes
        const endHours = Math.floor(totalMinutes / 60) % 24
        const endMins = totalMinutes % 60
        endTime = `${endHours.toString().padStart(2, "0")}:${endMins.toString().padStart(2, "0")}`
      }

      return {
        id: `interview-${interview.id}`,
        title: `Vorstellungsgespräch: ${candidateName}`,
        description: interview.notes || `${interview.interview_type || "Interview"} mit ${candidateName}`,
        startDate: interview.scheduled_date,
        endDate: interview.scheduled_date,
        startTime: interview.scheduled_time || "09:00",
        endTime: endTime || "10:00",
        type: "interview",
        priority: "high",
        createdBy: interview.created_by,
        createdAt: interview.created_at,
        practiceId: interview.practice_id,
        isAllDay: false,
        attendees: interview.interviewer_ids || [],
        location: interview.location || (interview.is_online ? "Online" : ""),
        recurrenceType: "none",
        recurrenceEndDate: null,
        isRecurringInstance: false,
        parentEventId: null,
        lastGeneratedDate: null,
        // Additional interview-specific fields
        interviewType: interview.interview_type,
        interviewStatus: interview.status,
        candidateEmail: candidate?.email,
        meetingLink: interview.meeting_link,
        isOnline: !!interview.meeting_link,
      }
    })

    const trainingCalendarEvents = (trainingEventsData || []).map((training) => {
      const courseName = training.training_course?.name || training.title || "Fortbildung"

      return {
        id: `training-${training.id}`,
        title: courseName,
        description: training.description || `Fortbildung: ${courseName}`,
        startDate: training.start_date,
        endDate: training.end_date || training.start_date,
        startTime: training.start_time || "09:00",
        endTime: training.end_time || "17:00",
        type: "training",
        priority: "medium",
        createdBy: training.created_by,
        createdAt: training.created_at,
        practiceId: training.practice_id,
        isAllDay: !training.start_time,
        attendees: [],
        location: training.location || (training.is_online ? "Online" : ""),
        recurrenceType: "none",
        recurrenceEndDate: null,
        isRecurringInstance: false,
        parentEventId: null,
        lastGeneratedDate: null,
        // Additional training-specific fields
        trainingCourseId: training.training_course_id,
        trainingStatus: training.status,
        meetingLink: training.meeting_link,
        isOnline: training.is_online,
      }
    })

    const allEvents = [...calendarEvents, ...interviewEvents, ...trainingCalendarEvents].sort((a, b) => {
      const dateA = new Date(a.startDate + "T" + (a.startTime || "00:00"))
      const dateB = new Date(b.startDate + "T" + (b.startTime || "00:00"))
      return dateA.getTime() - dateB.getTime()
    })

    Logger.info("calendar-events-api", "Returning calendar events", {
      totalCount: allEvents.length,
      calendarCount: calendarEvents.length,
      interviewCount: interviewEvents.length,
      trainingCount: trainingCalendarEvents.length,
    })

    return NextResponse.json({ events: allEvents })
  } catch (error: any) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params

    const { adminClient: supabase, user } = await requirePracticeAccess(practiceId)

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
      practice_id: practiceId,
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
