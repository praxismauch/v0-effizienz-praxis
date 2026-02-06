import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { getSupabaseUrl, getSupabaseAnonKey, hasSupabaseConfig } from "./lib/supabase/config"

/**
 * Edge-compatible logging utilities
 * Optimized for middleware performance in Next.js 16
 */
const edgeLog = {
  debug: (msg: string, data?: unknown) => {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[middleware] ${msg}`, data ?? "")
    }
  },
  error: (msg: string, error?: unknown) => {
    console.error(`[middleware] ${msg}`, error ?? "")
  },
  generateRequestId: (): string => `${Date.now()}-${Math.random().toString(36).substring(7)}`,
} as const

// Expanded list of protected routes
const PROTECTED_ROUTES = [
  "/dashboard",
  "/team",
  "/settings",
  "/zeiterfassung",
  "/arbeitsmittel",
  "/devices",
  "/rooms",
  "/material",
  "/kontakte",
  "/umfragen",
  "/arbeitsplaetze",
  "/organigramm",
  "/kompetenzen",
  "/selbst-check",
  "/mitarbeitergespraeche",
  "/personalsuche",
  "/hiring",
  "/goals",
  "/workflows",
  "/calendar",
  "/analytics",
  "/academy",
  "/igel-analysis",
  "/lohnt-es-sich-analyse",
  "/selbstzahler-analyse",
  "/konkurrenzanalyse",
  "/wunschpatient",
  "/knowledge",
  "/onboarding",
  "/tickets",
  "/wellbeing",
  "/cirs",
  "/hygiene",
]

// Helper function to check if path is protected
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route))
}

/**
 * In-memory rate limiting for middleware
 * Production apps should use Redis (Upstash) for distributed rate limiting
 */
interface RateLimitEntry {
  count: number
  resetTime: number
}

const ipRequestCounts = new Map<string, RateLimitEntry>()
const MIDDLEWARE_RATE_LIMIT = 800
const RATE_LIMIT_WINDOW = 60 * 1000

function checkMiddlewareRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = ipRequestCounts.get(ip)

  if (!entry || entry.resetTime < now) {
    ipRequestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (entry.count >= MIDDLEWARE_RATE_LIMIT) {
    edgeLog.debug(`Rate limit exceeded for IP: ${ip}`)
    return false
  }

  entry.count++
  return true
}

// Cleanup stale entries periodically (Edge runtime compatible)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of ipRequestCounts.entries()) {
      if (entry.resetTime < now) {
        ipRequestCounts.delete(key)
      }
    }
  }, 60000)
}

/**
 * Apply security headers to all responses
 * Next.js 16 compatible with enhanced security policies
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  const headers = [
    ["X-Frame-Options", "DENY"],
    ["X-Content-Type-Options", "nosniff"],
    ["X-XSS-Protection", "1; mode=block"],
    ["Referrer-Policy", "strict-origin-when-cross-origin"],
    ["Permissions-Policy", "camera=(), microphone=(self), geolocation=(), interest-cohort=()"],
    ["X-DNS-Prefetch-Control", "on"],
  ] as const

  headers.forEach(([key, value]) => response.headers.set(key, value))

  // HSTS only in production
  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")
    
    // Enhanced CSP for production
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co https://*.vercel-insights.com wss://*.supabase.co https://api.openai.com https://api.anthropic.com https://api.groq.com https://generativelanguage.googleapis.com https://gateway.ai.cloudflare.com https://*.vercel.ai",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ]
    response.headers.set("Content-Security-Policy", cspDirectives.join("; "))
  }

  return response
}

/**
 * Update and validate user session
 * Next.js 16 optimized with proper error handling
 */
async function updateSession(request: NextRequest): Promise<NextResponse> {
  const requestId = edgeLog.generateRequestId()

  let supabaseResponse = NextResponse.next({ request })

  const supabaseUrl = getSupabaseUrl()
  const supabaseAnonKey = getSupabaseAnonKey()

  if (!hasSupabaseConfig()) {
    edgeLog.debug("Supabase not configured - skipping auth")
    return addSecurityHeaders(supabaseResponse)
  }

  try {
    // Create fresh Supabase client for each request
    // IMPORTANT: Never cache or reuse this client
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))

          supabaseResponse = NextResponse.next({ request })

          cookiesToSet.forEach(({ name, value, options }) => 
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    })

    // CRITICAL: Do not run code between createServerClient and getUser()
    // This prevents random logout issues
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    // Only log errors that aren't just "session missing" (which is expected for public routes)
    if (error && error.message !== "Auth session missing!" && error.name !== "AuthSessionMissingError") {
      edgeLog.error("Supabase auth error:", error)
    }

    // Redirect to login if accessing protected route without auth
    const pathname = request.nextUrl.pathname
    if (isProtectedRoute(pathname) && !user) {
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      url.searchParams.set("redirect", pathname)

      edgeLog.debug(`Auth redirect: ${pathname} -> /auth/login`)
      return NextResponse.redirect(url)
    }

    // Add tracing headers
    supabaseResponse.headers.set("x-request-id", requestId)
    if (user) {
      supabaseResponse.headers.set("x-user-id", user.id)
    }

    return supabaseResponse
  } catch (error) {
    edgeLog.error("Session update failed:", error)
    return supabaseResponse
  }
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const supabaseResponse = await updateSession(request)

  if (pathname.startsWith("/api/")) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "unknown"

    if (!checkMiddlewareRateLimit(ip)) {
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
          },
        },
      )
    }

    return addSecurityHeaders(supabaseResponse)
  }

  return addSecurityHeaders(supabaseResponse)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
}
