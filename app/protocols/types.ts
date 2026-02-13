export interface ProtocolItem {
  id: string
  title: string
  responsibleId: string | null
  responsibleName: string
  dueDate: Date | null
}

export interface Protocol {
  id: string
  title: string
  description?: string
  content?: string
  category: string
  status: "draft" | "published" | "archived"
  steps?: any[]
  action_items?: ProtocolItem[]
  attendees?: string[]
  protocol_date?: string
  created_at: string
  updated_at: string
  created_by?: string
}

export interface TeamMember {
  id: string
  name: string
  role?: string
  avatar_url?: string
}

export interface ProtocolFormData {
  title: string
  description: string
  category: string
  content: string
  protocolDate: Date
  actionItems: ProtocolItem[]
  attendees: string[]
}

export const PROTOCOL_CATEGORIES = [
  { value: "general", label: "Allgemein" },
  { value: "team", label: "Teambesprechung" },
  { value: "patient", label: "Patientenbesprechung" },
  { value: "management", label: "Management" },
  { value: "training", label: "Schulung" },
] as const
