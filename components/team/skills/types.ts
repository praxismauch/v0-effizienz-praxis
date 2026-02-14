export interface SkillDefinition {
  id: string
  name: string
  category: string | null
  description: string | null
  team_id: string | null
  level_0_description: string
  level_1_description: string
  level_2_description: string
  level_3_description: string
  current_level: number | null
  target_level: number | null
  assessed_at: string | null
  assessed_by: string | null
  notes: string | null
  team_member_skill_id: string | null
}

export interface SkillHistoryEntry {
  id: string
  skill_id: string
  level: number
  version: number
  assessed_by: string | null
  change_reason: string | null
  notes: string | null
  changed_at: string
  skill_definitions?: {
    name: string
    category: string | null
  }
}

export interface Team {
  id: string
  name: string
  color: string | null
}

export const LEVEL_CONFIG = [
  {
    level: 0,
    title: "Kein Skill",
    shortTitle: "Keine",
    color: "bg-gray-100 text-gray-600 border-gray-300",
    bgColor: "bg-gray-50",
    progressColor: "bg-gray-300",
    dotColor: "bg-gray-400",
    icon: "○",
  },
  {
    level: 1,
    title: "Basis",
    shortTitle: "Basis",
    color: "bg-amber-100 text-amber-700 border-amber-300",
    bgColor: "bg-amber-50",
    progressColor: "bg-amber-400",
    dotColor: "bg-amber-500",
    icon: "◐",
  },
  {
    level: 2,
    title: "Selbstständig",
    shortTitle: "Selbst.",
    color: "bg-blue-100 text-blue-700 border-blue-300",
    bgColor: "bg-blue-50",
    progressColor: "bg-blue-500",
    dotColor: "bg-blue-600",
    icon: "◑",
  },
  {
    level: 3,
    title: "Experte",
    shortTitle: "Experte",
    color: "bg-emerald-100 text-emerald-700 border-emerald-300",
    bgColor: "bg-emerald-50",
    progressColor: "bg-emerald-500",
    dotColor: "bg-emerald-600",
    icon: "●",
  },
] as const
