import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate") || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const endDate = searchParams.get("endDate") || new Date().toISOString()
    const page = searchParams.get("page") || "all"

    const supabase = await createAdminClient()

    // Build query
    let query = supabase
      .from("landing_page_analytics")
      .select("*")
      .gte("created_at", startDate)
      .lte("created_at", endDate)

    if (page !== "all") {
      query = query.eq("page_path", page)
    }

    const { data: events, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching analytics:", error)
      return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
    }

    // Calculate metrics
    const totalViews = events?.filter((e) => e.event_type === "page_view").length || 0
    const uniqueVisitors = new Set(events?.map((e) => e.visitor_id).filter(Boolean)).size
    const totalEvents = events?.length || 0

    // Group by page
    const pageViews: Record<string, number> = {}
    const pageUniqueVisitors: Record<string, Set<string>> = {}

    events?.forEach((event) => {
      if (event.event_type === "page_view") {
        pageViews[event.page_path] = (pageViews[event.page_path] || 0) + 1

        if (!pageUniqueVisitors[event.page_path]) {
          pageUniqueVisitors[event.page_path] = new Set()
        }
        if (event.visitor_id) {
          pageUniqueVisitors[event.page_path].add(event.visitor_id)
        }
      }
    })

    // Convert page stats to array
    const pageStats = Object.entries(pageViews).map(([path, views]) => ({
      page: path,
      views,
      uniqueVisitors: pageUniqueVisitors[path]?.size || 0,
    }))

    // Group by date
    const dailyStats: Record<string, { views: number; visitors: Set<string> }> = {}
    events?.forEach((event) => {
      if (event.event_type === "page_view") {
        const date = new Date(event.created_at).toISOString().split("T")[0]
        if (!dailyStats[date]) {
          dailyStats[date] = { views: 0, visitors: new Set() }
        }
        dailyStats[date].views++
        if (event.visitor_id) {
          dailyStats[date].visitors.add(event.visitor_id)
        }
      }
    })

    const dailyData = Object.entries(dailyStats)
      .map(([date, stats]) => ({
        date,
        views: stats.views,
        uniqueVisitors: stats.visitors.size,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Device breakdown
    const deviceStats: Record<string, number> = {}
    events?.forEach((event) => {
      if (event.device_type && event.event_type === "page_view") {
        deviceStats[event.device_type] = (deviceStats[event.device_type] || 0) + 1
      }
    })

    // Browser breakdown
    const browserStats: Record<string, number> = {}
    events?.forEach((event) => {
      if (event.browser && event.event_type === "page_view") {
        browserStats[event.browser] = (browserStats[event.browser] || 0) + 1
      }
    })

    // Traffic sources (referrers)
    const referrerStats: Record<string, number> = {}
    events?.forEach((event) => {
      if (event.event_type === "page_view") {
        const referrer = event.referrer || "Direct"
        referrerStats[referrer] = (referrerStats[referrer] || 0) + 1
      }
    })

    return NextResponse.json({
      summary: {
        totalViews,
        uniqueVisitors,
        totalEvents,
        avgViewsPerVisitor: uniqueVisitors > 0 ? (totalViews / uniqueVisitors).toFixed(2) : 0,
      },
      pageStats,
      dailyData,
      deviceStats,
      browserStats,
      referrerStats,
      events: events?.slice(0, 100), // Return latest 100 events
    })
  } catch (error) {
    console.error("[v0] Analytics API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Track analytics event
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const supabase = await createAdminClient()

    const { data, error } = await supabase.from("landing_page_analytics").insert({
      page_path: body.page_path,
      event_type: body.event_type || "page_view",
      visitor_id: body.visitor_id,
      user_agent: body.user_agent,
      referrer: body.referrer,
      country: body.country,
      city: body.city,
      device_type: body.device_type,
      browser: body.browser,
      os: body.os,
      session_id: body.session_id,
      metadata: body.metadata || {},
    })

    if (error) {
      console.error("[v0] Error inserting analytics:", error)
      return NextResponse.json({ error: "Failed to track event" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("[v0] Analytics tracking error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
