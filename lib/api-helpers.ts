import "server-only"
import { type NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { hasSupabaseAdminConfig } from "@/lib/supabase/config"
import { isSuperAdminRole, isPracticeAdminRole, isManagerRole } from "@/lib/auth-utils"

export interface ApiAuthResult {
  user: {
    id: string
    email: string
    role: string
    practiceId: string | null
  }
  supabase: Awaited<ReturnType<typeof createClient>>
  adminClient: Awaited<ReturnType<typeof createAdminClient>>
  isSuperAdmin: boolean
}

export interface PracticeAuthResult extends ApiAuthResult {
  practiceId: string
  accessType: "owner" | "super_admin"
}

/**
 * Simplified authenticateApiRequest - trust proxy for session.
 * The proxy already refreshes the session and sets cookies properly.
 * We just need to read the user from the already-refreshed session.
 */
export async function authenticateApiRequest(): Promise<ApiAuthResult> {
  const supabase = await createClient()
  const adminClient = hasSupabaseAdminConfig() ? await createAdminClient() : supabase

  // Get user from session - proxy has already refreshed it
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  // Handle auth errors - distinguish between "no session" and actual errors
  if (error) {
    // AuthSessionMissingError is expected for unauthenticated requests
    if (error.message === "Auth session missing!" || error.name === "AuthSessionMissingError") {
      throw new ApiError("Nicht authentifiziert", 401)
    }
    // Other auth errors should be logged and treated as server errors
    console.error("[v0] API Auth error:", error)
    throw new ApiError("Authentifizierungsfehler", 500)
  }
  
  if (!user) {
    throw new ApiError("Nicht authentifiziert", 401)
  }

  // Get user data using admin client (bypasses RLS)
  let userData: any = null
  let userError: any = null
  
  // Try admin client first, then fall back to session client
  const lookupClient = hasSupabaseAdminConfig() ? adminClient : supabase
  const { data: uData, error: uError } = await lookupClient
    .from("users")
    .select("id, email, role, practice_id")
    .eq("id", user.id)
    .single()
  
  userData = uData
  userError = uError

  if (userError || !userData) {
    throw new ApiError("Benutzerdaten nicht gefunden", 404)
  }

  return {
    user: {
      id: userData.id,
      email: userData.email,
      role: userData.role,
      practiceId: userData.practice_id ? String(userData.practice_id) : null,
    },
    supabase,
    adminClient,
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
export function createSuccessResponse<T = unknown>(data: T, status = 200) {
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
 * Check if user has access to practice (boolean check)
 */
export async function checkPracticeAccess(practiceId: string, auth: ApiAuthResult): Promise<boolean> {
  if (auth.isSuperAdmin) {
    return true
  }

  return String(auth.user.practiceId) === String(practiceId)
}

/**
 * Require authenticated user with access to specific practice
 */
export async function requirePracticeAccess(
  practiceId: string | number | undefined | null,
): Promise<PracticeAuthResult> {
  const practiceIdStr = String(practiceId ?? "")

  // Validate practice ID format
  if (
    !practiceIdStr ||
    practiceIdStr === "undefined" ||
    practiceIdStr === "null" ||
    practiceIdStr === "0" ||
    practiceIdStr === ""
  ) {
    throw new ApiError("Praxis-ID fehlt oder ist ungültig", 400)
  }

  const auth = await authenticateApiRequest()

  // Super admins can access any practice
  if (auth.isSuperAdmin) {
    return {
      ...auth,
      practiceId: practiceIdStr,
      accessType: "super_admin",
    }
  }

  // Check practice access
  const userPracticeId = String(auth.user.practiceId ?? "")
  if (userPracticeId !== practiceIdStr) {
    throw new ApiError("Keine Berechtigung für diese Praxis", 403)
  }

  return {
    ...auth,
    practiceId: practiceIdStr,
    accessType: "owner",
  }
}

/**
 * Require practice admin or higher for the specified practice
 */
export async function requirePracticeAdminAccess(practiceId: string): Promise<PracticeAuthResult> {
  const result = await requirePracticeAccess(practiceId)

  if (!result.isSuperAdmin && !isPracticeAdminRole(result.user.role)) {
    throw new ApiError("Keine Berechtigung - Praxis Admin erforderlich", 403)
  }

  return result
}

/**
 * Require manager or higher for the specified practice
 */
export async function requireManagerAccess(practiceId: string): Promise<PracticeAuthResult> {
  const result = await requirePracticeAccess(practiceId)

  if (!result.isSuperAdmin && !isManagerRole(result.user.role)) {
    throw new ApiError("Keine Berechtigung - Manager erforderlich", 403)
  }

  return result
}

/**
 * Handle API errors with consistent format
 */
export function handleApiError(error: unknown): NextResponse {
  // Handle ApiError with explicit status codes first
  if (error instanceof ApiError) {
    return createErrorResponse(error.message, error.status)
  }
  
  if (error instanceof Error) {
    const message = error.message

    if (message.includes("Nicht authentifiziert")) {
      return createErrorResponse(message, 401)
    }
    if (message.includes("Keine Berechtigung")) {
      return createErrorResponse(message, 403)
    }
    if (message.includes("nicht gefunden")) {
      return createErrorResponse(message, 404)
    }
    if (message.includes("fehlt")) {
      return createErrorResponse(message, 400)
    }

    return createErrorResponse(message, 500)
  }

  return createErrorResponse("Ein unerwarteter Fehler ist aufgetreten", 500)
}

/**
 * Validate UUID format
 */
export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

/**
 * Validate practice ID format
 */
export function validatePracticeId(practiceId: string | undefined | null): string {
  if (!practiceId || practiceId === "undefined" || practiceId === "null" || practiceId === "0") {
    throw new Error("Praxis-ID fehlt oder ist ungültig")
  }

  return practiceId
}

/**
 * Get effective practice ID (normalize string/number to string)
 */
export function getEffectivePracticeId(practiceId: string | number | undefined | null): string {
  const idStr = String(practiceId ?? "")
  
  if (!idStr || idStr === "undefined" || idStr === "null" || idStr === "0" || idStr === "") {
    throw new Error("Praxis-ID fehlt oder ist ungültig")
  }
  
  return idStr
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status = 500) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}
