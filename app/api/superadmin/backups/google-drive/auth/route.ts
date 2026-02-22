import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const GOOGLE_REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL + "/api/superadmin/backups/google-drive/callback"

export async function GET(request: NextRequest) {
  try {

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      console.error(
        "[v0] Google Drive credentials missing. GOOGLE_CLIENT_ID:",
        !!GOOGLE_CLIENT_ID,
        "GOOGLE_CLIENT_SECRET:",
        !!GOOGLE_CLIENT_SECRET,
      )
      return NextResponse.json(
        {
          error:
            "Google Drive integration not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.",
        },
        { status: 500 },
      )
    }

    // Generate Google OAuth URL
    const scopes = ["https://www.googleapis.com/auth/drive.file", "https://www.googleapis.com/auth/drive.appdata"]

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID!,
      redirect_uri: GOOGLE_REDIRECT_URI!,
      response_type: "code",
      scope: scopes.join(" "),
      access_type: "offline",
      prompt: "consent",
    }).toString()}`

    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error("[v0] Google Drive auth error:", error)
    return NextResponse.json({ error: "Failed to generate auth URL" }, { status: 500 })
  }
}

// Function to handle Google Drive OAuth callback
export async function POST(request: NextRequest) {
  try {

    const { code, state } = await request.json()

    if (!code || !state) {
      console.error("[v0] Missing code or state in callback")
      return NextResponse.json({ error: "Missing code or state" }, { status: 400 })
    }

    // Exchange code for access token and refresh token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        redirect_uri: GOOGLE_REDIRECT_URI!,
        grant_type: "authorization_code",
      }).toString(),
    })

    const tokens = await tokenResponse.json()

    if (tokens.error) {
      console.error("[v0] Error exchanging code for tokens:", tokens.error)
      return NextResponse.json({ error: tokens.error }, { status: 500 })
    }

    // Store tokens in Supabase for the user
    const supabase = await createAdminClient()

    const { error: updateError } = await supabase
      .from("user_backups")
      .update({ google_access_token: tokens.access_token, google_refresh_token: tokens.refresh_token })
      .eq("user_id", state)

    if (updateError) {
      console.error("[v0] Error updating user tokens:", updateError)
      return NextResponse.json({ error: "Failed to update user tokens" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Google Drive OAuth callback error:", error)
    return NextResponse.json({ error: "Failed to handle OAuth callback" }, { status: 500 })
  }
}
