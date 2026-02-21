import { NextResponse } from "next/server"
import { createServerClient as supabaseCreateServerClient } from "@supabase/ssr"
import { getSupabaseUrl, getSupabaseAnonKey, hasSupabaseConfig } from "@/lib/supabase/config"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Create a REAL Supabase client without the dev-user fallback.
 * This is used exclusively by the auth guards below to ensure
 * actual authentication is enforced.
 */
async function createStrictAuthClient() {
  const { cookies } = await import("next/headers")
  const cookieStore = await cookies()

  if (!hasSupabaseConfig()) {
    return null
  }

  return supabaseCreateServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // Read-only in Server Components
        }
      },
    },
  })
}

interface AuthResult {
  user: { id: string; email?: string }
}

interface AuthError {
  response: NextResponse
}

/**
 * Require a valid authenticated user session.
 * Returns the user object or a 401 response.
 *
 * Usage:
 *   const auth = await requireAuth()
 *   if ("response" in auth) return auth.response
 *   const { user } = auth
 */
export async function requireAuth(): Promise<AuthResult | AuthError> {
  const supabase = await createStrictAuthClient()

  if (!supabase) {
    return {
      response: NextResponse.json(
        { error: "Service not configured" },
        { status: 503 }
      ),
    }
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return {
      response: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      ),
    }
  }

  return { user: { id: user.id, email: user.email ?? undefined } }
}

/**
 * Require a valid authenticated user who is also a super admin.
 * Returns the user object or a 401/403 response.
 *
 * Usage:
 *   const auth = await requireSuperAdmin()
 *   if ("response" in auth) return auth.response
 *   const { user } = auth
 */
export async function requireSuperAdmin(): Promise<AuthResult | AuthError> {
  const auth = await requireAuth()
  if ("response" in auth) return auth

  const adminClient = createAdminClient()
  const { data: profile } = await adminClient
    .from("users")
    .select("role")
    .eq("id", auth.user.id)
    .single()

  if (!profile || profile.role !== "superadmin") {
    return {
      response: NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      ),
    }
  }

  return auth
}
