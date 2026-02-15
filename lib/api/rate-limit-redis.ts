/**
 * Rate limiting with Upstash Redis
 * Production-ready rate limiting with distributed state
 */
import { Redis } from "@upstash/redis"
import { Ratelimit } from "@upstash/ratelimit"
import { logSecurityEvent } from "./anomaly-detection"

// Initialize Redis client
const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

// Rate limiters for different operations
export const rateLimiters = {
  // Auth operations - strict limits
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "60 s"), // 5 requests per minute
    analytics: true,
    prefix: "ratelimit:auth",
  }),

  // Password reset - very strict
  passwordReset: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, "300 s"), // 3 requests per 5 minutes
    analytics: true,
    prefix: "ratelimit:password-reset",
  }),

  // Standard API calls
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "60 s"), // 100 requests per minute
    analytics: true,
    prefix: "ratelimit:api",
  }),

  // AI/expensive operations
  ai: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "60 s"), // 10 requests per minute
    analytics: true,
    prefix: "ratelimit:ai",
  }),

  // File uploads
  upload: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, "60 s"), // 20 uploads per minute
    analytics: true,
    prefix: "ratelimit:upload",
  }),

  // Email sending
  email: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "60 s"), // 10 emails per minute
    analytics: true,
    prefix: "ratelimit:email",
  }),

  // Cron jobs
  cron: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(1, "60 s"), // 1 request per minute
    analytics: true,
    prefix: "ratelimit:cron",
  }),
}

export type RateLimiterType = keyof typeof rateLimiters

/**
 * Get client IP from request
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  const realIp = request.headers.get("x-real-ip")
  const cfIp = request.headers.get("cf-connecting-ip")

  return cfIp || forwarded?.split(",")[0]?.trim() || realIp || "unknown"
}

/**
 * Apply rate limiting to a request
 */
export async function applyRateLimitRedis(
  request: Request,
  type: RateLimiterType = "api",
  identifier?: string,
): Promise<{ allowed: true; remaining: number } | { allowed: false; response: Response }> {
  try {
    const limiter = rateLimiters[type]
    const ip = identifier || getClientIp(request)
    const key = `${ip}:${type}`

    const result = await limiter.limit(key)
    
    const url = new URL(request.url)
    const userAgent = request.headers.get("user-agent") || "unknown"

    if (result.success) {
      // Log successful request
      await logSecurityEvent({
        ip,
        endpoint: url.pathname,
        timestamp: Date.now(),
        userAgent,
        status: "allowed",
      })
      
      return { allowed: true, remaining: result.remaining }
    }

    // Log blocked request
    await logSecurityEvent({
      ip,
      endpoint: url.pathname,
      timestamp: Date.now(),
      userAgent,
      status: "blocked",
      reason: "rate_limit_exceeded",
    })

    const retryAfter = Math.ceil((result.reset - Date.now()) / 1000)

    return {
      allowed: false,
      response: new Response(
        JSON.stringify({
          error: "Too many requests",
          message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
          retryAfter,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(retryAfter),
            "X-RateLimit-Limit": String(result.limit),
            "X-RateLimit-Remaining": String(result.remaining),
            "X-RateLimit-Reset": String(result.reset),
          },
        },
      ),
    }
  } catch (error) {
    // If Redis is unavailable, allow the request but log the error
    console.error("Rate limit error:", error)
    return { allowed: true, remaining: -1 }
  }
}

/**
 * Check if rate limiting is available
 */
export function isRateLimitingEnabled(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
}
