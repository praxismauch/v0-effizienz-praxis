import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function POST(request: Request, { params }: { params: Promise<{ practiceId: string; billId: string }> }) {
  try {
    const { practiceId, billId } = await params
    const body = await request.json()
    const { items_to_apply } = body // Array of item indices to apply to inventory

    const supabase = await createAdminClient()

    // Get the bill with extracted items
    const { data: bill, error: fetchError } = await supabase
      .from("inventory_bills")
      .select("*")
      .eq("id", billId)
      .eq("practice_id", practiceId)
      .single()

    if (fetchError || !bill) {
      return NextResponse.json({ error: "Rechnung nicht gefunden" }, { status: 404 })
    }

    if (!bill.extracted_items || bill.extracted_items.length === 0) {
      return NextResponse.json({ error: "Keine extrahierten Artikel vorhanden" }, { status: 400 })
    }

    const results = {
      created: [] as string[],
      updated: [] as string[],
      errors: [] as string[],
    }

    // Process each item
    for (const index of items_to_apply || Object.keys(bill.extracted_items).map(Number)) {
      const item = bill.extracted_items[index]
      if (!item || !item.name) continue

      try {
        // Check if item already exists by name
        const { data: existingItem } = await supabase
          .from("inventory_items")
          .select("id, current_stock")
          .eq("practice_id", practiceId)
          .ilike("name", item.name)
          .is("deleted_at", null)
          .maybeSingle()

        if (existingItem) {
          // Update existing item - add to stock
          const newStock = (existingItem.current_stock || 0) + (item.quantity || 0)
          await supabase
            .from("inventory_items")
            .update({
              current_stock: newStock,
              unit_cost: item.unit_price || undefined,
              last_restocked_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingItem.id)

          // Log consumption (negative = restock)
          await supabase.from("inventory_consumption").insert({
            practice_id: practiceId,
            item_id: existingItem.id,
            quantity: -(item.quantity || 0),
            consumption_type: "restock",
            notes: `Aufgefüllt aus Rechnung ${bill.bill_number || bill.file_name}`,
            consumed_at: bill.bill_date || new Date().toISOString(),
          })

          results.updated.push(item.name)
        } else {
          // Create new inventory item
          const { data: newItem, error: insertError } = await supabase
            .from("inventory_items")
            .insert({
              practice_id: practiceId,
              name: item.name,
              current_stock: item.quantity || 0,
              unit: item.unit || "Stück",
              unit_cost: item.unit_price,
              minimum_stock: Math.max(1, Math.floor((item.quantity || 0) * 0.2)),
              reorder_point: Math.max(2, Math.floor((item.quantity || 0) * 0.3)),
              optimal_stock: item.quantity || 10,
              category: "general",
              is_active: true,
              last_restocked_at: new Date().toISOString(),
            })
            .select()
            .single()

          if (insertError) {
            results.errors.push(`${item.name}: ${insertError.message}`)
          } else {
            results.created.push(item.name)
          }
        }
      } catch (itemError: any) {
        results.errors.push(`${item.name}: ${itemError.message}`)
      }
    }

    // Archive the bill after applying
    await supabase
      .from("inventory_bills")
      .update({
        is_archived: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", billId)

    return NextResponse.json({
      success: true,
      results,
      message: `${results.created.length} Artikel erstellt, ${results.updated.length} Artikel aktualisiert`,
    })
  } catch (error: any) {
    console.error("[v0] Error applying bill items:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
