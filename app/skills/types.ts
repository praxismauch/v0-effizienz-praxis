export interface Skill {
  id: string
  name: string
  description: string | null
  category: string | null
  team_id: string | null
  is_active: boolean
  display_order: number
  level_0_description: string | null
  level_1_description: string | null
  level_2_description: string | null
  level_3_description: string | null
  created_at: string
  updated_at: string
}

export interface GeneratedSkill {
  name: string
  description: string
  category: string
  level_0_description: string
  level_1_description: string
  level_2_description: string
  level_3_description: string
  selected?: boolean
}

export interface Arbeitsplatz {
  id: string
  name: string
  beschreibung?: string
}

export const categoryLabels: Record<string, string> = {
  medical: "Medizinisch",
  administrative: "Administrativ",
  communication: "Kommunikation",
  technical: "Technisch",
  leadership: "Führung",
  soft_skills: "Soft Skills",
  quality: "Qualität",
  hygiene: "Hygiene",
  emergency: "Notfall",
  other: "Sonstiges",
}

export const categoryColors: Record<string, string> = {
  medical: "bg-red-100 text-red-800 border-red-200",
  administrative: "bg-blue-100 text-blue-800 border-blue-200",
  communication: "bg-green-100 text-green-800 border-green-200",
  technical: "bg-purple-100 text-purple-800 border-purple-200",
  leadership: "bg-orange-100 text-orange-800 border-orange-200",
  soft_skills: "bg-pink-100 text-pink-800 border-pink-200",
  quality: "bg-cyan-100 text-cyan-800 border-cyan-200",
  hygiene: "bg-lime-100 text-lime-800 border-lime-200",
  emergency: "bg-amber-100 text-amber-800 border-amber-200",
  other: "bg-gray-100 text-gray-800 border-gray-200",
}
