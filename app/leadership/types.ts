import type React from "react"

export interface LeadershipMetric {
  label: string
  value: number
  target: number
  trend: "up" | "down" | "stable"
  icon: React.ReactNode
}

export interface TeamPerformance {
  memberId: string
  memberName: string
  avatar?: string
  role: string
  completedTasks: number
  totalTasks: number
  goalsAchieved: number
  totalGoals: number
  satisfaction: number
  lastFeedback: string
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
  assessment_date: string
  assessment_type: string
  notes?: string
  created_at: string
}

export interface SelfAssessment {
  positiveEmotions: number
  engagement: number
  relationships: number
  meaning: number
  accomplishment: number
  vitality: number
  notes: string
}

export const PERMA_DIMENSIONS = [
  { value: "positiveEmotions", label: "Positive Emotionen" },
  { value: "engagement", label: "Engagement" },
  { value: "relationships", label: "Beziehungen" },
  { value: "meaning", label: "Sinnhaftigkeit" },
  { value: "accomplishment", label: "Zielerreichung" },
  { value: "vitality", label: "Vitalität" },
] as const

export function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-600"
  if (score >= 60) return "text-amber-500"
  return "text-red-500"
}

export function getAverageScore(scores: PermaScores): number {
  const values = Object.values(scores)
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length)
}
