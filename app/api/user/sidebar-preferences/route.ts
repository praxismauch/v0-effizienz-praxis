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

    const dataToUpsert: Record<string, any> = {
      user_id: user.id,
      practice_id: practice_id || "default",
      updated_at: new Date().toISOString(),
    }

    if (sidebar_collapsed !== undefined) {
      dataToUpsert.sidebar_collapsed = sidebar_collapsed
    }
    if (expanded_groups !== undefined) {
      dataToUpsert.expanded_groups = expanded_groups
    }
    if (expanded_items !== undefined) {
      dataToUpsert.expanded_items = expanded_items
    }
    if (favorites !== undefined) {
      console.log("[v0] Saving favorites:", favorites)
      dataToUpsert.favorites = favorites
    }

    const { error } = await adminClient.from("user_sidebar_preferences").upsert(dataToUpsert, {
      onConflict: "user_id,practice_id",
    })

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
