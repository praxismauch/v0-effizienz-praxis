import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/email/send-email"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, name, practice_name, practice_type, phone, message } = body

    // Validate required field
    if (!email) {
      return NextResponse.json({ error: "E-Mail-Adresse ist erforderlich" }, { status: 400 })
    }

    const supabase = await createAdminClient()

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
        // Unique constraint violation - email already exists
        return NextResponse.json({ error: "Diese E-Mail-Adresse ist bereits registriert." }, { status: 409 })
      }
      throw insertError
    }

    console.log("[v0] Waitlist entry created:", waitlistEntry.id)

    try {
      const { data: superAdmins, error: adminError } = await supabase
        .from("users")
        .select("email, name")
        .or("role.eq.super_admin,role.eq.superadmin")

      if (adminError) {
        console.error("[v0] Error fetching super admins:", adminError)
      } else if (superAdmins && superAdmins.length > 0) {
        console.log(`[v0] Sending notification to ${superAdmins.length} super admin(s)`)

        const adminEmails = superAdmins.map((admin) => admin.email).filter(Boolean) as string[]

        if (adminEmails.length > 0) {
          console.log("[v0] Sending email to", adminEmails.join(", "))

          const emailResult = await sendEmail({
            to: adminEmails,
            subject: "🎉 Neue Wartelisten-Registrierung",
            html: `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8">
                  <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
                    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                    .info-block { background: white; padding: 20px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #667eea; }
                    .label { font-weight: 600; color: #4b5563; margin-bottom: 5px; }
                    .value { color: #1f2937; margin-bottom: 15px; }
                    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
                    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header">
                      <h1 style="margin: 0; font-size: 28px;">Neue Wartelisten-Registrierung</h1>
                      <p style="margin: 10px 0 0 0; opacity: 0.9;">Ein neuer Interessent hat sich für Effizienz Praxis registriert</p>
                    </div>
                    <div class="content">
                      <div class="info-block">
                        <div class="label">📧 E-Mail-Adresse</div>
                        <div class="value">${email}</div>
                        
                        ${name ? `<div class="label">👤 Name</div><div class="value">${name}</div>` : ""}
                        
                        ${practice_name ? `<div class="label">🏥 Praxisname</div><div class="value">${practice_name}</div>` : ""}
                        
                        ${practice_type ? `<div class="label">🔬 Fachbereich</div><div class="value">${practice_type}</div>` : ""}
                        
                        ${phone ? `<div class="label">📞 Telefon</div><div class="value">${phone}</div>` : ""}
                        
                        ${message ? `<div class="label">💬 Nachricht</div><div class="value">${message}</div>` : ""}
                        
                        <div class="label">📅 Registriert am</div>
                        <div class="value">${new Date().toLocaleString("de-DE", {
                          dateStyle: "long",
                          timeStyle: "short",
                        })}</div>
                      </div>
                      
                      <div style="text-align: center;">
                        <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://effizienz-praxis.de"}/super-admin?tab=waitlist" class="button">
                          Warteliste anzeigen
                        </a>
                      </div>
                    </div>
                    <div class="footer">
                      <p>Diese E-Mail wurde automatisch von Effizienz Praxis gesendet.</p>
                    </div>
                  </div>
                </body>
              </html>
            `,
            replyTo: email,
          })

          if (emailResult.success) {
            console.log("[v0] Super admin notification sent successfully")
          } else {
            console.warn("[v0] Failed to send email notification (non-critical):", emailResult.error)
          }
        }
      }
    } catch (emailError) {
      console.warn("[v0] Email notification error (non-critical):", emailError)
    }

    try {
      const confirmation = await sendEmail({
        to: email,
        subject: "Bestätigung Ihrer Registrierung für Effizienz Praxis",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                .message-box { background: white; padding: 25px; border-radius: 6px; border-left: 4px solid #667eea; }
                .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0; font-size: 28px;">Willkommen bei Effizienz Praxis</h1>
                  <p style="margin: 10px 0 0 0; opacity: 0.9;">Ihre Registrierung wurde erfolgreich bestätigt</p>
                </div>
                <div class="content">
                  <div class="message-box">
                    <p>Guten Tag${name ? " " + name : ""},</p>
                    <p>vielen Dank für Ihre Registrierung für die Warteliste von <strong>Effizienz Praxis</strong>.</p>
                    <p>Wir melden uns bei Ihnen, sobald wir mit dem Early Access starten.</p>
                    <p>Viele Grüße<br/>Ihr Effizienz-Praxis-Team</p>
                  </div>
                </div>
                <div class="footer">
                  <p>Diese E-Mail wurde automatisch von Effizienz Praxis gesendet.</p>
                </div>
              </div>
            </body>
          </html>
        `,
        replyTo: "info@effizient-praxis.de",
      })

      if (!confirmation.success) {
        console.warn("[v0] Failed to send confirmation email:", confirmation.error)
      } else {
        console.log("[v0] Confirmation email sent successfully to", email)
      }
    } catch (err) {
      console.warn("[v0] Confirmation email error (non-critical):", err)
    }

    return NextResponse.json({
      success: true,
      message: "Registrierung erfolgreich",
      id: waitlistEntry.id,
    })
  } catch (error) {
    console.error("[v0] Error in waitlist submit route:", error)
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut." },
      { status: 500 },
    )
  }
}
