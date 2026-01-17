import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function PATCH(request: Request, { params }: { params: Promise<{ practiceId: string; id: string }> }) {
  try {
    const { practiceId, id } = await params
    const supabase = await createAdminClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from("org_chart_positions")
      .update(body)
      .eq("id", id)
      .eq("practice_id", practiceId)
      .select()
      .maybeSingle()

    if (error) {
      console.error("[v0] org-chart-positions PATCH error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Position not found" }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[v0] org-chart-positions PATCH exception:", error)
    return NextResponse.json({ error: "Failed to update org chart position" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ practiceId: string; id: string }> }) {
  try {
    const { practiceId, id } = await params
    const supabase = await createAdminClient()

    const { data, error } = await supabase
      .from("org_chart_positions")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("practice_id", practiceId)
      .select()
      .maybeSingle()

    if (error) {
      console.error("[v0] org-chart-positions DELETE error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Position not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] org-chart-positions DELETE exception:", error)
    return NextResponse.json({ error: "Failed to delete org chart position" }, { status: 500 })
  }
}
