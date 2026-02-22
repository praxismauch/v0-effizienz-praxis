import { type NextRequest, NextResponse } from "next/server"
import { sendEmail, isEmailConfigured } from "@/lib/email/send-email"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    // Skip entirely if email is not configured
    const emailConfigured = await isEmailConfigured()
    if (!emailConfigured) {
      return NextResponse.json({ success: false, message: "Email not configured" })
    }

    const body = await request.json()
    const {
      timestamp,
      url,
      pathname,
      search,
      hash,
      origin,
      referrer,
      userAgent,
      language,
      languages,
      platform,
      vendor,
      cookiesEnabled,
      online,
      touchPoints,
      deviceMemory,
      hardwareConcurrency,
      screenWidth,
      screenHeight,
      viewportWidth,
      viewportHeight,
      devicePixelRatio,
      colorDepth,
      orientation,
      connectionType,
      connectionDownlink,
      timezone,
      timezoneOffset,
      historyLength,
      performance: perfData,
    } = body

    // Also capture server-side request info
    const forwardedFor = request.headers.get("x-forwarded-for")
    const realIp = request.headers.get("x-real-ip")
    const cfCountry = request.headers.get("cf-ipcountry")
    const cfRay = request.headers.get("cf-ray")
    const acceptLanguage = request.headers.get("accept-language")
    const serverUserAgent = request.headers.get("user-agent")
    const refererHeader = request.headers.get("referer")

    // Get super admin emails from the users table
    const supabase = await createClient()
    const { data: superAdmins, error } = await supabase
      .from("users")
      .select("email")
      .eq("role", "superadmin")
      .eq("is_active", true)
      .not("email", "is", null)

    if (error || !superAdmins || superAdmins.length === 0) {
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
    const formattedDate = dateFormatter.format(new Date(timestamp || Date.now()))

    // Detect device type from touch and screen
    const isMobile = (touchPoints || 0) > 0 && (screenWidth || 0) < 768
    const isTablet = (touchPoints || 0) > 0 && (screenWidth || 0) >= 768
    const deviceType = isMobile ? "Mobil" : isTablet ? "Tablet" : "Desktop"

    // Parse browser from user agent
    const ua = userAgent || serverUserAgent || ""
    let browser = "Unbekannt"
    if (ua.includes("Firefox/")) browser = "Firefox"
    else if (ua.includes("Edg/")) browser = "Edge"
    else if (ua.includes("Chrome/") && !ua.includes("Edg/")) browser = "Chrome"
    else if (ua.includes("Safari/") && !ua.includes("Chrome/")) browser = "Safari"
    else if (ua.includes("Opera/") || ua.includes("OPR/")) browser = "Opera"

    // Build detail row helper
    const row = (label: string, value: string | number | null | undefined) =>
      value != null && value !== ""
        ? `<tr><td style="padding:6px 12px;font-weight:600;color:#555;white-space:nowrap;vertical-align:top;">${label}</td><td style="padding:6px 12px;word-break:break-all;">${value}</td></tr>`
        : ""

    // Send email notification
    const emailResult = await sendEmail({
      to: adminEmails,
      subject: `404-Fehler: ${pathname || url || "Unbekannte Seite"} | Effizienz-Praxis`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 680px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
            
            <div style="background: #dc2626; color: white; padding: 24px 30px; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; font-size: 22px; font-weight: 700;">404 Seite nicht gefunden</h1>
              <p style="margin: 6px 0 0 0; opacity: 0.9; font-size: 14px;">${formattedDate}</p>
            </div>
            
            <div style="background: #ffffff; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 12px 12px; overflow: hidden;">
              
              <!-- URL Details -->
              <div style="padding: 24px 30px; border-bottom: 1px solid #f0f0f0;">
                <h2 style="margin: 0 0 16px 0; font-size: 16px; color: #dc2626;">Aufgerufene URL</h2>
                <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 14px; font-family: monospace; font-size: 13px; word-break: break-all;">
                  ${url || "Unbekannt"}
                </div>
                <table style="width:100%; border-collapse:collapse; margin-top:12px; font-size:13px;">
                  ${row("Pfad", pathname)}
                  ${row("Query", search)}
                  ${row("Hash", hash)}
                  ${row("Origin", origin)}
                  ${row("Referrer", referrer || refererHeader)}
                </table>
              </div>
              
              <!-- Browser & Device -->
              <div style="padding: 24px 30px; border-bottom: 1px solid #f0f0f0;">
                <h2 style="margin: 0 0 16px 0; font-size: 16px; color: #2563eb;">Browser & Gerät</h2>
                <table style="width:100%; border-collapse:collapse; font-size:13px;">
                  ${row("Browser", browser)}
                  ${row("Gerätetyp", deviceType)}
                  ${row("Plattform", platform)}
                  ${row("Sprache", language)}
                  ${row("Sprachen", Array.isArray(languages) && languages.length > 0 ? languages.join(", ") : null)}
                  ${row("Cookies aktiv", cookiesEnabled != null ? (cookiesEnabled ? "Ja" : "Nein") : null)}
                  ${row("Online", online != null ? (online ? "Ja" : "Nein") : null)}
                  ${row("Touch-Punkte", touchPoints)}
                </table>
              </div>

              <!-- Screen -->
              <div style="padding: 24px 30px; border-bottom: 1px solid #f0f0f0;">
                <h2 style="margin: 0 0 16px 0; font-size: 16px; color: #7c3aed;">Bildschirm & Viewport</h2>
                <table style="width:100%; border-collapse:collapse; font-size:13px;">
                  ${row("Bildschirm", screenWidth && screenHeight ? `${screenWidth} x ${screenHeight} px` : null)}
                  ${row("Viewport", viewportWidth && viewportHeight ? `${viewportWidth} x ${viewportHeight} px` : null)}
                  ${row("Pixel Ratio", devicePixelRatio)}
                  ${row("Farbtiefe", colorDepth ? `${colorDepth} bit` : null)}
                  ${row("Orientierung", orientation)}
                </table>
              </div>

              <!-- Hardware & Network -->
              <div style="padding: 24px 30px; border-bottom: 1px solid #f0f0f0;">
                <h2 style="margin: 0 0 16px 0; font-size: 16px; color: #059669;">Hardware & Netzwerk</h2>
                <table style="width:100%; border-collapse:collapse; font-size:13px;">
                  ${row("CPU-Kerne", hardwareConcurrency)}
                  ${row("Geräte-RAM", deviceMemory ? `${deviceMemory} GB` : null)}
                  ${row("Verbindung", connectionType)}
                  ${row("Download", connectionDownlink ? `${connectionDownlink} Mbps` : null)}
                  ${row("Zeitzone", timezone)}
                  ${row("UTC-Offset", timezoneOffset != null ? `UTC${timezoneOffset > 0 ? "-" : "+"}${Math.abs(timezoneOffset / 60)}` : null)}
                </table>
              </div>

              <!-- Server-side Info -->
              <div style="padding: 24px 30px; border-bottom: 1px solid #f0f0f0;">
                <h2 style="margin: 0 0 16px 0; font-size: 16px; color: #d97706;">Server-Kontext</h2>
                <table style="width:100%; border-collapse:collapse; font-size:13px;">
                  ${row("IP (forwarded)", forwardedFor)}
                  ${row("IP (real)", realIp)}
                  ${row("Land (CF)", cfCountry)}
                  ${row("CF-Ray", cfRay)}
                  ${row("Accept-Language", acceptLanguage)}
                  ${row("History-Laenge", historyLength)}
                </table>
              </div>

              <!-- Performance -->
              ${perfData ? `
              <div style="padding: 24px 30px; border-bottom: 1px solid #f0f0f0;">
                <h2 style="margin: 0 0 16px 0; font-size: 16px; color: #0891b2;">Performance</h2>
                <table style="width:100%; border-collapse:collapse; font-size:13px;">
                  ${row("Navigation-Typ", perfData.type)}
                  ${row("Redirects", perfData.redirectCount)}
                  ${row("TTFB", perfData.ttfb != null ? `${perfData.ttfb} ms` : null)}
                  ${row("DOM Content Loaded", perfData.domContentLoaded != null ? `${perfData.domContentLoaded} ms` : null)}
                  ${row("Ladezeit", perfData.loadTime != null ? `${perfData.loadTime} ms` : null)}
                </table>
              </div>
              ` : ""}

              <!-- Raw User Agent -->
              <div style="padding: 24px 30px; border-bottom: 1px solid #f0f0f0;">
                <h2 style="margin: 0 0 12px 0; font-size: 16px; color: #6b7280;">User Agent (roh)</h2>
                <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px 14px; font-family: monospace; font-size: 11px; word-break: break-all; color: #6b7280;">
                  ${ua || "Nicht verfügbar"}
                </div>
              </div>

              <!-- Recommendations -->
              <div style="padding: 24px 30px;">
                <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 0 8px 8px 0;">
                  <p style="margin: 0 0 8px 0; font-weight: 600; color: #92400e;">Empfohlene Maßnahmen</p>
                  <ul style="margin: 0; padding-left: 20px; color: #92400e; font-size: 13px;">
                    <li>Prüfen Sie, ob wichtige Links defekt sind</li>
                    <li>Überprüfen Sie Navigation und Menüs</li>
                    <li>Erstellen Sie ggf. eine Weiterleitung (Redirect)</li>
                    <li>Aktualisieren Sie die Sitemap falls nötig</li>
                  </ul>
                </div>
              </div>

              <div style="text-align: center; padding: 16px 30px 24px; border-top: 1px solid #f0f0f0;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                  Automatisch generiert von Effizienz-Praxis &bull; ${new Date().getFullYear()}
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    })

    return NextResponse.json({ success: emailResult.success })
  } catch {
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 })
  }
}
