import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

const HARDCODED_PRACTICE_ID = "1"

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const effectivePracticeId =
      practiceId === "0" || practiceId === "undefined" || !practiceId
        ? Number.parseInt(HARDCODED_PRACTICE_ID)
        : Number.parseInt(practiceId)

    const supabase = await createAdminClient()

    const { data: courses, error } = await supabase
      .from("academy_courses")
      .select("*")
      .eq("practice_id", effectivePracticeId)
      .is("deleted_at", null)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Academy courses error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Found courses:", courses?.length || 0)
    return NextResponse.json(courses || [])
  } catch (error: any) {
    console.error("[v0] Error fetching academy courses:", error)
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const effectivePracticeId =
      practiceId === "0" || practiceId === "undefined" || !practiceId
        ? Number.parseInt(HARDCODED_PRACTICE_ID)
        : Number.parseInt(practiceId)

    const body = await request.json()
    const supabase = await createAdminClient()

    const courseData = {
      ...body,
      practice_id: effectivePracticeId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data: course, error } = await supabase.from("academy_courses").insert(courseData).select().single()

    if (error) {
      console.error("[v0] Error creating course:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Course created:", course.id)
    return NextResponse.json(course)
  } catch (error: any) {
    console.error("[v0] Error in POST /academy/courses:", error)
    return NextResponse.json({ error: "Failed to create course" }, { status: 500 })
  }
}
