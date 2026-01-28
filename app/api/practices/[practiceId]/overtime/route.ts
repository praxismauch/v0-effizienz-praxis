import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params

    if (!practiceId) {
      return NextResponse.json({ error: "Practice ID is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get all active team members for this practice
    const { data: teamMembers, error: membersError } = await supabase
      .from("team_members")
      .select(
        `
        id,
        user_id,
        first_name,
        last_name,
        email,
        avatar_url,
        planned_hours_per_week
      `,
      )
      .eq("practice_id", practiceId)
      .eq("is_active", true)

    if (membersError) {
      console.error("Error fetching team members:", membersError)
      return NextResponse.json({ error: "Failed to fetch team members" }, { status: 500 })
    }

    // Calculate date ranges
    const now = new Date()
    const weekStart = startOfWeek(now, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)

    // Fetch overtime data for each team member
    const membersWithOvertime = await Promise.all(
      (teamMembers || []).map(async (member) => {
        // Get all time blocks for this user
        const { data: allBlocks } = await supabase
          .from("time_blocks")
          .select("overtime_minutes, date, actual_hours")
          .eq("practice_id", practiceId)
          .eq("user_id", member.user_id)
          .eq("status", "completed")

        // Get time blocks for this week
        const { data: weekBlocks } = await supabase
          .from("time_blocks")
          .select("overtime_minutes, actual_hours")
          .eq("practice_id", practiceId)
          .eq("user_id", member.user_id)
          .eq("status", "completed")
          .gte("date", weekStart.toISOString().split("T")[0])
          .lte("date", weekEnd.toISOString().split("T")[0])

        // Get time blocks for this month
        const { data: monthBlocks } = await supabase
          .from("time_blocks")
          .select("overtime_minutes, actual_hours")
          .eq("practice_id", practiceId)
          .eq("user_id", member.user_id)
          .eq("status", "completed")
          .gte("date", monthStart.toISOString().split("T")[0])
          .lte("date", monthEnd.toISOString().split("T")[0])

        // Calculate totals
        const overtimeTotalMinutes = (allBlocks || []).reduce((sum, block) => sum + (block.overtime_minutes || 0), 0)
        const overtimeWeekMinutes = (weekBlocks || []).reduce((sum, block) => sum + (block.overtime_minutes || 0), 0)
        const overtimeMonthMinutes = (monthBlocks || []).reduce((sum, block) => sum + (block.overtime_minutes || 0), 0)
        const actualHoursWeek = (weekBlocks || []).reduce((sum, block) => sum + (block.actual_hours || 0), 0)
        const actualHoursMonth = (monthBlocks || []).reduce((sum, block) => sum + (block.actual_hours || 0), 0)

        return {
          id: member.id,
          user_id: member.user_id,
          first_name: member.first_name,
          last_name: member.last_name,
          email: member.email,
          avatar_url: member.avatar_url,
          overtime_total_minutes: overtimeTotalMinutes,
          overtime_this_week_minutes: overtimeWeekMinutes,
          overtime_this_month_minutes: overtimeMonthMinutes,
          planned_hours_per_week: member.planned_hours_per_week || 40,
          actual_hours_this_week: actualHoursWeek,
          actual_hours_this_month: actualHoursMonth,
        }
      }),
    )

    return NextResponse.json({
      members: membersWithOvertime,
      summary: {
        total_overtime_minutes: membersWithOvertime.reduce((sum, m) => sum + m.overtime_total_minutes, 0),
        week_overtime_minutes: membersWithOvertime.reduce((sum, m) => sum + m.overtime_this_week_minutes, 0),
        month_overtime_minutes: membersWithOvertime.reduce((sum, m) => sum + m.overtime_this_month_minutes, 0),
        team_count: membersWithOvertime.length,
      },
    })
  } catch (error) {
    console.error("Error fetching overtime data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
