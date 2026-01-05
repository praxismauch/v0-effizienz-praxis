// Default order for team member roles
// Index 0 = highest priority (shown first)
export const DEFAULT_ROLE_ORDER: string[] = [
  "Arzt",
  "MFA",
  "Auszubildende-MFA",
  "Weiterbildungsassistent",
  "Verwaltung",
  "Extern",
]

// Role name variations mapping to canonical names for sorting
export const ROLE_ALIASES: Record<string, string> = {
  // Arzt variations
  arzt: "Arzt",
  doctor: "Arzt",
  ärztin: "Arzt",
  facharzt: "Arzt",
  fachärztin: "Arzt",
  oberarzt: "Arzt",
  chefarzt: "Arzt",
  assistenzarzt: "Arzt",
  weiterbildungsassistent: "Weiterbildungsassistent",

  // MFA variations
  mfa: "MFA",
  "medizinische fachangestellte": "MFA",
  arzthelferin: "MFA",
  praxisassistentin: "MFA",

  // Azubi variations
  "auszubildende-mfa": "Auszubildende-MFA",
  azubi: "Auszubildende-MFA",
  auszubildende: "Auszubildende-MFA",
  "azubi-mfa": "Auszubildende-MFA",
  auszubildender: "Auszubildende-MFA",

  // Verwaltung variations
  verwaltung: "Verwaltung",
  administration: "Verwaltung",
  büro: "Verwaltung",
  empfang: "Verwaltung",
  rezeption: "Verwaltung",
  praxismanager: "Verwaltung",
  praxismanagerin: "Verwaltung",

  // Extern variations
  extern: "Extern",
  external: "Extern",
  gast: "Extern",
  externer: "Extern",
  externe: "Extern",
}

/**
 * Get the canonical role name for sorting purposes
 */
export function getCanonicalRole(role: string | null | undefined): string {
  if (!role) return "Extern"

  const normalizedRole = role.toLowerCase().trim()

  // Check for exact alias match
  if (ROLE_ALIASES[normalizedRole]) {
    return ROLE_ALIASES[normalizedRole]
  }

  // Check for partial matches
  for (const [alias, canonical] of Object.entries(ROLE_ALIASES)) {
    if (normalizedRole.includes(alias) || alias.includes(normalizedRole)) {
      return canonical
    }
  }

  // Return original role if no match found
  return role
}

/**
 * Get the sort index for a role based on custom or default order
 */
export function getRoleSortIndex(role: string | null | undefined, customOrder?: string[]): number {
  const canonicalRole = getCanonicalRole(role)
  const orderList = customOrder && customOrder.length > 0 ? customOrder : DEFAULT_ROLE_ORDER

  const index = orderList.findIndex((r) => r.toLowerCase() === canonicalRole.toLowerCase())

  // Return a high number for unknown roles so they appear at the end
  return index >= 0 ? index : 999
}

/**
 * Sort team members by role order
 */
export function sortTeamMembersByRole<T extends { role?: string | null }>(members: T[], customOrder?: string[]): T[] {
  return [...members].sort((a, b) => {
    const indexA = getRoleSortIndex(a.role, customOrder)
    const indexB = getRoleSortIndex(b.role, customOrder)
    return indexA - indexB
  })
}
