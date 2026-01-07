export const dynamic = "force-dynamic"

import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()
  const { email, referralCode, userId, practiceId } = body

  if (!email || !referralCode || !userId || !practiceId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  try {
    const { data, error } = await supabase
      .from("referrals")
      .insert({
        referrer_user_id: userId,
        referrer_practice_id: String(practiceId),
        referral_code: referralCode,
        referred_email: email,
        status: "pending",
        reward_months: 3, // 3 months free for both parties
      })
      .select()
      .single()

    if (error) throw error

    // TODO: Send email invitation with referral link
    // Email should explain: "Sie wurden eingeladen! Registrieren Sie sich und beide erhalten 3 Monate kostenlos!"
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.effizienz-praxis.de"
    const inviteLink = `${appUrl}/register?ref=${referralCode}`

    console.log(`Send email to ${email} with invite link: ${inviteLink}`)
    console.log(`Both parties will receive 3 months free upon successful registration`)

    return NextResponse.json({ success: true, referral: data })
  } catch (error) {
    console.error("Error sending invite:", error)
    return NextResponse.json({ error: "Failed to send invite" }, { status: 500 })
  }
}
