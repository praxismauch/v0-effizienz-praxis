import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; widgetId: string }> },
) {
  try {
    const { practiceId, widgetId } = await params
    const body = await request.json()
    const supabase = await createClient()

    const { data: widget, error } = await supabase
      .from("practice_widgets")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", widgetId)
      .eq("practice_id", practiceId)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating widget:", error)
      return NextResponse.json({ error: "Failed to update widget" }, { status: 500 })
    }

    return NextResponse.json({ widget })
  } catch (error) {
    console.error("[v0] Error in PATCH /api/practices/[practiceId]/widgets/[widgetId]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; widgetId: string }> },
) {
  try {
    const { practiceId, widgetId } = await params
    const supabase = await createClient()

    const { error } = await supabase
      .from("practice_widgets")
      .delete()
      .eq("id", widgetId)
      .eq("practice_id", practiceId)

    if (error) {
      console.error("[v0] Error deleting widget:", error)
      return NextResponse.json({ error: "Failed to delete widget" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in DELETE /api/practices/[practiceId]/widgets/[widgetId]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
