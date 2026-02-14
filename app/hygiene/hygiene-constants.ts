export interface HygienePlan {
  id: string
  practice_id: string
  title: string
  description?: string
  plan_type: string
  area: string
  frequency: string
  procedure: string
  responsible_role?: string
  products_used?: string[]
  documentation_required: boolean
  rki_reference?: string
  status: string
  created_at: string
  updated_at: string
  version: number
}

export interface HygienePlanExecution {
  id: string
  plan_id: string
  executed_by: string
  executed_at: string
  notes?: string
  verification_status: string
}

export const PLAN_TYPES = [
  { value: "desinfektion", label: "Desinfektion" },
  { value: "reinigung", label: "Reinigung" },
  { value: "sterilisation", label: "Sterilisation" },
  { value: "haendehygiene", label: "Händehygiene" },
  { value: "flaechendesinfektion", label: "Flächendesinfektion" },
  { value: "instrumentenaufbereitung", label: "Instrumentenaufbereitung" },
  { value: "andere", label: "Andere" },
]

export const AREAS = [
  { value: "behandlungsraum", label: "Behandlungsraum" },
  { value: "wartezimmer", label: "Wartezimmer" },
  { value: "toiletten", label: "Toiletten" },
  { value: "labor", label: "Labor" },
  { value: "sterilisation", label: "Sterilisationsbereich" },
  { value: "empfang", label: "Empfang" },
  { value: "kueche", label: "Küche/Pausenraum" },
  { value: "allgemein", label: "Allgemein" },
]

export const FREQUENCIES = [
  { value: "taeglich", label: "Täglich" },
  { value: "nach_patient", label: "Nach jedem Patienten" },
  { value: "woechentlich", label: "Wöchentlich" },
  { value: "monatlich", label: "Monatlich" },
  { value: "quartalsweise", label: "Quartalsweise" },
  { value: "jaehrlich", label: "Jährlich" },
  { value: "bei_bedarf", label: "Bei Bedarf" },
]

export const STATUS_OPTIONS = [
  { value: "active", label: "Aktiv", color: "bg-green-500" },
  { value: "draft", label: "Entwurf", color: "bg-gray-500" },
  { value: "archived", label: "Archiviert", color: "bg-orange-500" },
]

export interface HygieneFormData {
  title: string
  description: string
  plan_type: string
  area: string
  frequency: string
  procedure: string
  responsible_role: string
  products_used: string
  documentation_required: boolean
  rki_reference: string
}

export const EMPTY_FORM_DATA: HygieneFormData = {
  title: "",
  description: "",
  plan_type: "",
  area: "",
  frequency: "",
  procedure: "",
  responsible_role: "",
  products_used: "",
  documentation_required: true,
  rki_reference: "",
}
