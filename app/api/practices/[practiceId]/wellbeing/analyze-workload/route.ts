import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateText } from "ai"
import { subDays } from "date-fns"

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  const { practiceId } = await params
  const supabase = await createClient()

  try {
    // Gather data for analysis
    const thirtyDaysAgo = subDays(new Date(), 30)

    // Get mood responses
    const { data: moodData } = await supabase
      .from("anonymous_mood_responses")
      .select("*")
      .eq("practice_id", practiceId)
      .gte("created_at", thirtyDaysAgo.toISOString())

    // Get team size
    const { data: teamMembers } = await supabase
      .from("team_members")
      .select("id")
      .eq("practice_id", practiceId)

    // Get time tracking data if available
    const { data: timeData } = await supabase
      .from("time_blocks")
      .select("*")
      .eq("practice_id", practiceId)
      .gte("date", thirtyDaysAgo.toISOString().split("T")[0])

    // Calculate metrics
    const avgStress =
      moodData && moodData.length > 0
        ? moodData.reduce((sum, r) => sum + (r.stress_level || 0), 0) / moodData.length
        : 3

    const avgWorkLifeBalance =
      moodData && moodData.length > 0
        ? moodData.reduce((sum, r) => sum + (r.work_life_balance || 0), 0) / moodData.length
        : 3

    const avgWorkSatisfaction =
      moodData && moodData.length > 0
        ? moodData.reduce((sum, r) => sum + (r.work_satisfaction || 0), 0) / moodData.length
        : 3

    // Calculate average weekly hours from time data
    const avgWeeklyHours =
      timeData && timeData.length > 0
        ? timeData.reduce((sum, t) => sum + (t.total_hours || 0), 0) / (teamMembers?.length || 1) / 4
        : 40

    // Calculate overtime percentage
    const overtimePercentage = avgWeeklyHours > 40 ? ((avgWeeklyHours - 40) / 40) * 100 : 0

    // Calculate burnout risk score
    let burnoutRiskScore = 0
    if (avgStress >= 4) burnoutRiskScore += 30
    else if (avgStress >= 3) burnoutRiskScore += 15
    if (avgWorkLifeBalance <= 2) burnoutRiskScore += 25
    else if (avgWorkLifeBalance <= 3) burnoutRiskScore += 10
    if (avgWorkSatisfaction <= 2) burnoutRiskScore += 20
    else if (avgWorkSatisfaction <= 3) burnoutRiskScore += 10
    if (overtimePercentage > 20) burnoutRiskScore += 25
    else if (overtimePercentage > 10) burnoutRiskScore += 10

    // Identify risk factors
    const riskFactors: string[] = []
    if (avgStress >= 4) riskFactors.push("Hoher durchschnittlicher Stress-Level")
    if (avgWorkLifeBalance <= 2) riskFactors.push("Schlechte Work-Life-Balance")
    if (avgWorkSatisfaction <= 2) riskFactors.push("Geringe Arbeitszufriedenheit")
    if (overtimePercentage > 20) riskFactors.push("Hohe Überstundenquote (>20%)")

    // Get AI insights
    const { text: aiInsights } = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      prompt: `Analysiere folgende Daten zur Arbeitsbelastung eines Praxis-Teams und gib eine kurze Einschätzung (2-3 Sätze):

Durchschnittlicher Stress-Level: ${avgStress.toFixed(1)}/5
Work-Life-Balance: ${avgWorkLifeBalance.toFixed(1)}/5
Arbeitszufriedenheit: ${avgWorkSatisfaction.toFixed(1)}/5
Durchschnittliche Wochenstunden: ${avgWeeklyHours.toFixed(1)}h
Überstundenquote: ${overtimePercentage.toFixed(0)}%
Burnout-Risiko-Score: ${burnoutRiskScore}%
Team-Größe: ${teamMembers?.length || "unbekannt"}
Risikofaktoren: ${riskFactors.join(", ") || "Keine erkannt"}

Gib eine kurze, konstruktive Einschätzung auf Deutsch.`,
    })

    // Generate recommendations
    const recommendations = []
    if (avgStress >= 4) {
      recommendations.push({
        title: "Stress-Management-Programm",
        description: "Einführung regelmäßiger Pausen und Entspannungstechniken",
        priority: "high",
      })
    }
    if (avgWorkLifeBalance <= 3) {
      recommendations.push({
        title: "Flexible Arbeitszeiten",
        description: "Prüfung von Gleitzeit- oder Homeoffice-Optionen",
        priority: avgWorkLifeBalance <= 2 ? "high" : "medium",
      })
    }
    if (overtimePercentage > 10) {
      recommendations.push({
        title: "Personalplanung überprüfen",
        description: "Analyse der Arbeitslast und ggf. Aufstockung des Teams",
        priority: overtimePercentage > 20 ? "high" : "medium",
      })
    }
    if (avgWorkSatisfaction <= 3) {
      recommendations.push({
        title: "Mitarbeitergespräche",
        description: "Regelmäßige 1:1-Gespräche zur Karriereentwicklung",
        priority: avgWorkSatisfaction <= 2 ? "high" : "medium",
      })
    }

    // Save analysis
    const { data: analysis, error } = await supabase
      .from("workload_analysis")
      .insert({
        practice_id: practiceId,
        analysis_period_start: thirtyDaysAgo.toISOString().split("T")[0],
        analysis_period_end: new Date().toISOString().split("T")[0],
        avg_weekly_hours: avgWeeklyHours,
        overtime_percentage: overtimePercentage,
        sick_leave_rate: 5, // Placeholder - would need actual data
        vacation_usage_rate: 70, // Placeholder - would need actual data
        burnout_risk_score: Math.min(100, Math.max(0, burnoutRiskScore)),
        risk_factors: riskFactors,
        ai_insights: aiInsights,
        ai_recommendations: recommendations,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ analysis })
  } catch (error) {
    console.error("Error analyzing workload:", error)
    return NextResponse.json({ error: "Failed to analyze workload" }, { status: 500 })
  }
}
