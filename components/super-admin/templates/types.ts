export interface TemplateSkill {
  id: string
  template_id: string
  name: string
  category: string | null
  description: string | null
  color: string
  icon: string
  level_0_title: string
  level_0_description: string
  level_0_criteria: string[]
  level_1_title: string
  level_1_description: string
  level_1_criteria: string[]
  level_2_title: string
  level_2_description: string
  level_2_criteria: string[]
  level_3_title: string
  level_3_description: string
  level_3_criteria: string[]
  is_active: boolean
  display_order: number
}

export interface PracticeTemplate {
  id: string
  name: string
  description: string | null
  specialty_ids: string[]
  is_active: boolean
  is_system_template?: boolean
  display_order: number
  created_at: string
  template_skills?: TemplateSkill[]
}

export interface PracticeType {
  id: string
  name: string
}

export const SKILL_COLORS = [
  { value: "#3b82f6", label: "Blau", className: "bg-blue-500" },
  { value: "#10b981", label: "Grün", className: "bg-emerald-500" },
  { value: "#f59e0b", label: "Orange", className: "bg-amber-500" },
  { value: "#8b5cf6", label: "Lila", className: "bg-violet-500" },
  { value: "#ec4899", label: "Pink", className: "bg-pink-500" },
  { value: "#ef4444", label: "Rot", className: "bg-red-500" },
  { value: "#06b6d4", label: "Cyan", className: "bg-cyan-500" },
  { value: "#84cc16", label: "Lime", className: "bg-lime-500" },
]

export const SKILL_CATEGORIES = [
  "Medizinische Kompetenz",
  "Verwaltung",
  "Kommunikation",
  "Technik",
  "Hygiene",
  "Notfall",
  "Qualitätsmanagement",
  "Patientenbetreuung",
]

export const DEFAULT_SKILL_FORM = {
  name: "",
  category: "",
  description: "",
  color: "#3b82f6",
  level_0_title: "Kein Skill",
  level_0_description: "Keine Erfahrung, benötigt vollständige Anleitung",
  level_0_criteria: [""],
  level_1_title: "Basis",
  level_1_description: "Kann einfache Aufgaben mit Anleitung ausführen",
  level_1_criteria: [""],
  level_2_title: "Selbstständig",
  level_2_description: "Beherrscht Aufgaben sicher und zuverlässig ohne Hilfe",
  level_2_criteria: [""],
  level_3_title: "Experte",
  level_3_description: "Beherrscht komplexe Situationen, kann andere anleiten, optimiert Prozesse",
  level_3_criteria: [""],
}

export type SkillFormData = typeof DEFAULT_SKILL_FORM
