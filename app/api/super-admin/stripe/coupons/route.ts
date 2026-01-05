import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe"

// GET - List all coupons
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: coupons, error } = await supabase
      .from("stripe_coupons")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ coupons: coupons || [] })
  } catch (error) {
    console.error("[Stripe Coupons] Error:", error)
    return NextResponse.json({ coupons: [] })
  }
}

// POST - Create a new coupon
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const {
      name,
      code,
      percentOff,
      amountOff,
      duration,
      durationMonths,
      maxRedemptions,
      validUntil,
      minAmount,
      firstPurchaseOnly,
      isActive,
    } = body

    // Create coupon in Stripe
    let stripeCoupon = null
    try {
      const couponParams: any = {
        name,
        duration,
        metadata: { code },
      }

      if (percentOff) {
        couponParams.percent_off = percentOff
      } else if (amountOff) {
        couponParams.amount_off = amountOff
        couponParams.currency = "eur"
      }

      if (duration === "repeating" && durationMonths) {
        couponParams.duration_in_months = durationMonths
      }

      if (maxRedemptions) {
        couponParams.max_redemptions = maxRedemptions
      }

      if (validUntil) {
        couponParams.redeem_by = Math.floor(new Date(validUntil).getTime() / 1000)
      }

      stripeCoupon = await stripe.coupons.create(couponParams)

      // Create promotion code in Stripe
      if (code) {
        await stripe.promotionCodes.create({
          coupon: stripeCoupon.id,
          code: code.toUpperCase(),
          restrictions: {
            first_time_transaction: firstPurchaseOnly,
            minimum_amount: minAmount,
            minimum_amount_currency: "eur",
          },
        })
      }
    } catch (stripeError) {
      console.error("[Stripe] Error creating coupon:", stripeError)
    }

    // Save to database
    const { data: coupon, error } = await supabase
      .from("stripe_coupons")
      .insert({
        stripe_coupon_id: stripeCoupon?.id,
        name,
        code: code.toUpperCase(),
        percent_off: percentOff,
        amount_off: amountOff,
        duration,
        duration_in_months: durationMonths,
        max_redemptions: maxRedemptions,
        valid_until: validUntil,
        min_amount: minAmount,
        first_purchase_only: firstPurchaseOnly,
        is_active: isActive,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ coupon })
  } catch (error) {
    console.error("[Stripe Coupons] Error creating coupon:", error)
    return NextResponse.json({ message: "Fehler beim Erstellen des Coupons" }, { status: 500 })
  }
}
