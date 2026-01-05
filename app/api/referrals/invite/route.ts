export const dynamic = "force-dynamic"

import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  const supabase = createClient(cookies())
  const body = await request.json()
  const { email, referralCode, userId, practiceId } = body

  if (!email || !referralCode || !userId || !practiceId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  try {
    // Create referral entry
    const { data, error } = await supabase
      .from("referrals")
      .insert({
        referrer_user_id: userId,
        referrer_practice_id: practiceId,
        referral_code: referralCode,
        referred_email: email,
        status: "pending",
        reward_amount: 5000, // 50 EUR in cents
      })
      .select()
      .single()

    if (error) throw error

    // TODO: Send email invitation with referral link
    // This would integrate with your email service (Resend, SendGrid, etc.)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.effizienz-praxis.de"
    const inviteLink = `${appUrl}/register?ref=${referralCode}`

    console.log(`Send email to ${email} with invite link: ${inviteLink}`)

    return NextResponse.json({ success: true, referral: data })
  } catch (error) {
    console.error("Error sending invite:", error)
    return NextResponse.json({ error: "Failed to send invite" }, { status: 500 })
  }
}
