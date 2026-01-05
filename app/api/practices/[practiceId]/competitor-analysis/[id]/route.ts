import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string; id: string }> }) {
  try {
    const { practiceId, id } = await params
    const supabase = await createAdminClient()

    const { data, error } = await supabase
      .from("competitor_analyses")
      .select("*")
      .eq("id", id)
      .eq("practice_id", practiceId)
      .is("deleted_at", null)
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching competitor analysis:", error)
    return NextResponse.json({ error: "Failed to fetch analysis" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ practiceId: string; id: string }> }) {
  try {
    const { practiceId, id } = await params
    const body = await request.json()
    const supabase = await createAdminClient()

    const { data, error } = await supabase
      .from("competitor_analyses")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("practice_id", practiceId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error updating competitor analysis:", error)
    return NextResponse.json({ error: "Failed to update analysis" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; id: string }> },
) {
  try {
    const { practiceId, id } = await params
    const supabase = await createAdminClient()

    const { error } = await supabase
      .from("competitor_analyses")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("practice_id", practiceId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting competitor analysis:", error)
    return NextResponse.json({ error: "Failed to delete analysis" }, { status: 500 })
  }
}
