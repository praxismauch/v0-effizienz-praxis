"use client"

import { useMemo } from "react"
import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"
import { useAuth } from "@/contexts/auth-context"

export interface PracticeIdResult {
  // The resolved practice ID - guaranteed to be valid if isReady is true
  practiceId: string | null

  // Whether the practice ID is ready to use (not loading and has a valid ID)
  isReady: boolean

  // Loading state
  isLoading: boolean

  // Error message if practice ID could not be resolved
  error: string | null

  // User type information
  isSuperAdmin: boolean

  // The source of the practice ID for debugging
  source: "currentPractice" | "user.practice_id" | "user.practiceId" | "authUser" | "none"

  // Current user info
  userId: string | null

  // Helper to get practice ID with fallback
  getOrFallback: (fallback: string) => string
}

/**
 * Universal hook to get a valid practice ID across all user types.
 *
 * Resolution order:
 * 1. currentPractice.id from PracticeContext (best for super admins who switch practices)
 * 2. currentUser.practice_id from UserContext
 * 3. currentUser.practiceId from UserContext (legacy field)
 * 4. Returns null with error if none available
 *
 * Usage:
 * ```tsx
 * const { practiceId, isReady, isLoading, error, isSuperAdmin } = usePracticeId()
 *
 * if (isLoading) return <Loading />
 * if (error) return <Error message={error} />
 * if (!isReady) return <NoPractice />
 *
 * // Safe to use practiceId here
 * fetch(`/api/practices/${practiceId}/...`)
 * ```
 */
export function usePracticeId(): PracticeIdResult {
  const { currentUser, isSuperAdmin, loading: userLoading } = useUser()
  const { currentPractice, isLoading: practiceLoading } = usePractice()
  const { user: authUser } = useAuth()

  return useMemo(() => {
    const isLoading = userLoading || practiceLoading

    // Try to resolve practice ID from multiple sources
    let practiceId: string | null = null
    let source: PracticeIdResult["source"] = "none"
    let error: string | null = null

    // Source 1: currentPractice from PracticeContext (best for super admins)
    if (currentPractice?.id && isValidPracticeId(currentPractice.id)) {
      practiceId = currentPractice.id
      source = "currentPractice"
    }
    // Source 2: currentUser.practice_id from UserContext
    else if (currentUser?.practice_id && isValidPracticeId(currentUser.practice_id)) {
      practiceId = currentUser.practice_id
      source = "user.practice_id"
    }
    // Source 3: currentUser.practiceId (legacy field)
    else if (currentUser?.practiceId && isValidPracticeId(currentUser.practiceId)) {
      practiceId = currentUser.practiceId
      source = "user.practiceId"
    }
    // Source 4: authUser.id as fallback for super admins (they might not have practice_id)
    else if (isSuperAdmin && authUser?.id) {
      // Super admins without a selected practice - this is OK, they need to select one
      practiceId = null
      source = "none"
      error = "Bitte wählen Sie eine Praxis aus dem Dropdown-Menü aus."
    }

    // Set error if no practice ID found and not loading
    if (!isLoading && !practiceId && !error) {
      if (!currentUser && !authUser) {
        error = "Nicht angemeldet. Bitte melden Sie sich an."
      } else if (isSuperAdmin) {
        error = "Bitte wählen Sie eine Praxis aus."
      } else {
        error = "Keine Praxis zugeordnet. Bitte kontaktieren Sie Ihren Administrator."
      }
    }

    const isReady = !isLoading && !!practiceId && isValidPracticeId(practiceId)

    return {
      practiceId,
      isReady,
      isLoading,
      error: isReady ? null : error,
      isSuperAdmin,
      source,
      userId: currentUser?.id || authUser?.id || null,
      getOrFallback: (fallback: string) => practiceId || fallback,
    }
  }, [currentUser, currentPractice, authUser, isSuperAdmin, userLoading, practiceLoading])
}

/**
 * Validates that a practice ID is valid (not null, undefined, empty, "0", "null", "undefined")
 */
export function isValidPracticeId(id: string | null | undefined): id is string {
  if (!id) return false
  if (typeof id !== "string") return false

  const trimmed = id.trim()
  if (trimmed === "") return false
  if (trimmed === "0") return false
  if (trimmed === "null") return false
  if (trimmed === "undefined") return false
  if (trimmed === "default") return false

  return true
}

/**
 * Server-side validation for practice ID in API routes
 */
export function validatePracticeIdForApi(practiceId: string | null | undefined): {
  isValid: boolean
  error?: string
  practiceId?: string
} {
  if (!practiceId) {
    return { isValid: false, error: "Practice ID is required" }
  }

  if (!isValidPracticeId(practiceId)) {
    return { isValid: false, error: `Invalid practice ID: ${practiceId}` }
  }

  return { isValid: true, practiceId }
}

/**
 * Hook to get practice ID with automatic error handling
 * Returns practiceId directly or throws if not ready
 */
export function useRequiredPracticeId(): string {
  const { practiceId, isReady, isLoading, error } = usePracticeId()

  if (isLoading) {
    throw new Error("Practice ID is still loading")
  }

  if (!isReady || !practiceId) {
    throw new Error(error || "No practice ID available")
  }

  return practiceId
}

export default usePracticeId
