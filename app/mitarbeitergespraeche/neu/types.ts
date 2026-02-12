export interface TeamMember {
  id: string
  name: string
  role: string
  avatar_url?: string
  email?: string
  department?: string
}

export interface Skill {
  name: string
  current_level: number
  target_level: number
  comment?: string
}

export interface PerformanceArea {
  name: string
  rating: number
  weight: number
}

export interface Competency {
  skill_id?: string
  name: string
  currentLevel: number
  targetLevel: number
  previousLevel?: number
  gap?: number
}

export interface NewGoal {
  title: string
  description: string
  measurable?: string
  deadline?: string
  priority: string
  status: string
}

export interface Goal {
  goal: string
  target_date?: string
  success_criteria?: string
  progress?: number
  status?: string
}

export interface DevelopmentPlan {
  title: string
  description: string
  type: string
  timeline?: string
  resources?: string
  status: string
  skill_id?: string
  action?: string
  responsible?: string
}

export interface FollowUpAction {
  action: string
  responsible: string
  deadline?: string
  status: string
}

export interface FormData {
  performance_areas: PerformanceArea[]
  competencies: Competency[]
  goals: NewGoal[]
  development_plans: DevelopmentPlan[]
  strengths: string
  areas_for_improvement: string
  achievements: string
  challenges: string
  employee_self_assessment: string
  manager_comments: string
  overall_rating: number | null
  summary: string
  career_aspirations: string
  promotion_readiness: string
  next_review_date: string
  follow_up_actions: FollowUpAction[]
}

export interface SkillDefinition {
  id: string
  name: string
  category: string | null
  description: string | null
  current_level: number | null
  target_level: number | null
}

export interface Appraisal {
  id?: string
  employee_id: string
  appraiser_id?: string
  appraisal_type: string
  appraisal_date: string
  period_start?: string
  period_end?: string
  status: string
  overall_rating?: number | null
  performance_areas?: Array<{ name: string; rating: number; weight: number }>
  competencies?: Array<{
    skill_id?: string
    name: string
    currentLevel: number
    targetLevel: number
    previousLevel?: number
    gap?: number
  }>
  goals_review?: Array<{ title: string; status: string; achievement?: number; comments?: string }>
  new_goals?: Array<{
    title: string
    description: string
    measurable?: string
    deadline?: string
    priority: string
    status: string
  }>
  development_plan?: Array<{
    title: string
    description: string
    type: string
    timeline?: string
    resources?: string
    status: string
    skill_id?: string
  }>
  strengths?: string
  areas_for_improvement?: string
  achievements?: string
  challenges?: string
  employee_self_assessment?: string
  manager_comments?: string
  career_aspirations?: string
  promotion_readiness?: string
  succession_potential?: string
  salary_recommendation?: string
  next_review_date?: string
  summary?: string
  follow_up_actions?: Array<{ action: string; responsible: string; deadline?: string; status: string }>
}

export interface AISuggestions {
  goals?: Array<{ title: string; description: string; measurable: string; deadline: string; priority: string }>
  development?: Array<{
    title: string
    description: string
    type: string
    timeline: string
    resources: string
    skill_id?: string
  }>
  developmentActions?: Array<{
    title: string
    description: string
    type: string
    timeline: string
    resources: string
    skill_id?: string
  }>
  strengths?: string[]
  improvements?: string[]
  careerSteps?: Array<{ step: string; timeline: string; skills: string[] }>
}

export const SKILL_LEVEL_CONFIG = [
  { level: 0, title: "Kein Skill", color: "bg-gray-100 text-gray-600", dotColor: "bg-gray-400" },
  { level: 1, title: "Basis", color: "bg-amber-100 text-amber-700", dotColor: "bg-amber-500" },
  { level: 2, title: "Selbstständig", color: "bg-blue-100 text-blue-700", dotColor: "bg-blue-600" },
  { level: 3, title: "Experte", color: "bg-emerald-100 text-emerald-700", dotColor: "bg-emerald-600" },
]

export const DEFAULT_PERFORMANCE_AREAS = [
  { name: "Sorgfalt", rating: 3, weight: 10 },
  { name: "Zusammenarbeit / Freundlichkeit", rating: 3, weight: 10 },
  { name: "Bereitschaft flexibel zu Arbeiten", rating: 3, weight: 10 },
  { name: "Mitarbeit an Verbesserungen", rating: 3, weight: 10 },
  { name: "Arbeitsqualität", rating: 3, weight: 10 },
  { name: "Selbstständigkeit / Planung", rating: 3, weight: 10 },
  { name: "Patientenbezug", rating: 3, weight: 10 },
  { name: "Einstellung zu Zielen", rating: 3, weight: 10 },
  { name: "Initiative zu Projekten", rating: 3, weight: 10 },
  { name: "Einhaltung von Praxisvorgaben", rating: 3, weight: 10 },
]

export const getRatingLabel = (rating: number) => {
  if (rating >= 4.5) return { label: "Herausragend", color: "text-emerald-600" }
  if (rating >= 3.5) return { label: "Sehr gut", color: "text-blue-600" }
  if (rating >= 2.5) return { label: "Gut", color: "text-amber-600" }
  if (rating >= 1.5) return { label: "Entwicklungsbedarf", color: "text-orange-600" }
  return { label: "Kritisch", color: "text-red-600" }
}

export const calculateOverallRating = (areas: Array<{ name: string; rating: number; weight: number }>) => {
  if (areas.length === 0) return 0
  const totalWeight = areas.reduce((sum, a) => sum + a.weight, 0)
  const weightedSum = areas.reduce((sum, a) => sum + a.rating * a.weight, 0)
  return totalWeight > 0 ? (weightedSum / totalWeight).toFixed(1) : 0
}
