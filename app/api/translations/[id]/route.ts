import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from("translations")
      .update({
        key: body.key,
        english: body.english,
        german: body.german,
        category: body.category,
        description: body.description,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ translation: data })
  } catch (error) {
    console.error("[v0] Error updating translation:", error)
    return NextResponse.json({ error: "Failed to update translation" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from("translations").delete().eq("id", params.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting translation:", error)
    return NextResponse.json({ error: "Failed to delete translation" }, { status: 500 })
  }
}
