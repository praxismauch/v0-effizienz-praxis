import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET - List all custom pricing
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: pricing, error } = await supabase
      .from("practice_custom_pricing")
      .select(`
        *,
        practices:practice_id (
          name
        )
      `)
      .order("created_at", { ascending: false })

    if (error) throw error

    const formattedPricing = (pricing || []).map((p: any) => ({
      ...p,
      practice_name: p.practices?.name,
    }))

    return NextResponse.json({ pricing: formattedPricing })
  } catch (error) {
    console.error("[Custom Pricing] Error:", error)
    return NextResponse.json({ pricing: [] })
  }
}

// POST - Create custom pricing
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const {
      practiceId,
      customPriceMonthly,
      customPriceYearly,
      discountPercent,
      discountReason,
      validUntil,
      notes,
      isActive,
    } = body

    // Deactivate any existing pricing for this practice
    await supabase
      .from("practice_custom_pricing")
      .update({ is_active: false })
      .eq("practice_id", practiceId)
      .eq("is_active", true)

    // Create new pricing
    const { data: pricing, error } = await supabase
      .from("practice_custom_pricing")
      .insert({
        practice_id: practiceId,
        custom_price_monthly: customPriceMonthly,
        custom_price_yearly: customPriceYearly,
        discount_percent: discountPercent,
        discount_reason: discountReason,
        valid_until: validUntil,
        notes,
        is_active: isActive,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ pricing })
  } catch (error) {
    console.error("[Custom Pricing] Error creating:", error)
    return NextResponse.json({ message: "Fehler beim Erstellen des Sonderpreises" }, { status: 500 })
  }
}
