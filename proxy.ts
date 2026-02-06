import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "./lib/supabase/server"

// Rate limiting map (edge-safe, in-memory)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

// Basic rate limiting for API routes
function checkMiddlewareRateLimit(ip: string): boolean {
  const now = Date.now()
  const limit = 60 // requests per minute
  const windowMs = 60 * 1000 // 1 minute

  const record = rateLimitMap.get(ip)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + windowMs,
    })
    return true
  }

  if (record.count >= limit) {
    return false
  }

  record.count++
  return true
}

// Security headers
function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")

  return response
}

// Update session with Supabase
async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  try {
    const supabase = await createServerClient()

    // Refresh session if expired
    const {
      data: { user },
    } = await supabase.auth.getUser()

    return response
  } catch (error) {
    return response
  }
}

// Main proxy function
async function proxyHandler(request: NextRequest) {
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

// Export as both default and named "proxy" for Next.js 16 compatibility
export default proxyHandler
export { proxyHandler as proxy }

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
}
