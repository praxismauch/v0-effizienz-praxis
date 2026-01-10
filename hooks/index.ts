/**
 * Central export for all SWR hooks
 * Usage: import { useTeams, useAcademyCourses, useCurrentUser } from "@/hooks"
 */

// User hooks
export { useCurrentUser, useUserPreferences, useAuth } from "./use-user"

// Practice hooks
export { usePractice, usePracticeSettings, usePracticeData } from "./use-practice"

// Team hooks
export { useTeams, useTeamMembers, useTeamMutations } from "./use-teams"

// Academy hooks
export {
  useAcademyCourses,
  useAcademyModules,
  useAcademyLessons,
  useAcademyBadges,
  useAcademyStats,
  useAcademyMutations,
} from "./use-academy"

// Dashboard hooks
export { useDashboardStats, useSuperAdminStats } from "./use-dashboard"

// Re-export types
export type { User, UserPreferences } from "./use-user"
export type { Practice, PracticeSettings } from "./use-practice"
export type { Team, TeamMember } from "./use-teams"
export type { Course, Module, Lesson, Badge, AcademyStats } from "./use-academy"
export type { DashboardStats } from "./use-dashboard"
