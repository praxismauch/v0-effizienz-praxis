import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("user_favorites")
      .select("favorite_path, sort_order")
      .eq("user_id", userId)
      .order("sort_order", { ascending: true })

    if (error) {
      console.error("[v0] Error loading favorites:", error)
      return NextResponse.json({ favorites: [] })
    }

    const favorites = data?.map((row) => row.favorite_path) || []
    return NextResponse.json({ favorites })
  } catch (error) {
    console.error("[v0] Error in GET favorites:", error)
    return NextResponse.json({ favorites: [] })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params
    const body = await request.json()
    const { item_path, action, favorites } = body

    const supabase = await createClient()

    // Handle reorder action - update all favorites with new sort order
    if (action === "reorder" && Array.isArray(favorites)) {
      // Update each favorite with its new sort_order
      for (let i = 0; i < favorites.length; i++) {
        const { error } = await supabase
          .from("user_favorites")
          .update({ sort_order: i })
          .eq("user_id", userId)
          .eq("favorite_path", favorites[i])

        if (error) {
          console.error("[v0] Error reordering favorite:", error)
          return NextResponse.json({ error: error.message }, { status: 500 })
        }
      }

      return NextResponse.json({ success: true, action: "reordered" })
    }

    if (!item_path) {
      return NextResponse.json({ error: "item_path is required" }, { status: 400 })
    }

    if (action === "add") {
      // Get the highest sort_order for this user
      const { data: existingFavorites } = await supabase
        .from("user_favorites")
        .select("sort_order")
        .eq("user_id", userId)
        .order("sort_order", { ascending: false })
        .limit(1)

      const nextSortOrder = (existingFavorites?.[0]?.sort_order ?? -1) + 1

      const { error } = await supabase.from("user_favorites").upsert(
        { user_id: userId, favorite_path: item_path, sort_order: nextSortOrder },
        { onConflict: "user_id,practice_id,favorite_path" }
      )

      if (error) {
        console.error("[v0] Error adding favorite:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, action: "added" })
    } else if (action === "remove") {
      const { error } = await supabase
        .from("user_favorites")
        .delete()
        .eq("user_id", userId)
        .eq("favorite_path", item_path)

      if (error) {
        console.error("[v0] Error removing favorite:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, action: "removed" })
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("[v0] Error in POST favorites:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
