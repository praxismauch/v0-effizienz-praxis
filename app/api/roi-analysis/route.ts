import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (error: any) {
      const isRetryable =
        error?.message?.includes("Failed to fetch") ||
        error?.message?.includes("Too Many Requests") ||
        error?.code === "PGRST301"
      if (!isRetryable || i === retries - 1) throw error
      await new Promise((r) => setTimeout(r, 500 * (i + 1)))
    }
  }
  throw new Error("Max retries reached")
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createAdminClient()

    const { searchParams } = new URL(request.url)
    const practiceId = searchParams.get("practice_id")

    if (!practiceId) {
      return NextResponse.json({ error: "Practice ID required" }, { status: 400 })
    }

    const { data: analyses, error } = await withRetry(() =>
      supabase.from("roi_analyses").select("*").eq("practice_id", practiceId).order("created_at", { ascending: false }),
    )

    if (error) {
      console.error("ROI analyses fetch error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(analyses || [])
  } catch (error: any) {
    console.error("Error fetching ROI analyses:", error)
    return NextResponse.json({ error: error?.message || "Failed to fetch ROI analyses" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createAdminClient()

    const body = await request.json()

    if (!body.practice_id) {
      return NextResponse.json({ error: "Practice ID required" }, { status: 400 })
    }

    // Calculate break-even and ROI score
    const totalFixed = body.total_fixed_costs || 0
    const totalVariable = body.total_variable_costs || 0
    const realisticPrice = body.scenario_realistic || 0
    const realisticDemand = body.demand_realistic || 0

    const marginPerUnit = realisticPrice - totalVariable
    const monthlyProfit = marginPerUnit * realisticDemand
    const breakEvenUnits = totalFixed / (marginPerUnit || 1)
    const breakEvenMonths = breakEvenUnits / (realisticDemand || 1)

    // Calculate ROI score (0-100)
    let roiScore = 0
    let recommendation = "not_recommended"
    let recommendationReason = ""

    if (monthlyProfit > 0) {
      // Positive monthly profit
      if (breakEvenMonths <= 6) {
        roiScore = 90
        recommendation = "highly_recommended"
        recommendationReason = "Hervorragende Investition: Schnelle Amortisation und hoher monatlicher Gewinn."
      } else if (breakEvenMonths <= 12) {
        roiScore = 75
        recommendation = "recommended"
        recommendationReason = "Gute Investition: Die Amortisation erfolgt innerhalb eines Jahres."
      } else if (breakEvenMonths <= 24) {
        roiScore = 50
        recommendation = "neutral"
        recommendationReason = "Mittelfristige Investition: Die Amortisation dauert 1-2 Jahre."
      } else {
        roiScore = 25
        recommendation = "not_recommended"
        recommendationReason = "Langfristige Investition: Die Amortisation dauert mehr als 2 Jahre."
      }
    } else {
      roiScore = 10
      recommendation = "not_recommended"
      recommendationReason = "Keine Empfehlung: Die erwarteten Kosten übersteigen den Preis pro Leistung."
    }

    const { data: analysis, error } = await supabase
      .from("roi_analyses")
      .insert({
        practice_id: body.practice_id,
        created_by: body.user_id || null,
        service_name: body.service_name,
        description: body.description || null,
        fixed_costs: body.fixed_costs || [],
        variable_costs: body.variable_costs || [],
        total_fixed_costs: totalFixed,
        total_variable_costs: totalVariable,
        scenario_pessimistic: body.scenario_pessimistic || 0,
        scenario_realistic: body.scenario_realistic || 0,
        scenario_optimistic: body.scenario_optimistic || 0,
        demand_pessimistic: body.demand_pessimistic || 0,
        demand_realistic: body.demand_realistic || 0,
        demand_optimistic: body.demand_optimistic || 0,
        break_even_units: Math.ceil(breakEvenUnits),
        break_even_months: breakEvenMonths,
        roi_score: roiScore,
        recommendation,
        recommendation_reason: recommendationReason,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(analysis)
  } catch (error: any) {
    console.error("Error creating ROI analysis:", error)
    return NextResponse.json({ error: error?.message || "Failed to create ROI analysis" }, { status: 500 })
  }
}
