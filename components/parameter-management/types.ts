export interface Parameter {
  id: string
  name: string
  description: string
  type: "number" | "text" | "boolean" | "date" | "select" | "calculated" | "numeric" | "rating"
  category: string
  unit?: string
  interval?: "weekly" | "monthly" | "quarterly" | "yearly"
  defaultValue?: string
  options?: string[]
  formula?: string
  dependencies?: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
  isGlobal?: boolean
  templateId?: string
  dataCollectionStart?: string
  min?: number
  max?: number
  target?: number
}

export interface ParameterGroup {
  id: string
  name: string
  description: string
  parameters: string[]
  color: string
  isActive: boolean
  createdAt: string
  practiceId?: string | null
  templateId?: string | null
}

export interface GlobalParameter {
  id: string
  name: string
  description: string
  type: "number" | "text" | "boolean" | "date" | "select" | "calculated" | "numeric" | "rating"
  category: string
  unit?: string
  defaultValue?: string
  options?: string[]
  formula?: string
  dependencies?: string[]
  isActive: boolean
  isTemplate: boolean
  isGlobal: boolean
  createdAt: string
  updatedAt: string
  min?: number
  max?: number
  target?: number
  dataCollectionStart?: string
  interval?: "weekly" | "monthly" | "quarterly" | "yearly"
}

export const DEFAULT_PARAMETER: Partial<Parameter> = {
  name: "",
  description: "",
  type: "number",
  category: "",
  unit: "",
  interval: "monthly",
  isActive: true,
  dataCollectionStart: new Date().toISOString().split("T")[0],
}

export const DEFAULT_GROUP: Partial<ParameterGroup> = {
  name: "",
  description: "",
  parameters: [],
  color: "bg-blue-500",
  isActive: true,
}

export const DEFAULT_INTERVAL_COLORS = {
  weekly: "#3b82f6",
  monthly: "#f97316",
  quarterly: "#a855f7",
  yearly: "#22c55e",
}
