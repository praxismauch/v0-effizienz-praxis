export interface TicketItem {
  id: string
  title: string
  description: string
  status: "open" | "in_progress" | "to_test" | "resolved" | "closed" | "wont_fix"
  priority: "low" | "medium" | "high" | "urgent"
  type: string
  practice_id: string
  practice_name?: string
  created_by: string
  user_name?: string
  user_email?: string
  assigned_to?: string
  assigned_to_name?: string
  created_at: string
  updated_at: string
  resolved_at?: string
  messages_count?: number
  screenshot_urls?: string[]
}
