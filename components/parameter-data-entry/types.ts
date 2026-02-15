export interface ParameterValue {
  id: string
  parameterId: string
  parameterName: string
  value: string | number | boolean
  date: string
  userId: string
  userName: string
  notes?: string
  createdAt: string
}

export interface Parameter {
  id: string
  name: string
  description: string
  type: "number" | "text" | "boolean" | "date" | "select"
  category: string
  unit?: string
  options?: string[]
  isActive: boolean
  interval?: "weekly" | "monthly" | "quarterly" | "yearly"
  visibility?: "all" | "admin_only" | "custom"
  visible_to_roles?: string[]
}

export interface SortConfig {
  key: string
  direction: "asc" | "desc" | null
}

export const DEFAULT_INTERVAL_BADGE_COLORS = {
  weekly: "#3b82f6",
  monthly: "#f97316",
  quarterly: "#a855f7",
  yearly: "#22c55e",
}
