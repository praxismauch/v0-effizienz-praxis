import { createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { value, label, is_active, display_order } = body

    const supabase = await createAdminClient()

    const updateData: Record<string, unknown> = {}
    if (value !== undefined) updateData.value = value.trim().toLowerCase().replace(/\s+/g, "-")
    if (label !== undefined) updateData.label = label.trim()
    if (is_active !== undefined) updateData.is_active = is_active
    if (display_order !== undefined) updateData.display_order = display_order
    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from("practice_forms")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error updating practice form:", error)
    return NextResponse.json({ error: "Fehler beim Aktualisieren der Praxisart" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createAdminClient()

    const { error } = await supabase.from("practice_forms").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting practice form:", error)
    return NextResponse.json({ error: "Fehler beim Löschen der Praxisart" }, { status: 500 })
  }
}
