import { type NextRequest, NextResponse } from "next/server"
import { getApiClient } from "@/lib/supabase/admin"
import { getValidatedPracticeId } from "@/lib/auth/get-user-practice"

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await getApiClient()

    const effectivePracticeId = await getValidatedPracticeId(practiceId)

    if (!effectivePracticeId) {
      return NextResponse.json({ error: "Unauthorized or invalid practice" }, { status: 401 })
    }

    const url = new URL(request.url)
    const userId = url.searchParams.get("userId")
    const courseId = url.searchParams.get("courseId")

    let query = supabase
      .from("academy_enrollments")
      .select(`
        *,
        course:academy_courses(*)
      `)
      .eq("practice_id", effectivePracticeId)
      .is("deleted_at", null)
      .eq("is_active", true)

    if (userId) {
      query = query.eq("user_id", userId)
    }

    if (courseId) {
      query = query.eq("course_id", courseId)
    }

    const { data: enrollments, error } = await query.order("last_accessed_at", { ascending: false })

    if (error) {
      console.error("[v0] Academy enrollments query error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(enrollments || [])
  } catch (error: any) {
    console.error("[v0] Error fetching enrollments:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await getApiClient()

    const effectivePracticeId = await getValidatedPracticeId(practiceId)

    if (!effectivePracticeId) {
      return NextResponse.json({ error: "Unauthorized or invalid practice" }, { status: 401 })
    }

    const body = await request.json()
    const { userId, courseId } = body

    if (!userId || !courseId) {
      return NextResponse.json({ error: "userId and courseId are required" }, { status: 400 })
    }

    // Check if already enrolled
    const { data: existing } = await supabase
      .from("academy_enrollments")
      .select("id")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .eq("practice_id", effectivePracticeId)
      .is("deleted_at", null)
      .single()

    if (existing) {
      return NextResponse.json({ message: "Already enrolled", enrollment: existing })
    }

    const enrollmentData = {
      user_id: userId,
      course_id: courseId,
      practice_id: effectivePracticeId,
      progress_percentage: 0,
      completed_lessons: [],
      is_active: true,
      enrolled_at: new Date().toISOString(),
      last_accessed_at: new Date().toISOString(),
    }

    const { data: enrollment, error } = await supabase
      .from("academy_enrollments")
      .insert(enrollmentData)
      .select()
      .single()

    if (error) {
      console.error("[v0] Enrollment creation error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Update course enrollment count
    await supabase
      .rpc("increment", {
        table_name: "academy_courses",
        row_id: courseId,
        column_name: "total_enrollments",
      })
      .catch(console.error)

    return NextResponse.json(enrollment)
  } catch (error: any) {
    console.error("[v0] Error creating enrollment:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
