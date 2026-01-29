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

    const { data: suppliers, error } = await safeSupabaseQuery(
      () =>
        supabase
          .from("suppliers")
          .select("*")
          .eq("practice_id", String(practiceId))
          .order("name", { ascending: true }),
      { data: [], error: null },
    )

    if (error) {
      console.error("[v0] Suppliers GET error:", error.message)
      return NextResponse.json({ suppliers: [] })
    }

    return NextResponse.json({ suppliers: suppliers || [] })
  } catch (error) {
    console.error("[v0] Suppliers GET exception:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ suppliers: [] })
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
          .from("suppliers")
          .insert({
            practice_id: String(practiceId),
            name: body.name,
            email: body.email || null,
            phone: body.phone || null,
            contact_person: body.contact_person || null,
            is_preferred: body.is_preferred || false,
          })
          .select()
          .single(),
      { data: null, error: null },
    )

    if (error) {
      console.error("[v0] Supplier POST error:", error.message)
      return NextResponse.json({ error: "Failed to create supplier" }, { status: 500 })
    }

    return NextResponse.json({ supplier: data }, { status: 201 })
  } catch (error) {
    console.error("[v0] Supplier POST exception:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
