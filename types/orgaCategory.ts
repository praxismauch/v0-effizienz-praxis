export interface OrgaCategory {
  id: string
  practice_id: string | null
  name: string
  description: string | null
  color: string | null
  icon: string | null
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
  itemsCount?: number
}
