import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
// Do NOT import from lib/supabase/server.ts which uses next/headers
import { createServerClient } from "@supabase/ssr"

const edgeLog = {
  debug: (msg: string, data?: any) => {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[proxy] ${msg}`, data || "")
    }
  },
  error: (msg: string, error?: any) => {
    console.error(`[proxy] ${msg}`, error || "")
  },
  generateRequestId: () => `${Date.now()}-${Math.random().toString(36).substring(7)}`,
}

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
]

// Helper function to check if path is protected
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route))
}

// Helper function to clear all Supabase auth cookies
function clearAuthCookies(response: NextResponse): void {
  const cookieOptions = {
    path: "/",
    maxAge: 0,
    sameSite: "lax" as const,
  }

  // Only clear the essential auth cookies
  response.cookies.set("sb-access-token", "", cookieOptions)
  response.cookies.set("sb-refresh-token", "", cookieOptions)
}

const pendingRefreshes = new Map<string, Promise<void>>()
const refreshTokenLock = new Map<string, number>()

async function acquireLockWithQueue(key: string, operation: () => Promise<void>): Promise<void> {
  const existingPromise = pendingRefreshes.get(key)
  if (existingPromise) {
    try {
      await existingPromise
    } catch {
      // Ignore errors from existing promise - we'll try our own operation
    }
    return
  }

  const refreshPromise = (async () => {
    try {
      refreshTokenLock.set(key, Date.now())
      await operation()
    } catch (error: unknown) {
      // Re-throw non-abort errors
      const errorMessage = error instanceof Error ? error.message : String(error)
      const isAbortError = errorMessage.includes("abort") || (error instanceof Error && error.name === "AbortError")
      if (!isAbortError) {
        throw error
      }
      // Silently swallow abort errors
    } finally {
      refreshTokenLock.delete(key)
      pendingRefreshes.delete(key)
    }
  })()

  pendingRefreshes.set(key, refreshPromise)
  await refreshPromise
}

// Rate limiting for middleware
const ipRequestCounts = new Map<string, { count: number; resetTime: number }>()
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
    return false
  }

  entry.count++
  return true
}

// Cleanup stale entries periodically
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of ipRequestCounts.entries()) {
      if (entry.resetTime < now) {
        ipRequestCounts.delete(key)
      }
    }
    // Clean up stale locks
    const staleThreshold = 10000
    for (const [key, timestamp] of refreshTokenLock.entries()) {
      if (now - timestamp > staleThreshold) {
        refreshTokenLock.delete(key)
        pendingRefreshes.delete(key)
      }
    }
  }, 60000)
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(self), geolocation=(), interest-cohort=()")
  response.headers.set("X-DNS-Prefetch-Control", "on")
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")

  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://*.vercel-insights.com wss://*.supabase.co https://api.openai.com https://api.anthropic.com https://api.groq.com https://generativelanguage.googleapis.com https://gateway.ai.cloudflare.com https://*.vercel.ai; frame-ancestors 'none';",
    )
  }

  return response
}

async function updateSession(request: NextRequest) {
  const requestId = edgeLog.generateRequestId()

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    edgeLog.error("Missing Supabase environment variables")
    return supabaseResponse
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))

        supabaseResponse = NextResponse.next({
          request,
        })

        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
      },
    },
  })

  // Get lock key from auth cookie
  const projectRef = supabaseUrl.split("//")[1]?.split(".")[0] || "default"
  const authTokenCookie = request.cookies.get(`sb-${projectRef}-auth-token`)
  const lockKey = authTokenCookie?.value?.substring(0, 32) || `anon-${requestId}`

  let user = null
  // Track if token refresh failed
  let refreshFailed = false

  try {
    await acquireLockWithQueue(lockKey, async () => {
      const {
        data: { user: refreshedUser },
      } = await supabase.auth.getUser()
      user = refreshedUser
    })
  } catch (error: unknown) {
    // Silently handle AbortError and network errors - these are expected in v0 preview
    const errorMessage = error instanceof Error ? error.message : String(error)
    const isAbortError = errorMessage.includes("abort") || errorMessage.includes("AbortError") || (error instanceof Error && error.name === "AbortError")
    const isNetworkError = errorMessage.includes("fetch") || errorMessage.includes("network")
    
    if (!isAbortError && !isNetworkError) {
      edgeLog.error("Token refresh lock error", error)
    }
    // Mark refresh as failed
    refreshFailed = true
  }

  // Redirect to login if accessing ANY protected route without auth
  const pathname = request.nextUrl.pathname
  if (isProtectedRoute(pathname) && !user) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    url.searchParams.set("redirect", pathname)

    const redirectResponse = NextResponse.redirect(url)

    // Clear stale cookies on auth failure to prevent stuck state
    if (refreshFailed) {
      clearAuthCookies(redirectResponse)
    }

    edgeLog.debug(`Auth redirect: ${pathname} -> /auth/login (user: ${!!user}, refreshFailed: ${refreshFailed})`)
    return redirectResponse
  }

  // Add request ID header for tracing
  supabaseResponse.headers.set("x-request-id", requestId)

  return supabaseResponse
}

export async function proxy(request: NextRequest) {
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

export default proxy

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
}
