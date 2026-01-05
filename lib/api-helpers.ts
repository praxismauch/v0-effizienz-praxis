import { type NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { isSuperAdminRole } from "@/lib/auth-utils"

export interface ApiAuthResult {
  user: {
    id: string
    email: string
    role: string
    practiceId: string | null
  }
  supabase: Awaited<ReturnType<typeof createClient>>
  isSuperAdmin: boolean
}

/**
 * Authenticate API request and return user info with Supabase client
 * Throws an error if authentication fails
 */
export async function authenticateApiRequest(useAdminClient = false): Promise<ApiAuthResult> {
  const supabase = useAdminClient ? await createAdminClient() : await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("Nicht authentifiziert")
  }

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id, email, role, practice_id")
    .eq("id", user.id)
    .single()

  if (userError || !userData) {
    throw new Error("Benutzerdaten nicht gefunden")
  }

  return {
    user: {
      id: userData.id,
      email: userData.email,
      role: userData.role,
      practiceId: userData.practice_id,
    },
    supabase,
    isSuperAdmin: isSuperAdminRole(userData.role),
  }
}

/**
 * Create error response with consistent format
 */
export function createErrorResponse(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status })
}

/**
 * Create success response with consistent format
 */
export function createSuccessResponse(data: any, status = 200) {
  return NextResponse.json(data, { status })
}

/**
 * Require super admin for API endpoint
 */
export async function requireSuperAdminApi(): Promise<ApiAuthResult> {
  const auth = await authenticateApiRequest()

  if (!auth.isSuperAdmin) {
    throw new Error("Keine Berechtigung - Super Admin erforderlich")
  }

  return auth
}

/**
 * Extract and validate practice ID from request
 */
export function extractPracticeId(request: NextRequest, params?: any): string {
  const practiceId = params?.practiceId || request.nextUrl.searchParams.get("practiceId")

  if (!practiceId) {
    throw new Error("Praxis-ID fehlt")
  }

  return practiceId
}

/**
 * Check if user has access to practice
 */
export async function checkPracticeAccess(practiceId: string, auth: ApiAuthResult): Promise<boolean> {
  if (auth.isSuperAdmin) {
    return true
  }

  return auth.user.practiceId === practiceId
}
