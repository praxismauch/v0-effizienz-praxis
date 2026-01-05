import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// German public holidays data structure
const getGermanHolidays = (bundesland: string, year: number = new Date().getFullYear()) => {
  // Easter calculation (Gauss algorithm)
  const calculateEaster = (year: number) => {
    const a = year % 19
    const b = Math.floor(year / 100)
    const c = year % 100
    const d = Math.floor(b / 4)
    const e = b % 4
    const f = Math.floor((b + 8) / 25)
    const g = Math.floor((b - f + 1) / 3)
    const h = (19 * a + b - d - g + 15) % 30
    const i = Math.floor(c / 4)
    const k = c % 4
    const l = (32 + 2 * e + 2 * i - h - k) % 7
    const m = Math.floor((a + 11 * h + 22 * l) / 451)
    const month = Math.floor((h + l - 7 * m + 114) / 31)
    const day = ((h + l - 7 * m + 114) % 31) + 1
    return new Date(year, month - 1, day)
  }

  const easter = calculateEaster(year)
  const goodFriday = new Date(easter)
  goodFriday.setDate(easter.getDate() - 2)
  const easterMonday = new Date(easter)
  easterMonday.setDate(easter.getDate() + 1)
  const ascension = new Date(easter)
  ascension.setDate(easter.getDate() + 39)
  const whitMonday = new Date(easter)
  whitMonday.setDate(easter.getDate() + 50)
  const corpusChristi = new Date(easter)
  corpusChristi.setDate(easter.getDate() + 60)

  // Calculate Buß- und Bettag (Wednesday before Nov 23)
  const nov23 = new Date(year, 10, 23) // Nov 23
  const dayOfWeek = nov23.getDay()
  const daysToWednesday = dayOfWeek >= 3 ? dayOfWeek - 3 : dayOfWeek + 4
  const bussUndBettag = new Date(nov23)
  bussUndBettag.setDate(nov23.getDate() - daysToWednesday)

  // National holidays (all states)
  const holidays = [
    { name: "Neujahr", date: `${year}-01-01`, states: "all" },
    { name: "Karfreitag", date: goodFriday.toISOString().split("T")[0], states: "all" },
    { name: "Ostermontag", date: easterMonday.toISOString().split("T")[0], states: "all" },
    { name: "Tag der Arbeit", date: `${year}-05-01`, states: "all" },
    { name: "Christi Himmelfahrt", date: ascension.toISOString().split("T")[0], states: "all" },
    { name: "Pfingstmontag", date: whitMonday.toISOString().split("T")[0], states: "all" },
    { name: "Tag der Deutschen Einheit", date: `${year}-10-03`, states: "all" },
    { name: "1. Weihnachtsfeiertag", date: `${year}-12-25`, states: "all" },
    { name: "2. Weihnachtsfeiertag", date: `${year}-12-26`, states: "all" },

    // State-specific holidays
    { name: "Heilige Drei Könige", date: `${year}-01-06`, states: ["BW", "BY", "ST"] },
    { name: "Internationaler Frauentag", date: `${year}-03-08`, states: ["BE"] },
    {
      name: "Fronleichnam",
      date: corpusChristi.toISOString().split("T")[0],
      states: ["BW", "BY", "HE", "NW", "RP", "SL"],
    },
    { name: "Mariä Himmelfahrt", date: `${year}-08-15`, states: ["BY", "SL"] },
    { name: "Weltkindertag", date: `${year}-09-20`, states: ["TH"] },
    { name: "Reformationstag", date: `${year}-10-31`, states: ["BB", "HB", "HH", "MV", "NI", "SN", "ST", "SH", "TH"] },
    { name: "Allerheiligen", date: `${year}-11-01`, states: ["BW", "BY", "NW", "RP", "SL"] },
    { name: "Buß- und Bettag", date: bussUndBettag.toISOString().split("T")[0], states: ["SN"] },
  ]

  return holidays.filter((holiday) => holiday.states === "all" || holiday.states.includes(bundesland))
}

export async function GET(req: NextRequest, context: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await context.params
    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })
    }

    const bundesland = req.nextUrl.searchParams.get("bundesland")
    if (!bundesland) {
      return NextResponse.json({ error: "Bundesland parameter required" }, { status: 400 })
    }

    const currentYear = new Date().getFullYear()
    const nextYear = currentYear + 1

    // Get holidays for current and next year
    const currentYearHolidays = getGermanHolidays(bundesland, currentYear)
    const nextYearHolidays = getGermanHolidays(bundesland, nextYear)
    const allHolidays = [...currentYearHolidays, ...nextYearHolidays]

    const holidayEvents = allHolidays.map((holiday) => ({
      practice_id: practiceId,
      title: holiday.name,
      start_date: holiday.date,
      end_date: holiday.date,
      start_time: "00:00",
      end_time: "23:59",
      is_all_day: true,
      type: "holiday",
      priority: "medium",
      description: `Gesetzlicher Feiertag in ${bundesland}`,
      created_by: user.id,
    }))

    // Check for existing holidays to avoid duplicates
    const { data: existingEvents } = await supabase
      .from("calendar_events")
      .select("title, start_date")
      .eq("practice_id", practiceId)
      .eq("type", "holiday")

    const existingSet = new Set(existingEvents?.map((e) => `${e.title}-${e.start_date}`) || [])

    const newHolidays = holidayEvents.filter((h) => !existingSet.has(`${h.title}-${h.start_date}`))

    if (newHolidays.length > 0) {
      const { error: insertError } = await supabase.from("calendar_events").insert(newHolidays)

      if (insertError) {
        console.error("Error inserting holidays:", insertError)
        return NextResponse.json({ error: "Fehler beim Erstellen der Feiertage" }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      added: newHolidays.length,
      total: allHolidays.length,
      holidays: allHolidays,
    })
  } catch (error) {
    console.error("Holidays API error:", error)
    return NextResponse.json({ error: "Fehler beim Laden der Feiertage" }, { status: 500 })
  }
}
