import type { Todo } from "@/contexts/todo-context"

export interface TeamMember {
  id: string
  name?: string
  email?: string
  avatar_url?: string
}

export interface TodoCardProps {
  todo: Todo
  teamMembers: TeamMember[]
  onStatusChange: (todoId: string, status: string) => void
  onEdit: (todo: Todo) => void
  onDelete: (todoId: string) => void
  viewMode?: "list" | "kanban" | "matrix"
  draggable?: boolean
  isDragging?: boolean
  isDragOver?: boolean
  onDragStart?: (e: React.DragEvent, todo: Todo, index?: number) => void
  onDragOver?: (e: React.DragEvent, index?: number) => void
  onDrop?: (e: React.DragEvent, index?: number) => void
  onDragEnd?: (e: React.DragEvent) => void
  index?: number
  sortBy?: string
}

export const statusConfig = {
  offen: {
    label: "Offen",
    dotColor: "bg-primary",
    bgColor: "bg-primary/10",
    textColor: "text-primary",
  },
  in_bearbeitung: {
    label: "In Bearbeitung",
    dotColor: "bg-warning",
    bgColor: "bg-warning/10",
    textColor: "text-warning",
  },
  erledigt: {
    label: "Erledigt",
    dotColor: "bg-success",
    bgColor: "bg-success/10",
    textColor: "text-success",
  },
  abgebrochen: {
    label: "Abgebrochen",
    dotColor: "bg-destructive",
    bgColor: "bg-destructive/10",
    textColor: "text-destructive",
  },
}

export function isOverdue(dueDate: string | null, status?: string) {
  if (!dueDate || status === "erledigt") return false
  return new Date(dueDate) < new Date()
}

export function getDaysUntilDue(dueDate: string | null) {
  if (!dueDate) return null
  const now = new Date()
  const due = new Date(dueDate)
  const diffTime = due.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

export function getPriorityConfig(priority: string) {
  switch (priority) {
    case "high":
      return { label: "Hoch", color: "bg-destructive/10 text-destructive border-destructive/20", dotColor: "bg-destructive" }
    case "medium":
      return { label: "Mittel", color: "bg-warning/10 text-warning border-warning/20", dotColor: "bg-warning" }
    case "low":
      return { label: "Niedrig", color: "bg-success/10 text-success border-success/20", dotColor: "bg-success" }
    default:
      return { label: priority, color: "bg-secondary text-secondary-foreground border-border", dotColor: "bg-muted-foreground" }
  }
}
