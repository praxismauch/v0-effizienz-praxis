import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string }> },
) {
  try {
    const { practiceId } = await params
    const supabase = await createAdminClient()

    const searchParams = request.nextUrl.searchParams
    const itemId = searchParams.get("itemId")
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    let query = supabase
      .from("inventory_consumption_history")
      .select("*")
      .eq("practice_id", practiceId)
      .order("consumed_at", { ascending: false })
      .limit(limit)

    if (itemId) {
      query = query.eq("item_id", itemId)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching consumption history:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("[v0] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string }> },
) {
  try {
    const { practiceId } = await params
    const supabase = await createAdminClient()

    const body = await request.json()
    const { item_id, quantity, consumed_by, notes } = body

    if (!item_id || !quantity) {
      return NextResponse.json({ error: "Missing required fields: item_id, quantity" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("inventory_consumption_history")
      .insert({
        practice_id: practiceId,
        item_id,
        quantity,
        consumed_by,
        notes,
        consumed_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating consumption record:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update item stock
    const { error: updateError } = await supabase.rpc("update_inventory_stock", {
      p_item_id: item_id,
      p_quantity_change: -Math.abs(quantity),
    })

    if (updateError) {
      console.error("[v0] Warning: Could not update inventory stock:", updateError)
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
