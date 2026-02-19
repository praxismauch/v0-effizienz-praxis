import { CheckCircle, Clock, Pause } from "lucide-react"

export interface Workflow {
  id: string
  name: string
  description: string
  category: string
  status: "active" | "draft" | "archived" | "completed" | "paused"
  steps_count: number
  steps?: any[]
  created_at: string
  updated_at: string
  priority?: "low" | "medium" | "high" | "urgent"
  team_ids?: string[]
  estimated_duration?: number
  estimated_minutes?: number
}

export const categoryLabels: Record<string, string> = {
  patient: "Patientenmanagement",
  team: "Teamorganisation",
  admin: "Administration",
  quality: "Qualitätsmanagement",
  finance: "Finanzen",
  other: "Sonstiges",
}

export const statusConfig = {
  active: { label: "Aktiv", color: "bg-green-100 text-green-800", icon: CheckCircle },
  draft: { label: "Entwurf", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  archived: { label: "Archiviert", color: "bg-gray-100 text-gray-800", icon: Clock },
  completed: { label: "Abgeschlossen", color: "bg-blue-100 text-blue-800", icon: CheckCircle },
  paused: { label: "Pausiert", color: "bg-orange-100 text-orange-800", icon: Pause },
}

export const priorityConfig = {
  low: { label: "Niedrig", color: "bg-green-100 text-green-800" },
  medium: { label: "Mittel", color: "bg-yellow-100 text-yellow-800" },
  high: { label: "Hoch", color: "bg-orange-100 text-orange-800" },
  urgent: { label: "Dringend", color: "bg-red-100 text-red-800" },
}

export interface WorkflowFormData {
  name: string
  description: string
  category: string
  status: "active" | "draft" | "archived" | "completed" | "paused"
  priority: "low" | "medium" | "high" | "urgent"
}

export const defaultFormData: WorkflowFormData = {
  name: "",
  description: "",
  category: "other",
  status: "draft",
  priority: "medium",
}
