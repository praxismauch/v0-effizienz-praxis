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

    // Get practices created in date range
    const { data: practices, error } = await supabase
      .from("practices")
      .select("created_at")
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true })

    if (error) throw error

    // Group by date
    const dailyGrowth: any[] = []
    const dateMap = new Map()

    practices.forEach((practice: any) => {
      const date = new Date(practice.created_at).toISOString().split("T")[0]
      dateMap.set(date, (dateMap.get(date) || 0) + 1)
    })

    // Create daily data with cumulative count
    let cumulative = 0
    for (let i = 0; i < days; i++) {
      const date = new Date()
      date.setDate(date.getDate() - (days - 1 - i))
      const dateStr = date.toISOString().split("T")[0]
      const count = dateMap.get(dateStr) || 0
      cumulative += count

      dailyGrowth.push({
        date: dateStr,
        count,
        cumulative,
      })
    }

    return NextResponse.json({ dailyGrowth })
  } catch (error) {
    console.error("[v0] Error fetching practice growth:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
