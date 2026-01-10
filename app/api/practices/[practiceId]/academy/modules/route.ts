import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
})

export async function GET(request: NextRequest, { params }: { params: { practiceId: string } }) {
  try {
    const { practiceId } = params
    const practiceIdInt = practiceId === "0" || !practiceId ? 1 : Number.parseInt(practiceId) || 1

    console.log("[v0] GET /api/practices/[practiceId]/academy/modules - practiceId:", practiceIdInt)

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get("course_id")

    let query = supabase
      .from("academy_modules")
      .select("*")
      .is("deleted_at", null)
      .order("display_order", { ascending: true })

    if (courseId) {
      query = query.eq("course_id", courseId)
      console.log("[v0] Filtering by course_id:", courseId)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching modules:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Fetched modules:", data?.length || 0)

    return NextResponse.json({ modules: data || [] })
  } catch (error: any) {
    console.error("[v0] Unexpected error in GET modules:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { practiceId: string } }) {
  try {
    const { practiceId } = params
    const practiceIdInt = practiceId === "0" || !practiceId ? 1 : Number.parseInt(practiceId) || 1

    console.log("[v0] POST /api/practices/[practiceId]/academy/modules - practiceId:", practiceIdInt)

    const body = await request.json()
    console.log("[v0] Module data:", body)

    const moduleData = {
      course_id: body.course_id,
      title: body.title,
      description: body.description || null,
      display_order: body.display_order || 0,
      order_index: body.order_index || body.display_order || 0,
      is_published: body.is_published ?? false,
      estimated_minutes: body.estimated_minutes || 30,
      duration_minutes: body.duration_minutes || body.estimated_minutes || 30,
      xp_reward: body.xp_reward || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("academy_modules").insert([moduleData]).select().single()

    if (error) {
      console.error("[v0] Error creating module:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Module created successfully:", data.id)

    return NextResponse.json({ module: data }, { status: 201 })
  } catch (error: any) {
    console.error("[v0] Unexpected error in POST modules:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
