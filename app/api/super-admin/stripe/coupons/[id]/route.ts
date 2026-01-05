import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe"

// DELETE - Delete a coupon
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get coupon to find Stripe ID
    const { data: coupon } = await supabase.from("stripe_coupons").select("stripe_coupon_id").eq("id", id).single()

    // Delete from Stripe if exists
    if (coupon?.stripe_coupon_id) {
      try {
        await stripe.coupons.del(coupon.stripe_coupon_id)
      } catch (stripeError) {
        console.error("[Stripe] Error deleting coupon:", stripeError)
      }
    }

    // Delete from database
    const { error } = await supabase.from("stripe_coupons").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Stripe Coupons] Error deleting:", error)
    return NextResponse.json({ message: "Fehler beim Löschen des Coupons" }, { status: 500 })
  }
}
