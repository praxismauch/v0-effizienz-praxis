export interface FieldOption {
  value: string
  label: string
}

export interface FormField {
  id: string
  label: string
  type: string
  required: boolean
  options?: FieldOption[]
}

export const defaultRecruitingFields: FormField[] = [
  { id: "title", label: "Stellentitel", type: "text", required: true },
  {
    id: "department",
    label: "Stellentyp",
    type: "select",
    required: false,
    options: [
      { value: "mfa", label: "MFA" },
      { value: "arzt", label: "Arzt" },
      { value: "sonstiges", label: "Sonstiges" },
    ],
  },
  {
    id: "employment_type",
    label: "Beschäftigungsart",
    type: "select",
    required: true,
    options: [
      { value: "full-time", label: "Vollzeit" },
      { value: "part-time", label: "Teilzeit" },
      { value: "contract", label: "Vertrag" },
      { value: "internship", label: "Praktikum" },
    ],
  },
  { id: "location", label: "Standort", type: "text", required: false },
  { id: "link", label: "Bewerbungslink", type: "text", required: false },
  { id: "start_month", label: "Startmonat", type: "select", required: false },
  { id: "start_year", label: "Startjahr", type: "select", required: false },
  { id: "hours_per_week_min", label: "Stunden pro Woche (von)", type: "number", required: false },
  { id: "hours_per_week_max", label: "Stunden pro Woche (bis)", type: "number", required: false },
  { id: "salary_min", label: "Gehalt Min (€)", type: "number", required: false },
  { id: "salary_max", label: "Gehalt Max (€)", type: "number", required: false },
  { id: "description", label: "Stellenbeschreibung", type: "textarea", required: false },
  { id: "required_skills", label: "Skills", type: "skills", required: false },
  { id: "responsibilities", label: "Aufgaben", type: "textarea", required: false },
  { id: "benefits", label: "Benefits", type: "textarea", required: false },
]

export interface PipelineStage {
  name: string
  stage_order: number
  color: string
  description: string
}

export const defaultPipelineStages: PipelineStage[] = [
  {
    name: "Bewerbung eingegangen",
    stage_order: 1,
    color: "#3b82f6",
    description: "Neue Bewerbungen, die noch nicht bearbeitet wurden",
  },
  {
    name: "Erstgespräch",
    stage_order: 2,
    color: "#8b5cf6",
    description: "Kandidaten für das erste Vorstellungsgespräch ausgewählt",
  },
  {
    name: "Probearbeiten",
    stage_order: 3,
    color: "#06b6d4",
    description: "Kandidaten im Probearbeitsprozess",
  },
  {
    name: "Zweitgespräch",
    stage_order: 4,
    color: "#ec4899",
    description: "Kandidaten für das zweite Vorstellungsgespräch",
  },
  {
    name: "Angebot",
    stage_order: 5,
    color: "#f59e0b",
    description: "Kandidaten, denen ein Angebot unterbreitet wurde",
  },
  {
    name: "Abgelehnt",
    stage_order: 6,
    color: "#ef4444",
    description: "Kandidaten, die abgelehnt wurden oder abgesagt haben",
  },
]
