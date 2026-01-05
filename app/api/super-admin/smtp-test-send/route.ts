import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import nodemailer from "nodemailer"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createAdminClient()

    // Verify super admin
    const authHeader = request.headers.get("cookie")
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userData } = await supabase.from("users").select("is_super_admin").eq("id", user.id).single()

    if (!userData?.is_super_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { recipient, smtpConfig } = await request.json()

    if (!recipient || !recipient.includes("@")) {
      return NextResponse.json({ error: "Gültige E-Mail-Adresse erforderlich" }, { status: 400 })
    }

    if (!smtpConfig?.host || !smtpConfig?.port) {
      return NextResponse.json({ error: "SMTP-Konfiguration unvollständig" }, { status: 400 })
    }

    // Create nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: Number.parseInt(smtpConfig.port),
      secure: smtpConfig.secure,
      auth:
        smtpConfig.username && smtpConfig.password
          ? {
              user: smtpConfig.username,
              pass: smtpConfig.password,
            }
          : undefined,
    })

    // Send test email
    await transporter.sendMail({
      from: smtpConfig.username || "noreply@effizienz-praxis.de",
      to: recipient,
      subject: "Test-E-Mail von Effizienz Praxis",
      text: "Dies ist eine Test-E-Mail von Ihrem SMTP-Server.",
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Test-E-Mail erfolgreich!</h2>
            <p>Dies ist eine Test-E-Mail von Effizienz Praxis.</p>
            <p>Ihre SMTP-Konfiguration funktioniert korrekt.</p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
            <p style="color: #666; font-size: 12px;">
              Gesendet von: ${smtpConfig.host}:${smtpConfig.port}
            </p>
          </body>
        </html>
      `,
    })

    return NextResponse.json({
      success: true,
      message: "Test-E-Mail erfolgreich über SMTP gesendet",
    })
  } catch (error) {
    console.error("Error sending test email:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Fehler beim Senden der Test-E-Mail" },
      { status: 500 },
    )
  }
}
