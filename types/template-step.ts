export interface TemplateStep {
  title: string
  description?: string
  assignedTo?: string
  estimatedDuration?: number
  dependencies: string[]
}
