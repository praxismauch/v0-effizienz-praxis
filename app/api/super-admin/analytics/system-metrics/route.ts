export const dynamic = "force-dynamic"

import { createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createAdminClient()

    const searchParams = request.nextUrl.searchParams
    const days = Number.parseInt(searchParams.get("days") || "30")
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get total practices
    const { count: totalPractices } = await supabase.from("practices").select("*", { count: "exact", head: true })

    // Get new practices in date range
    const { count: newPractices } = await supabase
      .from("practices")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startDate.toISOString())

    // Get active users
    const { count: activeUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)

    // Get total feature usage
    const { count: totalFeatureUsage } = await supabase
      .from("app_feature_usage")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startDate.toISOString())

    // Get waitlist count
    const { count: waitlistCount } = await supabase
      .from("waitlist")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending")

    // Calculate metrics
    const avgFeatureUsagePerUser = activeUsers ? Math.round(totalFeatureUsage / activeUsers) : 0
    const userGrowthPercent = totalPractices ? ((newPractices / totalPractices) * 100).toFixed(1) : 0
    const growthRate = totalPractices ? ((newPractices / (totalPractices - newPractices)) * 100).toFixed(1) : 0

    // Calculate conversion rate (landing page views to practices)
    const { count: landingViews } = await supabase
      .from("landing_page_analytics")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startDate.toISOString())

    const conversionRate = landingViews ? ((newPractices / landingViews) * 100).toFixed(2) : 0

    const avgSessionDuration = await calculateAvgSessionDuration(supabase)

    return NextResponse.json({
      totalPractices,
      newPractices,
      activeUsers,
      totalFeatureUsage,
      avgFeatureUsagePerUser,
      userGrowthPercent: Number.parseFloat(userGrowthPercent),
      waitlistCount,
      growthRate: Number.parseFloat(growthRate),
      conversionRate: Number.parseFloat(conversionRate),
      avgSessionDuration,
    })
  } catch (error) {
    console.error("[v0] Error fetching system metrics:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Helper function to calculate session duration
async function calculateAvgSessionDuration(supabase: any): Promise<string> {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: activities } = await supabase
      .from("app_feature_usage")
      .select("user_id, timestamp")
      .gte("timestamp", thirtyDaysAgo.toISOString())
      .order("user_id", { ascending: true })
      .order("timestamp", { ascending: true })

    if (!activities || activities.length === 0) {
      return "15m" // Default fallback
    }

    // Group by user and calculate session durations
    const userSessions: { [key: string]: Date[] } = {}
    activities.forEach((activity) => {
      if (!userSessions[activity.user_id]) {
        userSessions[activity.user_id] = []
      }
      userSessions[activity.user_id].push(new Date(activity.timestamp))
    })

    let totalSessionMinutes = 0
    let sessionCount = 0

    Object.values(userSessions).forEach((timestamps) => {
      if (timestamps.length < 2) return

      for (let i = 1; i < timestamps.length; i++) {
        const diff = timestamps[i].getTime() - timestamps[i - 1].getTime()
        const minutes = diff / (1000 * 60)

        // Consider it a session if activities are within 30 minutes of each other
        if (minutes <= 30) {
          totalSessionMinutes += minutes
          sessionCount++
        }
      }
    })

    if (sessionCount === 0) return "15m"

    const avgMinutes = Math.round(totalSessionMinutes / sessionCount)
    return `${avgMinutes}m`
  } catch (error) {
    console.error("[v0] Error calculating session duration:", error)
    return "15m"
  }
}
