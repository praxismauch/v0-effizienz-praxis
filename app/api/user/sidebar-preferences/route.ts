import { NextRequest, NextResponse } from "next/server"
import { createAdminClient, createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { practice_id, sidebar_collapsed, expanded_groups, expanded_items, favorites } = body

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

    if (error) {
      console.error("Error saving sidebar preferences:", error)
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error in sidebar preferences API:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save preferences" },
      { status: 500 }
    )
  }
}
