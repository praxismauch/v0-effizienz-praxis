import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createAdminClient()

    // Calculate date for one month ago
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
    const oneMonthAgoStr = oneMonthAgo.toISOString().split("T")[0]

    // Count ratings from the last month
    const { count, error } = await supabase
      .from("google_ratings")
      .select("*", { count: "exact", head: true })
      .gte("review_date", oneMonthAgoStr)

    if (error) {
      console.error("[v0] Google Ratings Count API - Error:", error)
      return NextResponse.json({ error: "Failed to fetch Google ratings count" }, { status: 500 })
    }

    return NextResponse.json({
      count: count || 0,
      period: "last_month",
      startDate: oneMonthAgoStr,
    })
  } catch (error) {
    console.error("[v0] Google Ratings Count API - Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
