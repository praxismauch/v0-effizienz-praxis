export interface MedicalDevice {
  id: string
  practice_id: string
  name: string
  description?: string
  category?: string
  manufacturer?: string
  model?: string
  serial_number?: string
  inventory_number?: string
  purchase_date?: string
  purchase_price?: number
  currency?: string
  supplier_name?: string
  supplier_contact?: string
  warranty_end_date?: string
  location?: string
  room?: string
  responsible_user_id?: string
  image_url?: string
  handbook_url?: string
  ce_certificate_url?: string
  maintenance_interval_days?: number
  last_maintenance_date?: string
  next_maintenance_date?: string
  maintenance_service_partner?: string
  maintenance_service_contact?: string
  maintenance_service_phone?: string
  maintenance_service_email?: string
  consumables_supplier?: string
  consumables_order_url?: string
  consumables_notes?: string
  cleaning_instructions?: string
  maintenance_instructions?: string
  short_sop?: string
  status: string
  is_active: boolean
  created_at: string
}

export const DEVICE_CATEGORIES = [
  { value: "diagnostik", label: "Diagnostik" },
  { value: "therapie", label: "Therapie" },
  { value: "labor", label: "Labor" },
  { value: "bildgebung", label: "Bildgebung" },
  { value: "chirurgie", label: "Chirurgie" },
  { value: "monitoring", label: "Monitoring" },
  { value: "it", label: "IT & EDV" },
  { value: "sonstiges", label: "Sonstiges" },
]

export const STATUS_CONFIG: Record<string, { label: string; color: string; iconName: string }> = {
  active: { label: "Aktiv", color: "bg-green-100 text-green-700", iconName: "CheckCircle" },
  maintenance: { label: "In Wartung", color: "bg-yellow-100 text-yellow-700", iconName: "Wrench" },
  defect: { label: "Defekt", color: "bg-red-100 text-red-700", iconName: "AlertTriangle" },
  inactive: { label: "Inaktiv", color: "bg-gray-100 text-gray-700", iconName: "Settings2" },
  disposed: { label: "Entsorgt", color: "bg-gray-100 text-gray-500", iconName: "Trash2" },
}
