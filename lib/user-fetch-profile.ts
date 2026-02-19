import type { SupabaseClient } from "@supabase/supabase-js"
import { type User, mapProfileToUser, dispatchAuthRecovered } from "@/lib/user-utils"
import Logger from "@/lib/logger"

const USER_SELECT_FIELDS =
  "id, name, email, role, avatar, practice_id, is_active, created_at, preferred_language, first_name, last_name"

interface EnsureProfileParams {
  userId: string
  email?: string
  name?: string | null
  firstName?: string | null
  lastName?: string | null
}

/**
 * Fetches user profile from Supabase, auto-creating via API if it doesn't exist.
 * Shared between initial fetch and auth state change handler to avoid duplication.
 */
export async function fetchUserProfile(
  supabase: SupabaseClient,
  authUserId: string,
  authUserEmail?: string,
  metadata?: { name?: string; full_name?: string; first_name?: string; last_name?: string },
): Promise<User | null> {
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select(USER_SELECT_FIELDS)
    .eq("id", authUserId)
    .maybeSingle()

  if (profileError) {
    throw new Error(profileError.message || "Error fetching user profile")
  }

  if (profile) {
    return mapProfileToUser(profile, authUserEmail)
  }

  // Auto-create profile via API
  const params: EnsureProfileParams = {
    userId: authUserId,
    email: authUserEmail,
    name: metadata?.name || metadata?.full_name || null,
    firstName: metadata?.first_name || null,
    lastName: metadata?.last_name || null,
  }

  const createResponse = await fetch("/api/auth/ensure-profile", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  })

  if (!createResponse.ok) {
    const errorData = await createResponse.json().catch(() => ({ error: "Unknown error" }))
    throw new Error(`Failed to create user profile: ${errorData.error || createResponse.statusText}`)
  }

  const responseData = await createResponse.json()
  const createdProfile = responseData.user
  if (!createdProfile) {
    throw new Error("Profile creation returned no data")
  }

  return mapProfileToUser(createdProfile, authUserEmail)
}

/**
 * Handles successful profile fetch - dispatches auth event.
 */
export function onProfileFetched(): void {
  dispatchAuthRecovered()
}

/**
 * Fetches super admin users from API.
 */
export async function fetchSuperAdminUsers(): Promise<User[]> {
  try {
    const response = await fetch("/api/super-admin/users", {
      credentials: "include",
    })

    if (response.ok) {
      const data = await response.json()
      if (data.users) {
        const { isSuperAdminRole } = await import("@/lib/auth-utils")
        return data.users
          .filter((u: Record<string, unknown>) => isSuperAdminRole(u.role as string))
          .map((u: Record<string, unknown>) => mapProfileToUser(u))
      }
    }
  } catch (error) {
    Logger.error("context", "Error fetching super admins", error)
  }
  return []
}
