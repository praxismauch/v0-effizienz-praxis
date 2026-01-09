import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const redirectTo = requestUrl.searchParams.get("redirectTo") || "/dashboard"
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createServerClient()

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      console.log("[v0] [auth/callback] Successfully exchanged code for session")
      return NextResponse.redirect(`${origin}${redirectTo}`)
    } else {
      console.error("[v0] [auth/callback] Error exchanging code:", error.message)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login`)
}
