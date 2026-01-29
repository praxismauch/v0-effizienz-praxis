import { createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { safeSupabaseQuery } from "@/lib/supabase/safe-query"

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params

    if (!practiceId) {
      return NextResponse.json({ error: "Practice ID is required" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    const { data: bills, error } = await safeSupabaseQuery(
      () =>
        supabase
          .from("inventory_bills")
          .select("*")
          .eq("practice_id", String(practiceId))
          .eq("is_archived", false)
          .order("created_at", { ascending: false }),
      { data: [], error: null },
    )

    if (error) {
      console.error("[v0] Inventory bills GET error:", error.message)
      return NextResponse.json({ bills: [] })
    }

    return NextResponse.json({ bills: bills || [] })
  } catch (error) {
    console.error("[v0] Inventory bills GET exception:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ bills: [] })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const body = await request.json()

    if (!practiceId) {
      return NextResponse.json({ error: "Practice ID is required" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    const { data, error } = await safeSupabaseQuery(
      () =>
        supabase
          .from("inventory_bills")
          .insert({
            practice_id: String(practiceId),
            file_name: body.file_name,
            file_url: body.file_url,
            file_type: body.file_type || null,
            file_size: body.file_size || null,
            status: body.status || "pending",
            supplier_name: body.supplier_name || null,
            bill_date: body.bill_date || null,
            bill_number: body.bill_number || null,
            total_amount: body.total_amount || null,
            currency: body.currency || "EUR",
            is_archived: false,
          })
          .select()
          .single(),
      { data: null, error: null },
    )

    if (error) {
      console.error("[v0] Inventory bill POST error:", error.message)
      return NextResponse.json({ error: "Failed to create bill" }, { status: 500 })
    }

    return NextResponse.json({ bill: data }, { status: 201 })
  } catch (error) {
    console.error("[v0] Inventory bill POST exception:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
