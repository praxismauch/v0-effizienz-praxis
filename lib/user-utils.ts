/**
 * User Utility Functions
 * 
 * Shared utilities for user profile mapping and route checking.
 */

import { normalizeRole } from "@/lib/auth-utils"

/**
 * User interface - shared across contexts and components
 */
export interface User {
  id: string
  name: string
  email: string
  role: "superadmin" | "admin" | "doctor" | "nurse" | "receptionist"
  avatar?: string
  practiceId: string | null
  isActive: boolean
  joinedAt: string
  preferred_language?: string
  practice_id?: string
  defaultPracticeId?: string | null
  firstName?: string
}

/**
 * Profile data from database
 */
export interface ProfileData {
  id: string
  name?: string | null
  email?: string | null
  role?: string | null
  avatar?: string | null
  practice_id?: number | string | null
  is_active?: boolean | null
  created_at?: string | null
  preferred_language?: string | null
  first_name?: string | null
  last_name?: string | null
}

/**
 * Map profile data from database to User object
 */
export function mapProfileToUser(profile: ProfileData, fallbackEmail?: string): User {
  const name = profile.name || 
    `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || 
    "User"
  
  return {
    id: profile.id,
    name,
    email: profile.email || fallbackEmail || "",
    role: normalizeRole(profile.role) as User["role"],
    avatar: profile.avatar ?? undefined,
    practiceId: profile.practice_id?.toString() || "1",
    practice_id: profile.practice_id?.toString() || "1",
    isActive: profile.is_active ?? true,
    joinedAt: profile.created_at || new Date().toISOString(),
    preferred_language: profile.preferred_language ?? undefined,
    firstName: profile.first_name ?? undefined,
  }
}

/**
 * Public routes that don't require authentication
 */
const PUBLIC_ROUTES = [
  "/",
  "/auth/login",
  "/auth/register",
  "/auth/sign-up",
  "/auth/reset-password",
  "/auth/callback",
  "/auth/pending-approval",
  "/auth/sign-up-success",
  "/features",
  "/effizienz",
  "/about",
  "/contact",
  "/kontakt",
  "/preise",
  "/coming-soon",
  "/demo",
  "/help",
  "/careers",
  "/karriere",
  "/ueber-uns",
  "/impressum",
  "/datenschutz",
  "/agb",
  "/sicherheit",
  "/cookies",
  "/whats-new",
  "/updates",
]

const PUBLIC_ROUTE_PREFIXES = ["/features/", "/blog/", "/auth/"]

/**
 * Check if a path is a public route (no authentication required)
 */
export function isPublicRoute(path: string): boolean {
  if (PUBLIC_ROUTES.some((route) => path === route)) return true
  for (const prefix of PUBLIC_ROUTE_PREFIXES) {
    if (path.startsWith(prefix)) return true
  }
  return false
}

/**
 * Dispatch auth recovered event for components listening
 */
export function dispatchAuthRecovered(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("auth-recovered"))
  }
}
