import { createServerClient } from "@supabase/ssr"
import { createAdminClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { validateCsrf } from "@/lib/api/csrf"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    // Validate CSRF token first
    const csrfValidation = await validateCsrf(request)
    if (!csrfValidation.valid) {
      console.error("[auth/logout] Logout blocked - CSRF validation failed")
      return csrfValidation.response
    }

    const cookieStore = await cookies()

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const response = NextResponse.json({ success: true })

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, {
              ...options,
              httpOnly: true,
              secure: true,
              sameSite: "lax",
              path: "/",
            })
          })
        },
      },
    })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Sign out from Supabase (this will clear the session)
    await supabase.auth.signOut({ scope: "global" })

    if (user?.id) {
      try {
        const adminClient = await createAdminClient()
        await adminClient.auth.admin.signOut(user.id)
      } catch (adminError) {
        console.error("[auth/logout] CRITICAL: Failed to revoke tokens for user", user.id, adminError)
        // Log this as a security concern but continue with logout
        // The client-side session will still be cleared
        // NOTE: In production, consider alerting on this error
      }
    }

    const allCookies = cookieStore.getAll()
    allCookies.forEach((cookie) => {
      // Clear all Supabase cookies
      if (cookie.name.startsWith("sb-") || cookie.name.includes("supabase")) {
        response.cookies.set(cookie.name, "", {
          expires: new Date(0),
          maxAge: 0,
          path: "/",
          httpOnly: true,
          secure: true,
          sameSite: "lax",
        })
      }
    })

    const supabaseProjectRef = supabaseUrl.split("//")[1]?.split(".")[0] || ""
    const commonCookieNames = [
      `sb-${supabaseProjectRef}-auth-token`,
      `sb-${supabaseProjectRef}-auth-token-code-verifier`,
      "sb-access-token",
      "sb-refresh-token",
      "effizienz_session",
    ]

    commonCookieNames.forEach((name) => {
      response.cookies.set(name, "", {
        expires: new Date(0),
        maxAge: 0,
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "lax",
      })
    })

    return response
  } catch (error) {
    console.error("[auth/logout] Error:", error)
    return NextResponse.json({ error: "Logout failed" }, { status: 500 })
  }
}
