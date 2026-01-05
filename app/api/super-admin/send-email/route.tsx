import { NextResponse } from "next/server"
import { sendEmail, isEmailConfigured } from "@/lib/email/send-email"

export async function POST(request: Request) {
  try {
    const { recipients, subject, message } = await request.json()

    // Validate input
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: "Recipients are required" }, { status: 400 })
    }

    if (!subject || !message) {
      return NextResponse.json({ error: "Subject and message are required" }, { status: 400 })
    }

    // Check if SMTP is configured
    if (!(await isEmailConfigured())) {
      return NextResponse.json(
        {
          error:
            "E-Mail-Service nicht konfiguriert. Bitte SMTP-Einstellungen in den Systemeinstellungen konfigurieren.",
        },
        { status: 500 },
      )
    }

    // Send emails to all recipients
    const emailPromises = recipients.map((recipient) =>
      sendEmail({
        to: recipient,
        subject: subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
              ${message
                .split("\n")
                .map((line: string) => `<p style="margin: 10px 0;">${line}</p>`)
                .join("")}
            </div>
          </div>
        `,
      }),
    )

    const results = await Promise.allSettled(emailPromises)

    // Count successful and failed emails
    const successful = results.filter((r) => r.status === "fulfilled" && (r.value as any).success).length
    const failed = results.filter((r) => r.status === "rejected" || !(r.value as any).success).length

    if (failed > 0) {
      console.error(
        "Some emails failed to send:",
        results.filter((r) => r.status === "rejected" || !(r.value as any).success),
      )
    }

    return NextResponse.json({
      success: successful > 0,
      message: `E-Mail an ${successful} Empfänger gesendet${failed > 0 ? `, ${failed} fehlgeschlagen` : ""}`,
      successful,
      failed,
      total: recipients.length,
    })
  } catch (error) {
    console.error("Error sending email:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send email" },
      { status: 500 },
    )
  }
}
