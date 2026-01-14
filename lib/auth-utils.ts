import { createClient } from "@/lib/supabase/server"
import { normalizeRoleKey, getRoleConfig, type NormalizedRoleKey } from "@/lib/roles"

export type UserRole =
  | "superadmin"
  | "super_admin"
  | "practiceadmin"
  | "practice_admin"
  | "admin"
  | "manager"
  | "member"
  | "viewer"
  | "extern"

export interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
  practiceId: string | null
  isActive: boolean
  avatar?: string
  preferred_language?: string
}

/**
 * Normalize role string to standard format
 * Always returns normalized role or null
 */
export function normalizeRole(role: string | null | undefined): UserRole | null {
  return normalizeRoleKey(role) as UserRole | null
}

/**
 * Check if a role is a super admin role
 * Handles both "superadmin" and "super_admin" variants
 */
export function isSuperAdminRole(role: string | null | undefined): boolean {
  if (!role) {
    return false
  }

  const normalized = normalizeRoleKey(role)
  return normalized === "superadmin"
}

/**
 * Check if a role is a practice admin role (or higher)
 * Handles both "practiceadmin" and "practice_admin" variants
 */
export function isPracticeAdminRole(role: string | null | undefined): boolean {
  const normalized = normalizeRoleKey(role)
  return normalized === "practiceadmin" || normalized === "admin" || isSuperAdminRole(role)
}

/**
 * Check if a role is a manager role (or higher)
 */
export function isManagerRole(role: string | null | undefined): boolean {
  const normalized = normalizeRoleKey(role)
  return normalized === "manager" || isPracticeAdminRole(role)
}

/**
 * Check if a role is a member role (or higher)
 */
export function isMemberRole(role: string | null | undefined): boolean {
  const normalized = normalizeRoleKey(role)
  return normalized === "member" || isManagerRole(role)
}

/**
 * Check if a role is a viewer role (or higher)
 */
export function isViewerRole(role: string | null | undefined): boolean {
  const normalized = normalizeRoleKey(role)
  return normalized === "viewer" || isMemberRole(role)
}

/**
 * Check if a role is an external role
 */
export function isExternRole(role: string | null | undefined): boolean {
  const normalized = normalizeRoleKey(role)
  return normalized === "extern"
}

/**
 * Check if a role has at least the specified minimum role level
 */
export function hasMinimumRole(userRole: string | null | undefined, minimumRole: NormalizedRoleKey): boolean {
  const userConfig = getRoleConfig(userRole)
  const minConfig = getRoleConfig(minimumRole)

  if (!userConfig || !minConfig) return false
  return userConfig.hierarchy >= minConfig.hierarchy
}

/**
 * Get the current authenticated user with role information
 * Throws an error if not authenticated
 */
export async function requireAuth(): Promise<AuthUser> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("Nicht authentifiziert")
  }

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id, email, name, role, practice_id, is_active, avatar, preferred_language")
    .eq("id", user.id)
    .single()

  if (userError || !userData) {
    throw new Error("Benutzerdaten nicht gefunden")
  }

  return {
    id: userData.id,
    email: userData.email,
    name: userData.name,
    role: normalizeRole(userData.role) as UserRole,
    practiceId: userData.practice_id,
    isActive: userData.is_active ?? true,
    avatar: userData.avatar,
    preferred_language: userData.preferred_language,
  }
}

/**
 * Get the current user or return null if not authenticated
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    return await requireAuth()
  } catch {
    return null
  }
}

/**
 * Require super admin role
 */
export async function requireSuperAdmin(): Promise<AuthUser> {
  const user = await requireAuth()

  if (!isSuperAdminRole(user.role)) {
    throw new Error("Keine Berechtigung - Super Admin erforderlich")
  }

  return user
}

/**
 * Require practice admin role
 */
export async function requirePracticeAdmin(practiceId?: string): Promise<AuthUser> {
  const user = await requireAuth()

  if (!isPracticeAdminRole(user.role)) {
    throw new Error("Keine Berechtigung - Praxis Admin erforderlich")
  }

  if (practiceId && user.practiceId !== practiceId && !isSuperAdminRole(user.role)) {
    throw new Error("Keine Berechtigung für diese Praxis")
  }

  return user
}

/**
 * Require manager role
 */
export async function requireManager(practiceId?: string): Promise<AuthUser> {
  const user = await requireAuth()

  if (!isManagerRole(user.role)) {
    throw new Error("Keine Berechtigung - Manager erforderlich")
  }

  if (practiceId && user.practiceId !== practiceId && !isSuperAdminRole(user.role)) {
    throw new Error("Keine Berechtigung für diese Praxis")
  }

  return user
}

/**
 * Require member role (standard access)
 */
export async function requireMember(practiceId?: string): Promise<AuthUser> {
  const user = await requireAuth()

  if (!isMemberRole(user.role)) {
    throw new Error("Keine Berechtigung - Mitglied erforderlich")
  }

  if (practiceId && user.practiceId !== practiceId && !isSuperAdminRole(user.role)) {
    throw new Error("Keine Berechtigung für diese Praxis")
  }

  return user
}

/**
 * Check if user has access to a specific practice
 */
export async function hasAccessToPractice(practiceId: string): Promise<boolean> {
  const user = await getAuthUser()

  if (!user) return false
  if (isSuperAdminRole(user.role)) return true

  return user.practiceId === practiceId
}

// Legacy export for backwards compatibility
export function isPowerUserRole(role: string | null | undefined): boolean {
  return isManagerRole(role)
}
