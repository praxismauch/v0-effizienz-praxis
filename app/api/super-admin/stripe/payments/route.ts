import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET - List all payments
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: payments, error } = await supabase
      .from("stripe_payments")
      .select(`
        *,
        practices:practice_id (
          name
        )
      `)
      .order("created_at", { ascending: false })
      .limit(100)

    if (error) throw error

    const formattedPayments = (payments || []).map((p: any) => ({
      ...p,
      practice_name: p.practices?.name,
    }))

    return NextResponse.json({ payments: formattedPayments })
  } catch (error) {
    console.error("[Stripe Payments] Error:", error)
    return NextResponse.json({ payments: [] })
  }
}
