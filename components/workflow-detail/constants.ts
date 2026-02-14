import type { WorkflowStep } from "@/contexts/workflow-context"

export const categoryLabels: Record<string, string> = {
  administrative: "Administrativ",
  clinical: "Klinisch",
  patient_care: "Patientenversorgung",
  communication: "Kommunikation",
  financial: "Finanzen",
  hr: "Personal",
  compliance: "Compliance",
  marketing: "Marketing",
  other: "Sonstiges",
}

export const priorityLabels: Record<string, string> = {
  urgent: "Dringend",
  high: "Hoch",
  medium: "Mittel",
  low: "Niedrig",
}

export function getStepStatusColor(status: WorkflowStep["status"]) {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800"
    case "in-progress":
      return "bg-blue-100 text-blue-800"
    case "blocked":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export function getStepStatusLabel(status: WorkflowStep["status"]) {
  switch (status) {
    case "completed":
      return "Abgeschlossen"
    case "in-progress":
      return "In Bearbeitung"
    case "blocked":
      return "Blockiert"
    default:
      return "Ausstehend"
  }
}

export function getStepBgColor(status: WorkflowStep["status"]) {
  switch (status) {
    case "completed":
      return "bg-green-50 border-green-200"
    case "in-progress":
      return "bg-blue-50 border-blue-200"
    case "blocked":
      return "bg-red-50 border-red-200"
    default:
      return "bg-gray-50 border-gray-200"
  }
}
