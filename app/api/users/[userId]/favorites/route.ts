import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params
    const { searchParams } = new URL(request.url)
    const practiceId = searchParams.get("practice_id") || "default"
    const supabase = await createClient()

    // Try to get favorites with sort_order, fall back to just favorite_path if column doesn't exist
    let data, error
    
    const result = await supabase
      .from("user_favorites")
      .select("favorite_path, sort_order")
      .eq("user_id", userId)
      .eq("practice_id", practiceId)
      .order("sort_order", { ascending: true })

    // Check for column not found errors (42703 = undefined_column, PGRST204 = schema cache miss)
    const isColumnMissing = result.error && 
      (result.error.code === '42703' || result.error.code === 'PGRST204') && 
      result.error.message.includes('sort_order')
    
    if (isColumnMissing) {
      // sort_order column doesn't exist, try without it
      const fallbackResult = await supabase
        .from("user_favorites")
        .select("favorite_path")
        .eq("user_id", userId)
        .eq("practice_id", practiceId)
      
      data = fallbackResult.data
      error = fallbackResult.error
    } else {
      data = result.data
      error = result.error
    }

    if (error) {
      console.error("[v0] Error loading favorites:", error)
      return NextResponse.json({ favorites: [], useLocalStorage: true })
    }

    const favorites = data?.map((row) => row.favorite_path) || []
    return NextResponse.json({ favorites })
  } catch (error) {
    console.error("[v0] Error in GET favorites:", error)
    return NextResponse.json({ favorites: [], useLocalStorage: true })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params
    const body = await request.json()
    const { item_path, action, favorites, practice_id } = body
    const practiceId = practice_id || "default"

    const supabase = await createClient()

    // Handle reorder action - update all favorites with new sort order
    if (action === "reorder" && Array.isArray(favorites)) {
      // Try to update each favorite with its new sort_order
      let hasError = false
      for (let i = 0; i < favorites.length; i++) {
        const { error } = await supabase
          .from("user_favorites")
          .update({ sort_order: i })
          .eq("user_id", userId)
          .eq("practice_id", practiceId)
          .eq("favorite_path", favorites[i])

        // If sort_order column doesn't exist, just skip reordering
        if (error && (error.code === 'PGRST204' || error.code === '42703')) {
          console.log("[v0] sort_order column not found, skipping reorder")
          return NextResponse.json({ success: true, action: "reordered", useLocalStorage: true })
        }
        
        if (error) {
          console.error("[v0] Error reordering favorite:", error)
          hasError = true
        }
      }

      return NextResponse.json({ success: !hasError, action: "reordered" })
    }

    if (!item_path) {
      return NextResponse.json({ error: "item_path is required" }, { status: 400 })
    }

    if (action === "add") {
      // Try to add favorite, handling missing sort_order column
      let upsertData: any = { user_id: userId, practice_id: practiceId, favorite_path: item_path }
      
      // Try to get the highest sort_order for this user
      const { data: existingFavorites, error: selectError } = await supabase
        .from("user_favorites")
        .select("sort_order")
        .eq("user_id", userId)
        .eq("practice_id", practiceId)
        .order("sort_order", { ascending: false })
        .limit(1)

      // If sort_order column exists, include it in the upsert
      if (!selectError || (selectError.code !== 'PGRST204' && selectError.code !== '42703')) {
        const nextSortOrder = (existingFavorites?.[0]?.sort_order ?? -1) + 1
        upsertData.sort_order = nextSortOrder
      }

      const { error } = await supabase.from("user_favorites").upsert(
        upsertData,
        { onConflict: "user_id,practice_id,favorite_path" }
      )

      if (error) {
        // If upsert fails due to missing sort_order, try without it
        if ((error.code === 'PGRST204' || error.code === '42703') && error.message.includes('sort_order')) {
          const { error: fallbackError } = await supabase.from("user_favorites").upsert(
            { user_id: userId, practice_id: practiceId, favorite_path: item_path },
            { onConflict: "user_id,practice_id,favorite_path" }
          )
          
          if (fallbackError) {
            console.error("[v0] Error adding favorite (fallback):", fallbackError)
            return NextResponse.json({ success: false, error: fallbackError.message, useLocalStorage: true })
          }
        } else {
          console.error("[v0] Error adding favorite:", error)
          return NextResponse.json({ success: false, error: error.message, useLocalStorage: true })
        }
      }

      return NextResponse.json({ success: true, action: "added" })
    } else if (action === "remove") {
      const { error } = await supabase
        .from("user_favorites")
        .delete()
        .eq("user_id", userId)
        .eq("practice_id", practiceId)
        .eq("favorite_path", item_path)

      if (error) {
        console.error("[v0] Error removing favorite:", error)
        return NextResponse.json({ success: false, error: error.message, useLocalStorage: true })
      }

      return NextResponse.json({ success: true, action: "removed" })
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("[v0] Error in POST favorites:", error)
    return NextResponse.json({ success: false, error: "Internal server error", useLocalStorage: true })
  }
}
