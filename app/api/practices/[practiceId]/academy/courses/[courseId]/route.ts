import { type NextRequest, NextResponse } from "next/server"
import { getApiClient } from "@/lib/supabase/admin"
import { getValidatedPracticeId } from "@/lib/auth/get-user-practice"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; courseId: string }> },
) {
  try {
    const { practiceId, courseId } = await params
    const effectivePracticeId = await getValidatedPracticeId(practiceId)

    if (!effectivePracticeId) {
      return NextResponse.json({ error: "Unauthorized or invalid practice" }, { status: 401 })
    }

    const supabase = await getApiClient()

    const { data: course, error } = await supabase
      .from("academy_courses")
      .select("*")
      .eq("id", courseId)
      .eq("practice_id", effectivePracticeId)
      .is("deleted_at", null)
      .single()

    if (error) {
      console.error("[v0] Error fetching course:", error.message)
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json(course)
  } catch (error: any) {
    console.error("[v0] Error in GET /academy/courses/:id:", error)
    return NextResponse.json({ error: "Failed to fetch course" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; courseId: string }> },
) {
  try {
    const { practiceId, courseId } = await params
    const effectivePracticeId = await getValidatedPracticeId(practiceId)

    if (!effectivePracticeId) {
      return NextResponse.json({ error: "Unauthorized or invalid practice" }, { status: 401 })
    }

    const body = await request.json()
    const supabase = await getApiClient()

    console.log("[v0] Updating course:", courseId)

    const updateData = {
      ...body,
      updated_at: new Date().toISOString(),
    }

    // Remove fields that shouldn't be updated
    delete updateData.id
    delete updateData.created_at
    delete updateData.practice_id

    const { data: course, error } = await supabase
      .from("academy_courses")
      .update(updateData)
      .eq("id", courseId)
      .eq("practice_id", effectivePracticeId)
      .is("deleted_at", null)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating course:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Course updated:", course.id)
    return NextResponse.json(course)
  } catch (error: any) {
    console.error("[v0] Error in PUT /academy/courses/:id:", error)
    return NextResponse.json({ error: "Failed to update course" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; courseId: string }> },
) {
  try {
    const { practiceId, courseId } = await params
    const effectivePracticeId = await getValidatedPracticeId(practiceId)

    if (!effectivePracticeId) {
      return NextResponse.json({ error: "Unauthorized or invalid practice" }, { status: 401 })
    }

    const supabase = await getApiClient()

    console.log("[v0] Soft deleting course:", courseId)

    const { error } = await supabase
      .from("academy_courses")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", courseId)
      .eq("practice_id", effectivePracticeId)
      .is("deleted_at", null)

    if (error) {
      console.error("[v0] Error deleting course:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Course deleted:", courseId)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Error in DELETE /academy/courses/:id:", error)
    return NextResponse.json({ error: "Failed to delete course" }, { status: 500 })
  }
}
