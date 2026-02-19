export interface ArbeitsmittelFormData {
  name: string
  type: string
  description: string
  serial_number: string
  purchase_date: string
  purchase_price: string
  condition: string
  assigned_to: string
  status: string
  notes: string
}

export const EMPTY_FORM_DATA: ArbeitsmittelFormData = {
  name: "",
  type: "",
  description: "",
  serial_number: "",
  purchase_date: "",
  purchase_price: "",
  condition: "Neu",
  assigned_to: "",
  status: "available",
  notes: "",
}

export const EQUIPMENT_TYPES = ["Schluessel", "Dienstkleidung", "Dienst Handy", "Dienst Laptop", "Sonstiges"]

export const CONDITIONS = ["Neu", "Gut", "Gebraucht", "Defekt"]

export const STATUSES = [
  { value: "available", label: "Verfuegbar" },
  { value: "assigned", label: "Zugewiesen" },
  { value: "maintenance", label: "Wartung" },
  { value: "retired", label: "Ausgemustert" },
]
