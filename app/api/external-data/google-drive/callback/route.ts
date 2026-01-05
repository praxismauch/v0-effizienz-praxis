import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const code = searchParams.get("code")
    const state = searchParams.get("state") // practiceId

    if (!code || !state) {
      return new NextResponse("Missing code or state", { status: 400 })
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/external-data/google-drive/callback`,
        grant_type: "authorization_code",
      }),
    })

    const tokens = await tokenResponse.json()

    if (!tokenResponse.ok) {
      console.error("[v0] Token exchange failed:", tokens)
      return new NextResponse("Failed to exchange token", { status: 500 })
    }

    // Store tokens in database
    const supabase = await createClient()

    const { error } = await supabase.from("google_drive_credentials").upsert({
      practice_id: state,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expiry: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000).toISOString() : null,
      scope: tokens.scope,
      updated_at: new Date().toISOString(),
    })

    if (error) {
      console.error("[v0] Failed to store credentials:", error)
      return new NextResponse("Failed to store credentials", { status: 500 })
    }

    // Close the popup window
    return new NextResponse(
      `
      <html>
        <body>
          <script>
            window.opener.postMessage({ type: 'google-drive-connected' }, '*');
            window.close();
          </script>
          <p>Verbindung erfolgreich! Dieses Fenster kann geschlossen werden.</p>
        </body>
      </html>
    `,
      {
        headers: { "Content-Type": "text/html" },
      },
    )
  } catch (error) {
    console.error("[v0] Google Drive callback error:", error)
    return new NextResponse("Authentication failed", { status: 500 })
  }
}
