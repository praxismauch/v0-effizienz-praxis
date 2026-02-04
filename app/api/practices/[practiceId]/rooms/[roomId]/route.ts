import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PATCH(request: Request, { params }: { params: Promise<{ practiceId: string; roomId: string }> }) {
  try {
    const { practiceId, roomId } = await params
    const body = await request.json()
    const { name, beschreibung, color, images } = body

    if (!practiceId || !roomId) {
      return NextResponse.json({ error: "Practice ID and Room ID are required" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    const { data, error } = await supabase
      .from("rooms")
      .update({
        name: name?.trim(),
        beschreibung: beschreibung?.trim() || null,
        color: color || null,
        images: images || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", roomId)
      .eq("practice_id", practiceId)
      .select()
      .maybeSingle()

    if (error) {
      console.error("Error updating room:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Raum nicht gefunden" }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in room PATCH:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ practiceId: string; roomId: string }> },
) {
  try {
    const { practiceId, roomId } = await params

    if (!practiceId || !roomId) {
      return NextResponse.json({ error: "Practice ID and Room ID are required" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    const { error } = await supabase.from("rooms").delete().eq("id", roomId).eq("practice_id", practiceId)

    if (error) {
      console.error("Error deleting room:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in room DELETE:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
