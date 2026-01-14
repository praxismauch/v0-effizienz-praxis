import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createAdminClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from("testing_categories")
      .update({
        name: body.name,
        description: body.description,
        color: body.color,
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error updating testing category:", error)
    return NextResponse.json({ error: "Failed to update testing category" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createAdminClient()

    const { error } = await supabase.from("testing_categories").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting testing category:", error)
    return NextResponse.json({ error: "Failed to delete testing category" }, { status: 500 })
  }
}
