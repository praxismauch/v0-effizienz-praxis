import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ practiceId: string; id: string }> }) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const body = await request.json()

    const { data, error } = await supabase
      .from("parameter_values")
      .update({
        value: body.value,
        notes: body.notes,
        recorded_date: body.date, // Map date from request to recorded_date column
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(
        `
        *,
        parameter:analytics_parameters(id, name, category, unit, data_type)
      `,
      )
      .single()

    if (error) throw error

    return NextResponse.json({ value: data })
  } catch (error) {
    console.error("[v0] Error updating parameter value:", error)
    return NextResponse.json({ error: "Failed to update parameter value" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; id: string }> },
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const { error } = await supabase.from("parameter_values").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting parameter value:", error)
    return NextResponse.json({ error: "Failed to delete parameter value" }, { status: 500 })
  }
}
