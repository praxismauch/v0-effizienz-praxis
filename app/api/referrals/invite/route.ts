export const dynamic = "force-dynamic"

import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendEmail, isEmailConfigured } from "@/lib/email/send-email"

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()
  const { email, referralCode, userId, practiceId } = body

  if (!email || !referralCode || !userId || !practiceId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  try {
    // Get referrer's name for personalization
    const { data: referrerData } = await supabase
      .from("users")
      .select("name, first_name, last_name")
      .eq("id", userId)
      .single()

    const referrerName = referrerData?.name || 
      `${referrerData?.first_name || ""} ${referrerData?.last_name || ""}`.trim() || 
      "Ein Kollege"

    const { data, error } = await supabase
      .from("referrals")
      .insert({
        referrer_user_id: userId,
        referrer_practice_id: String(practiceId),
        referral_code: referralCode,
        referred_email: email,
        status: "pending",
        reward_months: 3,
      })
      .select()
      .single()

    if (error) throw error

    // Send email invitation
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.effizienz-praxis.de"
    const inviteLink = `${appUrl}/register?ref=${referralCode}`

    const emailConfigured = await isEmailConfigured()
    
    if (emailConfigured) {
      const emailResult = await sendEmail({
        to: email,
        subject: `${referrerName} lädt Sie zu Effizienz Praxis ein - 3 Monate kostenlos!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #111827; margin: 0;">Effizienz Praxis</h1>
              <p style="color: #6b7280; margin-top: 8px;">Einladung zur Praxismanagement-Software</p>
            </div>

            <div style="background: linear-gradient(135deg, #0070f3 0%, #7c3aed 50%, #ec4899 100%); padding: 24px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
              <h2 style="color: white; margin: 0 0 8px 0; font-size: 24px;">🎁 3 Monate geschenkt!</h2>
              <p style="color: rgba(255,255,255,0.9); margin: 0;">Für Sie und ${referrerName}</p>
            </div>

            <h2 style="color: #111827; margin-bottom: 16px;">Hallo!</h2>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              <strong>${referrerName}</strong> nutzt bereits Effizienz Praxis und möchte diese Erfahrung mit Ihnen teilen.
            </p>

            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Registrieren Sie sich jetzt über den untenstehenden Link und Sie <strong>beide</strong> erhalten jeweils 
              <strong style="color: #0070f3;">3 Monate Effizienz Praxis kostenlos!</strong>
            </p>

            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 24px 0;">
              <h3 style="color: #111827; margin: 0 0 12px 0;">Was ist Effizienz Praxis?</h3>
              <ul style="color: #374151; padding-left: 20px; margin: 0;">
                <li style="margin-bottom: 8px;">Digitales Praxismanagement für Arztpraxen</li>
                <li style="margin-bottom: 8px;">Aufgaben, Termine und Team-Koordination</li>
                <li style="margin-bottom: 8px;">Qualitätsmanagement und Workflows</li>
                <li>KI-gestützte Analysen und Optimierungen</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${inviteLink}" 
                 style="background-color: #0070f3; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px;">
                Jetzt registrieren und 3 Monate kostenlos erhalten
              </a>
            </div>

            <p style="color: #6b7280; font-size: 14px; text-align: center;">
              Ihr persönlicher Empfehlungscode: <strong>${referralCode}</strong>
            </p>

            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                Diese E-Mail wurde Ihnen gesendet, weil ${referrerName} Sie zu Effizienz Praxis eingeladen hat.<br/>
                Falls Sie diese Einladung nicht erwartet haben, können Sie diese E-Mail ignorieren.
              </p>
            </div>
          </div>
        `,
      })

      if (!emailResult.success) {
        console.error("Failed to send referral email:", emailResult.error)
        // Still return success since the referral was created
        return NextResponse.json({ 
          success: true, 
          referral: data,
          emailSent: false,
          emailError: "Email konnte nicht gesendet werden"
        })
      }

      return NextResponse.json({ 
        success: true, 
        referral: data,
        emailSent: true 
      })
    } else {
      console.warn("Email not configured, referral created but email not sent")
      return NextResponse.json({ 
        success: true, 
        referral: data,
        emailSent: false,
        emailError: "Email-Service nicht konfiguriert"
      })
    }
  } catch (error) {
    console.error("Error sending invite:", error)
    return NextResponse.json({ error: "Failed to send invite" }, { status: 500 })
  }
}
