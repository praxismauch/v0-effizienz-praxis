import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const unreadOnly = searchParams.get("unreadOnly") === "true"
    const threadId = searchParams.get("threadId")

    let query = supabase
      .from("messages")
      .select(`
        *,
        sender:users!messages_sender_id_fkey(id, name, email, avatar, first_name, last_name)
      `)
      .or(`recipient_id.eq.${user.id},sender_id.eq.${user.id}`)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (unreadOnly) {
      query = query.eq("is_read", false).eq("recipient_id", user.id)
    }

    if (threadId) {
      query = query.eq("thread_id", threadId).order("created_at", { ascending: true })
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching messages:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("[v0] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { recipient_id, subject, content, parent_message_id, thread_id, message_type, practice_id, metadata } = body

    if (!recipient_id || !subject || !content) {
      return NextResponse.json({ error: "Missing required fields: recipient_id, subject, content" }, { status: 400 })
    }

    // Generate thread_id for new conversations or use existing
    const finalThreadId = thread_id || parent_message_id || `thread_${Date.now()}_${user.id}`

    const { data, error } = await supabase
      .from("messages")
      .insert({
        sender_id: user.id,
        recipient_id,
        subject,
        content,
        parent_message_id,
        thread_id: finalThreadId,
        message_type: message_type || "direct",
        practice_id,
        metadata,
        is_read: false,
      })
      .select(`
        *,
        sender:users!messages_sender_id_fkey(id, name, email, avatar, first_name, last_name)
      `)
      .single()

    if (error) {
      console.error("[v0] Error creating message:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
