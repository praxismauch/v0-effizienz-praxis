import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { sendEmailWithResend } from "@/lib/email/send-email"

// =============================================================================
// UNIFIED WAITLIST API
// Consolidates: /api/waitlist/submit and /api/academy-waitlist
// =============================================================================

type WaitlistSource = "coming_soon_page" | "academy_coming_soon" | "landing_page" | "other"

interface WaitlistRequest {
  email: string
  name?: string
  practice_name?: string
  practice_type?: string
  phone?: string
  message?: string
  source?: WaitlistSource
}

const EMAIL_TEMPLATES: Record<WaitlistSource, { subject: string; getHtml: (data: WaitlistRequest) => string; getText: (data: WaitlistRequest) => string }> = {
  coming_soon_page: {
    subject: "Willkommen auf der Effizienz Praxis Warteliste!",
    getHtml: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Effizienz Praxis</h1>
          </div>
          
          <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1f2937; margin-top: 0;">Vielen Dank für Ihr Interesse!</h2>
            
            <p style="color: #4b5563; font-size: 16px;">
              Hallo${data.name ? ` ${data.name}` : ""},
            </p>
            
            <p style="color: #4b5563; font-size: 16px;">
              wir freuen uns sehr, dass Sie sich für <strong>Effizienz Praxis</strong> interessieren!
            </p>
            
            <p style="color: #4b5563; font-size: 16px;">
              Sie wurden erfolgreich auf unsere Warteliste aufgenommen.
            </p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 30px 0;">
              <h3 style="color: #1f2937; margin-top: 0; font-size: 18px;">Was Sie erwartet:</h3>
              <ul style="color: #4b5563; margin: 10px 0; padding-left: 20px;">
                <li style="margin: 8px 0;">Exklusiver Early Access</li>
                <li style="margin: 8px 0;">Sonderkonditionen für Early Birds</li>
                <li style="margin: 8px 0;">Persönliche Einrichtung und Support</li>
              </ul>
            </div>
            
            ${data.practice_name ? `<p style="color: #4b5563; font-size: 16px;">Wir haben Ihre Praxis <strong>${data.practice_name}</strong> registriert.</p>` : ""}
            
            <p style="color: #4b5563; font-size: 16px; margin-top: 30px;">
              Beste Grüße,<br>
              <strong>Ihr Effizienz Praxis Team</strong>
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 14px;">
            <p style="margin: 0;">© ${new Date().getFullYear()} Effizienz Praxis. Alle Rechte vorbehalten.</p>
          </div>
        </body>
      </html>
    `,
    getText: (data) => `
Willkommen auf der Effizienz Praxis Warteliste!

Hallo${data.name ? ` ${data.name}` : ""},

wir freuen uns sehr, dass Sie sich für Effizienz Praxis interessieren!

Sie wurden erfolgreich auf unsere Warteliste aufgenommen.

Was Sie erwartet:
- Exklusiver Early Access
- Sonderkonditionen für Early Birds
- Persönliche Einrichtung und Support

${data.practice_name ? `Wir haben Ihre Praxis ${data.practice_name} registriert.` : ""}

Beste Grüße,
Ihr Effizienz Praxis Team
    `.trim(),
  },
  academy_coming_soon: {
    subject: "Willkommen auf der Effizienz-Academy Warteliste",
    getHtml: () => `
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
            .highlight { background: #f3f4f6; padding: 15px; border-left: 4px solid #6366f1; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">Effizienz-Academy</h1>
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

              <p>Wir informieren Sie per E-Mail, sobald die Academy verfügbar ist.</p>

              <p style="margin-top: 30px;">Mit freundlichen Grüßen,<br><strong>Ihr Effizienz-Praxis Team</strong></p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Effizienz Praxis. Alle Rechte vorbehalten.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    getText: () => `
Willkommen auf der Effizienz-Academy Warteliste!

Vielen Dank für Ihr Interesse!

Sie haben sich erfolgreich für die Warteliste der Effizienz-Academy angemeldet.

Was erwartet Sie?
- Strukturierte Kurse für mehr Effizienz in der Praxis
- KI-gestützte Lernempfehlungen
- Gamification mit XP-Punkten und Achievements
- Praktische Übungen und direkt anwendbares Wissen

Wir informieren Sie per E-Mail, sobald die Academy verfügbar ist.

Mit freundlichen Grüßen,
Ihr Effizienz-Praxis Team
    `.trim(),
  },
  landing_page: {
    subject: "Willkommen auf der Effizienz Praxis Warteliste!",
    getHtml: (data) => EMAIL_TEMPLATES.coming_soon_page.getHtml(data),
    getText: (data) => EMAIL_TEMPLATES.coming_soon_page.getText(data),
  },
  other: {
    subject: "Willkommen auf der Effizienz Praxis Warteliste!",
    getHtml: (data) => EMAIL_TEMPLATES.coming_soon_page.getHtml(data),
    getText: (data) => EMAIL_TEMPLATES.coming_soon_page.getText(data),
  },
}

export async function POST(request: Request) {
  try {
    const body: WaitlistRequest = await request.json()
    const { email, name, practice_name, practice_type, phone, message, source = "coming_soon_page" } = body

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
        name: name || null,
        practice_name: practice_name || null,
        practice_type: practice_type || null,
        phone: phone || null,
        message: message || null,
        source,
        status: "pending",
      })
      .select()
      .single()

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json({ error: "Diese E-Mail-Adresse ist bereits registriert." }, { status: 409 })
      }
      console.error("Waitlist insert error:", insertError)
      throw insertError
    }

    // Send confirmation email
    try {
      const template = EMAIL_TEMPLATES[source] || EMAIL_TEMPLATES.other

      await sendEmailWithResend({
        to: email,
        subject: template.subject,
        html: template.getHtml(body),
        text: template.getText(body),
      })

      console.log("[Waitlist] Confirmation email sent to", email)
    } catch (emailError) {
      // Log error but don't fail the registration
      console.error("[Waitlist] Failed to send confirmation email:", emailError)
    }

    return NextResponse.json({
      success: true,
      message: "Registrierung erfolgreich",
      id: waitlistEntry.id,
    })
  } catch (error) {
    console.error("Waitlist error:", error)
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut." },
      { status: 500 },
    )
  }
}
