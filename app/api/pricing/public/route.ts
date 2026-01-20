export const dynamic = "force-dynamic"

import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// Public endpoint to fetch pricing for landing page
export async function GET() {
  try {
    const supabase = await createClient()

    // Fetch active subscription plans including old prices for strike-through display
    const { data: plans, error } = await supabase
      .from("subscription_plans")
      .select("id, name, description, price_monthly, price_yearly, old_price_monthly, old_price_yearly, features, display_order, limits")
      .eq("is_active", true)
      .order("display_order", { ascending: true })

    console.log("[v0] subscription_plans query result:", { plans, error })

    if (error) throw error

    const STANDARD_PLAN_NAMES = ["Starter", "Professional", "Premium"]
    const standardPlans = plans.filter((plan) => STANDARD_PLAN_NAMES.includes(plan.name))

    // Keep the first occurrence of each plan name to avoid duplicates
    const uniquePlans = standardPlans.reduce((acc: any[], plan: any) => {
      const existingPlan = acc.find((p) => p.name === plan.name)
      if (!existingPlan) {
        acc.push(plan)
      }
      return acc
    }, [])

    // Sort plans by standard order: Starter, Professional, Premium
    const sortedPlans = uniquePlans.sort((a, b) => {
      const order = ["Starter", "Professional", "Premium"]
      return order.indexOf(a.name) - order.indexOf(b.name)
    })

    const { data: settings, error: settingsError } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "annual_discount_percentage")
      .maybeSingle()

    // Handle missing setting gracefully
    const annualDiscountPercentage = settings?.value ? Number.parseInt(settings.value) : 20

    // Format plans for landing page
    const formattedPlans = sortedPlans.map((plan) => {
      const limits = plan.limits || {}
      return {
        name: plan.name,
        price_monthly: plan.price_monthly,
        price_yearly: plan.price_yearly,
        old_price_monthly: plan.old_price_monthly,
        old_price_yearly: plan.old_price_yearly,
        description: plan.description,
        features: plan.features || [],
        is_popular: plan.name === "Professional",
        max_users: limits.max_users,
        max_team_members: limits.max_team_members,
      }
    })

    console.log("[v0] Returning formatted plans:", formattedPlans.length, "plans")

    return NextResponse.json({
      plans: formattedPlans,
      annualDiscountPercentage,
    })
  } catch (error) {
    console.error("Error fetching public pricing:", error)
    return NextResponse.json({ error: "Fehler beim Laden der Preise" }, { status: 500 })
  }
}
