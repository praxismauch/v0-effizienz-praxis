import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import * as OTPAuth from "otpauth"
import { decrypt } from "@/lib/encryption"

// Disable MFA for the user
export async function POST(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params
    const supabase = await createServerClient()
    const { code } = await request.json()

    // Verify user is authenticated
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }

    // Get the user's MFA secret
    const { data: userData, error: fetchError } = await supabase
      .from("users")
      .select("preferences, mfa_enabled")
      .eq("id", userId)
      .single()

    if (fetchError || !userData) {
      return NextResponse.json({ error: "Benutzer nicht gefunden" }, { status: 404 })
    }

    if (!userData.mfa_enabled) {
      return NextResponse.json({ error: "2FA ist nicht aktiviert" }, { status: 400 })
    }

    const encryptedSecret = userData.preferences?.mfa_secret

    if (code && encryptedSecret) {
      // Decrypt the secret before verification
      const secret = decrypt(encryptedSecret)

      // Verify the TOTP code before disabling
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
    }

    // Disable MFA and remove secret
    const { error: updateError } = await supabase
      .from("users")
      .update({
        mfa_enabled: false,
        preferences: supabase.sql`COALESCE(preferences, '{}'::jsonb) - 'mfa_secret'`,
      })
      .eq("id", userId)

    if (updateError) {
      console.error("Error disabling MFA:", updateError)
      return NextResponse.json({ error: "Fehler beim Deaktivieren von 2FA" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "2FA erfolgreich deaktiviert" })
  } catch (error) {
    console.error("Error disabling MFA:", error)
    return NextResponse.json({ error: "Fehler beim Deaktivieren" }, { status: 500 })
  }
}
