export interface TemplateStep {
  title: string
  description?: string
  assignedTo?: string
  assignedUserId?: string
  estimatedDuration?: number
  dependencies: string[]
  subitems?: TemplateStep[]
}

export interface TemplateFormData {
  title: string
  description: string
  category: string
  isPublic: boolean
  hideItemsFromOtherUsers: boolean
}

export interface TeamMemberOption {
  id: string
  userId?: string
  name: string
  role?: string
}

export interface OrgaCategory {
  id: string
  name: string
  color: string
}
