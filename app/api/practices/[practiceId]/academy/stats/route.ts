import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server-admin"

const HARDCODED_PRACTICE_ID = "1"

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId: rawPracticeId } = await params
    const supabase = createClient()

    const practiceId =
      rawPracticeId === "0" || rawPracticeId === "undefined" || !rawPracticeId
        ? Number.parseInt(HARDCODED_PRACTICE_ID)
        : Number.parseInt(rawPracticeId)



    // Get total courses
    const { count: totalCourses } = await supabase
      .from("academy_courses")
      .select("*", { count: "exact", head: true })
      .eq("practice_id", practiceId)
      .is("deleted_at", null)

    // Get published courses
    const { count: publishedCourses } = await supabase
      .from("academy_courses")
      .select("*", { count: "exact", head: true })
      .eq("practice_id", practiceId)
      .eq("is_published", true)
      .is("deleted_at", null)

    // Get total enrollments
    const { count: totalEnrollments } = await supabase
      .from("academy_enrollments")
      .select("*", { count: "exact", head: true })
      .eq("practice_id", practiceId)

    // Get completed enrollments
    const { count: completedEnrollments } = await supabase
      .from("academy_enrollments")
      .select("*", { count: "exact", head: true })
      .eq("practice_id", practiceId)
      .not("completed_at", "is", null)

    // Get total modules
    const { count: totalModules } = await supabase
      .from("academy_modules")
      .select("*", { count: "exact", head: true })
      .eq("practice_id", practiceId)
      .is("deleted_at", null)

    // Get total lessons
    const { count: totalLessons } = await supabase
      .from("academy_lessons")
      .select("*", { count: "exact", head: true })
      .eq("practice_id", practiceId)
      .is("deleted_at", null)

    // Get total quizzes
    const { count: totalQuizzes } = await supabase
      .from("academy_quizzes")
      .select("*", { count: "exact", head: true })
      .eq("practice_id", practiceId)
      .is("deleted_at", null)

    // Get total badges
    const { count: totalBadges } = await supabase
      .from("academy_badges")
      .select("*", { count: "exact", head: true })
      .eq("practice_id", practiceId)
      .is("deleted_at", null)

    // Get total badges awarded
    const { count: totalBadgesAwarded } = await supabase
      .from("academy_user_badges")
      .select("*", { count: "exact", head: true })
      .eq("practice_id", practiceId)

    // Calculate completion rate
    const completionRate = totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0

    // Average rating placeholder - no academy review/rating table exists yet
    // When a course review system is added, query it here
    const avgRating = 0

    const stats = {
      totalCourses: totalCourses || 0,
      publishedCourses: publishedCourses || 0,
      totalEnrollments: totalEnrollments || 0,
      completedEnrollments: completedEnrollments || 0,
      completionRate,
      totalModules: totalModules || 0,
      totalLessons: totalLessons || 0,
      totalQuizzes: totalQuizzes || 0,
      totalBadges: totalBadges || 0,
      totalBadgesAwarded: totalBadgesAwarded || 0,
      averageRating: avgRating,
    }

    return NextResponse.json(stats)
  } catch (error: any) {
    console.error("[v0] Error fetching academy stats:", error)
    return NextResponse.json({ error: "Failed to fetch academy stats", details: error.message }, { status: 500 })
  }
}
