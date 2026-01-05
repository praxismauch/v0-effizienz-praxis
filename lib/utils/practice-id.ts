/**
 * Utility to safely get practiceId from user or practice context
 * Ensures consistent access pattern and validation
 */

export function getPracticeId(
  currentUser: { practice_id?: string; practiceId?: string } | null,
  currentPractice: { id?: string } | null,
): string | null {
  // Priority 1: currentPractice.id (most reliable for multi-practice support)
  if (currentPractice?.id && currentPractice.id !== "0" && currentPractice.id !== "null") {
    return currentPractice.id
  }

  // Priority 2: currentUser.practice_id (database column name)
  if (currentUser?.practice_id && currentUser.practice_id !== "0" && currentUser.practice_id !== "null") {
    return currentUser.practice_id
  }

  // Priority 3: currentUser.practiceId (alternative property)
  if (currentUser?.practiceId && currentUser.practiceId !== "0" && currentUser.practiceId !== "null") {
    return currentUser.practiceId
  }

  return null
}

export function requirePracticeId(
  currentUser: { practice_id?: string; practiceId?: string } | null,
  currentPractice: { id?: string } | null,
  errorMessage = "Keine Praxis-ID verfügbar. Bitte stellen Sie sicher, dass Sie einer Praxis zugeordnet sind.",
): string {
  const practiceId = getPracticeId(currentUser, currentPractice)

  if (!practiceId) {
    throw new Error(errorMessage)
  }

  return practiceId
}
