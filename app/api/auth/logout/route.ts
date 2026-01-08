import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST() {
  try {
    const cookieStore = await cookies()

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

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
            response.cookies.set(name, value, options)
          })
        },
      },
    })

    // Sign out from Supabase (this will clear the session)
    await supabase.auth.signOut({ scope: "global" })

    const allCookies = cookieStore.getAll()
    allCookies.forEach((cookie) => {
      // Clear all Supabase cookies
      if (cookie.name.startsWith("sb-") || cookie.name.includes("supabase")) {
        response.cookies.set(cookie.name, "", {
          expires: new Date(0),
          maxAge: 0,
          path: "/",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
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
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      })
    })

    return response
  } catch (error) {
    console.error("[auth/logout] Error:", error)
    return NextResponse.json({ error: "Logout failed" }, { status: 500 })
  }
}
