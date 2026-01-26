export interface MoodSurvey {
  id: string
  title: string
  description: string
  survey_type: string
  is_active: boolean
  start_date: string
  end_date: string | null
  response_count?: number
}

export interface MoodResponse {
  energy_level: number
  stress_level: number
  work_satisfaction: number
  team_harmony: number
  work_life_balance: number
  leadership_support: number
  growth_opportunities: number
  workload_fairness: number
}

export interface WorkloadAnalysis {
  id: string
  analysis_period_start: string
  analysis_period_end: string
  avg_weekly_hours: number
  overtime_percentage: number
  sick_leave_rate: number
  vacation_usage_rate: number
  burnout_risk_score: number
  risk_factors: string[]
  ai_insights: string
  ai_recommendations: Array<{
    title: string
    description: string
    priority: string
  }>
}

export interface WellbeingSuggestion {
  id: string
  category: string
  title: string
  description: string
  effort_level: string
  impact_level: string
  estimated_cost: string
  implementation_tips: string[]
  is_implemented: boolean
}

export interface Kudos {
  id: string
  from_user_id: string
  from_user_name?: string
  from_user_avatar?: string
  to_user_id: string
  to_user_name?: string
  to_user_avatar?: string
  category: string
  message: string
  is_public: boolean
  is_anonymous: boolean
  reactions: Record<string, number>
  created_at: string
}

export interface TeamMember {
  id: string
  name: string
  avatar?: string
  email?: string
}

export interface KudosForm {
  to_user_id: string
  category: string
  message: string
  is_anonymous: boolean
}
