import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe"
import type Stripe from "stripe"

export async function POST(request: Request) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET || "")
  } catch (err) {
    console.error("[Stripe Webhook] Signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const supabase = await createClient()

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const customer = (await stripe.customers.retrieve(subscription.customer as string)) as Stripe.Customer

        if (customer.metadata?.practice_id) {
          await supabase.from("stripe_subscriptions").upsert(
            {
              stripe_subscription_id: subscription.id,
              stripe_customer_id: customer.id,
              practice_id: Number.parseInt(customer.metadata.practice_id),
              status: subscription.status,
              price_id: subscription.items.data[0]?.price.id,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "stripe_subscription_id" },
          )
        }
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        await supabase
          .from("stripe_subscriptions")
          .update({
            status: "canceled",
            canceled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id)
        break
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice
        const customer = (await stripe.customers.retrieve(invoice.customer as string)) as Stripe.Customer

        if (customer.metadata?.practice_id) {
          await supabase.from("stripe_invoices").upsert(
            {
              stripe_invoice_id: invoice.id,
              stripe_customer_id: customer.id,
              practice_id: Number.parseInt(customer.metadata.practice_id),
              stripe_subscription_id: invoice.subscription as string,
              status: invoice.status || "paid",
              amount_due: invoice.amount_due,
              amount_paid: invoice.amount_paid,
              amount_remaining: invoice.amount_remaining,
              invoice_pdf: invoice.invoice_pdf,
              hosted_invoice_url: invoice.hosted_invoice_url,
              paid_at: new Date().toISOString(),
              subtotal: invoice.subtotal,
              tax: invoice.tax,
              total: invoice.total,
            },
            { onConflict: "stripe_invoice_id" },
          )

          // Also record payment
          await supabase.from("stripe_payments").insert({
            practice_id: Number.parseInt(customer.metadata.practice_id),
            stripe_invoice_id: invoice.id,
            stripe_customer_id: customer.id,
            amount: invoice.amount_paid,
            currency: invoice.currency,
            status: "succeeded",
            paid_at: new Date().toISOString(),
          })
        }
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const customer = (await stripe.customers.retrieve(invoice.customer as string)) as Stripe.Customer

        if (customer.metadata?.practice_id) {
          await supabase.from("stripe_payments").insert({
            practice_id: Number.parseInt(customer.metadata.practice_id),
            stripe_invoice_id: invoice.id,
            stripe_customer_id: customer.id,
            amount: invoice.amount_due,
            currency: invoice.currency,
            status: "failed",
            failure_reason: "Payment failed",
          })
        }
        break
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        if (paymentIntent.metadata?.practice_id) {
          await supabase.from("stripe_payments").upsert(
            {
              stripe_payment_intent_id: paymentIntent.id,
              practice_id: Number.parseInt(paymentIntent.metadata.practice_id),
              amount: paymentIntent.amount,
              currency: paymentIntent.currency,
              status: "succeeded",
              payment_method_type: paymentIntent.payment_method_types?.[0],
              receipt_url: paymentIntent.charges?.data?.[0]?.receipt_url,
              paid_at: new Date().toISOString(),
            },
            { onConflict: "stripe_payment_intent_id" },
          )
        }
        break
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge
        if (charge.payment_intent) {
          await supabase
            .from("stripe_payments")
            .update({
              refunded_amount: charge.amount_refunded,
              status: charge.refunded ? "refunded" : "partially_refunded",
            })
            .eq("stripe_payment_intent_id", charge.payment_intent)
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[Stripe Webhook] Error processing event:", error)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}
