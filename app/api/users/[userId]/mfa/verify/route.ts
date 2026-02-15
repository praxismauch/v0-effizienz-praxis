import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import * as OTPAuth from "otpauth"

// Verify TOTP code and enable MFA
export async function POST(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params
    const supabase = await createServerClient()
    const { code, secret } = await request.json()

    if (!code || !secret) {
      return NextResponse.json({ error: "Code und Geheimnis erforderlich" }, { status: 400 })
    }

    // Verify user is authenticated
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }

    // Verify the TOTP code
    const totp = new OTPAuth.TOTP({
      issuer: "Effizienz Praxis",
      label: "User",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret),
    })

    const delta = totp.validate({ token: code, window: 1 })

    if (delta === null) {
      return NextResponse.json({ error: "Ungültiger Verifizierungscode" }, { status: 400 })
    }

    // Store the secret and enable MFA
    // Note: In production, you should encrypt the secret before storing
    const { error: updateError } = await supabase
      .from("users")
      .update({
        mfa_enabled: true,
        preferences: supabase.sql`COALESCE(preferences, '{}'::jsonb) || '{"mfa_secret": "${secret}"}'::jsonb`,
      })
      .eq("id", userId)

    if (updateError) {
      console.error("Error enabling MFA:", updateError)
      return NextResponse.json({ error: "Fehler beim Aktivieren von 2FA" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "2FA erfolgreich aktiviert" })
  } catch (error) {
    console.error("Error verifying MFA:", error)
    return NextResponse.json({ error: "Fehler bei der Verifizierung" }, { status: 500 })
  }
}
