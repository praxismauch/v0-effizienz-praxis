/**
 * CSRF Protection Utility
 * Uses Double Submit Cookie pattern for stateless CSRF protection
 */
import { cookies } from "next/headers"
import type { NextRequest } from "next/server"

const CSRF_COOKIE_NAME = "csrf_token"
const CSRF_HEADER_NAME = "x-csrf-token"
const CSRF_TOKEN_LENGTH = 32

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(CSRF_TOKEN_LENGTH)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("")
}

/**
 * Set CSRF token in cookie (call from server component or API route)
 */
export async function setCsrfCookie(): Promise<string> {
  const token = generateCsrfToken()
  const cookieStore = await cookies()

  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  })

  return token
}

/**
 * Get CSRF token from cookie
 */
export async function getCsrfToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(CSRF_COOKIE_NAME)?.value || null
}

/**
 * Validate CSRF token from request
 * Compares token in header with token in cookie
 */
export async function validateCsrfToken(request: NextRequest): Promise<boolean> {
  // Skip CSRF validation for safe methods
  const safeMethod = ["GET", "HEAD", "OPTIONS"].includes(request.method)
  if (safeMethod) {
    return true
  }

  // Get token from header
  const headerToken = request.headers.get(CSRF_HEADER_NAME)
  if (!headerToken) {
    return false
  }

  // Get token from cookie
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value
  if (!cookieToken) {
    return false
  }

  // Constant-time comparison to prevent timing attacks
  return timingSafeEqual(headerToken, cookieToken)
}

/**
 * Constant-time string comparison
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }

  return result === 0
}

/**
 * CSRF validation middleware helper
 * Returns error response if CSRF validation fails
 */
export async function validateCsrf(
  request: NextRequest,
): Promise<{ valid: true } | { valid: false; response: Response }> {
  const isValid = await validateCsrfToken(request)

  if (isValid) {
    return { valid: true }
  }

  return {
    valid: false,
    response: new Response(
      JSON.stringify({
        error: "CSRF validation failed",
        message: "Invalid or missing CSRF token",
      }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      },
    ),
  }
}

/**
 * API Route helper to get CSRF token for client
 */
export async function getCsrfTokenForClient(): Promise<{ token: string }> {
  let token = await getCsrfToken()

  if (!token) {
    token = await setCsrfCookie()
  }

  return { token }
}
