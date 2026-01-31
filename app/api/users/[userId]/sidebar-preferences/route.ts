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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized - User ID mismatch" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const practiceId = searchParams.get("practice_id")

    const adminClient = await createAdminClient()

    const effectivePracticeId = practiceId || "1"

    // Use select * to avoid schema cache issues with specific columns
    const { data, error } = await adminClient
      .from("user_sidebar_preferences")
      .select("*")
      .eq("user_id", userId)
      .eq("practice_id", effectivePracticeId)
      .maybeSingle()

    if (error) {
      console.error("[v0] Error fetching sidebar preferences:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Deduplicate expanded_groups if corrupted
    const rawExpandedGroups = data?.expanded_groups || []
    const expandedGroups = Array.isArray(rawExpandedGroups) 
      ? [...new Set(rawExpandedGroups)] 
      : ["overview", "planning", "data", "strategy", "team-personal", "praxis-einstellungen"]

    return NextResponse.json({
      preferences: data
        ? {
            expanded_groups: expandedGroups,
            expanded_items: data.expanded_items || {},
            is_collapsed: data.is_collapsed || false,
            favorites: data.favorites || [],
            collapsed_sections: data.collapsed_sections || [],
          }
        : {
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
  console.log("[v0] POST /api/users/[userId]/sidebar-preferences - Request received")
  try {
    const { userId } = await params
    console.log("[v0] POST - userId from params:", userId)

    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    console.log("[v0] POST - Auth check:", authError ? `Error: ${authError.message}` : `User: ${user?.id}`)

    if (authError || !user) {
      console.log("[v0] POST - Unauthorized: no user")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (user.id !== userId) {
      console.log("[v0] POST - Unauthorized: user ID mismatch")
      return NextResponse.json({ error: "Unauthorized - User ID mismatch" }, { status: 403 })
    }

    const body = await request.json()
    const { practice_id, expanded_groups, expanded_items, is_collapsed, favorites } = body
    console.log("[v0] POST - Body received:", { practice_id, favorites_count: favorites?.length })

    const effectivePracticeId = String(practice_id || "1")

    const adminClient = await createAdminClient()

    const { data: existing } = await adminClient
      .from("user_sidebar_preferences")
      .select("id")
      .eq("user_id", userId)
      .eq("practice_id", effectivePracticeId)
      .maybeSingle()

    let result
    if (existing) {
      const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
      if (expanded_groups !== undefined) updateData.expanded_groups = expanded_groups
      if (expanded_items !== undefined) updateData.expanded_items = expanded_items
      if (is_collapsed !== undefined) updateData.is_collapsed = is_collapsed
      if (favorites !== undefined) {
        console.log("[v0] Updating favorites for user", userId, "practice", effectivePracticeId, ":", favorites)
        updateData.favorites = favorites
      }
      
      result = await adminClient
        .from("user_sidebar_preferences")
        .update(updateData)
        .eq("user_id", userId)
        .eq("practice_id", effectivePracticeId)
        .select()
        .single()
        
      console.log("[v0] Update result:", result.error ? `Error: ${result.error.message}` : "Success")
    } else {
      console.log("[v0] Inserting new preferences for user", userId, "practice", effectivePracticeId, "favorites:", favorites)
      
      const insertData: Record<string, unknown> = {
        user_id: userId,
        practice_id: effectivePracticeId,
        expanded_groups: expanded_groups || ["overview", "planning", "data", "strategy", "team-personal", "praxis-einstellungen"],
        expanded_items: expanded_items || {},
        is_collapsed: is_collapsed || false,
        favorites: favorites || [],
        collapsed_sections: [],
      }
      
      result = await adminClient
        .from("user_sidebar_preferences")
        .insert(insertData)
        .select()
        .single()
        
      console.log("[v0] Insert result:", result.error ? `Error: ${result.error.message}` : "Success")
    }
    
    if (result.error) {
      console.error("[v0] Error saving sidebar preferences:", result.error)
      console.error("[v0] Full error details:", JSON.stringify(result.error, null, 2))
      return NextResponse.json({ 
        error: result.error.message,
        errorCode: result.error.code,
        errorDetails: result.error
      }, { status: 500 })
    }

    const responseData = result.data
      ? {
          ...result.data,
          is_collapsed: result.data.is_collapsed || false,
          favorites: result.data.favorites || [],
          collapsed_sections: [],
        }
      : null

    return NextResponse.json({ preferences: responseData })
  } catch (error) {
    console.error("[v0] Error in sidebar preferences POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
