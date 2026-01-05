import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data, error } = await supabase
      .from("messages")
      .select(`
        *,
        sender:users!messages_sender_id_fkey(id, name, email, avatar, first_name, last_name)
      `)
      .eq("id", id)
      .or(`recipient_id.eq.${user.id},sender_id.eq.${user.id}`)
      .single()

    if (error) {
      console.error("[v0] Error fetching message:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { is_read, is_archived } = body

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }

    if (typeof is_read === "boolean") {
      updateData.is_read = is_read
      if (is_read) {
        updateData.read_at = new Date().toISOString()
      } else {
        updateData.read_at = null
      }
    }

    if (typeof is_archived === "boolean") {
      updateData.is_archived = is_archived
    }

    const { data, error } = await supabase
      .from("messages")
      .update(updateData)
      .eq("id", id)
      .eq("recipient_id", user.id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating message:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { error } = await supabase
      .from("messages")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .or(`recipient_id.eq.${user.id},sender_id.eq.${user.id}`)

    if (error) {
      console.error("[v0] Error deleting message:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
