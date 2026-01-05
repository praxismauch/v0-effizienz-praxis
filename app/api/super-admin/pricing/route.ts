import { createClient, createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { isSuperAdminRole } from "@/lib/auth-utils"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })
    }

    const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (!isSuperAdminRole(userData?.role)) {
      return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 })
    }

    // Fetch all subscription plans
    const { data: plans, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .order("display_order", { ascending: true })

    if (error) throw error

    return NextResponse.json({ plans })
  } catch (error) {
    console.error("Error fetching pricing:", error)
    return NextResponse.json({ error: "Fehler beim Laden der Preise" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    console.log("[v0] PUT /api/super-admin/pricing - Received body:", JSON.stringify(body, null, 2))

    const { planId, updates } = body

    if (!planId) {
      console.log("[v0] ERROR: Missing planId")
      return NextResponse.json({ error: "Plan ID ist erforderlich" }, { status: 400 })
    }

    console.log("[v0] Checking if plan exists:", planId)
    const adminClient = await createAdminClient()

    const { data: existingPlan } = await adminClient
      .from("subscription_plans")
      .select("id, name")
      .eq("id", String(planId))
      .single()

    if (!existingPlan) {
      console.error("[v0] Plan not found in database:", planId)
      return NextResponse.json({ error: "Plan nicht gefunden" }, { status: 404 })
    }

    console.log("[v0] Found existing plan:", JSON.stringify(existingPlan))

    if (!updates) {
      console.log("[v0] ERROR: Missing updates")
      return NextResponse.json({ error: "Updates erforderlich" }, { status: 400 })
    }

    const parsePrice = (value: any): number | null => {
      console.log("[v0] Parsing price value:", value, "type:", typeof value)
      if (value === undefined || value === null || value === "") {
        return null
      }
      const parsed = typeof value === "string" ? Number.parseFloat(value) : Number(value)
      console.log("[v0] Parsed price (in euros):", parsed)
      // Convert euros to cents by multiplying by 100, then round to nearest cent
      const priceInCents = Math.round(parsed * 100)
      console.log("[v0] Price in cents:", priceInCents)
      return Number.isNaN(priceInCents) ? null : priceInCents
    }

    const dbUpdates: Record<string, any> = {}

    if (updates.name !== undefined) dbUpdates.name = updates.name
    if (updates.description !== undefined) dbUpdates.description = updates.description
    if (updates.priceMonthly !== undefined) {
      const price = parsePrice(updates.priceMonthly)
      if (price !== null) dbUpdates.price_monthly = price
    }
    if (updates.priceYearly !== undefined) {
      const price = parsePrice(updates.priceYearly)
      if (price !== null) dbUpdates.price_yearly = price
    }
    if (updates.oldPriceMonthly !== undefined) {
      const price = parsePrice(updates.oldPriceMonthly)
      dbUpdates.old_price_monthly = price
    }
    if (updates.oldPriceYearly !== undefined) {
      const price = parsePrice(updates.oldPriceYearly)
      dbUpdates.old_price_yearly = price
    }
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive
    if (updates.maxUsers !== undefined) dbUpdates.max_users = updates.maxUsers
    if (updates.maxTeamMembers !== undefined) dbUpdates.max_team_members = updates.maxTeamMembers
    if (updates.features !== undefined) dbUpdates.features = updates.features
    if (updates.displayOrder !== undefined) dbUpdates.display_order = updates.displayOrder

    console.log("[v0] Transformed dbUpdates (snake_case):", JSON.stringify(dbUpdates, null, 2))
    console.log("[v0] Updating plan with ID:", planId)

    const camelCaseKeys = Object.keys(dbUpdates).filter((key) => /[A-Z]/.test(key))
    if (camelCaseKeys.length > 0) {
      console.error("[v0] WARNING: Found camelCase keys in dbUpdates:", camelCaseKeys)
    }

    const { data: updatedPlans, error } = await adminClient
      .from("subscription_plans")
      .update(dbUpdates)
      .eq("id", String(planId))
      .select()

    if (error) {
      console.error("[v0] Supabase error details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        dbUpdates: dbUpdates,
      })
      throw error
    }

    if (!updatedPlans || updatedPlans.length === 0) {
      console.error("[v0] Plan not found:", planId)
      return NextResponse.json({ error: "Plan nicht gefunden" }, { status: 404 })
    }

    const updatedPlan = updatedPlans[0]
    console.log("[v0] Successfully updated plan:", updatedPlan.id)

    return NextResponse.json({ plan: updatedPlan })
  } catch (error) {
    console.error("[v0] Error in PUT /api/super-admin/pricing:", error)
    return NextResponse.json(
      {
        error: "Fehler beim Aktualisieren der Preise",
        details: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const planId = searchParams.get("planId")

    if (!planId) {
      return NextResponse.json({ error: "Plan-ID erforderlich" }, { status: 400 })
    }

    console.log("[v0] Deleting pricing plan:", planId)

    const { error } = await supabase.from("subscription_plans").delete().eq("id", planId)

    if (error) {
      console.error("[v0] Error deleting plan:", error)
      throw error
    }

    console.log("[v0] Successfully deleted plan:", planId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in DELETE /api/super-admin/pricing:", error)
    return NextResponse.json({ error: "Fehler beim Löschen des Plans" }, { status: 500 })
  }
}
