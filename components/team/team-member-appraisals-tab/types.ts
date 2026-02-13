export interface SkillDefinition {
  id: string
  name: string
  category: string | null
  description: string | null
  current_level: number | null
  target_level: number | null
}

export const SKILL_LEVEL_CONFIG = [
  { level: 0, title: "Kein Skill", color: "bg-gray-100 text-gray-600", dotColor: "bg-gray-400" },
  { level: 1, title: "Basis", color: "bg-amber-100 text-amber-700", dotColor: "bg-amber-500" },
  { level: 2, title: "Selbststaendig", color: "bg-blue-100 text-blue-700", dotColor: "bg-blue-600" },
  { level: 3, title: "Experte", color: "bg-emerald-100 text-emerald-700", dotColor: "bg-emerald-600" },
]

export interface Appraisal {
  id: string
  employee_id: string
  appraiser_id?: string
  appraisal_type: string
  appraisal_date: string
  period_start?: string
  period_end?: string
  status: string
  overall_rating?: number
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
  created_at: string
  updated_at: string
}

export interface AppraisalsTabProps {
  memberId: string
  practiceId: string
  memberName: string
  isAdmin: boolean
  currentUserId?: string
}

export const DEFAULT_PERFORMANCE_AREAS = [
  { name: "Fachkompetenz", rating: 3, weight: 25 },
  { name: "Arbeitsqualitaet", rating: 3, weight: 20 },
  { name: "Zuverlaessigkeit", rating: 3, weight: 15 },
  { name: "Teamarbeit", rating: 3, weight: 15 },
  { name: "Kommunikation", rating: 3, weight: 15 },
  { name: "Initiative", rating: 3, weight: 10 },
]

export interface AiSuggestions {
  goals?: Array<{ title: string; description: string; measurable: string; deadline: string; priority: string }>
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
