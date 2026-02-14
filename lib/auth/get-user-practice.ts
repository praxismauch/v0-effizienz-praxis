/**
 * Server-side helper to get the authenticated user's practice_id
 * Use this in API routes instead of hardcoded fallbacks
 */

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function getUserPracticeId(): Promise<string | null> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return null
    }

    // Get user's practice_id from the users table
    const adminClient = await createAdminClient()
    const { data: userData, error } = await adminClient
      .from("users")
      .select("practice_id")
      .eq("id", user.id)
      .single()

    if (error || !userData?.practice_id) {
      return null
    }

    return userData.practice_id
  } catch (error) {
    console.error("[getUserPracticeId] Error:", error)
    return null
  }
}

/**
 * Get practice_id with fallback to URL param (for compatibility during migration)
 * Validates that URL param matches user's actual practice_id
 */
export async function getValidatedPracticeId(urlPracticeId: string): Promise<string | null> {
  const userPracticeId = await getUserPracticeId()

  // If user not authenticated or no practice assigned, reject
  if (!userPracticeId) {
    return null
  }

  // If URL param is "0" or missing, use user's practice
  if (!urlPracticeId || urlPracticeId === "0" || urlPracticeId === "undefined") {
    return userPracticeId
  }

  // Validate URL param matches user's practice (prevent cross-practice access)
  if (urlPracticeId !== userPracticeId) {
    console.warn(`[getValidatedPracticeId] Practice mismatch: URL=${urlPracticeId}, User=${userPracticeId}`)
    return null
  }

  return userPracticeId
}
