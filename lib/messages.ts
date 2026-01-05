import { createClient } from "@/lib/supabase/server"

export type MessageType = "direct" | "system" | "ticket" | "notification"

interface SendMessageParams {
  recipientId: string
  subject: string
  content: string
  messageType?: MessageType
  practiceId?: string
  metadata?: Record<string, unknown>
  parentMessageId?: string
  threadId?: string
}

/**
 * Send a message to a specific user
 */
export async function sendMessage(
  params: SendMessageParams,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const supabase = await createClient()

    const finalThreadId = params.threadId || params.parentMessageId || `thread_${Date.now()}`

    const { data, error } = await supabase
      .from("messages")
      .insert({
        sender_id: null, // System message
        recipient_id: params.recipientId,
        subject: params.subject,
        content: params.content,
        message_type: params.messageType || "system",
        practice_id: params.practiceId,
        parent_message_id: params.parentMessageId,
        thread_id: finalThreadId,
        metadata: params.metadata,
        is_read: false,
      })
      .select("id")
      .single()

    if (error) {
      console.error("[v0] Failed to send message:", error)
      return { success: false, error: error.message }
    }

    return { success: true, messageId: data.id }
  } catch (error) {
    console.error("[v0] Error in sendMessage:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Send a system message related to a ticket
 */
export async function sendTicketMessage(params: {
  ticketId: string
  ticketTitle: string
  recipientId: string
  messageContent: string
  practiceId?: string
}): Promise<{ success: boolean }> {
  const { ticketId, ticketTitle, recipientId, messageContent, practiceId } = params

  return sendMessage({
    recipientId,
    subject: `Ticket: ${ticketTitle}`,
    content: messageContent,
    messageType: "ticket",
    practiceId,
    metadata: { ticketId },
    threadId: `ticket_${ticketId}`,
  })
}
