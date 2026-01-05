/**
 * Helper function to filter active team members
 * Handles different status formats: "active", "aktiv", null, undefined
 */
export function isActiveMember(member: {
  status?: string | null
  isActive?: boolean | null
  is_active?: boolean | null
}): boolean {
  // Check isActive/is_active boolean fields
  if (member.isActive === false || member.is_active === false) {
    return false
  }

  // Check string status field
  if (member.status) {
    const status = member.status.toLowerCase()
    // Inactive statuses
    if (status === "inactive" || status === "inaktiv" || status === "disabled" || status === "deaktiviert") {
      return false
    }
  }

  // Default: include members with no status, "active", "aktiv", or any other status
  return true
}

/**
 * Filter team members to only include active ones
 */
export function filterActiveMembers<
  T extends { status?: string | null; isActive?: boolean | null; is_active?: boolean | null },
>(members: T[]): T[] {
  return members.filter(isActiveMember)
}
