import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("[v0] Sidebar preferences GET - Auth error:", authError?.message || "No user")
      return NextResponse.json({ error: "Unauthorized", details: authError?.message }, { status: 401 })
    }

    if (user.id !== userId) {
      console.error("[v0] Sidebar preferences GET - User mismatch:", { requested: userId, actual: user.id })
      return NextResponse.json({ error: "Unauthorized - User ID mismatch" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const practiceId = searchParams.get("practice_id")

    const adminClient = createAdminClient()
    let query = adminClient.from("user_sidebar_preferences").select("*").eq("user_id", userId)

    if (practiceId) {
      query = query.eq("practice_id", practiceId)
    }

    const { data, error } = await query.maybeSingle()

    if (error) {
      console.error("[v0] Error fetching sidebar preferences:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      preferences: data || {
        expanded_groups: ["overview", "planning", "data", "strategy", "team-personal", "praxis-einstellungen"],
        expanded_items: {},
        is_collapsed: false,
        favorites: [],
        collapsed_sections: [],
      },
    })
  } catch (error) {
    console.error("[v0] Error in sidebar preferences GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("[v0] Sidebar preferences POST - Auth error:", authError?.message || "No user")
      return NextResponse.json({ error: "Unauthorized", details: authError?.message }, { status: 401 })
    }

    if (user.id !== userId) {
      console.error("[v0] Sidebar preferences POST - User mismatch:", { requested: userId, actual: user.id })
      return NextResponse.json({ error: "Unauthorized - User ID mismatch" }, { status: 403 })
    }

    const body = await request.json()
    const { practice_id, expanded_groups, expanded_items, is_collapsed, favorites, collapsed_sections } = body

    if (!practice_id) {
      return NextResponse.json({ error: "practice_id is required" }, { status: 400 })
    }

    const adminClient = createAdminClient()

    const { data: existing } = await adminClient
      .from("user_sidebar_preferences")
      .select("id")
      .eq("user_id", userId)
      .eq("practice_id", String(practice_id))
      .maybeSingle()

    let result
    if (existing) {
      const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
      if (expanded_groups !== undefined) updateData.expanded_groups = expanded_groups
      if (expanded_items !== undefined) updateData.expanded_items = expanded_items
      if (is_collapsed !== undefined) updateData.is_collapsed = is_collapsed
      if (favorites !== undefined) updateData.favorites = favorites
      if (collapsed_sections !== undefined) updateData.collapsed_sections = collapsed_sections

      result = await adminClient
        .from("user_sidebar_preferences")
        .update(updateData)
        .eq("user_id", userId)
        .eq("practice_id", String(practice_id))
        .select()
        .single()
    } else {
      result = await adminClient
        .from("user_sidebar_preferences")
        .insert({
          user_id: userId,
          practice_id: String(practice_id),
          expanded_groups: expanded_groups || [
            "overview",
            "planning",
            "data",
            "strategy",
            "team-personal",
            "praxis-einstellungen",
          ],
          expanded_items: expanded_items || {},
          is_collapsed: is_collapsed || false,
          favorites: favorites || [],
          collapsed_sections: collapsed_sections || [],
        })
        .select()
        .single()
    }

    if (result.error) {
      console.error("[v0] Error saving sidebar preferences:", result.error)
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }

    return NextResponse.json({ preferences: result.data })
  } catch (error) {
    console.error("[v0] Error in sidebar preferences POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
