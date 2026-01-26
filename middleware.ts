import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  "/",
  "/auth/login",
  "/auth/register",
  "/auth/sign-up",
  "/auth/reset-password",
  "/auth/callback",
  "/auth/pending-approval",
  "/auth/sign-up-success",
  "/features",
  "/effizienz",
  "/about",
  "/contact",
  "/kontakt",
  "/preise",
  "/coming-soon",
  "/demo",
  "/help",
  "/careers",
  "/karriere",
  "/ueber-uns",
  "/impressum",
  "/datenschutz",
  "/agb",
  "/sicherheit",
  "/cookies",
  "/alle-funktionen",
  "/blog",
]

// Route prefixes that are public
const PUBLIC_ROUTE_PREFIXES = ["/features/", "/blog/", "/auth/", "/_next/", "/api/auth/"]

// API routes that require super admin
const SUPER_ADMIN_API_ROUTES = [
  "/api/super-admin",
  "/api/admin",
  "/api/tickets/config/seed",
]

// Routes blocked in production
const DEV_ONLY_ROUTES = [
  "/seed",
  "/api/seed",
]

// Sensitive API routes that need extra protection
const SENSITIVE_API_ROUTES = [
  "/api/practices",
  "/api/users",
  "/api/team",
]

// Check if path matches public routes
function isPublicRoute(path: string): boolean {
  // Check exact matches
  if (PUBLIC_ROUTES.includes(path)) return true
  
  // Check prefixes
  for (const prefix of PUBLIC_ROUTE_PREFIXES) {
    if (path.startsWith(prefix)) return true
  }
  
  // Static files and assets
  if (path.includes(".") && !path.endsWith(".html")) return true
  
  return false
}

// Check if route requires super admin
function requiresSuperAdmin(path: string): boolean {
  return SUPER_ADMIN_API_ROUTES.some(route => path.startsWith(route))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Block dev-only routes in production
  if (process.env.NODE_ENV === "production" && DEV_ONLY_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.json(
      { error: "Not Found", message: "This route is not available in production" },
      { status: 404 }
    )
  }

  // Allow public routes without authentication
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // Create response to modify cookies
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Create Supabase client for middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: "",
            ...options,
          })
        },
      },
    }
  )

  // Get user session
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  // Check dev mode bypass
  const IS_DEV_MODE =
    process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN === "true" && process.env.NODE_ENV !== "production"

  // Handle unauthenticated users
  if (!user && !IS_DEV_MODE) {
    // API routes return 401
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 }
      )
    }

    // Page routes redirect to login
    const loginUrl = new URL("/auth/login", request.url)
    loginUrl.searchParams.set("redirectTo", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // For super admin routes, verify role
  if (requiresSuperAdmin(pathname) && user) {
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    const userRole = userData?.role?.toLowerCase().replace(/_/g, "") || ""
    const isSuperAdmin = userRole === "superadmin"

    if (!isSuperAdmin) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Forbidden", message: "Super admin access required" },
          { status: 403 }
        )
      }
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
