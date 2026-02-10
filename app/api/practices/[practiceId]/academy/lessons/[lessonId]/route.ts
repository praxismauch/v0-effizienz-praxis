import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

let _supabaseAdmin: ReturnType<typeof createClient> | null = null
function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error("Supabase not configured")
    _supabaseAdmin = createClient(url, key)
  }
  return _supabaseAdmin
}
const supabaseAdmin = new Proxy({} as ReturnType<typeof createClient>, { get: (_, prop) => (getSupabaseAdmin() as any)[prop] })

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; lessonId: string }> },
) {
  try {
    const { practiceId, lessonId } = await params

    console.log("[v0] GET /api/practices/[practiceId]/academy/lessons/[lessonId]", {
      practiceId,
      lessonId,
    })

    const { data: lesson, error } = await supabaseAdmin
      .from("academy_lessons")
      .select("*")
      .eq("id", lessonId)
      .is("deleted_at", null)
      .single()

    if (error) {
      console.error("[v0] Error fetching lesson:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }

    console.log("[v0] Lesson fetched successfully:", lesson.id)

    return NextResponse.json({ lesson })
  } catch (error) {
    console.error("[v0] Error in GET lesson:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; lessonId: string }> },
) {
  try {
    const { practiceId, lessonId } = await params
    const body = await request.json()

    console.log("[v0] PUT /api/practices/[practiceId]/academy/lessons/[lessonId]", {
      practiceId,
      lessonId,
      body,
    })

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    // Only update fields that are provided
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.content !== undefined) updateData.content = body.content
    if (body.lesson_type !== undefined) updateData.lesson_type = body.lesson_type
    if (body.content_type !== undefined) updateData.content_type = body.content_type
    if (body.video_url !== undefined) updateData.video_url = body.video_url
    if (body.video_duration_seconds !== undefined) updateData.video_duration_seconds = body.video_duration_seconds
    if (body.display_order !== undefined) {
      updateData.display_order = body.display_order
      updateData.order_index = body.display_order
    }
    if (body.order_index !== undefined) updateData.order_index = body.order_index
    if (body.is_published !== undefined) updateData.is_published = body.is_published
    if (body.is_free_preview !== undefined) updateData.is_free_preview = body.is_free_preview
    if (body.estimated_minutes !== undefined) updateData.estimated_minutes = body.estimated_minutes
    if (body.duration_minutes !== undefined) updateData.duration_minutes = body.duration_minutes
    if (body.resources !== undefined) updateData.resources = body.resources
    if (body.xp_reward !== undefined) updateData.xp_reward = body.xp_reward

    const { data: lesson, error } = await supabaseAdmin
      .from("academy_lessons")
      .update(updateData)
      .eq("id", lessonId)
      .is("deleted_at", null)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating lesson:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }

    console.log("[v0] Lesson updated successfully:", lesson.id)

    return NextResponse.json({ lesson })
  } catch (error) {
    console.error("[v0] Error in PUT lesson:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; lessonId: string }> },
) {
  try {
    const { practiceId, lessonId } = await params

    console.log("[v0] DELETE /api/practices/[practiceId]/academy/lessons/[lessonId]", {
      practiceId,
      lessonId,
    })

    // Soft delete by setting deleted_at
    const { data: lesson, error } = await supabaseAdmin
      .from("academy_lessons")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", lessonId)
      .is("deleted_at", null)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error deleting lesson:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }

    console.log("[v0] Lesson soft deleted successfully:", lesson.id)

    return NextResponse.json({ message: "Lesson deleted successfully" })
  } catch (error) {
    console.error("[v0] Error in DELETE lesson:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
