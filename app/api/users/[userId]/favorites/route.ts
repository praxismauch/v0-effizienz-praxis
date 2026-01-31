import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("user_favorites")
      .select("item_path")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error loading favorites:", error)
      return NextResponse.json({ favorites: [] })
    }

    const favorites = data?.map((row) => row.item_path) || []
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
    const { item_path, action } = body

    if (!item_path) {
      return NextResponse.json({ error: "item_path is required" }, { status: 400 })
    }

    const supabase = await createClient()

    if (action === "add") {
      const { error } = await supabase.from("user_favorites").upsert(
        { user_id: userId, item_path },
        { onConflict: "user_id,item_path" }
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
        .eq("item_path", item_path)

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
