import { createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function PATCH(request: NextRequest, { params }: { params: { practiceId: string; id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    const supabase = await createAdminClient()

    const { data: category, error } = await supabase
      .from("orga_categories")
      .update({
        name: body.name,
        color: body.color,
        description: body.description,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(category, {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("[v0] Error updating workflow category:", error)
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { practiceId: string; id: string } }) {
  try {
    const { id } = params
    const supabase = await createAdminClient()

    const { error } = await supabase.from("orga_categories").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json(
      { success: true },
      {
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    console.error("[v0] Error deleting workflow category:", error)
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 })
  }
}
