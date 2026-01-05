import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createAdminClient()

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: analyticsData, error: analyticsError } = await supabase
      .from("landing_page_analytics")
      .select("created_at, event_type, page_path")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: true })

    if (analyticsError) throw analyticsError

    // Group by date and calculate metrics
    const trafficByDate: Record<string, { visits: number; clicks: number; views: number }> = {}

    analyticsData?.forEach((event) => {
      const date = new Date(event.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })

      if (!trafficByDate[date]) {
        trafficByDate[date] = { visits: 0, clicks: 0, views: 0 }
      }

      if (event.event_type === "page_view") {
        trafficByDate[date].visits++
        trafficByDate[date].views++
      } else if (event.event_type === "click" || event.event_type === "button_click") {
        trafficByDate[date].clicks++
      }
    })

    // Convert to array and format for chart
    const trafficData = Object.entries(trafficByDate)
      .map(([date, metrics]) => ({
        date,
        visits: metrics.visits,
        clicks: metrics.clicks,
        impressions: metrics.views * 10, // Estimate impressions
      }))
      .slice(-7) // Last 7 days

    return NextResponse.json({ trafficData })
  } catch (error) {
    console.error("Error fetching traffic data:", error)
    return NextResponse.json({ error: "Failed to fetch traffic data" }, { status: 500 })
  }
}
