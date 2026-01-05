import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { practiceId } = await req.json()

    const scopes = [
      "https://www.googleapis.com/auth/drive.readonly",
      "https://www.googleapis.com/auth/drive.metadata.readonly",
    ]

    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/external-data/google-drive/callback`,
      response_type: "code",
      scope: scopes.join(" "),
      access_type: "offline",
      state: practiceId,
      prompt: "consent",
    })

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`

    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error("[v0] Google Drive connect error:", error)
    return NextResponse.json({ error: "Failed to generate auth URL" }, { status: 500 })
  }
}
