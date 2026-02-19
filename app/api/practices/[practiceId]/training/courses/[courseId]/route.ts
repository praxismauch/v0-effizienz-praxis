import { getApiClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ practiceId: string; courseId: string }> }
) {
  try {
    const { practiceId, courseId } = await params
    const body = await request.json()

    const supabase = await getApiClient()

    const allowedFields = [
      "name", "title", "description", "provider", "category",
      "format", "duration_hours", "cost", "url", "is_online",
      "registration_url", "is_mandatory", "is_active"
    ]

    const updateData: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }
    // Also set title from name if name changed
    if (updateData.name && !updateData.title) {
      updateData.title = updateData.name
    }

    const { data, error } = await supabase
      .from("training_courses")
      .update(updateData)
      .eq("id", courseId)
      .eq("practice_id", practiceId)
      .select()
      .single()

    if (error) {
      console.error("Error updating course:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ course: data })
  } catch (error) {
    console.error("Error in course PATCH:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Also support PUT for backwards compatibility
export async function PUT(
  request: Request,
  context: { params: Promise<{ practiceId: string; courseId: string }> }
) {
  return PATCH(request, context)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ practiceId: string; courseId: string }> }
) {
  try {
    const { practiceId, courseId } = await params

    const supabase = await getApiClient()

    const { error } = await supabase
      .from("training_courses")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", courseId)
      .eq("practice_id", practiceId)

    if (error) {
      console.error("Error deleting course:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in course DELETE:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
