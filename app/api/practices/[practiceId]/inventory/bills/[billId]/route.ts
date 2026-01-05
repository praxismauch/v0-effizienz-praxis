import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: Promise<{ practiceId: string; billId: string }> }) {
  try {
    const { practiceId, billId } = await params

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from("inventory_bills")
      .select("*")
      .eq("id", billId)
      .eq("practice_id", practiceId)
      .is("deleted_at", null)
      .single()

    if (error) {
      console.error("[v0] Error fetching inventory bill:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error in inventory bill GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ practiceId: string; billId: string }> }) {
  try {
    const { practiceId, billId } = await params
    const body = await request.json()

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from("inventory_bills")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", billId)
      .eq("practice_id", practiceId)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating inventory bill:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error in inventory bill PATCH:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ practiceId: string; billId: string }> },
) {
  try {
    const { practiceId, billId } = await params

    const supabase = createAdminClient()

    const { error } = await supabase
      .from("inventory_bills")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", billId)
      .eq("practice_id", practiceId)

    if (error) {
      console.error("[v0] Error deleting inventory bill:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in inventory bill DELETE:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
