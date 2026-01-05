import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET - List all subscriptions
export async function GET() {
  try {
    const supabase = await createClient()

    // Try stripe_subscriptions table first, fallback to practice_subscriptions
    let { data: subscriptions, error } = await supabase
      .from("stripe_subscriptions")
      .select(`
        *,
        practices:practice_id (
          name,
          email
        )
      `)
      .order("created_at", { ascending: false })

    if (error || !subscriptions?.length) {
      // Fallback to practice_subscriptions
      const { data: fallbackSubs } = await supabase
        .from("practice_subscriptions")
        .select(`
          *,
          practices:practice_id (
            name,
            email
          ),
          subscription_plans (
            name,
            price_monthly
          )
        `)
        .order("created_at", { ascending: false })

      subscriptions = (fallbackSubs || []).map((s: any) => ({
        id: s.id,
        practice_id: s.practice_id,
        practice_name: s.practices?.name,
        practice_email: s.practices?.email,
        status: s.status,
        plan_name: s.subscription_plans?.name,
        price_monthly: s.subscription_plans?.price_monthly,
        current_period_start: s.current_period_start,
        current_period_end: s.current_period_end,
        trial_end: s.trial_end,
        cancel_at_period_end: false,
        created_at: s.created_at,
      }))
    } else {
      subscriptions = subscriptions.map((s: any) => ({
        ...s,
        practice_name: s.practices?.name,
        practice_email: s.practices?.email,
      }))
    }

    return NextResponse.json({ subscriptions })
  } catch (error) {
    console.error("[Stripe Subscriptions] Error:", error)
    return NextResponse.json({ subscriptions: [] })
  }
}
