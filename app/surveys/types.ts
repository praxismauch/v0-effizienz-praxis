import type React from "react"

export interface Survey {
  id: string
  title: string
  description: string | null
  status: "draft" | "active" | "closed" | "archived"
  target_audience: "all" | "team" | "patients" | "anonymous" | "specific"
  survey_type?: string
  start_date: string | null
  end_date: string | null
  public_token: string
  created_at: string
  response_count?: number
  notify_admin_on_response?: boolean
  is_anonymous?: boolean
}

export interface SurveyQuestion {
  id?: string
  question_text: string
  question_type: "scale" | "single_choice" | "multiple_choice" | "text" | "yes_no" | "rating"
  options?: string[]
  is_required: boolean
  order_index: number
}

export interface SurveyTemplate {
  id: string
  name: string
  description: string
  category: string
  questions: SurveyQuestion[]
  is_system_template?: boolean
}

export interface MoodTrendData {
  week: string
  weekLabel: string
  morale: number
  stress: number
  satisfaction: number
  responseCount: number
}

export interface MoodAlert {
  id: string
  type: "warning" | "critical"
  dimension: string
  message: string
  value: number
  trend: "down" | "stable"
  date: string
}

export interface EditSurveyData {
  title: string
  description: string
  target_audience: string
  is_anonymous: boolean
  start_date: string
  end_date: string
  questions?: SurveyQuestion[]
}

export interface NewSurveyData {
  title: string
  description: string
  survey_type: "internal"
  target_audience: "all"
  is_anonymous: boolean
  start_date: string
  end_date: string
  notify_admin_on_response: boolean
  questions?: SurveyQuestion[]
}
