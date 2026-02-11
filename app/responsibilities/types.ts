export interface Responsibility {
  id: string
  name: string
  description?: string
  category?: string
  group_name?: string
  responsible_user_id?: string
  responsible_user_name?: string
  suggested_hours_per_week?: number
  cannot_complete_during_consultation?: boolean
  optimization_suggestions?: string
  deputy_user_id?: string
  team_member_ids?: string[]
  estimated_time_amount?: number
  estimated_time_period?: string
  calculate_time_automatically?: boolean
  attachments?: File[]
  link_url?: string
  link_title?: string
  practice_id?: string
  estimated_time_minutes?: number
  is_active?: boolean
  is_practice_goal?: boolean
  created_at?: string
  updated_at?: string
  arbeitsplatz_ids?: string[]
  joint_execution?: boolean
  joint_execution_type?: "team_member" | "team_group"
  joint_execution_user_id?: string
  joint_execution_team_id?: string
}

export interface ResponsibilityFormData {
  name: string
  description: string
  optimization_suggestions: string
  responsible_user_id: string | null
  deputy_user_id: string | null
  team_member_ids: string[]
  suggested_hours_per_week: number | null
  estimated_time_amount: number | null
  estimated_time_period: string | null
  cannot_complete_during_consultation: boolean
  calculate_time_automatically: boolean
  attachments: File[]
  link_url: string
  link_title: string
  group_name: string
  estimated_time_minutes: number | null
  arbeitsplatz_ids?: string[]
  joint_execution?: boolean
  joint_execution_type?: "team_member" | "team_group"
  joint_execution_user_id?: string | null
  joint_execution_team_group?: string | null
}

export interface ResponsibilityStats {
  total: number
  assigned: number
  unassigned: number
  totalHours: number
}

export const CATEGORY_COLORS: Record<string, string> = {
  "Verwaltung": "bg-blue-500",
  "Administration": "bg-blue-500",
  "Qualitätsmanagement": "bg-purple-500",
  "QM": "bg-purple-500",
  "Labor & Diagnostik": "bg-emerald-500",
  "Labor": "bg-emerald-500",
  "Patientenversorgung": "bg-rose-500",
  "Kommunikation": "bg-amber-500",
  "Hygiene": "bg-teal-500",
  "Praxisorganisation": "bg-indigo-500",
  "IT & Technik": "bg-cyan-500",
  "Finanzen": "bg-green-500",
  "Personal": "bg-orange-500",
  "Marketing": "bg-pink-500",
  "Nicht kategorisiert": "bg-gray-400",
}

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] || "bg-primary"
}

export const INITIAL_FORM_DATA: ResponsibilityFormData = {
  name: "",
  description: "",
  optimization_suggestions: "",
  responsible_user_id: null,
  deputy_user_id: null,
  team_member_ids: [],
  suggested_hours_per_week: null,
  estimated_time_amount: null,
  estimated_time_period: null,
  cannot_complete_during_consultation: false,
  calculate_time_automatically: false,
  attachments: [],
  link_url: "",
  link_title: "",
  group_name: "",
  estimated_time_minutes: null,
  arbeitsplatz_ids: [],
}
