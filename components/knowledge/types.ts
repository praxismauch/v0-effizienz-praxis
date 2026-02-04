export interface KnowledgeArticle {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  status: string
  version: number
  created_at: string
  updated_at: string
  published_at: string | null
  author_id: string
  source_type?: "article" | "device" | "material" | "arbeitsmittel"
  source_link?: string
}

export interface OrgaCategory {
  id: string
  name: string
  color: string
}

export interface MedicalDevice {
  id: string
  name: string
  description?: string
  manufacturer?: string
  model?: string
  serial_number?: string
  location?: string
  category?: string
  status?: string
  operating_instructions?: string
  cleaning_instructions?: string
  maintenance_instructions?: string
  created_at: string
  updated_at?: string
}

export interface InventoryItem {
  id: string
  name: string
  description?: string
  category?: string
  unit?: string
  min_stock?: number
  current_stock?: number
  location?: string
  supplier?: string
  notes?: string
  created_at: string
  updated_at?: string
}

export interface WorkEquipment {
  id: string
  name: string
  description?: string
  category?: string
  manufacturer?: string
  serial_number?: string
  location?: string
  status?: string
  notes?: string
  created_at: string
  updated_at?: string
}
