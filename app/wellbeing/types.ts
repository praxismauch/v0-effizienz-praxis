import {
  Users, Lightbulb, Heart, Shield, Sparkles, Target, TrendingUp,
  Coffee, Brain, MessageSquare, Award, Clock, Activity,
  type LucideIcon,
} from "lucide-react"

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
  ai_recommendations: Array<{ title: string; description: string; priority: string }>
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

interface CategoryItem { value: string; label: string; icon: LucideIcon; color?: string }

export const KUDOS_CATEGORIES: CategoryItem[] = [
  { value: "teamwork", label: "Teamarbeit", icon: Users, color: "bg-blue-500" },
  { value: "innovation", label: "Innovation", icon: Lightbulb, color: "bg-purple-500" },
  { value: "helpfulness", label: "Hilfsbereitschaft", icon: Heart, color: "bg-pink-500" },
  { value: "customer_service", label: "Patientenservice", icon: Heart, color: "bg-red-500" },
  { value: "reliability", label: "Zuverlässigkeit", icon: Shield, color: "bg-green-500" },
  { value: "positivity", label: "Positive Energie", icon: Sparkles, color: "bg-yellow-500" },
  { value: "leadership", label: "Führung", icon: Target, color: "bg-indigo-500" },
  { value: "growth", label: "Weiterentwicklung", icon: TrendingUp, color: "bg-teal-500" },
]

export const SUGGESTION_CATEGORIES: Omit<CategoryItem, "color">[] = [
  { value: "work_life_balance", label: "Work-Life-Balance", icon: Coffee },
  { value: "stress_reduction", label: "Stressreduktion", icon: Brain },
  { value: "team_building", label: "Teambuilding", icon: Users },
  { value: "communication", label: "Kommunikation", icon: MessageSquare },
  { value: "recognition", label: "Anerkennung", icon: Award },
  { value: "flexibility", label: "Flexibilität", icon: Clock },
  { value: "health", label: "Gesundheit", icon: Activity },
  { value: "growth", label: "Entwicklung", icon: TrendingUp },
]

export function getMoodColor(value: number) {
  if (value >= 4) return "text-green-500"
  if (value >= 3) return "text-yellow-500"
  return "text-red-500"
}

export function getBurnoutRiskColor(score: number) {
  if (score >= 70) return "bg-red-500"
  if (score >= 40) return "bg-yellow-500"
  return "bg-green-500"
}

export function getBurnoutRiskLabel(score: number) {
  if (score >= 70) return "Hohes Risiko"
  if (score >= 40) return "Mittleres Risiko"
  return "Geringes Risiko"
}

export const MOOD_DIMENSIONS = [
  { key: "work_satisfaction" as const, label: "Arbeitszufriedenheit" },
  { key: "stress_level" as const, label: "Stress-Level" },
  { key: "team_harmony" as const, label: "Team-Harmonie" },
  { key: "work_life_balance" as const, label: "Work-Life-Balance" },
]
