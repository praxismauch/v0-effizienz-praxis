import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server-admin"

const HARDCODED_PRACTICE_ID = "1"

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createClient()

    const effectivePracticeId =
      !practiceId || practiceId === "0" || practiceId === "undefined"
        ? Number.parseInt(HARDCODED_PRACTICE_ID)
        : Number.parseInt(practiceId)

    console.log("[v0] Fetching academy enrollments for practice:", effectivePracticeId)

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

    console.log("[v0] Found enrollments:", enrollments?.length || 0)
    return NextResponse.json(enrollments || [])
  } catch (error: any) {
    console.error("[v0] Error fetching enrollments:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createClient()

    const effectivePracticeId =
      !practiceId || practiceId === "0" || practiceId === "undefined"
        ? Number.parseInt(HARDCODED_PRACTICE_ID)
        : Number.parseInt(practiceId)

    const body = await request.json()
    const { userId, courseId } = body

    if (!userId || !courseId) {
      return NextResponse.json({ error: "userId and courseId are required" }, { status: 400 })
    }

    console.log("[v0] Enrolling user in course:", { userId, courseId, practiceId: effectivePracticeId })

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
      console.log("[v0] User already enrolled")
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

    console.log("[v0] Enrollment created:", enrollment.id)
    return NextResponse.json(enrollment)
  } catch (error: any) {
    console.error("[v0] Error creating enrollment:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
