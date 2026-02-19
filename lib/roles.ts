/**
 * Centralized Role Configuration
 * All 7 roles: Super Admin, Praxis Admin, Admin, Manager, Mitglied, Betrachter, Extern
 */

import { Shield, UserCheck, UserCog, Users, Eye, UserX } from "lucide-react"

// Role type definition
export type UserRoleKey =
  | "superadmin"
  | "super_admin"
  | "practiceadmin"
  | "practice_admin"
  | "admin"
  | "manager"
  | "member"
  | "viewer"
  | "extern"

// Normalized role keys (without variants)
export type NormalizedRoleKey = "superadmin" | "practiceadmin" | "admin" | "manager" | "member" | "viewer" | "extern"

// Role configuration interface
export interface RoleConfig {
  key: NormalizedRoleKey
  label: string
  labelEn: string
  description: string
  color: string
  badgeColor: string
  icon: typeof Shield
  order: number
  hierarchy: number // Higher = more permissions
}

// Centralized role configuration - THE SINGLE SOURCE OF TRUTH
export const ROLE_CONFIG: Record<NormalizedRoleKey, RoleConfig> = {
  superadmin: {
    key: "superadmin",
    label: "Super Admin",
    labelEn: "Super Admin",
    description: "Vollzugriff auf alle Systeme und Praxen",
    color: "bg-red-500",
    badgeColor: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    icon: Shield,
    order: 1,
    hierarchy: 100,
  },
  practiceadmin: {
    key: "practiceadmin",
    label: "Praxis Admin",
    labelEn: "Practice Admin",
    description: "Administrator einer Praxis mit voller Kontrolle",
    color: "bg-purple-500",
    badgeColor: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    icon: UserCheck,
    order: 2,
    hierarchy: 80,
  },
  admin: {
    key: "admin",
    label: "Admin",
    labelEn: "Admin",
    description: "Administrativer Zugriff (ähnlich wie Praxis Admin)",
    color: "bg-indigo-500",
    badgeColor: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
    icon: UserCheck,
    order: 3,
    hierarchy: 70,
  },
  manager: {
    key: "manager",
    label: "Manager",
    labelEn: "Manager",
    description: "Erweiterte Berechtigungen für Teamführung",
    color: "bg-blue-500",
    badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    icon: UserCog,
    order: 4,
    hierarchy: 60,
  },
  member: {
    key: "member",
    label: "Mitglied",
    labelEn: "Member",
    description: "Standardbenutzer mit normalen Funktionen",
    color: "bg-green-500",
    badgeColor: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    icon: Users,
    order: 5,
    hierarchy: 40,
  },
  viewer: {
    key: "viewer",
    label: "Betrachter",
    labelEn: "Viewer",
    description: "Nur-Lese-Zugriff auf freigegebene Bereiche",
    color: "bg-gray-500",
    badgeColor: "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300",
    icon: Eye,
    order: 6,
    hierarchy: 20,
  },
  extern: {
    key: "extern",
    label: "Extern",
    labelEn: "External",
    description: "Eingeschränkter externer Zugriff",
    color: "bg-orange-500",
    badgeColor: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    icon: UserX,
    order: 7,
    hierarchy: 10,
  },
}

// Available roles for dropdowns (sorted by order)
export const AVAILABLE_ROLES = Object.values(ROLE_CONFIG)
  .sort((a, b) => a.order - b.order)
  .map((role) => ({
    value: role.key,
    label: role.label,
    description: role.description,
    color: role.color,
    badgeColor: role.badgeColor,
  }))

// Medical / profession-specific role labels (not system roles but team member positions)
export const PROFESSION_LABELS: Record<string, string> = {
  doctor: "Arzt/Ärztin",
  arzt: "Arzt/Ärztin",
  nurse: "Pflegekraft",
  mfa: "MFA",
  praxisinhaber: "Praxisinhaber/in",
}

// Role aliases mapping (for backwards compatibility)
export const ROLE_ALIASES: Record<string, NormalizedRoleKey> = {
  super_admin: "superadmin",
  practice_admin: "practiceadmin",
  poweruser: "manager", // Legacy alias
  user: "member", // Legacy alias
  mitglied: "member",
  betrachter: "viewer",
}

/**
 * Normalize role string to standard format
 * Handles aliases and variants for backwards compatibility
 */
export function normalizeRoleKey(role: string | null | undefined): NormalizedRoleKey | null {
  if (!role) return null

  const lowerRole = role.toLowerCase()

  // Check if it's already a normalized role
  if (lowerRole in ROLE_CONFIG) {
    return lowerRole as NormalizedRoleKey
  }

  // Check for aliases
  if (lowerRole in ROLE_ALIASES) {
    return ROLE_ALIASES[lowerRole]
  }

  // Default to member for unknown roles
  return "member"
}

/**
 * Get role configuration for a given role key
 */
export function getRoleConfig(role: string | null | undefined): RoleConfig | null {
  const normalized = normalizeRoleKey(role)
  if (!normalized) return null
  return ROLE_CONFIG[normalized]
}

/**
 * Get role label for display
 */
export function getRoleLabel(role: string | null | undefined): string {
  if (!role) return "Unbekannt"
  // Check profession/medical labels first (case-insensitive)
  const profLabel = PROFESSION_LABELS[role.toLowerCase()]
  if (profLabel) return profLabel
  // Then check system role config
  const config = getRoleConfig(role)
  return config?.label || role
}

/**
 * Get role badge color class
 */
export function getRoleBadgeColor(role: string | null | undefined): string {
  const config = getRoleConfig(role)
  return config?.badgeColor || "bg-gray-100 text-gray-800"
}

/**
 * Check if role A has higher or equal hierarchy than role B
 */
export function hasHigherOrEqualHierarchy(roleA: string | null | undefined, roleB: string | null | undefined): boolean {
  const configA = getRoleConfig(roleA)
  const configB = getRoleConfig(roleB)

  if (!configA || !configB) return false
  return configA.hierarchy >= configB.hierarchy
}

/**
 * Check if role can perform action on another role
 * e.g., only higher hierarchy can edit lower hierarchy users
 */
export function canManageRole(actorRole: string | null | undefined, targetRole: string | null | undefined): boolean {
  const actorConfig = getRoleConfig(actorRole)
  const targetConfig = getRoleConfig(targetRole)

  if (!actorConfig || !targetConfig) return false

  // Super admin can manage everyone
  if (actorConfig.key === "superadmin") return true

  // Can only manage roles with lower hierarchy
  return actorConfig.hierarchy > targetConfig.hierarchy
}

// Permission categories
export const PERMISSION_CATEGORIES = [
  "Übersicht",
  "Team & Personal",
  "Planung & Organisation",
  "Daten & Dokumente",
  "Administration",
  "Finanzen & Abrechnung",
  "Marketing",
  "Qualitätsmanagement",
  "Praxismanagement",
  "Infrastruktur",
] as const

export type PermissionCategory = (typeof PERMISSION_CATEGORIES)[number]

// Permission action types
export type PermissionAction = "can_view" | "can_create" | "can_edit" | "can_delete"

export const PERMISSION_ACTIONS: Record<PermissionAction, { label: string; icon: string }> = {
  can_view: { label: "Ansehen", icon: "Eye" },
  can_create: { label: "Erstellen", icon: "Plus" },
  can_edit: { label: "Bearbeiten", icon: "Edit" },
  can_delete: { label: "Löschen", icon: "Trash2" },
}

// Permission interface
export interface RolePermission {
  id: string
  role: NormalizedRoleKey
  permission_key: string
  permission_category: PermissionCategory
  can_view: boolean
  can_create: boolean
  can_edit: boolean
  can_delete: boolean
  created_at?: string
  updated_at?: string
}
