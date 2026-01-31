import { NextRequest, NextResponse } from "next/server"
import { createAdminClient, createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  console.log("[v0] POST /api/user/sidebar-preferences - Request received")
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.log("[v0] Auth result:", user ? `User ${user.id}` : "No user")

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { practice_id, sidebar_collapsed, expanded_groups, expanded_items, favorites } = body
    console.log("[v0] Body:", { practice_id, favorites_length: favorites?.length })

    const adminClient = await createAdminClient()

    // Use the stored procedure to bypass PostgREST schema cache issues
    const { data, error } = await adminClient.rpc("upsert_sidebar_preferences", {
      p_user_id: user.id,
      p_practice_id: practice_id || "default",
      p_expanded_groups: expanded_groups !== undefined ? expanded_groups : null,
      p_expanded_items: expanded_items !== undefined ? expanded_items : null,
      p_is_collapsed: sidebar_collapsed !== undefined ? sidebar_collapsed : null,
      p_favorites: favorites !== undefined ? favorites : null,
      p_collapsed_sections: null,
    })

    console.log("[v0] RPC result:", { data, error })

    if (error) {
      console.error("[v0] Error saving sidebar preferences:", error)
      throw error
    }

    console.log("[v0] Successfully saved preferences")
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Error in sidebar preferences API:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save preferences" },
      { status: 500 }
    )
  }
}
