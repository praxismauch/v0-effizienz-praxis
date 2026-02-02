import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createServerClient()
    const searchParams = request.nextUrl.searchParams

    const userId = searchParams.get("user_id")
    const year = searchParams.get("year")
    const month = searchParams.get("month")

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let query = supabase
      .from("monthly_time_reports")
      .select(`
        *,
        team_members:user_id (
          first_name,
          last_name,
          email
        )
      `)
      .eq("practice_id", practiceId)
      .order("year", { ascending: false })
      .order("month", { ascending: false })

    if (userId && userId !== "all") {
      query = query.eq("user_id", userId)
    }
    if (year && year !== "all") {
      query = query.eq("year", Number.parseInt(year))
    }
    if (month && month !== "all") {
      query = query.eq("month", Number.parseInt(month))
    }

    const { data: reports, error } = await query

    if (error) {
      console.error("Error fetching time reports:", error)
      return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 })
    }

    return NextResponse.json({ data: reports || [] })
  } catch (error) {
    console.error("Time reports API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createServerClient()
    const body = await request.json()
    const { user_id, year, month } = body

    if (!user_id || !year || !month) {
      return NextResponse.json({ error: "Missing required fields: user_id, year, month" }, { status: 400 })
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: existing } = await supabase
      .from("monthly_time_reports")
      .select("id")
      .eq("practice_id", practiceId)
      .eq("user_id", user_id)
      .eq("year", year)
      .eq("month", month)
      .single()

    if (existing) {
      return NextResponse.json({ error: "Report bereits vorhanden für diesen Zeitraum" }, { status: 400 })
    }

    const startDate = `${year}-${String(month).padStart(2, "0")}-01`
    const endDate = new Date(year, month, 0).toISOString().split("T")[0]

    const { data: blocks } = await supabase
      .from("time_blocks")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("user_id", user_id)
      .gte("date", startDate)
      .lte("date", endDate)

    if (!blocks || blocks.length === 0) {
      return NextResponse.json({ error: "Keine Zeitblöcke für diesen Zeitraum gefunden" }, { status: 404 })
    }

    const totalNetMinutes = blocks.reduce((sum, b) => sum + (b.net_minutes || 0), 0)
    const totalGrossMinutes = blocks.reduce((sum, b) => sum + (b.gross_minutes || 0), 0)
    const totalBreakMinutes = blocks.reduce((sum, b) => sum + (b.break_minutes || 0), 0)
    const workDays = new Set(blocks.map((b) => b.date)).size
    const homeOfficeDays = blocks.filter((b) => b.work_location === "homeoffice").length
    const warnings = blocks.filter((b) => b.plausibility_status !== "ok").length

    // 8 Stunden pro Tag = 480 Minuten
    const targetMinutes = workDays * 480
    const overtimeMinutes = totalNetMinutes - targetMinutes

    const { data: report, error: insertError } = await supabase
      .from("monthly_time_reports")
      .insert({
        practice_id: practiceId,
        user_id,
        year,
        month,
        total_work_days: workDays,
        total_gross_minutes: totalGrossMinutes,
        total_break_minutes: totalBreakMinutes,
        total_net_minutes: totalNetMinutes,
        overtime_minutes: overtimeMinutes,
        undertime_minutes: overtimeMinutes < 0 ? Math.abs(overtimeMinutes) : 0,
        homeoffice_days: homeOfficeDays,
        sick_days: 0,
        vacation_days: 0,
        training_days: 0,
        corrections_count: 0,
        plausibility_warnings: warnings,
        report_data: {
          daily_breakdown: blocks.map((b) => ({
            date: b.date,
            start_time: b.start_time,
            end_time: b.end_time,
            gross_minutes: b.gross_minutes,
            break_minutes: b.break_minutes,
            net_minutes: b.net_minutes,
            work_location: b.work_location,
            plausibility_status: b.plausibility_status,
          })),
        },
        generated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error("Error creating report:", insertError)
      return NextResponse.json({ error: "Failed to create report" }, { status: 500 })
    }

    return NextResponse.json({ data: report })
  } catch (error) {
    console.error("Generate report error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
