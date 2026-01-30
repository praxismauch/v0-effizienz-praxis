import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createClient()

    const { data: widgets, error } = await supabase
      .from("practice_widgets")
      .select("*")
      .eq("practice_id", practiceId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching widgets:", error)
      return NextResponse.json({ widgets: [] })
    }

    return NextResponse.json({ widgets })
  } catch (error) {
    console.error("[v0] Error in GET /api/practices/[practiceId]/widgets:", error)
    return NextResponse.json({ widgets: [] })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const body = await request.json()
    const supabase = await createClient()

    const widgetData = {
      id: body.id || `widget-${Date.now()}`,
      practice_id: practiceId,
      title: body.title,
      description: body.description,
      type: body.type,
      chart_type: body.chartType,
      category: body.category,
      data_source: body.dataSource,
      enabled: body.enabled ?? true,
      config: body.config || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data: widget, error } = await supabase
      .from("practice_widgets")
      .upsert(widgetData, { onConflict: "id" })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error saving widget:", error)
      return NextResponse.json({ error: "Failed to save widget" }, { status: 500 })
    }

    return NextResponse.json({ widget })
  } catch (error) {
    console.error("[v0] Error in POST /api/practices/[practiceId]/widgets:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
