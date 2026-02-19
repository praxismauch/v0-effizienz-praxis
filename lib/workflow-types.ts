export interface WorkflowStep {
  id: string
  title: string
  description?: string
  assignedTo?: string
  assignedUserId?: string
  estimatedDuration?: number
  dependencies: string[]
  status: "pending" | "in-progress" | "completed" | "blocked"
  completedAt?: string
  completedBy?: string
  notes?: string
  dueDate?: string
  parentStepId?: string
  isSubitem?: boolean
  subitems?: WorkflowStep[]
}

export interface Workflow {
  id: string
  title: string
  description?: string
  category: string
  priority: "low" | "medium" | "high" | "urgent"
  status: "draft" | "active" | "paused" | "completed" | "archived"
  createdBy: string
  createdAt: string
  updatedAt: string
  practiceId: string
  teamIds: string[]
  steps: WorkflowStep[]
  isTemplate: boolean
  templateId?: string
  estimatedTotalDuration?: number
  actualDuration?: number
  startedAt?: string
  completedAt?: string
  hideItemsFromOtherUsers?: boolean
}

export interface WorkflowTemplate {
  id: string
  title: string
  description?: string
  category: string
  steps: Omit<WorkflowStep, "id" | "status" | "completedAt" | "completedBy" | "notes">[]
  estimatedDuration: number
  createdBy: string
  createdAt: string
  isPublic: boolean
  practiceId?: string
  hideItemsFromOtherUsers?: boolean
}

export interface OrgaCategory {
  id: string
  name: string
  description?: string
  color: string
  icon: string
  is_active: boolean
  display_order: number
  practice_id: string | null
  created_at: string
  updated_at: string
}
