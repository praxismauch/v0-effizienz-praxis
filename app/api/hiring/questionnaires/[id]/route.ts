import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createAdminClient()
    const body = await request.json()

    const { data, error } = await supabase.from("questionnaires").update(body).eq("id", id).select().single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error updating questionnaire:", error)
    return NextResponse.json({ error: "Failed to update questionnaire" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createAdminClient()

    const { error } = await supabase.from("questionnaires").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting questionnaire:", error)
    return NextResponse.json({ error: "Failed to delete questionnaire" }, { status: 500 })
  }
}
