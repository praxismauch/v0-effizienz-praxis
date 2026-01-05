import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { subDays, startOfDay, format } from "date-fns"

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  const { practiceId } = await params
  const supabase = await createClient()

  try {
    // Get mood responses from last 30 days
    const thirtyDaysAgo = subDays(new Date(), 30).toISOString()

    const { data: responses, error } = await supabase
      .from("anonymous_mood_responses")
      .select("*")
      .eq("practice_id", Number.parseInt(practiceId))
      .gte("submitted_at", thirtyDaysAgo)
      .order("submitted_at", { ascending: true })

    if (error) throw error

    // Calculate averages
    const averages =
      responses && responses.length > 0
        ? {
            energy_level: responses.reduce((sum, r) => sum + (r.energy_level || 0), 0) / responses.length,
            stress_level: responses.reduce((sum, r) => sum + (r.stress_level || 0), 0) / responses.length,
            work_satisfaction: responses.reduce((sum, r) => sum + (r.work_satisfaction || 0), 0) / responses.length,
            team_harmony: responses.reduce((sum, r) => sum + (r.team_harmony || 0), 0) / responses.length,
            work_life_balance: responses.reduce((sum, r) => sum + (r.work_life_balance || 0), 0) / responses.length,
            leadership_support: responses.reduce((sum, r) => sum + (r.leadership_support || 0), 0) / responses.length,
            growth_opportunities:
              responses.reduce((sum, r) => sum + (r.growth_opportunities || 0), 0) / responses.length,
            workload_fairness: responses.reduce((sum, r) => sum + (r.workload_fairness || 0), 0) / responses.length,
          }
        : null

    // Group by date for trends
    const trendsByDate: Record<string, any[]> = {}
    responses?.forEach((r) => {
      const date = format(new Date(r.submitted_at), "yyyy-MM-dd")
      if (!trendsByDate[date]) trendsByDate[date] = []
      trendsByDate[date].push(r)
    })

    const trends = Object.entries(trendsByDate).map(([date, dayResponses]) => ({
      date,
      work_satisfaction: dayResponses.reduce((sum, r) => sum + (r.work_satisfaction || 0), 0) / dayResponses.length,
      stress_level: dayResponses.reduce((sum, r) => sum + (r.stress_level || 0), 0) / dayResponses.length,
      team_harmony: dayResponses.reduce((sum, r) => sum + (r.team_harmony || 0), 0) / dayResponses.length,
      count: dayResponses.length,
    }))

    // Check if user submitted today (using a simple check - in production would use proper fingerprinting)
    const today = startOfDay(new Date()).toISOString()
    const { data: todayResponse } = await supabase
      .from("anonymous_mood_responses")
      .select("id")
      .eq("practice_id", Number.parseInt(practiceId))
      .gte("submitted_at", today)
      .limit(1)

    return NextResponse.json({
      averages,
      trends,
      totalResponses: responses?.length || 0,
      hasSubmittedToday: false, // In production: check via fingerprint hash
    })
  } catch (error) {
    console.error("Error fetching mood data:", error)
    return NextResponse.json({ averages: null, trends: [], totalResponses: 0 })
  }
}
