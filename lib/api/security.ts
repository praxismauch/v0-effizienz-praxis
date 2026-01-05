/**
 * Unified Security Middleware
 * Combines rate limiting, CSRF, and input validation
 */
import type { NextRequest } from "next/server"
import type { z } from "zod"
import { applyRateLimitRedis, isRateLimitingEnabled, type RateLimiterType } from "./rate-limit-redis"
import { applyRateLimit, type RateLimitConfig, RATE_LIMITS } from "./rate-limit"
import { validateCsrf } from "./csrf"
import { validateRequest } from "./schemas"

export interface SecurityOptions {
  /** Rate limit type */
  rateLimit?: RateLimiterType | false
  /** Custom rate limit config (for in-memory fallback) */
  rateLimitConfig?: RateLimitConfig
  /** Enable CSRF validation */
  csrf?: boolean
  /** Zod schema for body validation */
  bodySchema?: z.ZodSchema
  /** Zod schema for query params validation */
  querySchema?: z.ZodSchema
  /** Required authentication */
  requireAuth?: boolean
}

export interface SecurityResult {
  success: true
  body?: unknown
  query?: unknown
}

export interface SecurityError {
  success: false
  response: Response
}

/**
 * Apply security checks to an API request
 */
export async function applySecurityChecks(
  request: NextRequest,
  options: SecurityOptions = {},
): Promise<SecurityResult | SecurityError> {
  const { rateLimit = "api", rateLimitConfig, csrf = false, bodySchema, querySchema } = options

  // 1. Rate limiting
  if (rateLimit !== false) {
    if (isRateLimitingEnabled()) {
      // Use Redis-based rate limiting
      const rateLimitResult = await applyRateLimitRedis(request, rateLimit)
      if (!rateLimitResult.allowed) {
        return { success: false, response: rateLimitResult.response }
      }
    } else {
      // Fallback to in-memory rate limiting
      const config = rateLimitConfig || RATE_LIMITS[rateLimit] || RATE_LIMITS.api
      const rateLimitResult = applyRateLimit(request, config, rateLimit)
      if (!rateLimitResult.allowed) {
        return { success: false, response: rateLimitResult.response }
      }
    }
  }

  // 2. CSRF validation (for mutating requests)
  if (csrf && !["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    const csrfResult = await validateCsrf(request)
    if (!csrfResult.valid) {
      return { success: false, response: csrfResult.response }
    }
  }

  // 3. Body validation
  let validatedBody: unknown
  if (bodySchema && ["POST", "PUT", "PATCH"].includes(request.method)) {
    try {
      const rawBody = await request.json()
      const result = validateRequest(bodySchema, rawBody)
      if (!result.success) {
        return {
          success: false,
          response: new Response(
            JSON.stringify({
              error: "Validation error",
              message: result.error,
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          ),
        }
      }
      validatedBody = result.data
    } catch {
      return {
        success: false,
        response: new Response(
          JSON.stringify({
            error: "Invalid JSON",
            message: "Request body must be valid JSON",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        ),
      }
    }
  }

  // 4. Query validation
  let validatedQuery: unknown
  if (querySchema) {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams)
    const result = validateRequest(querySchema, searchParams)
    if (!result.success) {
      return {
        success: false,
        response: new Response(
          JSON.stringify({
            error: "Validation error",
            message: result.error,
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        ),
      }
    }
    validatedQuery = result.data
  }

  return {
    success: true,
    body: validatedBody,
    query: validatedQuery,
  }
}

/**
 * Create a secured API handler wrapper
 */
export function withSecurity<T>(
  options: SecurityOptions,
  handler: (request: NextRequest, context: { body?: T; query?: unknown }) => Promise<Response>,
) {
  return async (request: NextRequest) => {
    const securityResult = await applySecurityChecks(request, options)

    if (!securityResult.success) {
      return securityResult.response
    }

    return handler(request, {
      body: securityResult.body as T,
      query: securityResult.query,
    })
  }
}
