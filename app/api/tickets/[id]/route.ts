import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { sendNotification } from "@/lib/notifications"
import { sendTicketMessage } from "@/lib/messages"
import { getTicketStatusByValue } from "@/lib/tickets/config"
import { isSuperAdminRole, normalizeRole } from "@/lib/auth-utils"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const reservedPaths = ["stats", "count"]
    if (reservedPaths.includes(id)) {
      return NextResponse.json({ error: "Not found - this endpoint is reserved" }, { status: 404 })
    }

    const { data, error } = await supabase
      .from("tickets")
      .select(`
        *,
        user:users(name, email, avatar),
        comments:ticket_comments(*, user:users(name, email, avatar))
      `)
      .eq("id", id)
      .maybeSingle()

    if (error) {
      console.error("[v0] Error fetching ticket:", error)
      const errorMessage = error?.message || error?.toString() || "Failed to fetch ticket"
      return NextResponse.json({ error: errorMessage }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    return NextResponse.json({ ticket: data })
  } catch (error) {
    console.error("[v0] Error in ticket GET:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch ticket"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const body = await request.json()

    const { data: existingTicket, error: fetchError } = await supabase
      .from("tickets")
      .select("id, status, title, user_id")
      .eq("id", id)
      .maybeSingle()

    if (fetchError) {
      console.error("[v0] Error fetching ticket for update:", fetchError)
      return NextResponse.json({ error: "Failed to fetch ticket" }, { status: 500 })
    }

    if (!existingTicket) {
      console.error("[v0] Ticket not found for update:", id)
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    const updateData = {
      ...body,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("tickets").update(updateData).eq("id", id).select().maybeSingle()

    if (error) {
      console.error("[v0] Error updating ticket:", error)
      const errorMessage = error?.message || error?.toString() || "Failed to update ticket"
      return NextResponse.json({ error: errorMessage }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Ticket not found after update" }, { status: 404 })
    }

    if (body.status && existingTicket.status !== body.status && existingTicket.user_id) {
      const statusConfig = await getTicketStatusByValue(body.status)
      const statusLabel = statusConfig?.label_de || body.status
      const oldStatusConfig = await getTicketStatusByValue(existingTicket.status)
      const oldStatusLabel = oldStatusConfig?.label_de || existingTicket.status

      await sendNotification({
        ticketId: id,
        ticketTitle: existingTicket.title || "Ticket",
        userId: existingTicket.user_id,
        updateType: body.status === "resolved" ? "resolved" : "status_change",
        newStatus: statusLabel,
      })

      // Send internal message to ticket creator about status change
      await sendTicketMessage({
        ticketId: id,
        ticketTitle: existingTicket.title || "Ticket",
        recipientId: existingTicket.user_id,
        messageContent: `Der Status Ihres Tickets wurde von "${oldStatusLabel}" auf "${statusLabel}" geändert.`,
      })
    }

    return NextResponse.json({ ticket: data })
  } catch (error) {
    console.error("[v0] Error in ticket PUT:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to update ticket"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const body = await request.json()

    console.log("[v0] PATCH ticket:", id, body)

    // Fetch existing ticket to check if it exists and get current status
    const { data: existingTicket, error: fetchError } = await supabase
      .from("tickets")
      .select("id, status, title, user_id, priority")
      .eq("id", id)
      .maybeSingle()

    if (fetchError) {
      console.error("[v0] Error fetching ticket for PATCH:", fetchError)
      return NextResponse.json({ error: "Failed to fetch ticket" }, { status: 500 })
    }

    if (!existingTicket) {
      console.error("[v0] Ticket not found for PATCH:", id)
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    // Build update data - only include fields that are provided
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (body.status !== undefined) {
      updateData.status = body.status
    }
    if (body.priority !== undefined) {
      updateData.priority = body.priority
    }
    if (body.title !== undefined) {
      updateData.title = body.title
    }
    if (body.description !== undefined) {
      updateData.description = body.description
    }
    if (body.assigned_to !== undefined) {
      updateData.assigned_to = body.assigned_to
    }

    console.log("[v0] Updating ticket with data:", updateData)

    const { data, error } = await supabase.from("tickets").update(updateData).eq("id", id).select().maybeSingle()

    if (error) {
      console.error("[v0] Error updating ticket:", error)
      const errorMessage = error?.message || error?.toString() || "Failed to update ticket"
      return NextResponse.json({ error: errorMessage }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Ticket not found after update" }, { status: 404 })
    }

    console.log("[v0] Ticket updated successfully:", data)

    // Send notification and internal message if status changed
    if (body.status && existingTicket.status !== body.status && existingTicket.user_id) {
      try {
        const statusConfig = await getTicketStatusByValue(body.status)
        const statusLabel = statusConfig?.label_de || body.status
        const oldStatusConfig = await getTicketStatusByValue(existingTicket.status)
        const oldStatusLabel = oldStatusConfig?.label_de || existingTicket.status

        await sendNotification({
          ticketId: id,
          ticketTitle: existingTicket.title || "Ticket",
          userId: existingTicket.user_id,
          updateType: body.status === "resolved" ? "resolved" : "status_change",
          newStatus: statusLabel,
        })

        // Send internal message to ticket creator about status change
        await sendTicketMessage({
          ticketId: id,
          ticketTitle: existingTicket.title || "Ticket",
          recipientId: existingTicket.user_id,
          messageContent: `Der Status Ihres Tickets wurde von "${oldStatusLabel}" auf "${statusLabel}" geändert.`,
        })
      } catch (notifyError) {
        console.error("[v0] Error sending notification/message:", notifyError)
        // Don't fail the request if notification/message fails
      }
    }

    return NextResponse.json({ ticket: data, success: true })
  } catch (error) {
    console.error("[v0] Error in ticket PATCH:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to update ticket"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id } = await params

    console.log("[v0] DELETE ticket:", id)

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch the ticket first to check permissions
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .select("id, user_id, practice_id")
      .eq("id", id)
      .maybeSingle()

    if (ticketError) {
      console.error("[v0] Error fetching ticket for delete:", ticketError)
      return NextResponse.json({ error: "Failed to fetch ticket" }, { status: 500 })
    }

    if (!ticket) {
      console.error("[v0] Ticket not found for delete:", id)
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    // Fetch user data to check role
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, role, practice_id")
      .eq("id", user.id)
      .maybeSingle()

    if (userError) {
      console.error("[v0] Error fetching user data:", userError)
      return NextResponse.json({ error: "Failed to verify permissions" }, { status: 500 })
    }

    const normalizedRole = normalizeRole(userData?.role)
    const isSuperAdmin = isSuperAdminRole(normalizedRole)
    const isTicketOwner = ticket.user_id === user.id
    const samePractice = userData?.practice_id === ticket.practice_id

    console.log("[v0] DELETE ticket permission check:", {
      userId: user.id,
      userRole: userData?.role,
      normalizedRole,
      ticketUserId: ticket.user_id,
      isSuperAdmin,
      isTicketOwner,
      samePractice,
    })

    if (!isSuperAdmin && !(isTicketOwner && samePractice)) {
      console.error("[v0] Permission denied: user not authorized to delete ticket")
      return NextResponse.json({ error: "You do not have permission to delete this ticket" }, { status: 403 })
    }

    const { error } = await supabase.from("tickets").delete().eq("id", id)

    if (error) {
      console.error("[v0] Error deleting ticket:", error)
      const errorMessage = error?.message || error?.toString() || "Failed to delete ticket"
      return NextResponse.json({ error: errorMessage }, { status: 500 })
    }

    console.log("[v0] Ticket deleted successfully:", id)
    return NextResponse.json({ success: true, id })
  } catch (error) {
    console.error("[v0] DELETE ticket error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to delete ticket"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
