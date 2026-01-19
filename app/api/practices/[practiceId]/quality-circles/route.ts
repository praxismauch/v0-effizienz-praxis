import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server"

// GET - Fetch quality circle data (sessions, topics, actions, benchmarks)
export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createClient()
    const adminClient = createAdminClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "all"

    if (type === "sessions") {
      const { data, error } = await adminClient
        .from("quality_circle_sessions")
        .select(`
          *,
          participants:quality_circle_participants(*),
          agenda_items:quality_circle_agenda_items(*),
          protocol:quality_circle_protocols(*)
        `)
        .eq("practice_id", practiceId)
        .order("scheduled_date", { ascending: false })

      if (error) throw error
      return NextResponse.json(data || [])
    }

    if (type === "topics") {
      const { data, error } = await adminClient
        .from("quality_circle_topics")
        .select("*")
        .eq("practice_id", practiceId)
        .order("created_at", { ascending: false })

      if (error) throw error
      return NextResponse.json(data || [])
    }

    if (type === "actions") {
      const { data, error } = await adminClient
        .from("quality_circle_actions")
        .select("*")
        .eq("practice_id", practiceId)
        .order("created_at", { ascending: false })

      if (error) throw error
      return NextResponse.json(data || [])
    }

    if (type === "benchmarks") {
      const { data, error } = await adminClient
        .from("quality_benchmarks")
        .select("*")

      if (error) throw error
      return NextResponse.json(data || [])
    }

    // Default: fetch all
    const [sessions, topics, actions, benchmarks] = await Promise.all([
      adminClient
        .from("quality_circle_sessions")
        .select(`*, participants:quality_circle_participants(*), agenda_items:quality_circle_agenda_items(*), protocol:quality_circle_protocols(*)`)
        .eq("practice_id", practiceId)
        .order("scheduled_date", { ascending: false }),
      adminClient.from("quality_circle_topics").select("*").eq("practice_id", practiceId).order("created_at", { ascending: false }),
      adminClient.from("quality_circle_actions").select("*").eq("practice_id", practiceId).order("created_at", { ascending: false }),
      adminClient.from("quality_benchmarks").select("*"),
    ])

    return NextResponse.json({
      sessions: sessions.data || [],
      topics: topics.data || [],
      actions: actions.data || [],
      benchmarks: benchmarks.data || [],
    })
  } catch (error: any) {
    console.error("[v0] Error fetching quality circle data:", error)
    if (error.message?.includes("Not authenticated") || error.message?.includes("Access denied")) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: error.message || "Failed to fetch quality circle data" }, { status: 500 })
  }
}

// POST - Create new quality circle item (session, topic, or action)
export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createClient()
    const adminClient = createAdminClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { type, ...data } = body

    if (type === "session") {
      const { data: result, error } = await adminClient
        .from("quality_circle_sessions")
        .insert({
          ...data,
          practice_id: practiceId,
          created_by: user.id,
        })
        .select()
        .single()

      if (error) throw error
      return NextResponse.json(result)
    }

    if (type === "topic") {
      const { data: result, error } = await adminClient
        .from("quality_circle_topics")
        .insert({
          ...data,
          practice_id: practiceId,
          created_by: user.id,
        })
        .select()
        .single()

      if (error) throw error
      return NextResponse.json(result)
    }

    if (type === "action") {
      const { data: result, error } = await adminClient
        .from("quality_circle_actions")
        .insert({
          ...data,
          practice_id: practiceId,
          created_by: user.id,
        })
        .select()
        .single()

      if (error) throw error
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  } catch (error: any) {
    console.error("[v0] Error creating quality circle item:", error)
    if (error.message?.includes("Not authenticated") || error.message?.includes("Access denied")) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: error.message || "Failed to create quality circle item" }, { status: 500 })
  }
}

// PATCH - Update quality circle item
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createClient()
    const adminClient = createAdminClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { type, id, ...updates } = body

    if (type === "action") {
      const { data: result, error } = await adminClient
        .from("quality_circle_actions")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("practice_id", practiceId)
        .select()
        .single()

      if (error) throw error
      return NextResponse.json(result)
    }

    if (type === "topic") {
      const { data: result, error } = await adminClient
        .from("quality_circle_topics")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("practice_id", practiceId)
        .select()
        .single()

      if (error) throw error
      return NextResponse.json(result)
    }

    if (type === "session") {
      const { data: result, error } = await adminClient
        .from("quality_circle_sessions")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("practice_id", practiceId)
        .select()
        .single()

      if (error) throw error
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  } catch (error: any) {
    console.error("[v0] Error updating quality circle item:", error)
    if (error.message?.includes("Not authenticated") || error.message?.includes("Access denied")) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: error.message || "Failed to update quality circle item" }, { status: 500 })
  }
}
