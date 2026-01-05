import { createClient } from "@/lib/supabase/server"
import { getTicketStatusByValue } from "@/lib/tickets/config"

export type NotificationType =
  | "ticket_update"
  | "ticket_resolved"
  | "ticket_comment"
  | "system_announcement"
  | "practice_update"
  | "goal_update"
  | "todo_assigned"
  | "sick_leave_status"
  | "general"

interface SendNotificationParams {
  userId: string
  title: string
  message: string
  type: NotificationType
  link?: string
  practiceId?: string
  metadata?: Record<string, unknown>
}

interface BroadcastNotificationParams {
  title: string
  message: string
  type: NotificationType
  link?: string
  practiceId?: string // If set, only notify users in this practice
  metadata?: Record<string, unknown>
}

/**
 * Send a notification to a specific user
 */
export async function sendNotification(params: SendNotificationParams): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from("notifications").insert({
      user_id: params.userId,
      practice_id: params.practiceId,
      title: params.title,
      message: params.message,
      type: params.type,
      link: params.link,
      metadata: params.metadata,
      is_read: false,
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error("[v0] Failed to send notification:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("[v0] Error in sendNotification:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Send a notification to multiple users
 */
export async function sendNotificationToMany(
  userIds: string[],
  params: Omit<SendNotificationParams, "userId">,
): Promise<{ success: boolean; sentCount: number; failedCount: number }> {
  let sentCount = 0
  let failedCount = 0

  for (const userId of userIds) {
    const result = await sendNotification({ ...params, userId })
    if (result.success) {
      sentCount++
    } else {
      failedCount++
    }
  }

  return { success: failedCount === 0, sentCount, failedCount }
}

/**
 * Broadcast a notification to all users (or all users in a practice)
 */
export async function broadcastNotification(
  params: BroadcastNotificationParams,
): Promise<{ success: boolean; sentCount: number; error?: string }> {
  try {
    const supabase = await createClient()

    // Get all users (optionally filtered by practice)
    let query = supabase.from("users").select("id").eq("is_active", true).is("deleted_at", null)

    if (params.practiceId) {
      query = query.eq("practice_id", params.practiceId)
    }

    const { data: users, error: usersError } = await query

    if (usersError) {
      console.error("[v0] Failed to fetch users for broadcast:", usersError)
      return { success: false, sentCount: 0, error: usersError.message }
    }

    if (!users || users.length === 0) {
      return { success: true, sentCount: 0 }
    }

    // Create notifications for all users
    const notifications = users.map((user) => ({
      user_id: user.id,
      practice_id: params.practiceId,
      title: params.title,
      message: params.message,
      type: params.type,
      link: params.link,
      metadata: params.metadata,
      is_read: false,
      created_at: new Date().toISOString(),
    }))

    const { error: insertError } = await supabase.from("notifications").insert(notifications)

    if (insertError) {
      console.error("[v0] Failed to broadcast notifications:", insertError)
      return { success: false, sentCount: 0, error: insertError.message }
    }

    return { success: true, sentCount: users.length }
  } catch (error) {
    console.error("[v0] Error in broadcastNotification:", error)
    return { success: false, sentCount: 0, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Helper to create ticket-related notifications
 */
export async function notifyTicketUpdate(params: {
  ticketId: string
  ticketTitle: string
  userId: string
  updateType: "status_change" | "comment" | "resolved" | "assigned"
  newStatus?: string
  comment?: string
}): Promise<{ success: boolean }> {
  const { ticketId, ticketTitle, userId, updateType, newStatus, comment } = params

  const typeMap = {
    status_change: "ticket_update" as NotificationType,
    comment: "ticket_comment" as NotificationType,
    resolved: "ticket_resolved" as NotificationType,
    assigned: "ticket_update" as NotificationType,
  }

  const titleMap = {
    status_change: `Ticket aktualisiert: ${ticketTitle}`,
    comment: `Neuer Kommentar: ${ticketTitle}`,
    resolved: `Ticket gelöst: ${ticketTitle}`,
    assigned: `Ticket zugewiesen: ${ticketTitle}`,
  }

  let statusLabel = newStatus
  if (updateType === "status_change" && newStatus) {
    try {
      const statusConfig = await getTicketStatusByValue(newStatus)
      statusLabel = statusConfig?.label_de || newStatus
    } catch (error) {
      console.error("[v0] Failed to get status label:", error)
      // Fallback to raw value if lookup fails
    }
  }

  const messageMap = {
    status_change: `Der Status Ihres Tickets wurde auf "${statusLabel}" geändert.`,
    comment: comment
      ? `Neuer Kommentar: "${comment.substring(0, 100)}${comment.length > 100 ? "..." : ""}"`
      : "Ein neuer Kommentar wurde hinzugefügt.",
    resolved: "Ihr Ticket wurde erfolgreich bearbeitet und gelöst.",
    assigned: "Ein Ticket wurde Ihnen zugewiesen.",
  }

  return sendNotification({
    userId,
    title: titleMap[updateType],
    message: messageMap[updateType],
    type: typeMap[updateType],
    link: `/tickets?id=${ticketId}`,
    metadata: { ticketId, updateType, newStatus },
  })
}
