export interface Document {
  id: string
  name: string
  description: string | null
  file_url: string
  file_type: string
  file_size: number
  folder_id: string | null
  created_by: string
  created_by_name?: string
  created_by_at: string
  created_at?: string
  tags: string[]
  version: number
  ai_analysis: AIAnalysisResult | null
  is_folder?: boolean
}

export interface DocumentFolder {
  id: string
  name: string
  description: string | null
  parent_folder_id: string | null
  color: string
  created_at: string
  created_by_name?: string
  is_system_folder?: boolean
}

export interface AIAnalysisResult {
  documentId?: string
  documentName?: string
  summary: string
  documentType: string
  keyPoints: string[]
  categories: string[]
  tags: string[]
  detectedEntities: {
    dates: string[]
    amounts: string[]
    names: string[]
  }
  recommendations: string[]
  relevanceScore: number
}

export interface FolderPermission {
  type: "user" | "team"
  id: string
  name: string
  level: "view" | "edit" | "admin"
}

export interface UploadFormData {
  name: string
  description: string
  files: File[]
  folder_id: string | null
  analyzeWithAI: boolean
}

export interface FolderFormData {
  name: string
  description: string
  color: string
}
