import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET(request: Request, { params }: { params: { practiceId: string } }) {
  try {
    const { practiceId } = params
    const supabase = await createAdminClient()

    const { data, error } = await supabase
      .from("org_chart_positions")
      .select("*")
      .eq("practice_id", practiceId)
      .or("is_active.eq.true,is_active.is.null")
      .is("deleted_at", null)
      .order("level", { ascending: true })
      .order("display_order", { ascending: true })

    if (error) {
      console.error("[v0] org-chart-positions API error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ positions: data || [] })
  } catch (error: any) {
    console.error("[v0] org-chart-positions API exception:", error)
    return NextResponse.json({ error: "Failed to fetch org chart positions" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: { practiceId: string } }) {
  try {
    const { practiceId } = params
    const supabase = await createAdminClient()
    const body = await request.json()

    // Ensure practice_id matches the route param
    const positionData = {
      ...body,
      practice_id: practiceId,
    }

    const { data, error } = await supabase.from("org_chart_positions").insert(positionData).select().maybeSingle()

    if (error) {
      console.error("[v0] org-chart-positions POST error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Failed to create position" }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error("[v0] org-chart-positions POST exception:", error)
    return NextResponse.json({ error: "Failed to create org chart position" }, { status: 500 })
  }
}
