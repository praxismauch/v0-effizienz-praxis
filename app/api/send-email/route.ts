import { type NextRequest, NextResponse } from "next/server"
import { sendEmail } from "@/lib/email/send-email"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, subject, text, html } = body

    // Validate required fields
    if (!to || !subject) {
      return NextResponse.json({ error: "Missing required fields: 'to' and 'subject' are required" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const recipients = Array.isArray(to) ? to : [to]

    for (const email of recipients) {
      if (!emailRegex.test(email)) {
        return NextResponse.json({ error: `Invalid email address: ${email}` }, { status: 400 })
      }
    }

    // Generate HTML from text if no HTML provided
    const htmlContent = html || (text ? `<p>${text.replace(/\n/g, "<br>")}</p>` : "")

    if (!htmlContent && !text) {
      return NextResponse.json({ error: "Either 'text' or 'html' content is required" }, { status: 400 })
    }

    // Send email via Hostinger SMTP
    const result = await sendEmail({
      to,
      subject,
      html: htmlContent,
    })

    if (!result.success) {
      console.error("Failed to send email:", result.error)
      return NextResponse.json({ error: result.error || "Failed to send email" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    })
  } catch (error) {
    console.error("Error in send-email API route:", error)
    return NextResponse.json({ error: "Internal server error while sending email" }, { status: 500 })
  }
}
