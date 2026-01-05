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

    // Get feature usage grouped by feature name
    const { data: featureUsage, error } = await supabase
      .from("app_feature_usage")
      .select("feature_name, feature_category, practice_id")
      .gte("created_at", startDate.toISOString())

    if (error) throw error

    // Aggregate data
    const aggregated = featureUsage.reduce((acc: any, curr: any) => {
      if (!acc[curr.feature_name]) {
        acc[curr.feature_name] = {
          feature_name: curr.feature_name,
          feature_category: curr.feature_category,
          usage_count: 0,
          unique_practices: new Set(),
        }
      }
      acc[curr.feature_name].usage_count++
      if (curr.practice_id) {
        acc[curr.feature_name].unique_practices.add(curr.practice_id)
      }
      return acc
    }, {})

    // Convert to array and add unique practices count
    const topFeatures = Object.values(aggregated)
      .map((item: any) => ({
        ...item,
        unique_practices: item.unique_practices.size,
      }))
      .sort((a: any, b: any) => b.usage_count - a.usage_count)

    return NextResponse.json({ topFeatures })
  } catch (error) {
    console.error("[v0] Error fetching feature usage:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
