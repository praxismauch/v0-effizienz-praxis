export interface TestingCategory {
  id: string
  name: string
  description: string | null
  color: string
}

export interface ChecklistTemplate {
  id: string
  title: string
  description: string | null
  category_id: string | null
  is_active: boolean
  testing_categories?: TestingCategory
}

export interface TestChecklist {
  id: string
  title: string
  description: string | null
  status: string
  progress: number
  total_items: number
  completed_items: number
  completed_at: string | null
  created_at: string
}

export interface ChecklistItem {
  id: string
  title: string
  description: string | null
  is_completed: boolean
  category_id: string | null
  testing_categories?: TestingCategory
  notes: string | null
}
