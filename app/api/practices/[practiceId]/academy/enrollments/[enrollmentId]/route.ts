import { type NextRequest, NextResponse } from "next/server"
import { getApiClient } from "@/lib/supabase/admin"
import { getValidatedPracticeId } from "@/lib/auth/get-user-practice"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; enrollmentId: string }> },
) {
  try {
    const { practiceId, enrollmentId } = await params
    const supabase = await getApiClient()

    const effectivePracticeId = await getValidatedPracticeId(practiceId)

    if (!effectivePracticeId) {
      return NextResponse.json({ error: "Unauthorized or invalid practice" }, { status: 401 })
    }

    const { data: enrollment, error } = await supabase
      .from("academy_enrollments")
      .select(`
        *,
        course:academy_courses(*)
      `)
      .eq("id", enrollmentId)
      .eq("practice_id", effectivePracticeId)
      .is("deleted_at", null)
      .single()

    if (error) {
      console.error("[v0] Enrollment fetch error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json(enrollment)
  } catch (error: any) {
    console.error("[v0] Error fetching enrollment:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; enrollmentId: string }> },
) {
  try {
    const { practiceId, enrollmentId } = await params
    const supabase = await getApiClient()

    const effectivePracticeId = await getValidatedPracticeId(practiceId)

    if (!effectivePracticeId) {
      return NextResponse.json({ error: "Unauthorized or invalid practice" }, { status: 401 })
    }

    const body = await request.json()

    // Handle progress update
    const updateData: any = {
      ...body,
      updated_at: new Date().toISOString(),
      last_accessed_at: new Date().toISOString(),
    }

    // If progress is 100%, mark as completed
    if (updateData.progress_percentage === 100 && !updateData.completed_at) {
      updateData.completed_at = new Date().toISOString()
    }

    const { data: enrollment, error } = await supabase
      .from("academy_enrollments")
      .update(updateData)
      .eq("id", enrollmentId)
      .eq("practice_id", effectivePracticeId)
      .is("deleted_at", null)
      .select()
      .single()

    if (error) {
      console.error("[v0] Enrollment update error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(enrollment)
  } catch (error: any) {
    console.error("[v0] Error updating enrollment:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; enrollmentId: string }> },
) {
  try {
    const { practiceId, enrollmentId } = await params
    const supabase = await getApiClient()

    const effectivePracticeId = await getValidatedPracticeId(practiceId)

    if (!effectivePracticeId) {
      return NextResponse.json({ error: "Unauthorized or invalid practice" }, { status: 401 })
    }

    const { error } = await supabase
      .from("academy_enrollments")
      .update({
        deleted_at: new Date().toISOString(),
        is_active: false,
      })
      .eq("id", enrollmentId)
      .eq("practice_id", effectivePracticeId)

    if (error) {
      console.error("[v0] Enrollment deletion error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Error deleting enrollment:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
