import { createServerClient } from "@/lib/supabase/server"
import type { User } from "@/contexts/user-context"

/**
 * Server-side helper to get the currently authenticated user profile.
 *
 * IMPORTANT: This function uses cookies() via createServerClient() and MUST only be called:
 * - At the top level of Server Components, Server Actions, or Route Handlers
 * - Never inside timers (setTimeout/setInterval) or unawaited Promises
 * - Only in contexts where Next.js allows dynamic rendering (not in static pages)
 *
 * Violating these rules will cause DynamicServerError at build time.
 */
export async function getCurrentUserProfile(): Promise<User | null> {
  try {
    const supabase = await createServerClient()

    // Get the authenticated user from Supabase Auth
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return null
    }

    // Fetch the user profile from public.users table
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .single()

    if (profileError || !userProfile) {
      console.warn("[get-current-user] User exists in auth but not in users table:", authUser.id)
      return null
    }

    // Map database fields to User type
    return {
      id: userProfile.id,
      email: userProfile.email,
      name: userProfile.name || authUser.email?.split("@")[0] || "User",
      role: userProfile.role,
      practiceId: userProfile.practice_id,
      practice_id: userProfile.practice_id,
      isActive: userProfile.is_active ?? true,
      joinedAt: userProfile.created_at,
      preferred_language: userProfile.preferred_language || "de",
      firstName: userProfile.first_name,
    }
  } catch (error) {
    console.error("[get-current-user] Error fetching current user:", error)
    return null
  }
}
