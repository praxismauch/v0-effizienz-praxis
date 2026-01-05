import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: NextRequest, { params }: { params: { practiceId: string } }) {
  try {
    const supabase = await createClient()
    const { practiceId } = await params

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { orders } = body as { orders: Array<{ id: string; displayOrder: number }> }

    if (!orders || !Array.isArray(orders)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    // First, delete all existing orders for this user/practice
    const { error: deleteError } = await supabase
      .from("user_goal_order")
      .delete()
      .eq("user_id", user.id)
      .eq("practice_id", practiceId)

    if (deleteError) {
      // Continue anyway, might not have existing records
    }

    // Then insert all new orders
    if (orders.length > 0) {
      const insertData = orders.map(({ id, displayOrder }) => ({
        id: uuidv4(),
        user_id: user.id,
        goal_id: id,
        practice_id: practiceId,
        display_order: displayOrder,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))

      const { error: insertError } = await supabase.from("user_goal_order").insert(insertData)

      if (insertError) {
        return NextResponse.json({ error: "Failed to save goal order", details: insertError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error reordering goals:", error)
    return NextResponse.json({ error: "Failed to reorder goals" }, { status: 500 })
  }
}
