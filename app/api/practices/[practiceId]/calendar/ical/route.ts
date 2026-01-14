import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get("token")

    // Verify token (should be practice-specific subscription token)
    if (!token) {
      return new NextResponse("Unauthorized - Token required", { status: 401 })
    }

    const supabase = await createAdminClient()

    // Verify practice exists and token is valid
    const { data: practice, error: practiceError } = await supabase
      .from("practices")
      .select("id, name")
      .eq("id", practiceId)
      .single()

    if (practiceError || !practice) {
      return new NextResponse("Practice not found", { status: 404 })
    }

    // Fetch calendar events for the practice
    const { data: events, error: eventsError } = await supabase
      .from("calendar_events")
      .select("*")
      .eq("practice_id", practiceId)
      .order("start_date", { ascending: true })

    if (eventsError) {
      console.error("Error fetching events:", eventsError)
      return new NextResponse("Error fetching events", { status: 500 })
    }

    // Generate iCal format
    const icalContent = generateICalendar(events || [], practice.name, practiceId)

    return new NextResponse(icalContent, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${practiceId}-calendar.ics"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    })
  } catch (error) {
    console.error("Error generating iCal feed:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

function generateICalendar(events: any[], practiceName: string, practiceId: string): string {
  const now = new Date()
  const timestamp = now.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"

  let ical = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Effizienz Praxis//Calendar//DE",
    `X-WR-CALNAME:${practiceName} Kalender`,
    "X-WR-TIMEZONE:Europe/Berlin",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ].join("\r\n")

  events.forEach((event) => {
    const startDateTime = formatICalDateTime(event.start_date, event.start_time, event.is_all_day)
    const endDateTime = formatICalDateTime(event.end_date, event.end_time, event.is_all_day)
    const createdDate = formatICalDateTime(event.created_at, null, false)
    const updatedDate = formatICalDateTime(event.updated_at, null, false)

    ical += "\r\n"
    ical += [
      "BEGIN:VEVENT",
      `UID:${event.id}@effizienz-praxis.de`,
      `DTSTAMP:${timestamp}`,
      `CREATED:${createdDate}`,
      `LAST-MODIFIED:${updatedDate}`,
      `DTSTART${event.is_all_day ? ";VALUE=DATE" : ""}:${startDateTime}`,
      `DTEND${event.is_all_day ? ";VALUE=DATE" : ""}:${endDateTime}`,
      `SUMMARY:${escapeICalText(event.title || "Ohne Titel")}`,
      event.description ? `DESCRIPTION:${escapeICalText(event.description)}` : "",
      event.location ? `LOCATION:${escapeICalText(event.location)}` : "",
      `STATUS:CONFIRMED`,
      event.priority ? `PRIORITY:${getPriority(event.priority)}` : "",
      event.type ? `CATEGORIES:${event.type}` : "",
      "END:VEVENT",
    ]
      .filter(Boolean)
      .join("\r\n")
  })

  ical += "\r\nEND:VCALENDAR"
  return ical
}

function formatICalDateTime(date: string | null, time: string | null, isAllDay: boolean): string {
  if (!date) return ""

  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")

  if (isAllDay) {
    return `${year}${month}${day}`
  }

  let hours = "00"
  let minutes = "00"
  let seconds = "00"

  if (time) {
    const [h, m, s] = time.split(":")
    hours = h.padStart(2, "0")
    minutes = m.padStart(2, "0")
    seconds = (s || "00").padStart(2, "0")
  }

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`
}

function escapeICalText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n").replace(/\r/g, "")
}

function getPriority(priority: string): string {
  const priorityMap: Record<string, string> = {
    high: "1",
    medium: "5",
    low: "9",
  }
  return priorityMap[priority] || "5"
}
