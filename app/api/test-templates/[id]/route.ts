import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createAdminClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from("test_checklist_templates")
      .update({
        title: body.title,
        description: body.description,
        category_id: body.category_id || null,
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error updating test template:", error)
    return NextResponse.json({ error: "Failed to update test template" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createAdminClient()

    const { error } = await supabase.from("test_checklist_templates").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting test template:", error)
    return NextResponse.json({ error: "Failed to delete test template" }, { status: 500 })
  }
}
