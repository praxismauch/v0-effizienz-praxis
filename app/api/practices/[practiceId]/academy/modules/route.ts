import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

let _supabase: ReturnType<typeof createClient> | null = null
function getSupabase() {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error("Supabase not configured")
    _supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  }
  return _supabase
}
const supabase = new Proxy({} as ReturnType<typeof createClient>, { get: (_, prop) => (getSupabase() as any)[prop] })

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    // Return empty if invalid practice ID
    if (!practiceId || practiceId === "0" || practiceId === "undefined" || practiceId === "null") {
      return NextResponse.json({ modules: [] })
    }
    const practiceIdStr = String(practiceId)

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get("course_id")

    let query = supabase
      .from("academy_modules")
      .select("*")
      .is("deleted_at", null)
      .order("display_order", { ascending: true })

    if (courseId) {
      query = query.eq("course_id", courseId)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching modules:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ modules: data || [] })
  } catch (error: any) {
    console.error("[v0] Unexpected error in GET modules:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    // Return empty if invalid practice ID
    if (!practiceId || practiceId === "0" || practiceId === "undefined" || practiceId === "null") {
      return NextResponse.json({ modules: [] })
    }
    const practiceIdStr = String(practiceId)

    const body = await request.json()

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

    return NextResponse.json({ module: data }, { status: 201 })
  } catch (error: any) {
    console.error("[v0] Unexpected error in POST modules:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
