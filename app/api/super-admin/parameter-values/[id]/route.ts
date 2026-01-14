import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { id } = await params

    const { data, error } = await supabase
      .from("super_admin_parameter_values")
      .update({
        value: body.value,
        recorded_date: body.recordedDate,
        notes: body.notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating super admin parameter value:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ value: data })
  } catch (error) {
    console.error("[v0] Error in PUT /api/super-admin/parameter-values:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const { error } = await supabase.from("super_admin_parameter_values").delete().eq("id", id)

    if (error) {
      console.error("[v0] Error deleting super admin parameter value:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in DELETE /api/super-admin/parameter-values:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
