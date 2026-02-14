export const LEITBILD_CACHE_KEY = "effizienz-praxis-leitbild-cache"

export interface LeitbildVersion {
  id: string
  practice_id: string
  mission_statement: string | null
  vision_statement: string | null
  leitbild_one_sentence: string | null
  questionnaire_responses: Record<string, string> | null
  version: number
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface QuestionnaireResponses {
  core_values: string
  unique_approach: string
  patient_focus: string
  future_vision: string
  impact: string
}

export const defaultResponses: QuestionnaireResponses = {
  core_values: "",
  unique_approach: "",
  patient_focus: "",
  future_vision: "",
  impact: "",
}

export const questions = [
  {
    id: "core_values",
    question: "Was sind die 3-5 wichtigsten Werte Ihrer Praxis?",
    placeholder: "z.B. Vertrauen, Qualitat, Innovation, Menschlichkeit...",
  },
  {
    id: "patient_focus",
    question: "Wer sind Ihre idealen Patienten und was macht sie besonders?",
    placeholder: "Beschreiben Sie Ihre Zielgruppe und deren Bedurfnisse...",
  },
  {
    id: "unique_approach",
    question: "Was unterscheidet Ihre Praxis von anderen?",
    placeholder: "Beschreiben Sie Ihren besonderen Ansatz und Ihre Starken...",
  },
  {
    id: "future_vision",
    question: "Wo sehen Sie Ihre Praxis in 5 Jahren?",
    placeholder: "Beschreiben Sie Ihre Ziele und Ihre Vision...",
  },
  {
    id: "impact",
    question: "Welchen Beitrag leistet Ihre Praxis fur die Gemeinschaft?",
    placeholder: "z.B. Verbesserung der Gesundheitsversorgung, Aufklarung...",
  },
]
