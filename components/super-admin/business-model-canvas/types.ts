export interface CanvasItem {
  id: string
  text: string
  priority?: "high" | "medium" | "low"
  status?: "active" | "planned" | "archived"
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface CanvasSection {
  id: string
  title: string
  titleEn: string
  description: string
  iconName: string
  color: string
  items: CanvasItem[]
}

export interface CanvasVersion {
  id: string
  name: string
  createdAt: string
  sections: CanvasSection[]
}

export interface BMCData {
  keyPartners: CanvasSection
  keyActivities: CanvasSection
  keyResources: CanvasSection
  valuePropositions: CanvasSection
  customerRelationships: CanvasSection
  channels: CanvasSection
  customerSegments: CanvasSection
  costStructure: CanvasSection
  revenueStreams: CanvasSection
  lastModified: string | null
  currentVersion?: string
  versions?: CanvasVersion[]
}

export const ORDERED_SECTION_IDS = [
  "key-partners", "key-activities", "value-propositions",
  "customer-relationships", "customer-segments", "channels",
  "key-resources", "cost-structure", "revenue-streams",
]

export function getPriorityColor(priority?: string) {
  switch (priority) {
    case "high": return "bg-red-100 text-red-800 border-red-200"
    case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200"
    case "low": return "bg-green-100 text-green-800 border-green-200"
    default: return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

export function getStatusColor(status?: string) {
  switch (status) {
    case "active": return "bg-emerald-100 text-emerald-800"
    case "planned": return "bg-blue-100 text-blue-800"
    case "archived": return "bg-gray-100 text-gray-800"
    default: return "bg-gray-100 text-gray-800"
  }
}
