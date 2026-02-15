/**
 * Role Constants
 * 
 * Centralized role definitions to prevent mismatches across the codebase.
 * Always use these constants instead of hardcoded strings.
 */

export const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  PRACTICE_ADMIN: "practice_admin",
  USER: "user",
} as const

export type UserRole = (typeof ROLES)[keyof typeof ROLES]

/**
 * Role display names in German
 */
export const ROLE_LABELS: Record<UserRole, string> = {
  [ROLES.SUPER_ADMIN]: "Super Administrator",
  [ROLES.ADMIN]: "Administrator",
  [ROLES.PRACTICE_ADMIN]: "Praxis Administrator",
  [ROLES.USER]: "Benutzer",
}

/**
 * Role hierarchy - higher number = more permissions
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [ROLES.SUPER_ADMIN]: 4,
  [ROLES.ADMIN]: 3,
  [ROLES.PRACTICE_ADMIN]: 2,
  [ROLES.USER]: 1,
}

/**
 * Check if a role has at least the permission level of another role
 */
export function hasRolePermission(userRole: string, requiredRole: UserRole): boolean {
  const userLevel = ROLE_HIERARCHY[userRole as UserRole] || 0
  const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0
  return userLevel >= requiredLevel
}
