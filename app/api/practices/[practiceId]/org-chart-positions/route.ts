import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET(request: Request, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
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
