import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "./lib/supabase/server"
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// Lazy initialization of Redis to ensure env vars are loaded
let ratelimit: Ratelimit | null = null

function getRateLimiter() {
  if (!ratelimit) {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL || "",
      token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
    })

    ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, "1 m"), // 60 requests per minute
      analytics: true,
    })
  }
  return ratelimit
}

// Main proxy function (renamed from middleware in Next.js 16)
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Apply rate limiting to API routes FIRST (before any other processing)
  if (pathname.startsWith("/api/")) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || 
               request.headers.get("x-real-ip") || 
               "unknown"

    // Get rate limiter (lazy initialization)
    const limiter = getRateLimiter()
    const { success } = await limiter.limit(ip)

    if (!success) {
      return new NextResponse(
        JSON.stringify({
          error: "Too many requests",
          message: "Please slow down and try again later.",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": "60",
            "X-Frame-Options": "DENY",
            "X-Content-Type-Options": "nosniff",
            "Referrer-Policy": "strict-origin-when-cross-origin",
          },
        }
      )
    }
  }

  // Create response that passes through to API routes
  const response = NextResponse.next({
    request,
  })

  // Update Supabase session - silently handle errors to not crash middleware
  try {
    const supabase = await createServerClient()
    await supabase.auth.getUser()
  } catch (error) {
    // Silently handle - don't crash the middleware
    console.error("[middleware] Supabase session update failed:", error)
  }

  // Add security headers
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
}
