/**
 * Rate limiting utility using in-memory store
 * For production, consider using Upstash Redis
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store (replace with Redis in production for multi-instance support)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean up every minute

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  limit: number
  /** Time window in seconds */
  windowSeconds: number
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  reset: number
  retryAfter?: number
}

// Default rate limit configurations
export const RATE_LIMITS = {
  // Strict limits for sensitive operations
  auth: { limit: 5, windowSeconds: 60 }, // 5 attempts per minute
  passwordReset: { limit: 3, windowSeconds: 300 }, // 3 attempts per 5 minutes

  // Standard API limits
  api: { limit: 100, windowSeconds: 60 }, // 100 requests per minute

  // AI/expensive operations
  aiGenerate: { limit: 10, windowSeconds: 60 }, // 10 AI calls per minute
  aiAnalysis: { limit: 5, windowSeconds: 60 }, // 5 analysis calls per minute

  // File operations
  upload: { limit: 20, windowSeconds: 60 }, // 20 uploads per minute

  // Email operations
  email: { limit: 10, windowSeconds: 60 }, // 10 emails per minute
} as const

/**
 * Check rate limit for a given identifier
 */
export function checkRateLimit(identifier: string, config: RateLimitConfig = RATE_LIMITS.api): RateLimitResult {
  const now = Date.now()
  const key = identifier
  const entry = rateLimitStore.get(key)

  // If no entry or expired, create new entry
  if (!entry || entry.resetTime < now) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowSeconds * 1000,
    })
    return {
      success: true,
      remaining: config.limit - 1,
      reset: now + config.windowSeconds * 1000,
    }
  }

  // If under limit, increment and allow
  if (entry.count < config.limit) {
    entry.count++
    return {
      success: true,
      remaining: config.limit - entry.count,
      reset: entry.resetTime,
    }
  }

  // Over limit, reject
  return {
    success: false,
    remaining: 0,
    reset: entry.resetTime,
    retryAfter: Math.ceil((entry.resetTime - now) / 1000),
  }
}

/**
 * Create a rate limit key from request
 */
export function getRateLimitKey(request: Request, prefix = "api"): string {
  // Try to get IP from various headers
  const forwarded = request.headers.get("x-forwarded-for")
  const realIp = request.headers.get("x-real-ip")
  const ip = forwarded?.split(",")[0] || realIp || "unknown"

  return `${prefix}:${ip}`
}

/**
 * Rate limit middleware helper
 * Returns headers to add to response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(result.reset),
  }

  if (!result.success && result.retryAfter) {
    headers["Retry-After"] = String(result.retryAfter)
  }

  return headers
}

/**
 * Apply rate limit and return error response if exceeded
 */
export function applyRateLimit(
  request: Request,
  config: RateLimitConfig = RATE_LIMITS.api,
  prefix = "api",
): { allowed: true } | { allowed: false; response: Response } {
  const key = getRateLimitKey(request, prefix)
  const result = checkRateLimit(key, config)

  if (result.success) {
    return { allowed: true }
  }

  return {
    allowed: false,
    response: new Response(
      JSON.stringify({
        error: "Too many requests",
        message: `Rate limit exceeded. Please try again in ${result.retryAfter} seconds.`,
        retryAfter: result.retryAfter,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          ...getRateLimitHeaders(result),
        },
      },
    ),
  }
}
