import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { name, color, description, stage_order, is_active, job_posting_id } = body

    const supabase = await createAdminClient()

    const { data, error } = await supabase
      .from("hiring_pipeline_stages")
      .update({
        name,
        color,
        description,
        stage_order,
        is_active,
        job_posting_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating pipeline stage:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error in pipeline stage PUT API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createAdminClient()

    const { error } = await supabase.from("hiring_pipeline_stages").delete().eq("id", params.id)

    if (error) {
      console.error("[v0] Error deleting pipeline stage:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in pipeline stage DELETE API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
