import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { notifyTicketUpdate } from "@/lib/notifications"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { ticket_id, comment, is_internal } = body

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user details
    const { data: userData } = await supabase.from("users").select("name, email, role").eq("id", user.id).single()

    const isSuperAdmin = userData?.role === "super_admin"

    // Create the comment
    const { data: newComment, error: commentError } = await supabase
      .from("ticket_comments")
      .insert({
        ticket_id,
        user_id: user.id,
        user_name: userData?.name || "Unknown",
        user_email: userData?.email || user.email,
        comment,
        is_internal: is_internal || false,
      })
      .select()
      .single()

    if (commentError) {
      console.error("[v0] Error creating comment:", commentError)
      return NextResponse.json({ error: commentError.message }, { status: 500 })
    }

    if (isSuperAdmin && !is_internal) {
      const { data: ticket } = await supabase.from("tickets").select("title, user_id").eq("id", ticket_id).maybeSingle()

      if (ticket && ticket.user_id && ticket.user_id !== user.id) {
        await notifyTicketUpdate({
          ticketId: ticket_id,
          ticketTitle: ticket.title || "Ticket",
          userId: ticket.user_id,
          updateType: "comment",
          comment,
        })
      }
    }

    return NextResponse.json({ comment: newComment })
  } catch (error) {
    console.error("[v0] Error in comment POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
