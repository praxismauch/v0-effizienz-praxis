import { type NextRequest, NextResponse } from "next/server"
import { requirePracticeAccess, handleApiError } from "@/lib/api-helpers"

// GET - Fetch all unique suppliers from inventory items
export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const { adminClient } = await requirePracticeAccess(practiceId)

    // Get unique suppliers from inventory_items
    const { data: items, error } = await adminClient
      .from("inventory_items")
      .select("supplier")
      .eq("practice_id", Number.parseInt(practiceId))
      .eq("is_active", true)
      .not("supplier", "is", null)

    if (error) {
      console.error("[v0] Error fetching suppliers:", error)
      return NextResponse.json({ error: "Fehler beim Laden der Lieferanten" }, { status: 500 })
    }

    // Extract unique suppliers
    const uniqueSuppliers = [...new Set(items?.map((item) => item.supplier).filter(Boolean))]
    const suppliers = uniqueSuppliers.map((name, index) => ({
      id: `supplier-${index}`,
      name,
      practice_id: Number.parseInt(practiceId),
    }))

    return NextResponse.json(suppliers)
  } catch (error) {
    return handleApiError(error)
  }
}
