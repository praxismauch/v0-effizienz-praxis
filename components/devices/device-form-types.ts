export interface Room {
  id: string
  name: string
  beschreibung?: string
}

export interface ContactOption {
  id: string
  company: string | null
  first_name: string | null
  last_name: string | null
  phone: string | null
  email: string | null
}

export interface Department {
  id: string
  name: string
  color?: string
}

export interface InstructionDocument {
  id: string
  name: string
  url: string
  type: string
  size: number
}

export interface DeviceFormData {
  name: string
  description: string
  category: string
  manufacturer: string
  model: string
  serial_number: string
  inventory_number: string
  purchase_date: string
  purchase_price: string
  supplier_name: string
  supplier_contact: string
  warranty_end_date: string
  location: string
  room: string
  responsible_user_id: string
  image_url: string
  handbook_url: string
  maintenance_interval_days: string
  last_maintenance_date: string
  maintenance_service_partner: string
  maintenance_service_contact: string
  maintenance_service_phone: string
  maintenance_service_email: string
  consumables_supplier: string
  consumables_order_url: string
  consumables_notes: string
  cleaning_instructions: string
  maintenance_instructions: string
  short_sop: string
  status: string
  mpg_class: string
  software_version: string
  ce_marking: boolean
  safety_relevant: boolean
}

export const EMPTY_FORM_DATA: DeviceFormData = {
  name: "",
  description: "",
  category: "diagnostik",
  manufacturer: "",
  model: "",
  serial_number: "",
  inventory_number: "",
  purchase_date: "",
  purchase_price: "",
  supplier_name: "",
  supplier_contact: "",
  warranty_end_date: "",
  location: "",
  room: "",
  responsible_user_id: "",
  image_url: "",
  handbook_url: "",
  maintenance_interval_days: "",
  last_maintenance_date: "",
  maintenance_service_partner: "",
  maintenance_service_contact: "",
  maintenance_service_phone: "",
  maintenance_service_email: "",
  consumables_supplier: "",
  consumables_order_url: "",
  consumables_notes: "",
  cleaning_instructions: "",
  maintenance_instructions: "",
  short_sop: "",
  status: "active",
  mpg_class: "",
  software_version: "",
  ce_marking: false,
  safety_relevant: false,
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

export function getContactDisplayName(contact: ContactOption): string {
  return contact.company || `${contact.first_name || ""} ${contact.last_name || ""}`.trim()
}
