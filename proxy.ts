import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { updateSession } from "./lib/supabase/middleware"

const PUBLIC_ROUTES = new Set([
  "/",
  "/auth/login",
  "/auth/register",
  "/auth/sign-up",
  "/auth/reset-password",
  "/auth/callback",
  "/auth/pending-approval",
  "/auth/sign-up-success",
  "/about",
  "/contact",
  "/careers",
  "/cookies",
  "/help",
  "/team",
  "/preise",
  "/info",
  "/blog",
  "/wunschpatient",
  "/coming-soon",
  "/whats-new",
  "/impressum",
  "/datenschutz",
  "/agb",
  "/sicherheit",
  "/demo",
  "/updates",
  "/ueber-uns",
  "/kontakt",
  "/karriere",
  "/effizienz", // Added new public landing pages
  "/academy", // Added missing public pages linked from landing page
  "/leitbild",
])

const PUBLIC_ROUTE_PREFIXES = [
  "/features",
  "/blog", // Added public route prefixes for dynamic routes
]

const ipRequestCounts = new Map<string, { count: number; resetTime: number }>()
const MIDDLEWARE_RATE_LIMIT = 800 // requests per minute (increased from 500)
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute

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

// Clean up old entries every minute
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
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://*.vercel-insights.com wss://*.supabase.co; frame-ancestors 'none';",
    )
  }

  return response
}

function isPublicRoute(pathname: string): boolean {
  // Check exact matches
  if (PUBLIC_ROUTES.has(pathname)) {
    return true
  }

  // Check prefix matches for dynamic routes
  for (const prefix of PUBLIC_ROUTE_PREFIXES) {
    if (pathname.startsWith(prefix)) {
      return true
    }
  }

  return false
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware entirely for static files - no logging
  if (pathname.startsWith("/_next") || pathname.includes(".")) {
    return NextResponse.next()
  }

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

    const response = NextResponse.next()
    return addSecurityHeaders(response)
  }

  const supabaseResponse = await updateSession(request)

  // If updateSession returned a response (e.g., with updated cookies), use it
  if (supabaseResponse && supabaseResponse !== NextResponse.next()) {
    return addSecurityHeaders(supabaseResponse)
  }

  // Allow public routes immediately without any Supabase calls
  if (isPublicRoute(pathname)) {
    const response = NextResponse.next()
    return addSecurityHeaders(response)
  }

  // Protected route - allow access (client-side auth handles this)
  const response = NextResponse.next()
  return addSecurityHeaders(response)
}

export default proxy

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\..*).*)"],
}
