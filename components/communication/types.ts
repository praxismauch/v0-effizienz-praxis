export interface Notification {
  id: string
  title: string
  message: string
  type: string
  link?: string
  is_read: boolean
  created_at: string
}

export interface Message {
  id: string
  sender_id: string
  recipient_id: string
  subject: string
  content: string
  is_read: boolean
  read_at: string | null
  thread_id: string
  parent_message_id: string | null
  message_type: string
  created_at: string
  sender?: { first_name: string; last_name: string }
  recipient?: { first_name: string; last_name: string }
}

export interface TeamMember {
  user_id: string
  first_name: string
  last_name: string
  role: string
}

export interface NewMessageData {
  recipient_id: string
  subject: string
  content: string
}

export type MessageTab = "inbox" | "sent"
