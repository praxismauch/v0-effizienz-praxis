import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createAdminClient()
    const { id } = await params

    const { data: analysis, error } = await supabase.from("roi_analyses").select("*").eq("id", id).maybeSingle()

    if (error) {
      console.error("Error fetching ROI analysis:", error)
      return NextResponse.json({ error: "Failed to fetch ROI analysis" }, { status: 500 })
    }

    if (!analysis) {
      return NextResponse.json({ error: "ROI Analyse nicht gefunden" }, { status: 404 })
    }

    return NextResponse.json(analysis)
  } catch (error) {
    console.error("Error fetching ROI analysis:", error)
    return NextResponse.json({ error: "Failed to fetch ROI analysis" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createAdminClient()
    const { id } = await params

    const { error } = await supabase.from("roi_analyses").delete().eq("id", id)

    if (error) {
      console.error("Error deleting ROI analysis:", error)
      return NextResponse.json({ error: "Failed to delete ROI analysis" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting ROI analysis:", error)
    return NextResponse.json({ error: "Failed to delete ROI analysis" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createAdminClient()
    const { id } = await params
    const body = await request.json()

    const {
      service_name,
      description,
      fixed_costs,
      variable_costs,
      total_fixed_costs,
      total_variable_costs,
      scenario_pessimistic,
      scenario_realistic,
      scenario_optimistic,
      demand_pessimistic,
      demand_realistic,
      demand_optimistic,
    } = body

    // Calculate break-even and ROI score
    const realisticProfit = scenario_realistic - total_variable_costs
    let breakEvenMonths = null

    if (realisticProfit > 0 && demand_realistic > 0) {
      const monthlyProfit = realisticProfit * demand_realistic
      breakEvenMonths = total_fixed_costs / monthlyProfit
    }

    // Calculate ROI score (0-100)
    let roiScore = 0
    if (realisticProfit > 0 && demand_realistic > 0) {
      const yearlyProfit = realisticProfit * demand_realistic * 12
      const netProfit = yearlyProfit - total_fixed_costs

      if (netProfit > total_fixed_costs * 2) {
        roiScore = 90
      } else if (netProfit > total_fixed_costs) {
        roiScore = 75
      } else if (netProfit > 0) {
        roiScore = 50
      } else if (netProfit > -total_fixed_costs * 0.5) {
        roiScore = 25
      }
    } else {
      roiScore = 10
    }

    // Determine recommendation
    let recommendation = "not_recommended"
    let recommendationReason = ""

    if (roiScore >= 75) {
      recommendation = "highly_recommended"
      recommendationReason =
        "Hervorragende Rentabilität: Die Investition amortisiert sich schnell und generiert nachhaltigen Gewinn."
    } else if (roiScore >= 50) {
      recommendation = "recommended"
      recommendationReason =
        "Gute Rentabilität: Die Investition ist wirtschaftlich sinnvoll mit akzeptabler Amortisationszeit."
    } else if (roiScore >= 25) {
      recommendation = "neutral"
      recommendationReason =
        "Neutrale Bewertung: Die Wirtschaftlichkeit ist grenzwertig. Weitere Faktoren sollten berücksichtigt werden."
    } else {
      recommendation = "not_recommended"
      recommendationReason = "Keine Empfehlung: Die erwarteten Kosten übersteigen den Preis pro Leistung."
    }

    const { data: analysis, error } = await supabase
      .from("roi_analyses")
      .update({
        service_name,
        description,
        fixed_costs,
        variable_costs,
        total_fixed_costs,
        total_variable_costs,
        scenario_pessimistic,
        scenario_realistic,
        scenario_optimistic,
        demand_pessimistic,
        demand_realistic,
        demand_optimistic,
        roi_score: roiScore,
        recommendation,
        recommendation_reason: recommendationReason,
        break_even_months: breakEvenMonths,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating ROI analysis:", error)
      return NextResponse.json({ error: error.message || "Failed to update ROI analysis" }, { status: 500 })
    }

    return NextResponse.json(analysis)
  } catch (error) {
    console.error("Error updating ROI analysis:", error)
    return NextResponse.json({ error: "Failed to update ROI analysis" }, { status: 500 })
  }
}
