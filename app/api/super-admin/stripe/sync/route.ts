import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe"

// POST - Sync data from Stripe
export async function POST() {
  try {
    const supabase = await createClient()

    // Sync customers
    const customers = await stripe.customers.list({ limit: 100 })
    for (const customer of customers.data) {
      if (customer.metadata?.practice_id) {
        await supabase.from("stripe_customers").upsert(
          {
            stripe_customer_id: customer.id,
            practice_id: Number.parseInt(customer.metadata.practice_id),
            email: customer.email,
            name: customer.name,
            metadata: customer.metadata,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "stripe_customer_id" },
        )
      }
    }

    // Sync subscriptions
    const subscriptions = await stripe.subscriptions.list({ limit: 100, expand: ["data.customer"] })
    for (const sub of subscriptions.data) {
      const customer = sub.customer as any
      if (customer?.metadata?.practice_id) {
        await supabase.from("stripe_subscriptions").upsert(
          {
            stripe_subscription_id: sub.id,
            stripe_customer_id: customer.id,
            practice_id: Number.parseInt(customer.metadata.practice_id),
            status: sub.status,
            price_id: sub.items.data[0]?.price.id,
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            cancel_at_period_end: sub.cancel_at_period_end,
            canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
            trial_start: sub.trial_start ? new Date(sub.trial_start * 1000).toISOString() : null,
            trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "stripe_subscription_id" },
        )
      }
    }

    // Sync recent payments
    const paymentIntents = await stripe.paymentIntents.list({ limit: 50 })
    for (const payment of paymentIntents.data) {
      if (payment.metadata?.practice_id) {
        await supabase.from("stripe_payments").upsert(
          {
            stripe_payment_intent_id: payment.id,
            practice_id: Number.parseInt(payment.metadata.practice_id),
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            payment_method_type: payment.payment_method_types?.[0],
            description: payment.description,
            paid_at: payment.status === "succeeded" ? new Date().toISOString() : null,
          },
          { onConflict: "stripe_payment_intent_id" },
        )
      }
    }

    return NextResponse.json({ success: true, message: "Sync completed" })
  } catch (error) {
    console.error("[Stripe Sync] Error:", error)
    return NextResponse.json({ message: "Synchronisation fehlgeschlagen" }, { status: 500 })
  }
}
