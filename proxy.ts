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
  "/wellbeing",
]

// Helper function to check if path is protected
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route))
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

  // Create a fresh Supabase client for each request - this is important
  // Do not cache or reuse this client
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

  // IMPORTANT: Do not run code between createServerClient and supabase.auth.getUser()
  // A simple mistake could make it very hard to debug issues with users being randomly logged out.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect to login if accessing ANY protected route without auth
  const pathname = request.nextUrl.pathname
  if (isProtectedRoute(pathname) && !user) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    url.searchParams.set("redirect", pathname)

    edgeLog.debug(`Auth redirect: ${pathname} -> /auth/login`)
    return NextResponse.redirect(url)
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
