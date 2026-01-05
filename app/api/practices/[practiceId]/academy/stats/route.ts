import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createAdminClient()

    // Get user_id from query params or use a default
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("user_id")

    if (!userId) {
      // Return default stats if no user specified
      return NextResponse.json({
        total_xp: 0,
        current_level: 1,
        xp_for_next_level: 1000,
        courses_completed: 0,
        lessons_completed: 0,
        current_streak_days: 0,
        longest_streak_days: 0,
        quizzes_passed: 0,
      })
    }

    const { data: stats, error } = await supabase
      .from("academy_user_stats")
      .select("*")
      .eq("user_id", userId)
      .eq("practice_id", practiceId)
      .maybeSingle()

    if (error) {
      if (error.message?.includes("Too Many") || error.code === "429") {
        return NextResponse.json({
          total_xp: 0,
          current_level: 1,
          xp_for_next_level: 1000,
          courses_completed: 0,
          lessons_completed: 0,
          current_streak_days: 0,
          longest_streak_days: 0,
          quizzes_passed: 0,
        })
      }
      throw error
    }

    return NextResponse.json(
      stats || {
        total_xp: 0,
        current_level: 1,
        xp_for_next_level: 1000,
        courses_completed: 0,
        lessons_completed: 0,
        current_streak_days: 0,
        longest_streak_days: 0,
        quizzes_passed: 0,
      },
    )
  } catch (error: any) {
    console.error("Error fetching user stats:", error)
    return NextResponse.json({
      total_xp: 0,
      current_level: 1,
      xp_for_next_level: 1000,
      courses_completed: 0,
      lessons_completed: 0,
      current_streak_days: 0,
      longest_streak_days: 0,
      quizzes_passed: 0,
    })
  }
}
