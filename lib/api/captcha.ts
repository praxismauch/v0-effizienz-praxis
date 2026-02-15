/**
 * Progressive CAPTCHA System
 * Uses hCaptcha for bot detection with progressive activation
 */
import { getRedis } from "@/lib/redis"
import { getClientIp } from "./rate-limit-redis"
import { blockIP, logSecurityEvent } from "./anomaly-detection"

const HCAPTCHA_SECRET = process.env.HCAPTCHA_SECRET_KEY
const CAPTCHA_VERIFY_URL = "https://hcaptcha.com/siteverify"

// Progressive thresholds
const CAPTCHA_THRESHOLD = 4 // Require CAPTCHA after 4 failures
const BLOCK_THRESHOLD = 11 // Block IP after 11 failures

export interface CaptchaRequirement {
  required: boolean
  reason?: string
  failureCount: number
}

/**
 * Check if CAPTCHA is required for this IP
 */
export async function checkCaptchaRequirement(
  request: Request
): Promise<CaptchaRequirement> {
  try {
    const redis = await getRedis()
    if (!redis) {
      return { required: false, failureCount: 0 }
    }

    const ip = getClientIp(request)
    const key = `captcha:failures:${ip}`
    const failures = (await redis.get(key)) || 0
    const failureCount = Number(failures)

    // Check if IP is already blocked
    if (failureCount >= BLOCK_THRESHOLD) {
      await blockIP(ip, "Too many failed attempts", 3600) // 1 hour block
      return {
        required: true,
        reason: "IP temporarily blocked",
        failureCount,
      }
    }

    // Check if CAPTCHA is required
    if (failureCount >= CAPTCHA_THRESHOLD) {
      return {
        required: true,
        reason: "Multiple failed attempts detected",
        failureCount,
      }
    }

    return { required: false, failureCount }
  } catch (error) {
    console.error("[v0] Error checking CAPTCHA requirement:", error)
    return { required: false, failureCount: 0 }
  }
}

/**
 * Verify hCaptcha token
 */
export async function verifyCaptchaToken(token: string, remoteip?: string): Promise<boolean> {
  if (!HCAPTCHA_SECRET) {
    console.warn("[v0] HCAPTCHA_SECRET not configured - CAPTCHA verification disabled")
    return true
  }

  try {
    const formData = new FormData()
    formData.append("secret", HCAPTCHA_SECRET)
    formData.append("response", token)
    if (remoteip) {
      formData.append("remoteip", remoteip)
    }

    const response = await fetch(CAPTCHA_VERIFY_URL, {
      method: "POST",
      body: formData,
    })

    const data = await response.json()
    return data.success === true
  } catch (error) {
    console.error("[v0] Error verifying CAPTCHA:", error)
    return false
  }
}

/**
 * Record a failure (increases failure count)
 */
export async function recordFailure(request: Request, reason: string): Promise<void> {
  try {
    const redis = await getRedis()
    if (!redis) return

    const ip = getClientIp(request)
    const key = `captcha:failures:${ip}`

    // Increment failure count
    await redis.incr(key)

    // Set expiration to 1 hour
    await redis.expire(key, 3600)

    // Log security event
    const url = new URL(request.url)
    await logSecurityEvent({
      ip,
      endpoint: url.pathname,
      timestamp: Date.now(),
      userAgent: request.headers.get("user-agent") || "unknown",
      status: "blocked",
      reason,
    })
  } catch (error) {
    console.error("[v0] Error recording failure:", error)
  }
}

/**
 * Reset failure count (after successful login/operation)
 */
export async function resetFailures(request: Request): Promise<void> {
  try {
    const redis = await getRedis()
    if (!redis) return

    const ip = getClientIp(request)
    const key = `captcha:failures:${ip}`

    await redis.del(key)
  } catch (error) {
    console.error("[v0] Error resetting failures:", error)
  }
}

/**
 * Check CAPTCHA token from request headers
 */
export async function validateCaptchaFromRequest(
  request: Request
): Promise<{ valid: boolean; response?: Response }> {
  const captchaToken = request.headers.get("x-captcha-token")

  if (!captchaToken) {
    return {
      valid: false,
      response: new Response(
        JSON.stringify({
          error: "CAPTCHA required",
          message: "Please complete the CAPTCHA verification",
          code: "CAPTCHA_REQUIRED",
        }),
        {
          status: 449, // Custom status code for CAPTCHA required
          headers: { "Content-Type": "application/json" },
        }
      ),
    }
  }

  const ip = getClientIp(request)
  const isValid = await verifyCaptchaToken(captchaToken, ip)

  if (!isValid) {
    await recordFailure(request, "invalid_captcha")
    return {
      valid: false,
      response: new Response(
        JSON.stringify({
          error: "Invalid CAPTCHA",
          message: "CAPTCHA verification failed",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      ),
    }
  }

  // Reset failures on successful CAPTCHA
  await resetFailures(request)

  return { valid: true }
}

/**
 * Helper to get failure count for monitoring
 */
export async function getFailureCount(ip: string): Promise<number> {
  try {
    const redis = await getRedis()
    if (!redis) return 0

    const key = `captcha:failures:${ip}`
    const failures = (await redis.get(key)) || 0
    return Number(failures)
  } catch (error) {
    console.error("[v0] Error getting failure count:", error)
    return 0
  }
}
