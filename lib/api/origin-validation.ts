import { createHmac, timingSafeEqual } from "crypto"
import type { NextRequest } from "next/server"

const ORIGIN_SECRET = process.env.APP_ORIGIN_SECRET || ""
const TOKEN_EXPIRY_MS = 5 * 60 * 1000 // 5 minutes

export interface OriginToken {
  timestamp: number
  signature: string
}

/**
 * Generate a signed origin token for client-side use
 * Token includes timestamp and HMAC signature to prevent replay attacks
 */
export function generateOriginToken(): string {
  if (!ORIGIN_SECRET) {
    console.warn("[v0] APP_ORIGIN_SECRET not configured - origin validation disabled")
    return ""
  }

  const timestamp = Date.now()
  const signature = createHmac("sha256", ORIGIN_SECRET)
    .update(`${timestamp}`)
    .digest("hex")

  return Buffer.from(JSON.stringify({ timestamp, signature })).toString("base64")
}

/**
 * Validate the X-App-Origin header from the request
 * Returns true if valid, false otherwise
 */
export function validateOriginHeader(request: NextRequest): boolean {
  // If no secret is configured, skip validation (development mode)
  if (!ORIGIN_SECRET) {
    return true
  }

  const originHeader = request.headers.get("x-app-origin")
  if (!originHeader) {
    return false
  }

  try {
    const decoded = Buffer.from(originHeader, "base64").toString("utf-8")
    const token: OriginToken = JSON.parse(decoded)

    // Check if token is expired
    const age = Date.now() - token.timestamp
    if (age > TOKEN_EXPIRY_MS || age < 0) {
      return false
    }

    // Verify signature
    const expectedSignature = createHmac("sha256", ORIGIN_SECRET)
      .update(`${token.timestamp}`)
      .digest("hex")

    // Use timing-safe comparison to prevent timing attacks
    const expectedBuffer = Buffer.from(expectedSignature, "hex")
    const actualBuffer = Buffer.from(token.signature, "hex")

    if (expectedBuffer.length !== actualBuffer.length) {
      return false
    }

    return timingSafeEqual(expectedBuffer, actualBuffer)
  } catch (error) {
    console.error("[v0] Origin validation error:", error)
    return false
  }
}

/**
 * Check if origin validation should be enforced for this request
 */
export function shouldValidateOrigin(pathname: string): boolean {
  // Always validate super-admin routes
  if (pathname.startsWith("/api/super-admin")) {
    return true
  }

  // Validate sensitive mutation endpoints
  if (pathname.includes("/users") || pathname.includes("/practices")) {
    return true
  }

  // Skip validation for public endpoints and auth
  if (pathname.startsWith("/api/public") || pathname.startsWith("/api/auth")) {
    return false
  }

  // Default: validate
  return true
}
