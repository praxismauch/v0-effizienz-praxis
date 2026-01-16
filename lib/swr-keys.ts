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
  userProfile: (userId: string) => `/api/users/${userId}`,

  // Practice - hardcoded to 1
  practices: () => "/api/practices",
  practice: (id = DEFAULT_PRACTICE_ID) => `/api/practices/${id}`,
  practiceSettings: (id = DEFAULT_PRACTICE_ID) => `/api/practices/${id}/settings`,

  // Teams - hardcoded to practice 1
  teams: (practiceId = DEFAULT_PRACTICE_ID) => `/api/practices/${practiceId}/teams`,
  teamMembers: (practiceId = DEFAULT_PRACTICE_ID) => `/api/practices/${practiceId}/team-members`,
  teamMember: (practiceId = DEFAULT_PRACTICE_ID, memberId: string) =>
    `/api/practices/${practiceId}/team-members/${memberId}`,

  workflows: (practiceId = DEFAULT_PRACTICE_ID) => `/api/practices/${practiceId}/workflows`,
  workflow: (practiceId = DEFAULT_PRACTICE_ID, workflowId: string) =>
    `/api/practices/${practiceId}/workflows/${workflowId}`,
  workflowTemplates: () => "/api/workflow-templates",
  orgaCategories: (practiceId = DEFAULT_PRACTICE_ID) => `/api/practices/${practiceId}/orga-categories`,

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
  todo: (practiceId = DEFAULT_PRACTICE_ID, todoId: string) => `/api/practices/${practiceId}/todos/${todoId}`,

  // Calendar
  calendarEvents: (practiceId = DEFAULT_PRACTICE_ID) => `/api/practices/${practiceId}/calendar-events`,
  calendarEvent: (practiceId = DEFAULT_PRACTICE_ID, eventId: string) =>
    `/api/practices/${practiceId}/calendar-events/${eventId}`,

  // Dashboard
  dashboardStats: (practiceId = DEFAULT_PRACTICE_ID) => `/api/practices/${practiceId}/dashboard/stats`,

  // Super Admin
  superAdminStats: () => "/api/super-admin/dashboard-stats",
  superAdminPractices: () => "/api/super-admin/practices",
  superAdminUsers: () => "/api/super-admin/users",
  superAdminTeams: () => "/api/super-admin/teams",

  goals: (practiceId = DEFAULT_PRACTICE_ID) => `/api/practices/${practiceId}/goals`,
  goal: (practiceId = DEFAULT_PRACTICE_ID, goalId: string) => `/api/practices/${practiceId}/goals/${goalId}`,

  // Appraisals keys for Mitarbeitergespräche
  appraisals: (practiceId = DEFAULT_PRACTICE_ID) => `/api/practices/${practiceId}/appraisals`,
  appraisal: (practiceId = DEFAULT_PRACTICE_ID, appraisalId: string) =>
    `/api/practices/${practiceId}/appraisals/${appraisalId}`,

  // Parameters and orga-categories keys for form dialogs
  parameters: (practiceId = DEFAULT_PRACTICE_ID) => `/api/practices/${practiceId}/parameters`,
  parameterValues: (practiceId = DEFAULT_PRACTICE_ID, parameterId: string) =>
    `/api/practices/${practiceId}/parameter-values?parameterId=${parameterId}&limit=1`,
  goalAssignments: (practiceId = DEFAULT_PRACTICE_ID, goalId: string) =>
    `/api/practices/${practiceId}/goals/${goalId}/assignments`,

  // Hiring Module
  hiringCounts: (practiceId: string) => `/api/hiring/counts?practiceId=${practiceId}`,
  candidates: (
    practiceId: string,
    params?: { search?: string; jobPostingId?: string; status?: string; excludeArchived?: boolean },
  ) => {
    const url = new URL(`/api/hiring/candidates`, "http://localhost")
    url.searchParams.set("practiceId", practiceId)
    if (params?.search) url.searchParams.set("search", params.search)
    if (params?.jobPostingId && params.jobPostingId !== "all") url.searchParams.set("jobPostingId", params.jobPostingId)
    if (params?.status) url.searchParams.set("status", params.status)
    if (params?.excludeArchived) url.searchParams.set("excludeArchived", "true")
    return url.pathname + url.search
  },
  candidate: (candidateId: string) => `/api/hiring/candidates/${candidateId}`,
  jobPostings: (practiceId: string) => `/api/hiring/job-postings?practiceId=${practiceId}`,
  jobPosting: (jobPostingId: string) => `/api/hiring/job-postings/${jobPostingId}`,
  applications: (practiceId: string, jobPostingId?: string) =>
    jobPostingId
      ? `/api/hiring/applications?practiceId=${practiceId}&jobPostingId=${jobPostingId}`
      : `/api/hiring/applications?practiceId=${practiceId}`,
  pipelineStages: (practiceId: string, jobPostingId?: string) =>
    jobPostingId
      ? `/api/hiring/pipeline-stages?practiceId=${practiceId}&jobPostingId=${jobPostingId}`
      : `/api/hiring/pipeline-stages?practiceId=${practiceId}`,
  questionnaires: (practiceId: string) => `/api/hiring/questionnaires?practiceId=${practiceId}`,
  questionnaire: (questionnaireId: string) => `/api/hiring/questionnaires/${questionnaireId}`,

  // Analytics
  analyticsData: (practiceId = DEFAULT_PRACTICE_ID) => `/api/analytics/data?practiceId=${practiceId}`,
  systemMetrics: (days: string) => `/api/super-admin/analytics/system-metrics?days=${days}`,
  featureUsage: (days: string) => `/api/super-admin/analytics/feature-usage?days=${days}`,
  practiceGrowth: (days: string) => `/api/super-admin/analytics/practice-growth?days=${days}`,
  subscriptionStats: () => `/api/super-admin/analytics/subscriptions`,
  chartData: (practiceId: string, parameterIds: string[]) =>
    `/api/practices/${practiceId}/parameters?parameterIds=${parameterIds.join(",")}`,
} as const

// Helper to invalidate all keys for a practice
export function getPracticeKeys(practiceId = DEFAULT_PRACTICE_ID) {
  return [
    SWR_KEYS.practice(practiceId),
    SWR_KEYS.teams(practiceId),
    SWR_KEYS.teamMembers(practiceId),
    SWR_KEYS.workflows(practiceId),
    SWR_KEYS.orgaCategories(practiceId),
    SWR_KEYS.academyCourses(practiceId),
    SWR_KEYS.academyModules(practiceId),
    SWR_KEYS.academyLessons(practiceId),
    SWR_KEYS.academyBadges(practiceId),
    SWR_KEYS.academyStats(practiceId),
    SWR_KEYS.todos(practiceId),
    SWR_KEYS.calendarEvents(practiceId),
    SWR_KEYS.dashboardStats(practiceId),
    SWR_KEYS.goals(practiceId),
    SWR_KEYS.appraisals(practiceId),
    SWR_KEYS.parameters(practiceId),
    SWR_KEYS.candidates(practiceId),
    SWR_KEYS.jobPostings(practiceId),
    SWR_KEYS.applications(practiceId),
    SWR_KEYS.pipelineStages(practiceId),
    SWR_KEYS.questionnaires(practiceId),
    SWR_KEYS.analyticsData(practiceId),
  ]
}
