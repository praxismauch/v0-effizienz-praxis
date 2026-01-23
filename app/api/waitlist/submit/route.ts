import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { sendEmailWithResend } from "@/lib/email/send-email"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, name, practice_name, practice_type, phone, message } = body

    if (!email) {
      return NextResponse.json({ error: "E-Mail-Adresse ist erforderlich" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // Check for existing email
    const { data: existingEntry } = await supabase.from("waitlist").select("id").eq("email", email).maybeSingle()

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
        source: "coming_soon_page",
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

    // Send confirmation email using Resend
    try {
      const displayName = name || practice_name || email

      await sendEmailWithResend({
        to: email,
        subject: "Willkommen auf der Effizienz Praxis Warteliste!",
        html: `
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
                  Hallo${name ? ` ${name}` : ""},
                </p>
                
                <p style="color: #4b5563; font-size: 16px;">
                  wir freuen uns sehr, dass Sie sich für <strong>Effizienz Praxis</strong> interessieren!
                </p>
                
                <p style="color: #4b5563; font-size: 16px;">
                  Sie wurden erfolgreich auf unsere Warteliste aufgenommen und gehören zu den Ersten, die über den Launch unserer Praxismanagement-Software informiert werden.
                </p>
                
                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 30px 0;">
                  <h3 style="color: #1f2937; margin-top: 0; font-size: 18px;">Was Sie erwartet:</h3>
                  <ul style="color: #4b5563; margin: 10px 0; padding-left: 20px;">
                    <li style="margin: 8px 0;">✅ Exklusiver Early Access vor dem offiziellen Launch</li>
                    <li style="margin: 8px 0;">✅ Sonderkonditionen für Early Birds</li>
                    <li style="margin: 8px 0;">✅ Persönliche Einrichtung und Support</li>
                    <li style="margin: 8px 0;">✅ Ihre Wünsche fließen in die Entwicklung ein</li>
                  </ul>
                </div>
                
                ${
                  practice_name
                    ? `<p style="color: #4b5563; font-size: 16px;">
                  Wir haben Ihre Praxis <strong>${practice_name}</strong> registriert und werden Sie persönlich kontaktieren, sobald wir verfügbar sind.
                </p>`
                    : ""
                }
                
                <p style="color: #4b5563; font-size: 16px;">
                  Bei Fragen oder Anregungen können Sie uns jederzeit unter <a href="mailto:info@effizienz-praxis.de" style="color: #667eea; text-decoration: none;">info@effizienz-praxis.de</a> erreichen.
                </p>
                
                <p style="color: #4b5563; font-size: 16px; margin-top: 30px;">
                  Beste Grüße,<br>
                  <strong>Ihr Effizienz Praxis Team</strong>
                </p>
              </div>
              
              <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 14px;">
                <p style="margin: 0;">© 2026 Effizienz Praxis. Alle Rechte vorbehalten.</p>
                <p style="margin: 10px 0 0 0;">
                  <a href="https://effizienz-praxis.de" style="color: #667eea; text-decoration: none;">Website</a> |
                  <a href="https://effizienz-praxis.de/datenschutz" style="color: #667eea; text-decoration: none;">Datenschutz</a>
                </p>
              </div>
            </body>
          </html>
        `,
        text: `
Willkommen auf der Effizienz Praxis Warteliste!

Hallo${name ? ` ${name}` : ""},

wir freuen uns sehr, dass Sie sich für Effizienz Praxis interessieren!

Sie wurden erfolgreich auf unsere Warteliste aufgenommen und gehören zu den Ersten, die über den Launch unserer Praxismanagement-Software informiert werden.

Was Sie erwartet:
- Exklusiver Early Access vor dem offiziellen Launch
- Sonderkonditionen für Early Birds
- Persönliche Einrichtung und Support
- Ihre Wünsche fließen in die Entwicklung ein

${practice_name ? `Wir haben Ihre Praxis ${practice_name} registriert und werden Sie persönlich kontaktieren, sobald wir verfügbar sind.` : ""}

Bei Fragen oder Anregungen können Sie uns jederzeit unter info@effizienz-praxis.de erreichen.

Beste Grüße,
Ihr Effizienz Praxis Team

---
© 2026 Effizienz Praxis. Alle Rechte vorbehalten.
Website: https://effizienz-praxis.de
        `.trim(),
      })

      console.log("[v0] Confirmation email sent to", email)
    } catch (emailError) {
      // Log error but don't fail the registration
      console.error("[v0] Failed to send confirmation email:", emailError)
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
