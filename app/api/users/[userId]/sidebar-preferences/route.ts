import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    console.log("[v0] GET sidebar-preferences - starting")
    const { userId } = await params
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    console.log("[v0] GET sidebar-preferences - auth check:", {
      userId,
      authenticatedUser: user?.id,
      authError: authError?.message,
    })

    if (!user || user.id !== userId) {
      console.log("[v0] GET sidebar-preferences - unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const practiceId = searchParams.get("practice_id")

    console.log("[v0] GET sidebar-preferences - fetching for:", { userId, practiceId })

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

    console.log("[v0] GET sidebar-preferences - success:", { hasData: !!data })
    return NextResponse.json({ preferences: data || null })
  } catch (error) {
    console.error("[v0] Error in sidebar preferences GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    console.log("[v0] POST sidebar-preferences - starting")
    const { userId } = await params
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    console.log("[v0] POST sidebar-preferences - auth check:", {
      userId,
      authenticatedUser: user?.id,
      authError: authError?.message,
    })

    if (!user || user.id !== userId) {
      console.log("[v0] POST sidebar-preferences - unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { practice_id, expanded_groups, expanded_items, is_collapsed, favorites, collapsed_sections } = body

    console.log("[v0] POST sidebar-preferences - body:", {
      practice_id,
      hasExpandedGroups: !!expanded_groups,
      hasExpandedItems: !!expanded_items,
      hasFavorites: !!favorites,
    })

    if (!practice_id) {
      return NextResponse.json({ error: "practice_id is required" }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // First check if the preference exists
    const { data: existing } = await adminClient
      .from("user_sidebar_preferences")
      .select("id")
      .eq("user_id", userId)
      .eq("practice_id", practice_id)
      .maybeSingle()

    let result
    if (existing) {
      // Update existing - only update fields that are provided
      const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
      if (expanded_groups !== undefined) updateData.expanded_groups = expanded_groups
      if (expanded_items !== undefined) updateData.expanded_items = expanded_items
      if (is_collapsed !== undefined) updateData.is_collapsed = is_collapsed
      if (favorites !== undefined) updateData.favorites = favorites
      if (collapsed_sections !== undefined) updateData.collapsed_sections = collapsed_sections

      console.log("[v0] POST sidebar-preferences - updating existing")
      result = await adminClient
        .from("user_sidebar_preferences")
        .update(updateData)
        .eq("user_id", userId)
        .eq("practice_id", practice_id)
        .select()
        .single()
    } else {
      // Insert new
      console.log("[v0] POST sidebar-preferences - inserting new")
      result = await adminClient
        .from("user_sidebar_preferences")
        .insert({
          user_id: userId,
          practice_id: practice_id,
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

    console.log("[v0] POST sidebar-preferences - success")
    return NextResponse.json({ preferences: result.data })
  } catch (error) {
    console.error("[v0] Error in sidebar preferences POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
