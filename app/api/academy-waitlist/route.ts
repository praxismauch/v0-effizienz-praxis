import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { sendEmailWithResend } from "@/lib/email/send-email"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: "E-Mail-Adresse ist erforderlich" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Ungültige E-Mail-Adresse" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // Check for existing email
    const { data: existingEntry } = await supabase
      .from("waitlist")
      .select("id")
      .eq("email", email)
      .maybeSingle()

    if (existingEntry) {
      return NextResponse.json({ error: "Diese E-Mail-Adresse ist bereits registriert." }, { status: 409 })
    }

    // Insert new entry
    const { data: waitlistEntry, error: insertError } = await supabase
      .from("waitlist")
      .insert({
        email,
        source: "academy_coming_soon",
        status: "pending",
      })
      .select()
      .single()

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json({ error: "Diese E-Mail-Adresse ist bereits registriert." }, { status: 409 })
      }
      console.error("Academy waitlist insert error:", insertError)
      throw insertError
    }

    // Send confirmation email using Resend
    try {
      const emailResult = await sendEmailWithResend({
        to: email,
        subject: "Willkommen auf der Effizienz-Academy Warteliste",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #ffffff; padding: 30px 20px; border: 1px solid #e5e7eb; border-top: none; }
                .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
                .button { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                .highlight { background: #f3f4f6; padding: 15px; border-left: 4px solid #6366f1; margin: 20px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0; font-size: 28px;">🎓 Effizienz-Academy</h1>
                  <p style="margin: 10px 0 0 0; opacity: 0.9;">Ihre Anmeldung war erfolgreich!</p>
                </div>
                <div class="content">
                  <h2>Vielen Dank für Ihr Interesse!</h2>
                  <p>Sie haben sich erfolgreich für die Warteliste der <strong>Effizienz-Academy</strong> angemeldet.</p>
                  
                  <div class="highlight">
                    <strong>Was erwartet Sie?</strong>
                    <ul>
                      <li>Strukturierte Kurse für mehr Effizienz in der Praxis</li>
                      <li>KI-gestützte Lernempfehlungen</li>
                      <li>Gamification mit XP-Punkten und Achievements</li>
                      <li>Praktische Übungen und direkt anwendbares Wissen</li>
                    </ul>
                  </div>

                  <p>Wir informieren Sie per E-Mail, sobald die Academy verfügbar ist. Sie gehören zu den Ersten, die Zugang erhalten!</p>

                  <p style="margin-top: 30px;">Mit freundlichen Grüßen,<br><strong>Ihr Effizienz-Praxis Team</strong></p>
                </div>
                <div class="footer">
                  <p>Diese E-Mail wurde automatisch generiert.</p>
                  <p>&copy; ${new Date().getFullYear()} Effizienz Praxis. Alle Rechte vorbehalten.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      })

      if (!emailResult.success) {
        console.warn("Failed to send confirmation email:", emailResult.error)
        // Continue anyway - waitlist entry was successful
      }
    } catch (emailError) {
      console.error("Error sending confirmation email:", emailError)
      // Continue anyway - waitlist entry was successful
    }

    return NextResponse.json({
      success: true,
      message: "Registrierung erfolgreich",
      id: waitlistEntry.id,
    })
  } catch (error) {
    console.error("Academy waitlist error:", error)
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut." },
      { status: 500 },
    )
  }
}
