import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const GOOGLE_REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL + "/api/superadmin/backups/google-drive/callback"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get("code")
    const state = searchParams.get("state") // User ID
    const error = searchParams.get("error")

    if (error) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/super-admin?error=${error}`)
    }

    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/super-admin?error=missing_code`)
    }

    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    })

    const tokens = await tokenResponse.json()

    if (!tokens.access_token) {
      throw new Error("No access token received")
    }

    const supabase = await createAdminClient()

    const { data: user } = await supabase.from("users").select("id, practice_id").eq("id", state).single()

    if (!user) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/super-admin?error=user_not_found`)
    }

    // Calculate token expiry
    const expiresIn = tokens.expires_in || 3600
    const tokenExpiry = new Date(Date.now() + expiresIn * 1000).toISOString()

    const { error: storeError } = await supabase.from("google_drive_credentials").upsert({
      user_id: state,
      practice_id: user.practice_id || null,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expiry: tokenExpiry,
      scope: tokens.scope,
      created_by: state,
      updated_at: new Date().toISOString(),
    })

    if (storeError) {
      console.error("[v0] Error storing credentials:", storeError)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/super-admin?error=store_failed`)
    }

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/super-admin?success=google_drive_connected`)
  } catch (error) {
    console.error("[v0] Google Drive callback error:", error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/super-admin?error=callback_failed`)
  }
}
