import { createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, is_active, display_order } = body

    const supabase = await createAdminClient()

    const updateData: any = {}
    if (name !== undefined) updateData.name = name.trim()
    if (is_active !== undefined) updateData.is_active = is_active
    if (display_order !== undefined) updateData.display_order = display_order

    const { data, error } = await supabase.from("practice_types").update(updateData).eq("id", id).select().single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error updating practice type:", error)
    return NextResponse.json({ error: "Fehler beim Aktualisieren der Facharzt Gruppe" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createAdminClient()

    const { error } = await supabase.from("practice_types").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting practice type:", error)
    return NextResponse.json({ error: "Fehler beim Löschen der Facharzt Gruppe" }, { status: 500 })
  }
}
