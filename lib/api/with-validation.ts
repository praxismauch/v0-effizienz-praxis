/**
 * API Route Wrapper with Zod Validation
 * Provides type-safe request handling with automatic validation
 */
import { type NextRequest, NextResponse } from "next/server"
import type { z } from "zod"
import { createServerClient } from "@/lib/supabase/server"
import { applyRateLimitRedis, isRateLimitingEnabled, type RateLimiterType } from "./rate-limit-redis"
import { applyRateLimit, RATE_LIMITS } from "./rate-limit"

interface ValidationOptions<TBody, TQuery, TParams> {
  bodySchema?: z.ZodSchema<TBody>
  querySchema?: z.ZodSchema<TQuery>
  paramsSchema?: z.ZodSchema<TParams>
  rateLimit?: RateLimiterType | false
  requireAuth?: boolean
}

interface ValidatedContext<TBody, TQuery, TParams> {
  body: TBody
  query: TQuery
  params: TParams
  userId?: string
  practiceId?: string
}

type ApiHandler<TBody, TQuery, TParams> = (
  request: NextRequest,
  context: ValidatedContext<TBody, TQuery, TParams>,
) => Promise<Response>

/**
 * Create a validated API handler
 */
export function createValidatedHandler<TBody = unknown, TQuery = unknown, TParams = unknown>(
  options: ValidationOptions<TBody, TQuery, TParams>,
  handler: ApiHandler<TBody, TQuery, TParams>,
) {
  return async (request: NextRequest, { params }: { params?: Promise<Record<string, string>> } = {}) => {
    try {
      // 1. Rate limiting
      if (options.rateLimit !== false) {
        const limitType = options.rateLimit || "api"

        if (isRateLimitingEnabled()) {
          const result = await applyRateLimitRedis(request, limitType)
          if (!result.allowed) {
            return result.response
          }
        } else {
          const config = RATE_LIMITS[limitType] || RATE_LIMITS.api
          const result = applyRateLimit(request, config, limitType)
          if (!result.allowed) {
            return result.response
          }
        }
      }

      // 2. Auth check
      let userId: string | undefined
      let practiceId: string | undefined

      if (options.requireAuth) {
        const supabase = await createServerClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        userId = user.id

        const { data: profile } = await supabase
          .from("user_profiles")
          .select("current_practice_id")
          .eq("user_id", user.id)
          .single()

        practiceId = profile?.current_practice_id
      }

      // 3. Params validation
      let validatedParams = {} as TParams
      if (options.paramsSchema && params) {
        const resolvedParams = await params
        const result = options.paramsSchema.safeParse(resolvedParams)
        if (!result.success) {
          return NextResponse.json(
            {
              error: "Invalid parameters",
              details: result.error.flatten().fieldErrors,
            },
            { status: 400 },
          )
        }
        validatedParams = result.data
      }

      // 4. Query validation
      let validatedQuery = {} as TQuery
      if (options.querySchema) {
        const searchParams = Object.fromEntries(request.nextUrl.searchParams)
        const result = options.querySchema.safeParse(searchParams)
        if (!result.success) {
          return NextResponse.json(
            {
              error: "Invalid query parameters",
              details: result.error.flatten().fieldErrors,
            },
            { status: 400 },
          )
        }
        validatedQuery = result.data
      }

      // 5. Body validation
      let validatedBody = {} as TBody
      if (options.bodySchema && ["POST", "PUT", "PATCH"].includes(request.method)) {
        try {
          const rawBody = await request.json()
          const result = options.bodySchema.safeParse(rawBody)
          if (!result.success) {
            return NextResponse.json(
              {
                error: "Invalid request body",
                details: result.error.flatten().fieldErrors,
              },
              { status: 400 },
            )
          }
          validatedBody = result.data
        } catch {
          return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
        }
      }

      // 6. Call handler with validated context
      return handler(request, {
        body: validatedBody,
        query: validatedQuery,
        params: validatedParams,
        userId,
        practiceId,
      })
    } catch (error) {
      console.error("API handler error:", error)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
  }
}
