import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { sendEmail, isEmailConfigured } from "@/lib/email/send-email"

export async function POST(request: Request) {
  try {
    const { to, subject, html } = await request.json()

    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: "Empfänger, Betreff und HTML-Inhalt erforderlich" },
        { status: 400 }
      )
    }

    if (!(await isEmailConfigured())) {
      return NextResponse.json(
        { error: "E-Mail-Service nicht konfiguriert" },
        { status: 500 }
      )
    }

    const recipients = Array.isArray(to) ? to : [to]
    const results = await Promise.allSettled(
      recipients.map((recipient: string) =>
        sendEmail({ to: recipient, subject, html })
      )
    )

    const successful = results.filter(
      (r) => r.status === "fulfilled" && (r.value as any).success
    ).length
    const failed = recipients.length - successful

    const supabase = await createAdminClient()
    await supabase.from("system_logs").insert({
      level: failed > 0 ? "warning" : "info",
      message: `Custom email sent: ${successful}/${recipients.length} erfolgreich, Betreff: "${subject}"`,
      metadata: {
        recipients,
        subject,
        successful,
        failed,
        timestamp: new Date().toISOString(),
      },
    })

    return NextResponse.json({
      success: successful > 0,
      message: `${successful} von ${recipients.length} E-Mails gesendet${failed > 0 ? ` (${failed} fehlgeschlagen)` : ""}`,
      successful,
      failed,
    })
  } catch (error) {
    console.error("Error sending custom email:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Fehler beim Senden" },
      { status: 500 }
    )
  }
}
