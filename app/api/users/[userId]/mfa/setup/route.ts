import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import * as OTPAuth from "otpauth"

// Generate a new TOTP secret for the user
export async function POST(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params
    const supabase = await createServerClient()

    // Verify user is authenticated
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }

    // Get user info for the label
    const { data: userData, error: fetchError } = await supabase
      .from("users")
      .select("email, name")
      .eq("id", userId)
      .single()

    if (fetchError || !userData) {
      return NextResponse.json({ error: "Benutzer nicht gefunden" }, { status: 404 })
    }

    // Generate a new TOTP secret
    const totp = new OTPAuth.TOTP({
      issuer: "Effizienz Praxis",
      label: userData.email || userData.name || "User",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.generate(20),
    })

    // Get the secret in base32 format
    const secret = totp.secret.base32

    // Generate the otpauth URI for QR code
    const otpauthUrl = totp.toString()

    return NextResponse.json({
      secret,
      otpauthUrl,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`,
    })
  } catch (error) {
    console.error("Error generating MFA secret:", error)
    return NextResponse.json({ error: "Fehler beim Generieren des 2FA-Geheimnisses" }, { status: 500 })
  }
}
