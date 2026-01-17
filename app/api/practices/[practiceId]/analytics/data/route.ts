import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params

    if (!practiceId) {
      return NextResponse.json(
        {
          error: "Praxis-ID fehlt",
          details: "Analytics-Daten können nicht ohne Praxis-ID geladen werden.",
        },
        { status: 400 },
      )
    }

    // Analytics data is currently managed in-memory by the context, not stored in DB
    return NextResponse.json({
      practiceGrowthData: [],
      taskCategoryData: [],
      teamSatisfactionData: [],
      kpiData: [],
      efficiencyData: [],
      qualityMetricsData: [],
    })
  } catch (error) {
    console.error("[v0] Error fetching analytics data:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch analytics data",
        practiceGrowthData: [],
        taskCategoryData: [],
        teamSatisfactionData: [],
        kpiData: [],
        efficiencyData: [],
        qualityMetricsData: [],
      },
      { status: 500 },
    )
  }
}
