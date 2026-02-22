import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/email/send-email"

export async function POST(request: NextRequest) {
  try {

    const { recipient } = await request.json()

    if (!recipient || !recipient.includes("@")) {
      return NextResponse.json({ error: "Ungültige E-Mail-Adresse" }, { status: 400 })
    }

    // Send test email
    const result = await sendEmail({
      to: recipient,
      subject: "Test-E-Mail von Effizienz Praxis",
      html: `
        <h2>Test-E-Mail erfolgreich!</h2>
        <p>Diese Test-E-Mail wurde von Ihrem Effizienz Praxis System gesendet.</p>
        <p>Zeitstempel: ${new Date().toLocaleString("de-DE", {
          timeZone: "Europe/Berlin",
          dateStyle: "full",
          timeStyle: "long",
        })}</p>
        <p>Wenn Sie diese E-Mail erhalten haben, funktioniert Ihre E-Mail-Konfiguration korrekt.</p>
      `,
    })

    if (!result.success) {
      console.error("[v0] Test email failed:", result.error)
      return NextResponse.json(
        {
          error: result.error || "E-Mail konnte nicht gesendet werden",
          details: result.error,
        },
        { status: 500 },
      )
    }

    // Added await to createAdminClient
    const adminSupabase = await createAdminClient()
    await adminSupabase.from("system_logs").insert({
      level: "info",
      message: `Test email sent successfully to ${recipient}`,
      metadata: { recipient, timestamp: new Date().toISOString() },
    })

    return NextResponse.json({
      success: true,
      message: "Test-E-Mail erfolgreich gesendet",
    })
  } catch (error) {
    console.error("[v0] Error sending test email:", error)
    return NextResponse.json(
      {
        error: "Fehler beim Senden der Test-E-Mail",
        details: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      { status: 500 },
    )
  }
}
