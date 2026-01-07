import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { refreshTokenLock } from "./refreshTokenLock"

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
])

const PUBLIC_ROUTE_PREFIXES = ["/features", "/blog"]

let cachedSupabaseUrl: string | undefined
let cachedSupabaseAnonKey: string | undefined

function isPublicRoute(pathname: string): boolean {
  if (publicRoutesSet.has(pathname)) {
    return true
  }

  for (const prefix of PUBLIC_ROUTE_PREFIXES) {
    if (pathname.startsWith(prefix)) {
      return true
    }
  }

  return (
    pathname.startsWith("/api/webhooks") ||
    pathname.startsWith("/api/cron") ||
    pathname.startsWith("/api/public") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".")
  )
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

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl
  const requestId = Math.random().toString(36).substring(7)

  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  if (!cachedSupabaseUrl) {
    cachedSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://sytvmjmvwkqdzcfvjqkr.supabase.co"
    cachedSupabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5dHZtam12d2txZHpjZnZqcWtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MjkzNjUsImV4cCI6MjA3NDMwNTM2NX0.Y9r0hRzlsQPhGAGPjhw7hS1IttT6wWu7WslhxEZzVtg"
  }

  if (!cachedSupabaseUrl || !cachedSupabaseAnonKey) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({ request })

  const refreshToken = request.cookies.get("sb-refresh-token")?.value
  const lockKey = refreshToken || `request-${requestId}`

  const isLocked = refreshTokenLock.has(lockKey)
  if (isLocked) {
    const startTime = Date.now()
    while (refreshTokenLock.has(lockKey) && Date.now() - startTime < 500) {
      await new Promise((resolve) => setTimeout(resolve, 50))
    }
    if (refreshTokenLock.has(lockKey)) {
      // Lock timeout - proceed without waiting further
    }
  }

  refreshTokenLock.set(lockKey, Date.now())

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
              secure: process.env.NODE_ENV === "production",
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

    if (error && error.message?.toLowerCase().includes("refresh token")) {
      await localSignOut(supabase, supabaseResponse)
    }

    return supabaseResponse
  } catch (error) {
    return supabaseResponse
  } finally {
    refreshTokenLock.delete(lockKey)
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\..*).*)"],
}
