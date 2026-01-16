import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { acquireLockWithQueue } from "./lib/supabase/refreshTokenLock"
import Logger from "./lib/logger"

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

async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
    },
  )

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const projectRef = supabaseUrl.split("//")[1]?.split(".")[0] || "default"
  const authTokenCookie = request.cookies.get(`sb-${projectRef}-auth-token`)
  const lockKey = authTokenCookie?.value || "anonymous"

  let user = null
  try {
    await acquireLockWithQueue(lockKey, async () => {
      const {
        data: { user: refreshedUser },
      } = await supabase.auth.getUser()
      user = refreshedUser
    })
  } catch (error) {
    console.error("[proxy] Token refresh lock error:", error)
  }

  if (request.nextUrl.pathname.startsWith("/dashboard") && !user) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    url.searchParams.set("redirect", request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export async function proxy(request: NextRequest) {
  const requestId = Logger.generateRequestId()
  Logger.setRequestId(requestId)

  const { pathname } = request.nextUrl
  const timer = Logger.startTimer("Middleware")

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

    timer.endAndLog("api", { pathname, requestId })

    return addSecurityHeaders(supabaseResponse)
  }

  timer.endAndLog("non-api", { pathname, requestId })

  return addSecurityHeaders(supabaseResponse)
}

export default proxy

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
}
