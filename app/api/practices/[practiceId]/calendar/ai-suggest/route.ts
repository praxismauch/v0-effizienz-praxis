import { createClient } from "@/lib/supabase/server"
import { generateText } from "ai"

// Custom date utilities
function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7)
}

function startOfWeek(date: Date): Date {
  const result = new Date(date)
  const day = result.getDay()
  const diff = day === 0 ? -6 : 1 - day
  result.setDate(result.getDate() + diff)
  return result
}

function formatDate(date: Date, formatStr: string): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  if (formatStr === "yyyy-MM-dd") return `${year}-${month}-${day}`

  const weekdays = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"]
  const weekday = weekdays[date.getDay()]
  return `${weekday}, ${day}.${month}.${year}`
}

function nextWeekday(date: Date, targetDay: number): Date {
  const result = new Date(date)
  const currentDay = result.getDay()
  let daysToAdd = targetDay - currentDay
  if (daysToAdd <= 0) daysToAdd += 7
  result.setDate(result.getDate() + daysToAdd)
  return result
}
function nextMonday(date: Date): Date {
  return nextWeekday(date, 1)
}
function nextTuesday(date: Date): Date {
  return nextWeekday(date, 2)
}
function nextWednesday(date: Date): Date {
  return nextWeekday(date, 3)
}
function nextThursday(date: Date): Date {
  return nextWeekday(date, 4)
}
function nextFriday(date: Date): Date {
  return nextWeekday(date, 5)
}

function detectRecurrence(prompt: string): { recurrence: string; intervalWeeks?: number } {
  const promptLower = prompt.toLowerCase()

  // Check for specific interval patterns like "alle X wochen", "every X weeks", "alle X tage"
  const weeklyPattern = /alle\s*(\d+)\s*woche/i
  const dailyPattern = /alle\s*(\d+)\s*tag/i
  const monthlyPattern = /alle\s*(\d+)\s*monat/i
  const yearlyPattern = /alle\s*(\d+)\s*jahr|jährlich/i

  const weeklyMatch = prompt.match(weeklyPattern)
  const dailyMatch = prompt.match(dailyPattern)
  const monthlyMatch = prompt.match(monthlyPattern)
  const yearlyMatch = prompt.match(yearlyPattern)

  // "alle 4 wochen" = monthly (approximately)
  if (weeklyMatch) {
    const weeks = Number.parseInt(weeklyMatch[1])
    if (weeks === 1) {
      return { recurrence: "weekly", intervalWeeks: 1 }
    } else if (weeks === 2) {
      return { recurrence: "weekly", intervalWeeks: 2 } // bi-weekly
    } else if (weeks >= 4) {
      return { recurrence: "monthly", intervalWeeks: weeks }
    } else {
      return { recurrence: "weekly", intervalWeeks: weeks }
    }
  }

  if (dailyMatch) {
    const days = Number.parseInt(dailyMatch[1])
    if (days === 1) {
      return { recurrence: "daily" }
    } else if (days === 7) {
      return { recurrence: "weekly", intervalWeeks: 1 }
    }
    return { recurrence: "daily" }
  }

  if (monthlyMatch) {
    return { recurrence: "monthly" }
  }

  if (yearlyMatch) {
    return { recurrence: "yearly" }
  }

  // Check for simple keywords
  if (promptLower.includes("täglich") || promptLower.includes("jeden tag") || promptLower.includes("daily")) {
    return { recurrence: "daily" }
  }

  if (promptLower.includes("wöchentlich") || promptLower.includes("jede woche") || promptLower.includes("weekly")) {
    return { recurrence: "weekly", intervalWeeks: 1 }
  }

  if (promptLower.includes("monatlich") || promptLower.includes("jeden monat") || promptLower.includes("monthly")) {
    return { recurrence: "monthly" }
  }

  if (promptLower.includes("jährlich") || promptLower.includes("yearly") || promptLower.includes("annually")) {
    return { recurrence: "yearly" }
  }

  // Check for maintenance/wartung patterns which often have recurrence
  if (promptLower.includes("wartung") && (promptLower.includes("regelmäßig") || promptLower.includes("intervall"))) {
    return { recurrence: "monthly" }
  }

  return { recurrence: "none" }
}

export async function POST(request: Request, { params }: { params: { practiceId: string } }) {
  try {
    const { prompt } = await request.json()
    const supabase = await createClient()
    const practiceId = params.practiceId

    const today = new Date()
    const todayStr = formatDate(today, "EEEE, dd.MM.yyyy")
    const currentWeekStart = startOfWeek(today)

    // Calculate next occurrences of weekdays
    const nextWeekdays = {
      montag: formatDate(nextMonday(today), "yyyy-MM-dd"),
      dienstag: formatDate(nextTuesday(today), "yyyy-MM-dd"),
      mittwoch: formatDate(nextWednesday(today), "yyyy-MM-dd"),
      donnerstag: formatDate(nextThursday(today), "yyyy-MM-dd"),
      freitag: formatDate(nextFriday(today), "yyyy-MM-dd"),
    }

    // Fetch existing events
    const { data: events } = await supabase
      .from("calendar_events")
      .select("*")
      .eq("practice_id", practiceId)
      .gte("start_date", formatDate(new Date(), "yyyy-MM-dd"))

    const { recurrence, intervalWeeks } = detectRecurrence(prompt)

    let suggestions
    try {
      const { text } = await generateText({
        model: "openai/gpt-4o",
        prompt: `Du bist ein KI-Terminassistent. 

HEUTIGES DATUM: ${todayStr}

NÄCHSTE WOCHENTAGE:
- Nächster Montag: ${nextWeekdays.montag}
- Nächster Dienstag: ${nextWeekdays.dienstag}
- Nächster Mittwoch: ${nextWeekdays.mittwoch}
- Nächster Donnerstag: ${nextWeekdays.donnerstag}
- Nächster Freitag: ${nextWeekdays.freitag}

Der Benutzer möchte: "${prompt}"

Existierende Termine: ${JSON.stringify(events?.slice(0, 10))}

WICHTIG: 
- Wenn der Benutzer "Montag" sagt, verwende ${nextWeekdays.montag}
- Wenn der Benutzer "Dienstag" sagt, verwende ${nextWeekdays.dienstag}
- Wenn der Benutzer "Mittwoch" sagt, verwende ${nextWeekdays.mittwoch}
- Wenn der Benutzer "Donnerstag" sagt, verwende ${nextWeekdays.donnerstag}
- Wenn der Benutzer "Freitag" sagt, verwende ${nextWeekdays.freitag}
- Wenn "nächste Woche" erwähnt wird, addiere 7 Tage zum entsprechenden Wochentag
- WIEDERHOLUNG ERKENNEN: Wenn der Benutzer Begriffe wie "alle X Wochen", "wöchentlich", "monatlich", "täglich", "jährlich" verwendet, setze das "recurrence" Feld entsprechend:
  - "daily" für täglich
  - "weekly" für wöchentlich oder "alle 1-3 Wochen"
  - "monthly" für monatlich oder "alle 4+ Wochen"
  - "yearly" für jährlich
  - "none" wenn keine Wiederholung erwähnt wird
- TYP: Verwende nur diese erlaubten Werte: "meeting", "training", "maintenance", "holiday", "announcement", "task", "event", "other"
  - "maintenance" für Wartung, Geräte-Wartung
  - "training" für Schulungen, Fortbildungen  
  - "meeting" für Meetings, Besprechungen
  - "event" für Events, Veranstaltungen

Schlage 2-3 optimale Termine vor, die nicht mit existierenden Terminen kollidieren.
Verwende ISO-Format (yyyy-MM-dd) für Datumsangaben.

Gib die Antwort als JSON:
{
  "events": [
    {
      "title": "Termin-Titel",
      "description": "Beschreibung",
      "startDate": "2025-01-20",
      "endDate": "2025-01-20",
      "startTime": "09:00",
      "endTime": "10:00",
      "type": "meeting",
      "priority": "medium",
      "isAllDay": false,
      "location": "Konferenzraum",
      "recurrence": "none"
    }
  ],
  "reasoning": "Erklärung warum diese Zeiten optimal sind"
}`,
      })

      suggestions = JSON.parse(text)

      if (recurrence !== "none" && suggestions.events) {
        suggestions.events = suggestions.events.map((event: any) => ({
          ...event,
          recurrence: event.recurrence || recurrence,
        }))
      }
    } catch (aiError) {
      const promptLower = prompt.toLowerCase()

      // Detect requested weekday
      let targetDate = addDays(today, 1) // default to tomorrow

      if (promptLower.includes("montag") || promptLower.includes("monday")) {
        targetDate = nextMonday(today)
      } else if (promptLower.includes("dienstag") || promptLower.includes("tuesday")) {
        targetDate = nextTuesday(today)
      } else if (promptLower.includes("mittwoch") || promptLower.includes("wednesday")) {
        targetDate = nextWednesday(today)
      } else if (promptLower.includes("donnerstag") || promptLower.includes("thursday")) {
        targetDate = nextThursday(today)
      } else if (promptLower.includes("freitag") || promptLower.includes("friday")) {
        targetDate = nextFriday(today)
      } else if (promptLower.includes("nächste woche") || promptLower.includes("next week")) {
        targetDate = addWeeks(today, 1)
      }

      let eventType = "meeting"
      let defaultTime = "09:00"
      let duration = 1 // hours

      if (promptLower.includes("wartung") || promptLower.includes("maintenance")) {
        eventType = "maintenance"
        defaultTime = "08:00"
        duration = 1
      } else if (
        promptLower.includes("training") ||
        promptLower.includes("schulung") ||
        promptLower.includes("fortbildung")
      ) {
        eventType = "training"
        defaultTime = "14:00"
        duration = 2
      } else if (
        promptLower.includes("urlaub") ||
        promptLower.includes("feiertag") ||
        promptLower.includes("holiday")
      ) {
        eventType = "holiday"
        defaultTime = "00:00"
        duration = 8
      } else if (promptLower.includes("ankündigung") || promptLower.includes("announcement")) {
        eventType = "announcement"
        defaultTime = "10:00"
        duration = 0.5
      } else if (promptLower.includes("aufgabe") || promptLower.includes("task") || promptLower.includes("todo")) {
        eventType = "task"
        defaultTime = "09:00"
        duration = 1
      } else if (
        promptLower.includes("mitarbeiter") ||
        promptLower.includes("team") ||
        promptLower.includes("besprechung")
      ) {
        eventType = "meeting"
        defaultTime = "10:00"
        duration = 1
      } else {
        eventType = "event"
        defaultTime = "09:00"
        duration = 1
      }

      const endHour = Number.parseInt(defaultTime.split(":")[0]) + duration
      const endTime = `${endHour.toString().padStart(2, "0")}:00`

      // Create alternative date (one week later)
      const alternativeDate = addWeeks(targetDate, 1)

      suggestions = {
        events: [
          {
            title: prompt.length > 50 ? prompt.substring(0, 47) + "..." : prompt,
            description: `Vorgeschlagener Termin: ${prompt}`,
            startDate: formatDate(targetDate, "yyyy-MM-dd"),
            endDate: formatDate(targetDate, "yyyy-MM-dd"),
            startTime: defaultTime,
            endTime: endTime,
            type: eventType,
            priority: "medium",
            isAllDay: false,
            location: "Praxis",
            recurrence: recurrence,
          },
          {
            title: prompt.length > 50 ? prompt.substring(0, 47) + "..." : prompt,
            description: `Alternative Terminoption: ${prompt}`,
            startDate: formatDate(alternativeDate, "yyyy-MM-dd"),
            endDate: formatDate(alternativeDate, "yyyy-MM-dd"),
            startTime: defaultTime,
            endTime: endTime,
            type: eventType,
            priority: "medium",
            isAllDay: false,
            location: "Praxis",
            recurrence: recurrence,
          },
        ],
        reasoning: `Vorschläge für ${formatDate(targetDate, "EEEE, dd.MM.yyyy")} basierend auf typischen Praxiszeiten.${recurrence !== "none" ? ` Wiederholung: ${recurrence === "daily" ? "täglich" : recurrence === "weekly" ? "wöchentlich" : recurrence === "monthly" ? "monatlich" : "jährlich"}` : ""}`,
      }
    }

    return Response.json(suggestions)
  } catch (error) {
    console.error("[v0] Error generating calendar suggestions:", error)
    return Response.json(
      {
        error: "Failed to generate suggestions",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
