import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const year = searchParams.get("year") || new Date().getFullYear().toString()

    // Get all sick leaves for the year
    const { data: sickLeaves, error } = await supabase
      .from("sick_leaves")
      .select(`
        id,
        user_id,
        start_date,
        end_date,
        status
      `)
      .eq("practice_id", String(practiceId))
      .is("deleted_at", null)
      .gte("start_date", `${year}-01-01`)
      .lte("start_date", `${year}-12-31`)

    if (error) {
      console.error("[v0] sick-leaves stats error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get team members for user names
    const { data: teamMembers } = await supabase
      .from("practice_members")
      .select("user_id, first_name, last_name")
      .eq("practice_id", String(practiceId))

    const userNameMap: Record<string, string> = {}
    teamMembers?.forEach((member) => {
      if (member.user_id) {
        userNameMap[member.user_id] = `${member.first_name || ""} ${member.last_name || ""}`.trim() || "Unbekannt"
      }
    })

    // Calculate statistics
    const monthlyStats: { [month: string]: number } = {}
    const userStats: { [userId: string]: { name: string; days: number } } = {}
    let totalDays = 0

    for (let i = 1; i <= 12; i++) {
      monthlyStats[i.toString().padStart(2, "0")] = 0
    }
    ;(sickLeaves || []).forEach((leave) => {
      const start = new Date(leave.start_date)
      const end = new Date(leave.end_date)
      const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

      totalDays += diffDays

      // Add to monthly stats (by start month)
      const month = (start.getMonth() + 1).toString().padStart(2, "0")
      monthlyStats[month] = (monthlyStats[month] || 0) + diffDays

      // Add to user stats
      if (leave.user_id) {
        if (!userStats[leave.user_id]) {
          userStats[leave.user_id] = {
            name: userNameMap[leave.user_id] || "Unbekannt",
            days: 0,
          }
        }
        userStats[leave.user_id].days += diffDays
      }
    })

    // Convert to chart-friendly format
    const monthlyChartData = Object.entries(monthlyStats).map(([month, days]) => ({
      month: new Date(Number(year), Number(month) - 1).toLocaleDateString("de-DE", { month: "short" }),
      monthNumber: month,
      days,
    }))

    const userChartData = Object.entries(userStats)
      .map(([userId, data]) => ({
        userId,
        name: data.name,
        days: data.days,
      }))
      .sort((a, b) => b.days - a.days)

    return NextResponse.json({
      totalDays,
      totalRecords: sickLeaves?.length || 0,
      monthlyStats: monthlyChartData,
      userStats: userChartData,
      year,
    })
  } catch (error) {
    console.error("[v0] sick-leaves stats exception:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
