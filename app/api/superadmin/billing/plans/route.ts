import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

// GET - List all subscription plans
export async function GET() {
  try {
    const supabase = await createServerClient()

    const { data: plans, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("is_active", true)
      .order("display_order")

    if (error) throw error

    const STANDARD_PLAN_NAMES = ["Starter", "Professional", "Premium"]
    const standardPlans = plans?.filter((plan) => STANDARD_PLAN_NAMES.includes(plan.name))

    // Filter to ensure only unique plan names
    const uniquePlans = standardPlans?.reduce((acc: any[], plan: any) => {
      const existingPlan = acc.find((p) => p.name === plan.name)
      if (!existingPlan) {
        acc.push(plan)
      }
      return acc
    }, [])

    return NextResponse.json(uniquePlans || [])
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create a new subscription plan (Super Admin only)
export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const body = await request.json()

    const { data: existingPlan } = await supabase
      .from("subscription_plans")
      .select("id, name")
      .eq("name", body.name)
      .eq("is_active", true)
      .maybeSingle()

    if (existingPlan) {
      return NextResponse.json({ error: `Ein Plan mit dem Namen "${body.name}" existiert bereits` }, { status: 400 })
    }

    const { data: plan, error } = await supabase.from("subscription_plans").insert([body]).select().single()

    if (error) throw error

    return NextResponse.json(plan)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
