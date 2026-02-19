import {
  Trophy, Target, Flame, Zap, CheckCircle, Crown,
  Award, Medal, Star, Heart, Sparkles, Globe, Users,
} from "lucide-react"

export interface Course {
  id: string
  title: string
  description: string
  category: string
  difficulty_level: string
  thumbnail_url: string
  featured_image_url: string
  instructor_name: string
  instructor_bio: string
  instructor_avatar_url: string
  estimated_hours: number
  xp_reward: number
  is_published: boolean
  is_featured: boolean
  is_landing_page_featured: boolean
  visibility: "public" | "logged_in" | "premium"
  target_audience: string[]
  total_enrollments: number
  average_rating: number
  total_reviews: number
  tags: string[]
  learning_objectives: string[]
  created_at: string
  updated_at: string
}

export interface Module {
  id: string
  course_id: string
  title: string
  description: string
  display_order: number
  estimated_minutes: number
  is_published: boolean
  lessons?: Lesson[]
}

export interface Lesson {
  id: string
  module_id: string
  course_id: string
  title: string
  description: string
  content: string
  lesson_type: string
  video_url: string
  video_duration_seconds: number
  estimated_minutes: number
  xp_reward: number
  display_order: number
  is_published: boolean
  is_free_preview: boolean
  resources: any[]
}

export interface Quiz {
  id: string
  course_id: string
  module_id: string
  lesson_id: string
  title: string
  description: string
  quiz_type: string
  passing_score: number
  max_attempts: number
  time_limit_minutes: number
  xp_reward: number
  randomize_questions: boolean
  show_correct_answers: boolean
  questions?: QuizQuestion[]
}

export interface QuizQuestion {
  id: string
  quiz_id: string
  question_text: string
  question_type: string
  explanation: string
  points: number
  display_order: number
  options?: QuizOption[]
}

export interface QuizOption {
  id: string
  question_id: string
  option_text: string
  is_correct: boolean
  explanation: string
  display_order: number
}

export interface AcademyBadge {
  id: string
  name: string
  description: string
  badge_type: string
  icon_name: string
  icon_url: string
  icon?: string
  color: string
  rarity: string
  xp_reward: number
  criteria: any
  criteria_type?: string
  criteria_value?: string
  category?: string
  is_active: boolean
  display_order: number
}

export interface AcademyStats {
  totalCourses: number
  publishedCourses: number
  totalEnrollments: number
  totalLessons: number
  totalQuizzes: number
  totalBadges: number
  averageRating: number
  completionRate: number
}

export const CATEGORIES = [
  { value: "praxismanagement", label: "Praxismanagement" },
  { value: "kommunikation", label: "Kommunikation" },
  { value: "digitalisierung", label: "Digitalisierung" },
  { value: "teamfuehrung", label: "Teamführung" },
  { value: "qualitaetsmanagement", label: "Qualitätsmanagement" },
  { value: "abrechnung", label: "Abrechnung" },
  { value: "patientenbetreuung", label: "Patientenbetreuung" },
  { value: "hygiene", label: "Hygiene" },
  { value: "marketing", label: "Marketing" },
  { value: "rechtliches", label: "Rechtliches" },
]

export const DIFFICULTY_LEVELS = [
  { value: "beginner", label: "Einsteiger", color: "bg-green-500" },
  { value: "intermediate", label: "Fortgeschritten", color: "bg-yellow-500" },
  { value: "advanced", label: "Experte", color: "bg-red-500" },
]

export const CRITERIA_TYPES = [
  { value: "", label: "Keine (manuell)", description: "Badge wird manuell durch einen Admin vergeben, kein automatischer Auslöser." },
  { value: "welcome_tour", label: "Welcome Tour abgeschlossen", description: "Wird automatisch vergeben, wenn ein Benutzer die Einführungstour beim ersten Login abschließt." },
  { value: "profile_complete", label: "Profil vollständig ausgefüllt", description: "Ausgelöst, wenn alle Pflichtfelder im Benutzerprofil (Name, Rolle, Kontakt, Avatar) ausgefüllt sind." },
  { value: "first_login", label: "Erster Login", description: "Wird beim allerersten erfolgreichen Login eines neuen Benutzers vergeben." },
  { value: "course_complete", label: "Kurs abgeschlossen", description: "Ausgelöst, wenn ein bestimmter Kurs vollständig abgeschlossen wurde. Kurs-ID im Wert-Feld angeben." },
  { value: "courses_completed", label: "Anzahl Kurse abgeschlossen", description: "Wird vergeben, wenn der Benutzer eine bestimmte Anzahl an Kursen abgeschlossen hat (z.B. 3, 5, 10)." },
  { value: "streak_days", label: "Tage-Streak erreicht", description: "Ausgelöst bei einer ununterbrochenen Login-Serie über die angegebene Anzahl an Tagen." },
  { value: "first_ticket", label: "Erstes Ticket erstellt", description: "Wird vergeben, wenn der Benutzer sein erstes Support-Ticket im Ticketsystem erstellt." },
  { value: "first_protocol", label: "Erstes Protokoll erstellt", description: "Ausgelöst, wenn der Benutzer sein erstes Protokoll (z.B. Teambesprechung, QM) anlegt." },
  { value: "first_document", label: "Erstes Dokument hochgeladen", description: "Wird vergeben, wenn der Benutzer zum ersten Mal ein Dokument in die Dokumentenverwaltung hochlädt." },
  { value: "first_survey", label: "Erste Umfrage beantwortet", description: "Ausgelöst, wenn der Benutzer zum ersten Mal an einer Praxis-Umfrage teilnimmt." },
  { value: "first_cirs", label: "Ersten CIRS-Fall gemeldet", description: "Wird vergeben, wenn der Benutzer seinen ersten CIRS-Vorfall (Critical Incident Reporting) meldet." },
  { value: "self_check_complete", label: "Selbst-Check abgeschlossen", description: "Ausgelöst, wenn der Benutzer eine Selbstbewertung oder einen Kompetenz-Check vollständig durchführt." },
  { value: "team_lead", label: "Teamleiter-Rolle zugewiesen", description: "Wird automatisch vergeben, sobald einem Benutzer die Teamleiter-Rolle zugewiesen wird." },
  { value: "zeiterfassung_week", label: "1 Woche Zeiterfassung", description: "Ausgelöst, wenn der Benutzer eine vollständige Arbeitswoche (5 Tage) in der Zeiterfassung protokolliert hat." },
  { value: "goals_achieved", label: "Anzahl Ziele erreicht", description: "Wird vergeben, wenn der Benutzer eine bestimmte Anzahl an persönlichen oder Praxis-Zielen erreicht hat." },
  { value: "quiz_perfect", label: "Quiz mit 100% bestanden", description: "Ausgelöst, wenn ein Quiz mit voller Punktzahl (100%) beim ersten Versuch bestanden wird." },
  { value: "manual", label: "Manuell vergeben", description: "Badge wird ausschließlich manuell durch einen Admin vergeben, z.B. für besondere Leistungen." },
]

export const BADGE_TYPES = [
  { value: "achievement", label: "Achievement", icon: Trophy },
  { value: "milestone", label: "Meilenstein", icon: Target },
  { value: "streak", label: "Streak", icon: Flame },
  { value: "skill", label: "Skill", icon: Zap },
  { value: "completion", label: "Abschluss", icon: CheckCircle },
  { value: "special", label: "Spezial", icon: Crown },
]

export const BADGE_RARITIES = [
  { value: "common", label: "Gewöhnlich", color: "text-gray-500" },
  { value: "uncommon", label: "Ungewöhnlich", color: "text-green-500" },
  { value: "rare", label: "Selten", color: "text-blue-500" },
  { value: "epic", label: "Episch", color: "text-purple-500" },
  { value: "legendary", label: "Legendär", color: "text-amber-500" },
]

export const BADGE_ICONS = [
  { value: "trophy", label: "Pokal", icon: Trophy },
  { value: "award", label: "Auszeichnung", icon: Award },
  { value: "medal", label: "Medaille", icon: Medal },
  { value: "star", icon: Star },
  { value: "crown", icon: Crown },
  { value: "flame", icon: Flame },
  { value: "zap", icon: Zap },
  { value: "target", icon: Target },
  { value: "heart", icon: Heart },
  { value: "sparkles", icon: Sparkles },
]

export const VISIBILITY_OPTIONS = [
  { value: "public", label: "Öffentlich", description: "Für alle Besucher sichtbar", icon: Globe },
  { value: "logged_in", label: "Angemeldete Nutzer", description: "Nur für eingeloggte Benutzer", icon: Users },
  { value: "premium", label: "Premium", description: "Nur für zahlende Abonnenten", icon: Crown },
]

export const TARGET_AUDIENCE_OPTIONS = [
  { value: "all", label: "Alle" },
  { value: "admin", label: "Administratoren" },
  { value: "manager", label: "Praxismanager" },
  { value: "employee", label: "Mitarbeiter" },
  { value: "external", label: "Externe Benutzer" },
]

export function getDifficultyBadge(level: string) {
  return DIFFICULTY_LEVELS.find((d) => d.value === level) || { value: level, label: level, color: "bg-gray-500" }
}

export function getBadgeIcon(iconName: string) {
  const iconConfig = BADGE_ICONS.find((i) => i.value === iconName)
  return iconConfig?.icon || Trophy
}
