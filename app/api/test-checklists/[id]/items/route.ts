import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createServerClient()

    const { data: items, error } = await supabase
      .from("test_checklist_items")
      .select(`
        *,
        testing_categories (
          id,
          name,
          color
        )
      `)
      .eq("checklist_id", id)
      .order("display_order", { ascending: true })

    if (error) throw error

    return NextResponse.json(items)
  } catch (error) {
    console.error("[v0] Error fetching checklist items:", error)
    return NextResponse.json({ error: "Failed to fetch checklist items" }, { status: 500 })
  }
}
