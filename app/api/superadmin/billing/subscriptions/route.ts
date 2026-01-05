import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

// GET - List all practice subscriptions (Super Admin)
export async function GET() {
  try {
    const supabase = await createServerClient()

    const { data: subscriptions, error } = await supabase
      .from("practice_subscriptions")
      .select(`
        *,
        practices (
          id,
          name,
          email
        ),
        subscription_plans (
          id,
          name,
          price_monthly
        )
      `)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json(subscriptions)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
