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

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const { searchParams } = new URL(request.url)
    const moduleId = searchParams.get("module_id")
    const courseId = searchParams.get("course_id")

    // Build query
    let query = supabaseAdmin
      .from("academy_lessons")
      .select("*")
      .is("deleted_at", null)
      .order("display_order", { ascending: true })

    // Filter by module_id if provided
    if (moduleId) {
      query = query.eq("module_id", moduleId)
    }

    // Filter by course_id if provided
    if (courseId) {
      query = query.eq("course_id", courseId)
    }

    const { data: lessons, error } = await query

    if (error) {
      console.error("[v0] Error fetching lessons:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      lessons: lessons || [],
      total: lessons?.length || 0,
    })
  } catch (error) {
    console.error("[v0] Error in GET lessons:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const body = await request.json()

    // Prepare lesson data
    const lessonData = {
      module_id: body.module_id,
      course_id: body.course_id,
      title: body.title,
      description: body.description || null,
      content: body.content || null,
      lesson_type: body.lesson_type || "text",
      content_type: body.content_type || body.lesson_type || "text",
      video_url: body.video_url || null,
      video_duration_seconds: body.video_duration_seconds || null,
      display_order: body.display_order ?? 0,
      order_index: body.order_index ?? body.display_order ?? 0,
      is_published: body.is_published ?? false,
      is_free_preview: body.is_free_preview ?? false,
      estimated_minutes: body.estimated_minutes ?? 15,
      duration_minutes: body.duration_minutes ?? body.estimated_minutes ?? 0,
      resources: body.resources || [],
      xp_reward: body.xp_reward ?? 10,
    }

    const { data: lesson, error } = await supabaseAdmin.from("academy_lessons").insert(lessonData).select().single()

    if (error) {
      console.error("[v0] Error creating lesson:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ lesson }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error in POST lesson:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
