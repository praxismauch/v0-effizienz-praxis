import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

// GET - Get practice subscription
export async function GET(request: Request, { params }: { params: { practiceId: string } }) {
  try {
    const supabase = await createServerClient()

    const { data: subscription, error } = await supabase
      .from("practice_subscriptions")
      .select(`
        *,
        subscription_plans (
          id,
          name,
          description,
          price_monthly,
          features,
          max_users,
          max_team_members
        )
      `)
      .eq("practice_id", params.practiceId)
      .maybeSingle()

    if (error) throw error

    return NextResponse.json(subscription || null)
  } catch (error: any) {
    console.error("[v0] Error fetching subscription:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create or update subscription
export async function POST(request: Request, { params }: { params: { practiceId: string } }) {
  try {
    const supabase = await createServerClient()
    const body = await request.json()
    const { planId } = body

    // Check if subscription exists
    const { data: existing } = await supabase
      .from("practice_subscriptions")
      .select("id")
      .eq("practice_id", params.practiceId)
      .single()

    if (existing) {
      // Update existing subscription
      const { data, error } = await supabase
        .from("practice_subscriptions")
        .update({
          plan_id: planId,
          status: "active",
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single()

      if (error) throw error
      return NextResponse.json(data)
    } else {
      // Create new subscription
      const { data, error } = await supabase
        .from("practice_subscriptions")
        .insert([
          {
            practice_id: params.practiceId,
            plan_id: planId,
            status: "trial",
            trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ])
        .select()
        .single()

      if (error) throw error
      return NextResponse.json(data)
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
