import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const { searchParams } = new URL(request.url)
    const archived = searchParams.get("archived") === "true"

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from("inventory_bills")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("is_archived", archived)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching inventory bills:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("[v0] Error in inventory bills GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const body = await request.json()

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from("inventory_bills")
      .insert({
        practice_id: practiceId,
        file_name: body.file_name,
        file_url: body.file_url,
        file_type: body.file_type,
        file_size: body.file_size,
        uploaded_by: body.uploaded_by,
        notes: body.notes,
        status: "pending",
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating inventory bill:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error in inventory bills POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
