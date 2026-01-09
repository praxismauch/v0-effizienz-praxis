import { type NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
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
 * Authenticate API request and return user info with Supabase client
 * Throws an error if authentication fails
 */
export async function authenticateApiRequest(useAdminClient = false): Promise<ApiAuthResult> {
  const supabase = await createClient()
  const adminClient = await createAdminClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("Nicht authentifiziert")
  }

  const { data: userData, error: userError } = await adminClient
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
 * Check if user has access to practice (boolean check)
 */
export async function checkPracticeAccess(practiceId: string, auth: ApiAuthResult): Promise<boolean> {
  if (auth.isSuperAdmin) {
    return true
  }

  return auth.user.practiceId === practiceId
}

/**
 * Require authenticated user with access to specific practice
 * This is the MAIN function to use in all practice-scoped API routes
 *
 * Usage:
 * \`\`\`ts
 * export async function GET(req: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
 *   try {
 *     const { practiceId } = await params
 *     const { user, adminClient, accessType } = await requirePracticeAccess(practiceId)
 *
 *     // Now safe to query data - user is verified to have access
 *     const { data } = await adminClient.from("todos").select("*").eq("practice_id", practiceId)
 *
 *     return NextResponse.json(data)
 *   } catch (error) {
 *     return handleApiError(error)
 *   }
 * }
 * \`\`\`
 */
export async function requirePracticeAccess(
  practiceId: string | number | undefined | null,
): Promise<PracticeAuthResult> {
  const practiceIdStr = String(practiceId ?? "")

  if (
    !practiceIdStr ||
    practiceIdStr === "undefined" ||
    practiceIdStr === "null" ||
    practiceIdStr === "0" ||
    practiceIdStr === ""
  ) {
    console.warn(`[requirePracticeAccess] Invalid practiceId received: "${practiceId}" (type: ${typeof practiceId})`)
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

  // users.practice_id can be integer, but URL params are always strings
  const userPracticeId = String(auth.user.practiceId ?? "")

  if (userPracticeId !== practiceIdStr) {
    console.warn(
      `[ACCESS DENIED] User ${auth.user.id} (practice: ${auth.user.practiceId} [${typeof auth.user.practiceId}]) ` +
        `attempted to access practice ${practiceId} [${typeof practiceId}]. ` +
        `Comparison: "${userPracticeId}" !== "${practiceIdStr}"`,
    )
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

export class ApiError extends Error {
  status: number

  constructor(message: string, status = 500) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

/**
 * Handle API errors with consistent format
 * Extracts status from ApiError, defaults to 500 for unknown errors
 */
export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return createErrorResponse(error.message, error.status)
  }

  if (error instanceof Error) {
    // Map common error messages to appropriate status codes
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

    console.error("[API Error]", message)
    return createErrorResponse(message, 500)
  }

  console.error("[API Error] Unknown error:", error)
  return createErrorResponse("Ein unerwarteter Fehler ist aufgetreten", 500)
}

export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

export function validatePracticeId(practiceId: string | undefined | null): string {
  if (!practiceId || practiceId === "undefined" || practiceId === "null" || practiceId === "0") {
    throw new ApiError("Praxis-ID fehlt oder ist ungültig", 400)
  }

  if (!isValidUUID(practiceId)) {
    throw new ApiError("Ungültiges Praxis-ID Format", 400)
  }

  return practiceId
}
