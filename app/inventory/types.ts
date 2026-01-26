export interface InventoryItem {
  id: string
  name: string
  sku?: string
  barcode?: string
  category: string
  current_stock: number
  minimum_stock: number
  min_stock?: number
  max_stock?: number
  reorder_point: number
  optimal_stock: number
  unit: string
  unit_cost?: number
  price?: number
  supplier_id?: string
  last_restocked_at?: string
}

export interface Supplier {
  id: string
  name: string
  email?: string
  phone?: string
  contact_person?: string
  is_preferred?: boolean
}

export interface OrderSuggestion {
  item: InventoryItem
  suggestedQuantity: number
  reason: string
  urgency: "critical" | "high" | "medium" | "low"
  estimatedCost: number
  daysUntilStockout: number
  confidence: number
}

export interface InventoryBill {
  id: string
  file_name: string
  file_url: string
  file_type?: string
  file_size?: number
  status: "pending" | "processing" | "completed" | "failed"
  extracted_at?: string
  extraction_error?: string
  supplier_name?: string
  bill_date?: string
  bill_number?: string
  total_amount?: number
  currency?: string
  extracted_items?: ExtractedItem[]
  ai_confidence?: number
  is_archived: boolean
  created_at: string
}

export interface ExtractedItem {
  name: string
  quantity: number
  unit: string
  unit_price: number
  total_price: number
}

export const CATEGORIES = [
  { value: "medical", label: "Medizinisch", icon: "🏥" },
  { value: "office", label: "Büro", icon: "📎" },
  { value: "hygiene", label: "Hygiene", icon: "🧴" },
  { value: "equipment", label: "Geräte", icon: "⚙️" },
  { value: "lab", label: "Labor", icon: "🔬" },
  { value: "general", label: "Allgemein", icon: "📦" },
]

export const URGENCY_COLORS: Record<string, string> = {
  critical: "bg-red-100 text-red-700 border-red-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-green-100 text-green-700 border-green-200",
}

export const URGENCY_LABELS: Record<string, string> = {
  critical: "Kritisch",
  high: "Hoch",
  medium: "Mittel",
  low: "Niedrig",
}

export interface InventorySettings {
  emailNotifications: boolean
  pushNotifications: boolean
  lowStockThreshold: number
  criticalStockThreshold: number
  autoReorder: boolean
}

export interface ItemFormState {
  name: string
  barcode: string
  category: string
  current_stock: number
  min_stock: number
  max_stock: number
  unit: string
  price: number
}
