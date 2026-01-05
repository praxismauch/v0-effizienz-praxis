import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createAdminClient()
    const body = await request.json()
    const { categories } = body

    if (!categories || !Array.isArray(categories)) {
      return NextResponse.json({ error: "Invalid categories data" }, { status: 400 })
    }

    const updatePromises = categories.map(({ id, display_order }: { id: string; display_order: number }) =>
      supabase.from("orga_categories").update({ display_order, updated_at: new Date().toISOString() }).eq("id", id),
    )

    const results = await Promise.all(updatePromises)

    const errors = results.filter((result) => result.error)
    if (errors.length > 0) {
      console.error("[v0] Error updating category order:", errors)
      return NextResponse.json({ error: "Failed to update some categories" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in reorder endpoint:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
