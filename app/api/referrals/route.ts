export const dynamic = "force-dynamic"

import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")

  if (!userId) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 })
  }

  try {
    // First check if user has any referrals
    const { data: existingReferrals } = await supabase
      .from("referrals")
      .select("referral_code")
      .eq("referrer_user_id", userId)
      .limit(1)

    let referralCode = existingReferrals?.[0]?.referral_code

    // If no referral code exists, generate one based on user ID
    if (!referralCode) {
      // Generate a simple referral code from user ID
      referralCode = `REF-${userId.substring(0, 8).toUpperCase()}`
    }

    // Get user's referrals
    const { data: referrals } = await supabase
      .from("referrals")
      .select("*")
      .eq("referrer_user_id", userId)
      .order("created_at", { ascending: false })

    return NextResponse.json({
      referralCode,
      referrals: referrals || [],
    })
  } catch (error) {
    console.error("Error fetching referrals:", error)
    return NextResponse.json({ error: "Failed to fetch referrals" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()
  const { userId, practiceId, referredEmail } = body

  if (!userId || !practiceId || !referredEmail) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  try {
    // Generate referral code based on user ID
    const code = `REF-${userId.substring(0, 8).toUpperCase()}`

    const { data, error } = await supabase
      .from("referrals")
      .insert({
        referrer_user_id: userId,
        referrer_practice_id: practiceId,
        referral_code: code,
        referred_email: referredEmail,
        status: "pending",
        reward_months: 3, // 3 months free for both parties
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, referral: data })
  } catch (error) {
    console.error("Error creating referral:", error)
    return NextResponse.json({ error: "Failed to create referral" }, { status: 500 })
  }
}
