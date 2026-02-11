export interface TicketItem {
  id: string
  title: string
  description: string
  status: "open" | "in_progress" | "to_test" | "resolved" | "closed" | "wont_fix"
  priority: "low" | "medium" | "high" | "urgent"
  type: "bug" | "feature_request" | "question" | "other"
  category?: string
  practice_id?: string
  practice_name?: string
  user_id?: string
  user_name?: string
  user_email?: string
  assigned_to?: string
  assigned_to_name?: string
  created_at: string
  updated_at: string
  resolved_at?: string
  messages_count?: number
  screenshot_urls?: string[]
  steps_to_reproduce?: string
  expected_behavior?: string
  actual_behavior?: string
}

export interface TicketStats {
  total: number
  open: number
  in_progress: number
  to_test: number
  resolved: number
  closed: number
  avgResolutionDays: number
  highPriority: number
  urgent: number
}
