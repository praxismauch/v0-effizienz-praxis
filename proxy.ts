import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { ROLES } from "./lib/constants/roles"

// Protected routes that require authentication
const PROTECTED_PATHS = ["/dashboard", "/settings", "/patients", "/protocols", "/academy", "/reports"]

// Admin/Super Admin routes that require elevated roles
const ADMIN_PATHS = ["/super-admin", "/admin"]

/**
 * Next.js 16 proxy function with:
 * - Supabase session refresh (keeps sessions alive)
 * - Security headers
 * - Route protection (redirect unauthenticated users)
 * - Admin role checks
 */
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Support fallback env var names for flexibility
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[proxy] Missing Supabase environment variables")
    return supabaseResponse
  }

  // Create Supabase client with cookie handling for session management
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

  // CRITICAL: This getUser() call is required to refresh the session.
  // Without it, users will be randomly logged out.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // --- Route protection ---

  const isProtectedPath = PROTECTED_PATHS.some((path) => pathname.startsWith(path))
  const isAdminPath = ADMIN_PATHS.some((path) => pathname.startsWith(path))

  // If no user and trying to access a protected or admin route, redirect to login
  if (!user && (isProtectedPath || isAdminPath)) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/auth/login"
    redirectUrl.searchParams.set("redirectTo", pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If user exists and trying to access admin routes, verify their role
  if (user && isAdminPath) {
    const { data: userData } = await supabase
      .from("users")
      .select("role, is_active")
      .eq("id", user.id)
      .maybeSingle()

    const hasAdminAccess =
      userData &&
      userData.is_active &&
      (userData.role === ROLES.SUPER_ADMIN || userData.role === ROLES.ADMIN)

    if (!hasAdminAccess) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = "/dashboard"
      return NextResponse.redirect(redirectUrl)
    }
  }

  // --- Security headers ---

  supabaseResponse.headers.set("X-Frame-Options", "DENY")
  supabaseResponse.headers.set("X-Content-Type-Options", "nosniff")
  supabaseResponse.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")

  // IMPORTANT: Return the supabaseResponse with updated cookies
  return supabaseResponse
}

// Match all routes except static assets
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
}
