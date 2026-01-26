export interface Course {
  id: string
  title: string
  description: string
  category: string
  thumbnail_url: string | null
  instructor_name: string
  instructor_avatar_url: string | null
  estimated_hours: number
  difficulty_level: string
  xp_reward: number
  total_enrollments: number
  average_rating: number
  total_reviews: number
  is_featured: boolean
  learning_objectives: string[]
  tags: string[]
}

export interface Enrollment {
  id: string
  course_id: string
  progress_percentage: number
  enrolled_at: string
  last_accessed_at: string | null
  course?: Course
}

export interface UserStats {
  total_xp: number
  current_level: number
  xp_for_next_level: number
  courses_completed: number
  lessons_completed: number
  current_streak_days: number
  longest_streak_days: number
  quizzes_passed: number
}

export interface UserBadge {
  id: string
  badge_id: string
  earned_at: string
  badge?: {
    id: string
    badge_id: string
    name: string
    description: string
    badge_type: string
    icon_name: string
    color: string
    rarity: string
    xp_reward: number
  }
}

export interface LeaderboardEntry {
  rank: number
  user_id: string
  user_name: string
  avatar_url?: string
  xp_earned: number
  courses_completed: number
}

export const DEFAULT_STATS: UserStats = {
  total_xp: 0,
  current_level: 1,
  xp_for_next_level: 100,
  courses_completed: 0,
  lessons_completed: 0,
  current_streak_days: 0,
  longest_streak_days: 0,
  quizzes_passed: 0,
}

export const getDifficultyColor = (level: string) => {
  switch (level) {
    case "beginner":
      return "bg-green-100 text-green-700 border-green-200"
    case "intermediate":
      return "bg-amber-100 text-amber-700 border-amber-200"
    case "advanced":
      return "bg-red-100 text-red-700 border-red-200"
    default:
      return "bg-gray-100 text-gray-700 border-gray-200"
  }
}

export const getDifficultyLabel = (level: string) => {
  switch (level) {
    case "beginner":
      return "Anfänger"
    case "intermediate":
      return "Fortgeschritten"
    case "advanced":
      return "Experte"
    default:
      return level
  }
}

export const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    efficiency: "Effizienz",
    leadership: "Führung",
    technology: "Technologie",
    communication: "Kommunikation",
    praxismanagement: "Praxismanagement",
    qualitaetsmanagement: "Qualitätsmanagement",
    personal: "Personal",
    finanzen: "Finanzen",
  }
  return labels[category] || category
}
