// PERMA-V dimension types

export interface PermaModelItem {
  dimension: string
  score: number
  previousScore?: number
  trend?: "up" | "down" | "stable"
}

export interface PracticeAverages {
  positiveEmotions: number
  engagement: number
  relationships: number
  meaning: number
  accomplishment: number
  vitality: number
  overall: number
}

export interface PermaScores {
  positiveEmotions: number
  engagement: number
  relationships: number
  meaning: number
  accomplishment: number
  vitality: number
}

export interface PermaAssessment {
  id: string
  practice_id: string
  user_id: string
  positive_emotions: number
  engagement: number
  relationships: number
  meaning: number
  accomplishment: number
  vitality: number
  assessment_type: string
  notes: string | null
  action_items: ActionItem[]
  assessment_date: string
  created_at: string
}

export interface ActionItem {
  id: string
  title: string
  dimension: string
  status: "pending" | "in_progress" | "completed"
  dueDate?: string
  priority: "low" | "medium" | "high"
  notes?: string
}

export interface TeamMemberScore {
  userId: string
  name: string
  avatar?: string
  scores: PermaScores
  trend: "up" | "down" | "stable"
  lastAssessment: string
}

export interface PermaDimension {
  key: keyof PermaScores
  name: string
  fullName: string
  description: string
  icon: string
  color: string
  tips: string[]
}

export const PERMA_DIMENSIONS: PermaDimension[] = [
  {
    key: "positiveEmotions",
    name: "P",
    fullName: "Positive Emotionen",
    description: "Freude, Dankbarkeit, Hoffnung und andere positive Gefühle",
    icon: "Smile",
    color: "#f59e0b",
    tips: [
      "Führen Sie ein Dankbarkeitstagebuch",
      "Teilen Sie positive Erlebnisse mit Kollegen",
      "Feiern Sie kleine Erfolge im Team",
    ],
  },
  {
    key: "engagement",
    name: "E",
    fullName: "Engagement",
    description: "Flow-Erlebnisse und tiefes Eintauchen in Aufgaben",
    icon: "Zap",
    color: "#8b5cf6",
    tips: [
      "Identifizieren Sie Ihre Stärken und setzen Sie diese ein",
      "Schaffen Sie ungestörte Arbeitszeiten",
      "Suchen Sie herausfordernde, aber machbare Aufgaben",
    ],
  },
  {
    key: "relationships",
    name: "R",
    fullName: "Beziehungen",
    description: "Positive Verbindungen zu anderen Menschen",
    icon: "Users",
    color: "#ec4899",
    tips: [
      "Planen Sie regelmäßige Team-Aktivitäten",
      "Praktizieren Sie aktives Zuhören",
      "Zeigen Sie Wertschätzung für Kollegen",
    ],
  },
  {
    key: "meaning",
    name: "M",
    fullName: "Sinn",
    description: "Das Gefühl, Teil von etwas Größerem zu sein",
    icon: "Target",
    color: "#10b981",
    tips: [
      "Verbinden Sie tägliche Aufgaben mit übergeordneten Zielen",
      "Reflektieren Sie über den Beitrag Ihrer Arbeit",
      "Teilen Sie die Vision der Praxis regelmäßig",
    ],
  },
  {
    key: "accomplishment",
    name: "A",
    fullName: "Leistung",
    description: "Erfolge erreichen und Ziele verwirklichen",
    icon: "Award",
    color: "#3b82f6",
    tips: [
      "Setzen Sie sich klare, messbare Ziele",
      "Feiern Sie erreichte Meilensteine",
      "Geben Sie konstruktives Feedback",
    ],
  },
  {
    key: "vitality",
    name: "V",
    fullName: "Vitalität",
    description: "Physische und mentale Gesundheit und Energie",
    icon: "Heart",
    color: "#ef4444",
    tips: [
      "Achten Sie auf ausreichend Pausen",
      "Fördern Sie Bewegung am Arbeitsplatz",
      "Unterstützen Sie Work-Life-Balance",
    ],
  },
]
