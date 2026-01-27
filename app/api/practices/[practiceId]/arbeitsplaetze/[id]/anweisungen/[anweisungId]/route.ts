import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// PATCH update anweisung
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ practiceId: string; id: string; anweisungId: string }> }
) {
  const { practiceId, id, anweisungId } = await params

  try {
    const supabase = await createClient()
    const body = await request.json()

    const { data: anweisung, error } = await supabase
      .from("arbeitsplatz_anweisungen")
      .update({
        title: body.title,
        content: body.content,
        sort_order: body.sort_order,
        is_active: body.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", anweisungId)
      .eq("arbeitsplatz_id", id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(anweisung)
  } catch (error: any) {
    console.error("Error updating anweisung:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE anweisung
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ practiceId: string; id: string; anweisungId: string }> }
) {
  const { practiceId, id, anweisungId } = await params

  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from("arbeitsplatz_anweisungen")
      .delete()
      .eq("id", anweisungId)
      .eq("arbeitsplatz_id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting anweisung:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
