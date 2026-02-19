import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server-admin"
import { getValidatedPracticeId } from "@/lib/auth/get-user-practice"

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId: rawPracticeId } = await params
    const supabase = await createClient()

    const practiceId = await getValidatedPracticeId(rawPracticeId)

    if (!practiceId) {
      return NextResponse.json({ error: "Unauthorized or invalid practice" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get("period") || "all" // all, weekly, monthly
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    console.log("[v0] Academy leaderboard - Practice ID:", practiceId, "Period:", period, "Limit:", limit)

    // Calculate time filter for period
    let timeFilter = null
    if (period === "weekly") {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      timeFilter = weekAgo.toISOString()
    } else if (period === "monthly") {
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      timeFilter = monthAgo.toISOString()
    }

    // Get user progress from enrollments
    let query = supabase
      .from("academy_enrollments")
      .select(`
        user_id,
        progress_percentage,
        completed_at,
        users:user_id (
          id,
          name,
          email
        )
      `)
      .eq("practice_id", practiceId)

    if (timeFilter) {
      query = query.gte("updated_at", timeFilter)
    }

    const { data: enrollments, error: enrollError } = await query

    if (enrollError) {
      console.error("[v0] Enrollment query error:", enrollError)
      throw enrollError
    }

    // Get badges earned per user
    let badgeQuery = supabase.from("academy_user_badges").select("user_id, badge_id").eq("practice_id", practiceId)

    if (timeFilter) {
      badgeQuery = badgeQuery.gte("earned_at", timeFilter)
    }

    const { data: userBadges } = await badgeQuery

    // Aggregate user stats
    const userStatsMap = new Map()

    enrollments?.forEach((enrollment: any) => {
      const userId = enrollment.user_id
      if (!userStatsMap.has(userId)) {
        userStatsMap.set(userId, {
          user_id: userId,
          name: enrollment.users?.name || "Unknown User",
          email: enrollment.users?.email,
          total_progress: 0,
          courses_enrolled: 0,
          courses_completed: 0,
          badges_earned: 0,
        })
      }

      const userStats = userStatsMap.get(userId)
      userStats.courses_enrolled++
      userStats.total_progress += enrollment.progress_percentage || 0
      if (enrollment.completed_at) {
        userStats.courses_completed++
      }
    })

    // Add badge counts
    userBadges?.forEach((badge: any) => {
      const userId = badge.user_id
      if (userStatsMap.has(userId)) {
        userStatsMap.get(userId).badges_earned++
      }
    })

    // Calculate score and sort
    const leaderboard = Array.from(userStatsMap.values())
      .map((user: any) => ({
        ...user,
        average_progress: user.courses_enrolled > 0 ? Math.round(user.total_progress / user.courses_enrolled) : 0,
        score: user.courses_completed * 100 + user.badges_earned * 50 + user.total_progress,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((user, index) => ({
        rank: index + 1,
        ...user,
      }))

    console.log("[v0] Leaderboard result:", leaderboard.length, "users")
    return NextResponse.json(leaderboard)
  } catch (error: any) {
    console.error("[v0] Error fetching leaderboard:", error)
    return NextResponse.json({ error: "Failed to fetch leaderboard", details: error.message }, { status: 500 })
  }
}
