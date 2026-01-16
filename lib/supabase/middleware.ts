import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { waitForLock } from "./refreshTokenLock"
import Logger from "@/lib/logger"

const publicRoutesSet = new Set([
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
  "/effizienz",
  "/academy",
  "/leitbild",
])

const PUBLIC_ROUTE_PREFIXES = ["/features", "/blog"]

const PUBLIC_API_ROUTES = new Set(["/api/webhooks", "/api/cron", "/api/public", "/api/csrf", "/api/landing-chatbot"])

const PUBLIC_AUTH_API_PREFIXES = ["/api/auth/"]

let cachedSupabaseUrl: string | undefined
let cachedSupabaseAnonKey: string | undefined

export function isPublicRoute(pathname: string): boolean {
  if (publicRoutesSet.has(pathname)) {
    return true
  }

  for (const prefix of PUBLIC_ROUTE_PREFIXES) {
    if (pathname.startsWith(prefix)) {
      return true
    }
  }

  if (pathname.startsWith("/api/")) {
    for (const prefix of PUBLIC_AUTH_API_PREFIXES) {
      if (pathname.startsWith(prefix)) {
        return true
      }
    }

    for (const publicApiRoute of PUBLIC_API_ROUTES) {
      if (pathname.startsWith(publicApiRoute)) {
        return true
      }
    }
  }

  return pathname.startsWith("/_next") || pathname.startsWith("/favicon.ico") || pathname.includes(".")
}

async function localSignOut(supabase: ReturnType<typeof createServerClient>, response: NextResponse): Promise<void> {
  try {
    await supabase.auth.signOut()

    const cookiesToClear = ["sb-access-token", "sb-refresh-token"]
    cookiesToClear.forEach((cookieName) => {
      response.cookies.delete(cookieName)
    })
  } catch (error) {
    // Silent failure
  }
}

async function retryGetUser(
  supabase: ReturnType<typeof createServerClient>,
  maxAttempts = 2,
): Promise<{ user: any; error: any }> {
  let lastError: any = null

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error) {
        lastError = error

        if (attempt < maxAttempts && error.message?.includes("refresh")) {
          const backoffMs = Math.pow(2, attempt - 1) * 100
          await new Promise((resolve) => setTimeout(resolve, backoffMs))
          continue
        }

        return { user: null, error }
      }

      return { user, error: null }
    } catch (err) {
      lastError = err

      if (attempt < maxAttempts) {
        const backoffMs = Math.pow(2, attempt - 1) * 100
        await new Promise((resolve) => setTimeout(resolve, backoffMs))
      }
    }
  }

  return { user: null, error: lastError }
}

function isTokenExpired(user: any): boolean {
  try {
    if (!user?.aud || !user?.exp) {
      return true
    }

    const now = Math.floor(Date.now() / 1000)
    return user.exp < now
  } catch {
    return true
  }
}

function generateSessionFingerprint(request: NextRequest): string {
  const userAgent = request.headers.get("user-agent") || ""
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || ""

  // Simple hash function (in production, use crypto.subtle.digest)
  let hash = 0
  const str = `${userAgent}${ip}`
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return hash.toString(36)
}

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl
  const requestId = Math.random().toString(36).substring(7)

  Logger.setRequestId(requestId)

  const isDevMode = process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN === "true" && process.env.NODE_ENV !== "production"

  if (isDevMode) {
    const devUserEmail = process.env.NEXT_PUBLIC_DEV_USER_EMAIL

    if (!devUserEmail) {
      Logger.error("auth", "Dev mode enabled but NEXT_PUBLIC_DEV_USER_EMAIL not set")
      return NextResponse.json({ error: "Dev mode configuration error" }, { status: 500 })
    }

    const response = NextResponse.next({ request })
    response.headers.set("x-dev-mode", "true")
    return response
  }

  const hasAuthCookies = request.cookies.getAll().some((c) => c.name.includes("sb-") && c.name.includes("auth"))

  if (isPublicRoute(pathname) && !hasAuthCookies) {
    return NextResponse.next()
  }

  if (!cachedSupabaseUrl) {
    cachedSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    cachedSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  }

  if (!cachedSupabaseUrl || !cachedSupabaseAnonKey) {
    Logger.error("auth", "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY")

    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Service configuration error" }, { status: 500 })
    }

    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  let supabaseResponse = NextResponse.next({ request })

  const refreshToken = request.cookies.get("sb-refresh-token")?.value
  const lockKey = refreshToken || `request-${requestId}`

  const lockAcquired = await waitForLock(lockKey, 2000)
  if (!lockAcquired) {
    Logger.warn("auth", "Lock timeout for key", { lockKey: lockKey.substring(0, 10) })
  }

  try {
    const supabase = createServerClient(cachedSupabaseUrl, cachedSupabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })

          supabaseResponse = NextResponse.next({ request })

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, {
              ...options,
              httpOnly: true,
              secure: true,
              sameSite: "lax",
              path: "/",
            })
          })
        },
      },
      auth: {
        detectSessionInUrl: false,
        persistSession: true,
        autoRefreshToken: true,
      },
    })

    const { user, error } = await retryGetUser(supabase)

    if (user && isTokenExpired(user)) {
      Logger.warn("auth", "Token expired", { userId: user.id })
      await localSignOut(supabase, supabaseResponse)

      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Session expired" }, { status: 401 })
      } else {
        const loginUrl = new URL("/auth/login", request.url)
        loginUrl.searchParams.set("redirect", pathname)
        return NextResponse.redirect(loginUrl)
      }
    }

    if (isPublicRoute(pathname)) {
      return supabaseResponse
    }

    if (!user || error) {
      if (error && error.message?.toLowerCase().includes("refresh token")) {
        await localSignOut(supabase, supabaseResponse)
      }

      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
      } else {
        const loginUrl = new URL("/auth/login", request.url)
        loginUrl.searchParams.set("redirect", pathname)
        return NextResponse.redirect(loginUrl)
      }
    }

    const fingerprint = generateSessionFingerprint(request)
    supabaseResponse.headers.set("x-session-fingerprint", fingerprint)
    // Removed: x-user-id and x-user-email headers

    return supabaseResponse
  } catch (error) {
    Logger.error("auth", "Authentication error", error)

    if (isPublicRoute(pathname)) {
      return supabaseResponse
    }

    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Authentifizierungsfehler" }, { status: 500 })
    } else {
      const loginUrl = new URL("/auth/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\..*).*)"],
}
