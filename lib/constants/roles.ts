/**
 * Role Constants
 * 
 * Centralized role definitions matching actual database values.
 * The database uses: superadmin, practiceadmin, member (no underscores).
 * Always use these constants instead of hardcoded strings.
 */

export const ROLES = {
  SUPER_ADMIN: "superadmin",
  ADMIN: "admin",
  PRACTICE_ADMIN: "practiceadmin",
  MEMBER: "member",
} as const

export type UserRole = (typeof ROLES)[keyof typeof ROLES]

/**
 * Normalize a role string to match the database format (no underscores, lowercase)
 */
export function normalizeRole(role: string): string {
  return role.toLowerCase().replace(/[_\- ]/g, "")
}

/**
 * Check if a role matches a target role (handles both formats)
 */
export function isRole(role: string, target: string): boolean {
  return normalizeRole(role) === normalizeRole(target)
}

/**
 * Role display names in German
 */
export const ROLE_LABELS: Record<string, string> = {
  [ROLES.SUPER_ADMIN]: "Super Administrator",
  [ROLES.ADMIN]: "Administrator",
  [ROLES.PRACTICE_ADMIN]: "Praxis Administrator",
  [ROLES.MEMBER]: "Mitglied",
}

/**
 * Role hierarchy - higher number = more permissions
 */
export const ROLE_HIERARCHY: Record<string, number> = {
  superadmin: 4,
  super_admin: 4,
  admin: 3,
  practiceadmin: 2,
  practice_admin: 2,
  member: 1,
  user: 1,
}

/**
 * Check if a role has at least the permission level of another role
 */
export function hasRolePermission(userRole: string, requiredRole: string): boolean {
  const normalized = normalizeRole(userRole)
  const normalizedRequired = normalizeRole(requiredRole)
  const userLevel = ROLE_HIERARCHY[normalized] || ROLE_HIERARCHY[userRole] || 0
  const requiredLevel = ROLE_HIERARCHY[normalizedRequired] || ROLE_HIERARCHY[requiredRole] || 0
  return userLevel >= requiredLevel
}
