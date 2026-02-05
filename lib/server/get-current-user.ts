import { createServerClient } from "@/lib/supabase/server"
import { mapProfileToUser, type User } from "@/lib/user-utils"
import { cache } from "react"

/**
 * Server-side utility to get the current authenticated user
 * Uses React's cache() to dedupe requests within a single render
 * 
 * Usage in Server Components:
 * ```tsx
 * import { getCurrentUser } from "@/lib/server/get-current-user"
 * 
 * export default async function Page() {
 *   const user = await getCurrentUser()
 *   if (!user) redirect("/auth/login")
 *   // Use user data...
 * }
 * ```
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  try {
    const supabase = await createServerClient()
    
    // Get authenticated user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !authUser) {
      return null
    }

    // Fetch user profile from database
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id, name, email, role, avatar, practice_id, is_active, created_at, preferred_language, first_name, last_name")
      .eq("id", authUser.id)
      .maybeSingle()

    if (profileError) {
      console.error("[Server] Error fetching user profile:", profileError)
      return null
    }

    if (!profile) {
      // User exists in auth but not in database - this shouldn't happen in normal flow
      // but could occur if profile creation failed
      console.warn("[Server] User exists in auth but has no profile:", authUser.id)
      return null
    }

    return mapProfileToUser(profile, authUser.email)
  } catch (error) {
    console.error("[Server] Error getting current user:", error)
    return null
  }
})

/**
 * Server-side utility to get user's practice ID
 * Returns null if user is not authenticated or has no practice
 */
export const getCurrentPracticeId = cache(async (): Promise<string | null> => {
  const user = await getCurrentUser()
  return user?.practiceId || user?.practice_id || null
})

/**
 * Server-side utility to check if user is admin
 */
export const isCurrentUserAdmin = cache(async (): Promise<boolean> => {
  const user = await getCurrentUser()
  if (!user) return false
  return user.role === "practice_admin" || user.role === "super_admin"
})

/**
 * Server-side utility to check if user is super admin
 */
export const isCurrentUserSuperAdmin = cache(async (): Promise<boolean> => {
  const user = await getCurrentUser()
  if (!user) return false
  return user.role === "super_admin"
})
