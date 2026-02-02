import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

// Force dynamic rendering since we're reading from database
export const dynamic = "force-dynamic"

// Create a simple Supabase client without cookies for public endpoints
function createPublicClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables not configured")
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}

// Public endpoint to fetch pricing for landing page
export async function GET() {
  try {
    const supabase = createPublicClient()

    // Fetch active subscription plans - only query existing columns
    const { data: plans, error } = await supabase
      .from("subscription_plans")
      .select("id, name, description, price_monthly, price_yearly, old_price_monthly, old_price_yearly, features, display_order")
      .eq("is_active", true)
      .order("display_order", { ascending: true })

    if (error) throw error

    const STANDARD_PLAN_NAMES = ["Starter", "Professional", "Premium"]
    const standardPlans = (plans || []).filter((plan) => STANDARD_PLAN_NAMES.includes(plan.name))

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

    const { data: settings } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "annual_discount_percentage")
      .maybeSingle()

    const annualDiscountPercentage = settings?.value ? Number.parseInt(settings.value) : 20

    // Format plans for landing page
    const formattedPlans = sortedPlans.map((plan) => ({
      name: plan.name,
      price_monthly: plan.price_monthly,
      price_yearly: plan.price_yearly,
      old_price_monthly: plan.old_price_monthly,
      old_price_yearly: plan.old_price_yearly,
      description: plan.description,
      features: plan.features || [],
      is_popular: plan.name === "Professional",
    }))

    const response = NextResponse.json({
      plans: formattedPlans,
      annualDiscountPercentage,
    })

    // Add cache headers for CDN/browser caching
    response.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600")

    return response
  } catch (error) {
    console.error("Error fetching public pricing:", error)
    return NextResponse.json({ error: "Fehler beim Laden der Preise" }, { status: 500 })
  }
}
