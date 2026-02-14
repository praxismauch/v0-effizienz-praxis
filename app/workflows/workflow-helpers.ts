import type { Workflow, WorkflowStep } from "@/contexts/workflow-context"

export const getStepProgress = (workflow: Workflow) => {
  if (workflow.steps.length === 0) return 0
  const completedSteps = workflow.steps.filter((step) => step.status === "completed").length
  return (completedSteps / workflow.steps.length) * 100
}

export const getPriorityColor = (priority: Workflow["priority"]) => {
  switch (priority) {
    case "urgent":
      return "bg-red-100 text-red-800 border-red-200"
    case "high":
      return "bg-orange-100 text-orange-800 border-orange-200"
    case "medium":
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    case "low":
      return "bg-green-100 text-green-800 border-green-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

export const getStatusColor = (status: Workflow["status"]) => {
  switch (status) {
    case "active":
      return "bg-blue-100 text-blue-800"
    case "completed":
      return "bg-green-100 text-green-800"
    case "paused":
      return "bg-yellow-100 text-yellow-800"
    case "draft":
      return "bg-gray-100 text-gray-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export const getStepStatusColor = (status: WorkflowStep["status"]) => {
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

export const canStartStep = (workflow: Workflow, step: WorkflowStep) => {
  return step.dependencies.every(
    (depId) => workflow.steps.find((s) => s.id === depId)?.status === "completed"
  )
}

export const getPriorityLabel = (priority: string) => {
  switch (priority) {
    case "urgent": return "Dringend"
    case "high": return "Hoch"
    case "medium": return "Mittel"
    case "low": return "Niedrig"
    default: return priority
  }
}

export const getStatusLabel = (status: string) => {
  switch (status) {
    case "active": return "Aktiv"
    case "completed": return "Abgeschlossen"
    case "paused": return "Pausiert"
    case "draft": return "Entwurf"
    default: return status
  }
}
