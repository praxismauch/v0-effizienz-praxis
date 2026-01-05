import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

interface MoodTrendData {
  week: string
  weekLabel: string
  morale: number
  stress: number
  satisfaction: number
  responseCount: number
}

interface MoodAlert {
  id: string
  type: "warning" | "critical"
  dimension: string
  message: string
  value: number
  trend: "down" | "stable"
  date: string
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get("period") || "8weeks"

    // Calculate date range
    const weeks = period === "4weeks" ? 4 : period === "12weeks" ? 12 : 8
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - weeks * 7)

    // Find mood-related surveys (Team Stimmungsbarometer)
    const { data: surveys } = await supabase
      .from("surveys")
      .select("id, title, created_at")
      .eq("practice_id", practiceId)
      .ilike("title", "%Stimmungsbarometer%")
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true })

    if (!surveys || surveys.length === 0) {
      return NextResponse.json({ trends: [], alerts: [] })
    }

    // Get all responses for these surveys
    const surveyIds = surveys.map((s) => s.id)
    const { data: responses } = await supabase
      .from("survey_responses")
      .select(`
        id,
        survey_id,
        completed_at,
        survey_answers (
          question_id,
          answer_value,
          survey_questions (
            question_text,
            display_order
          )
        )
      `)
      .in("survey_id", surveyIds)
      .eq("status", "completed")

    if (!responses || responses.length === 0) {
      return NextResponse.json({ trends: [], alerts: [] })
    }

    // Group responses by week and calculate averages
    const weeklyData: Record<string, { morale: number[]; stress: number[]; satisfaction: number[] }> = {}

    responses.forEach((response: any) => {
      if (!response.completed_at) return

      const date = new Date(response.completed_at)
      const weekKey = getWeekKey(date)

      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { morale: [], stress: [], satisfaction: [] }
      }

      response.survey_answers?.forEach((answer: any) => {
        const order = answer.survey_questions?.display_order
        const value = answer.answer_value

        if (typeof value === "number") {
          if (order === 1) weeklyData[weekKey].morale.push(value)
          else if (order === 2) weeklyData[weekKey].stress.push(value)
          else if (order === 3) weeklyData[weekKey].satisfaction.push(value)
        }
      })
    })

    // Calculate trends
    const trends: MoodTrendData[] = Object.entries(weeklyData)
      .map(([week, data]) => ({
        week,
        weekLabel: formatWeekLabel(week),
        morale: data.morale.length > 0 ? data.morale.reduce((a, b) => a + b, 0) / data.morale.length : 0,
        stress: data.stress.length > 0 ? data.stress.reduce((a, b) => a + b, 0) / data.stress.length : 0,
        satisfaction:
          data.satisfaction.length > 0 ? data.satisfaction.reduce((a, b) => a + b, 0) / data.satisfaction.length : 0,
        responseCount: data.morale.length,
      }))
      .sort((a, b) => a.week.localeCompare(b.week))

    // Generate alerts
    const alerts: MoodAlert[] = []

    if (trends.length > 0) {
      const latest = trends[trends.length - 1]
      const previous = trends.length > 1 ? trends[trends.length - 2] : null

      // Check for low morale
      if (latest.morale < 2.5) {
        alerts.push({
          id: `alert-morale-${latest.week}`,
          type: "critical",
          dimension: "Arbeitszufriedenheit",
          message: "Kritisch niedriges Zufriedenheitsniveau im Team",
          value: latest.morale,
          trend: previous && latest.morale < previous.morale ? "down" : "stable",
          date: latest.weekLabel,
        })
      } else if (latest.morale < 3.0) {
        alerts.push({
          id: `alert-morale-${latest.week}`,
          type: "warning",
          dimension: "Arbeitszufriedenheit",
          message: "Zufriedenheitsniveau unter Durchschnitt",
          value: latest.morale,
          trend: previous && latest.morale < previous.morale ? "down" : "stable",
          date: latest.weekLabel,
        })
      }

      // Check for high stress
      if (latest.stress > 4.0) {
        alerts.push({
          id: `alert-stress-${latest.week}`,
          type: "critical",
          dimension: "Stresslevel",
          message: "Kritisch hohes Stressniveau im Team erkannt",
          value: latest.stress,
          trend: previous && latest.stress > previous.stress ? "down" : "stable",
          date: latest.weekLabel,
        })
      } else if (latest.stress > 3.5) {
        alerts.push({
          id: `alert-stress-${latest.week}`,
          type: "warning",
          dimension: "Stresslevel",
          message: "Erhöhtes Stressniveau im Team",
          value: latest.stress,
          trend: previous && latest.stress > previous.stress ? "down" : "stable",
          date: latest.weekLabel,
        })
      }

      // Check for low support
      if (latest.satisfaction < 2.5) {
        alerts.push({
          id: `alert-support-${latest.week}`,
          type: "critical",
          dimension: "Team-Unterstützung",
          message: "Team-Mitglieder fühlen sich wenig unterstützt",
          value: latest.satisfaction,
          trend: previous && latest.satisfaction < previous.satisfaction ? "down" : "stable",
          date: latest.weekLabel,
        })
      }

      // Check for declining trends
      if (previous && trends.length >= 3) {
        const third = trends[trends.length - 3]
        if (latest.morale < previous.morale && previous.morale < third.morale) {
          alerts.push({
            id: `alert-trend-morale-${latest.week}`,
            type: "warning",
            dimension: "Trend",
            message: "Zufriedenheit sinkt seit 3 Wochen kontinuierlich",
            value: latest.morale,
            trend: "down",
            date: latest.weekLabel,
          })
        }
      }
    }

    return NextResponse.json({ trends, alerts })
  } catch (error) {
    console.error("Error fetching mood data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function getWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const year = d.getUTCFullYear()
  const yearStart = new Date(Date.UTC(year, 0, 1))
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${year}-W${week.toString().padStart(2, "0")}`
}

function formatWeekLabel(weekKey: string): string {
  const [year, week] = weekKey.split("-W")
  return `KW ${Number.parseInt(week)}`
}
