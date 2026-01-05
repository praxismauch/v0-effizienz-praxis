import { type NextRequest, NextResponse } from "next/server"
import { sendEmail } from "@/lib/email/send-email"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { timestamp, url, referrer } = body

    // Get super admin emails
    const supabase = await createClient()
    const { data: superAdmins, error } = await supabase
      .from("super_admins")
      .select("email")
      .eq("is_active", true)
      .not("email", "is", null)

    if (error || !superAdmins || superAdmins.length === 0) {
      console.warn("[v0] No super admins found for 404 notification")
      return NextResponse.json({ success: false, message: "No recipients" })
    }

    const adminEmails = superAdmins.map((admin) => admin.email).filter(Boolean) as string[]

    if (adminEmails.length === 0) {
      return NextResponse.json({ success: false, message: "No valid emails" })
    }

    // Format date in German
    const dateFormatter = new Intl.DateTimeFormat("de-DE", {
      dateStyle: "full",
      timeStyle: "long",
      timeZone: "Europe/Berlin",
    })
    const formattedDate = dateFormatter.format(new Date(timestamp))

    // Send email notification
    const emailResult = await sendEmail({
      to: adminEmails,
      subject: "🚨 404-Fehler auf Effizienz-Praxis",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 28px;">🚨 404-Fehler erkannt</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Ein Benutzer hat eine nicht existierende Seite aufgerufen</p>
            </div>
            
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
              <h2 style="color: #667eea; margin-top: 0;">Fehlerdetails</h2>
              
              <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0 0 10px 0;"><strong>🕐 Zeitpunkt:</strong><br/>${formattedDate}</p>
                ${url ? `<p style="margin: 10px 0;"><strong>🔗 Aufgerufene URL:</strong><br/><code style="background: #fff; padding: 5px 10px; border-radius: 3px; display: inline-block; word-break: break-all;">${url}</code></p>` : ""}
                ${referrer ? `<p style="margin: 10px 0 0 0;"><strong>📍 Referrer:</strong><br/><code style="background: #fff; padding: 5px 10px; border-radius: 3px; display: inline-block; word-break: break-all;">${referrer}</code></p>` : ""}
              </div>

              <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #856404;"><strong>⚠️ Empfohlene Maßnahmen:</strong></p>
                <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #856404;">
                  <li>Prüfen Sie, ob wichtige Links defekt sind</li>
                  <li>Überprüfen Sie Navigation und Menüs</li>
                  <li>Aktualisieren Sie die Sitemap falls nötig</li>
                  <li>Erstellen Sie ggf. eine Weiterleitung</li>
                </ul>
              </div>

              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                <p style="color: #666; font-size: 14px; margin: 0;">
                  Diese Benachrichtigung wurde automatisch vom Effizienz-Praxis System generiert.
                </p>
              </div>
            </div>
            
            <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
              <p style="margin: 0;">© ${new Date().getFullYear()} Effizienz-Praxis • Ihr System für effiziente Praxisverwaltung</p>
            </div>
          </body>
        </html>
      `,
    })

    if (!emailResult.success) {
      console.error("[v0] Failed to send 404 notification email:", emailResult.error)
    }

    return NextResponse.json({ success: emailResult.success })
  } catch (error) {
    console.error("[v0] Error in 404 notification handler:", error)
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 })
  }
}
