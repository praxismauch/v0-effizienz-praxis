import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createAdminClient()

    const body = await request.json()
    const { planId, config } = body

    if (!planId || !config) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Update subscription plan
    const { data, error } = await supabase
      .from("subscription_plans")
      .update({
        name: config.name,
        description: config.description,
        price_monthly: Math.round(Number.parseFloat(config.priceMonthly) * 100),
        is_active: config.isActive,
        max_users: config.maxUsers ? Number.parseInt(config.maxUsers) : null,
        max_team_members: config.maxTeamMembers ? Number.parseInt(config.maxTeamMembers) : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", planId)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating subscription plan:", error)
      return NextResponse.json({ error: "Failed to update plan" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("[v0] Error in subscription plan configuration:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
