import "server-only"
import Stripe from "stripe"

let stripeInstance: Stripe | null = null

export function getStripe(): Stripe {
  if (stripeInstance) {
    return stripeInstance
  }

  const apiKey = process.env.STRIPE_SECRET_KEY
  if (!apiKey) {
    throw new Error("STRIPE_SECRET_KEY is not defined in environment variables")
  }

  stripeInstance = new Stripe(apiKey, {
    apiVersion: "2024-12-18.acacia",
    typescript: true,
  })

  return stripeInstance
}

// Backwards compatibility - lazy getter
export const stripe = new Proxy({} as Stripe, {
  get: (_, prop) => {
    const instance = getStripe()
    return instance[prop as keyof Stripe]
  },
})
