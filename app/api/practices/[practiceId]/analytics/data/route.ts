import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { isRateLimitError } from "@/lib/supabase/safe-query"

export const dynamic = "force-dynamic"

async function fetchWithRetry<T>(
  fetchFn: () => Promise<T>,
  retries = 3,
  delay = 1000,
): Promise<{ data: T | null; error: any }> {}

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

    let supabase
    try {
      supabase = await createAdminClient()
    } catch (clientError) {
      if (isRateLimitError(clientError)) {
        console.warn("[v0] Analytics GET - Rate limited creating client, returning empty data")
        return NextResponse.json({
          practiceGrowthData: [],
          taskCategoryData: [],
          teamSatisfactionData: [],
          kpiData: [],
          efficiencyData: [],
          qualityMetricsData: [],
        })
      }
      throw clientError
    }
  } catch (error) {
    console.error("[v0] Error fetching analytics data:", error)
    return NextResponse.json({ error: "Failed to fetch analytics data" }, { status: 500 })
  }
}
