import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request, { params }: { params: { practiceId: string } }) {
  try {
    const body = await request.json()
    const categories = body.categories || body.categoryOrders || []

    if (!Array.isArray(categories) || categories.length === 0) {
      return NextResponse.json({ error: "Invalid categories array" }, { status: 400 })
    }

    const supabase = await createServerClient()

    const updates = categories.map(({ id, display_order }: { id: string; display_order: number }) =>
      supabase
        .from("orga_categories")
        .update({
          display_order,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id),
    )

    await Promise.all(updates)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Reorder orga categories error:", error)
    return NextResponse.json({ error: "Failed to reorder orga categories" }, { status: 500 })
  }
}
