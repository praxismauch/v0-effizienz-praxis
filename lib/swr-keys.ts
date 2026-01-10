/**
 * Centralized SWR cache keys for consistent cache management
 * All keys are functions that take parameters to allow for proper cache invalidation
 */

// Hardcoded practice ID for now
export const DEFAULT_PRACTICE_ID = "1"

// User-related keys
export const SWR_KEYS = {
  // User
  currentUser: () => "/api/user/me",
  userPreferences: () => "/api/user/preferences",

  // Practice - hardcoded to 1
  practice: (id = DEFAULT_PRACTICE_ID) => `/api/practices/${id}`,
  practiceSettings: (id = DEFAULT_PRACTICE_ID) => `/api/practices/${id}/settings`,

  // Teams - hardcoded to practice 1
  teams: (practiceId = DEFAULT_PRACTICE_ID) => `/api/practices/${practiceId}/teams`,
  teamMembers: (practiceId = DEFAULT_PRACTICE_ID) => `/api/practices/${practiceId}/team-members`,
  teamMember: (practiceId = DEFAULT_PRACTICE_ID, memberId: string) =>
    `/api/practices/${practiceId}/team-members/${memberId}`,

  // Academy - hardcoded to practice 1
  academyCourses: (practiceId = DEFAULT_PRACTICE_ID) => `/api/practices/${practiceId}/academy/courses`,
  academyCourse: (practiceId = DEFAULT_PRACTICE_ID, courseId: string) =>
    `/api/practices/${practiceId}/academy/courses/${courseId}`,
  academyModules: (practiceId = DEFAULT_PRACTICE_ID, courseId?: string) =>
    courseId
      ? `/api/practices/${practiceId}/academy/modules?course_id=${courseId}`
      : `/api/practices/${practiceId}/academy/modules`,
  academyLessons: (practiceId = DEFAULT_PRACTICE_ID, moduleId?: string) =>
    moduleId
      ? `/api/practices/${practiceId}/academy/lessons?module_id=${moduleId}`
      : `/api/practices/${practiceId}/academy/lessons`,
  academyQuizzes: (practiceId = DEFAULT_PRACTICE_ID, courseId?: string) =>
    courseId
      ? `/api/practices/${practiceId}/academy/quizzes?course_id=${courseId}`
      : `/api/practices/${practiceId}/academy/quizzes`,
  academyBadges: (practiceId = DEFAULT_PRACTICE_ID) => `/api/practices/${practiceId}/academy/badges`,
  academyStats: (practiceId = DEFAULT_PRACTICE_ID) => `/api/practices/${practiceId}/academy/stats`,
  academyLeaderboard: (practiceId = DEFAULT_PRACTICE_ID) => `/api/practices/${practiceId}/academy/leaderboard`,
  academyEnrollments: (practiceId = DEFAULT_PRACTICE_ID) => `/api/practices/${practiceId}/academy/enrollments`,

  // Todos
  todos: (practiceId = DEFAULT_PRACTICE_ID) => `/api/practices/${practiceId}/todos`,

  // Calendar
  calendarEvents: (practiceId = DEFAULT_PRACTICE_ID) => `/api/practices/${practiceId}/calendar`,

  // Dashboard
  dashboardStats: (practiceId = DEFAULT_PRACTICE_ID) => `/api/practices/${practiceId}/dashboard/stats`,

  // Super Admin
  superAdminStats: () => "/api/super-admin/dashboard-stats",
  superAdminPractices: () => "/api/super-admin/practices",
  superAdminUsers: () => "/api/super-admin/users",
  superAdminTeams: () => "/api/super-admin/teams",
} as const

// Helper to invalidate all keys for a practice
export function getPracticeKeys(practiceId = DEFAULT_PRACTICE_ID) {
  return [
    SWR_KEYS.practice(practiceId),
    SWR_KEYS.teams(practiceId),
    SWR_KEYS.teamMembers(practiceId),
    SWR_KEYS.academyCourses(practiceId),
    SWR_KEYS.academyModules(practiceId),
    SWR_KEYS.academyLessons(practiceId),
    SWR_KEYS.academyBadges(practiceId),
    SWR_KEYS.academyStats(practiceId),
    SWR_KEYS.todos(practiceId),
    SWR_KEYS.calendarEvents(practiceId),
    SWR_KEYS.dashboardStats(practiceId),
  ]
}
