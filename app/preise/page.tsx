"use client"

import { LandingPageLayout } from "@/components/landing-page-layout"
import { Button } from "@/components/ui/button"
import { Check, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useEffect, useState, useMemo } from "react"

type RawPlan = {
  name: string
  price_monthly: number | null
  price_yearly: number | null
  old_price_monthly: number | null
  old_price_yearly: number | null
  description: string
  features: string[]
  is_popular?: boolean
}

type PricingPlan = {
  name: string
  price: string
  oldPrice?: string
  period: string
  yearlyTotal?: string
  description: string
  features: string[]
  popular?: boolean
}

export default function PreisePage() {
  const [rawPlans, setRawPlans] = useState<RawPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly")
  const [annualDiscount, setAnnualDiscount] = useState(20)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // Fallback raw plan data
  const fallbackRawPlans: RawPlan[] = [
    {
      name: "Starter",
      price_monthly: 7900,
      price_yearly: 75840,
      old_price_monthly: 9900,
      old_price_yearly: 95040,
      description: "Perfekt für kleine Praxen",
      features: [
        "Bis zu 3 Benutzer",
        "Basis Kennzahlen Dashboard",
        "Standard Analytics",
        "Email Support",
        "5 GB Speicherplatz",
      ],
    },
    {
      name: "Professional",
      price_monthly: 14900,
      price_yearly: 143040,
      old_price_monthly: 19900,
      old_price_yearly: 191040,
      description: "Für wachsende Praxen",
      is_popular: true,
      features: [
        "Bis zu 10 Benutzer",
        "Erweiterte Kennzahlen",
        "Premium Analytics",
        "Recruiting Pipeline",
        "Form Builder",
        "Priority Support",
        "50 GB Speicherplatz",
      ],
    },
    {
      name: "Premium",
      price_monthly: null,
      price_yearly: null,
      old_price_monthly: null,
      old_price_yearly: null,
      description: "Für gehobene Ansprüche",
      is_popular: false,
      features: [
        "Unbegrenzte Benutzer",
        "Alle Features",
        "Custom Integrationen",
        "Dedicated Account Manager",
        "24/7 Premium Support",
        "Unbegrenzter Speicher",
        "SLA Garantie",
      ],
    },
  ]

  // Fetch raw plans once on mount
  useEffect(() => {
    async function fetchPricing() {
      try {
        const response = await fetch("/api/pricing/public")
        if (!response.ok) throw new Error("Failed to fetch pricing")
        const data = await response.json()

        setAnnualDiscount(data.annualDiscountPercentage || 20)

        // If no plans returned from API, use fallback
        if (!data.plans || data.plans.length === 0) {
          throw new Error("No plans available")
        }

        // Store raw plans for re-mapping when billing interval changes
        setRawPlans(data.plans)
      } catch (error) {
        // Use fallback pricing data
        setRawPlans(fallbackRawPlans)
      } finally {
        setLoading(false)
      }
    }

    fetchPricing()
  }, [])

  // Map raw plans to display format - memoized for performance
  // For yearly billing, show monthly price (yearly / 12) with "pro Monat (bei 12 Monaten)"
  const pricingPlans = useMemo<PricingPlan[]>(() => {
    if (rawPlans.length === 0) return []

    const isYearly = billingInterval === "yearly"
    return rawPlans.map((plan) => {
      // For yearly: divide by 12 to show monthly equivalent
      const price = isYearly 
        ? (plan.price_yearly ? Math.round(plan.price_yearly / 12) : null)
        : plan.price_monthly
      const oldPrice = isYearly 
        ? (plan.old_price_yearly ? Math.round(plan.old_price_yearly / 12) : null)
        : plan.old_price_monthly

      return {
        name: plan.name,
        price: price ? `${Math.round(price / 100)}€` : "Individuell",
        oldPrice: oldPrice && oldPrice > (price || 0) ? `${Math.round(oldPrice / 100)}€` : undefined,
        period: price ? "pro Monat" : "",
        yearlyTotal: isYearly && plan.price_yearly ? `${Math.round(plan.price_yearly / 100)}€ / Jahr` : undefined,
        description: plan.description,
        features: plan.features || [],
        popular: plan.is_popular || plan.name === "Professional",
      }
    })
  }, [rawPlans, billingInterval])

  if (loading) {
    return (
      <LandingPageLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-muted-foreground">Lade Preise...</div>
        </div>
      </LandingPageLayout>
    )
  }

  return (
    <LandingPageLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background py-16 md:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <Link href="/">
            <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground mb-8">
              <ArrowLeft className="h-4 w-4" />
              Zurück zur Startseite
            </Button>
          </Link>

          <div className="mx-auto text-center space-y-6 max-w-4xl">
            <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary">
              Transparente Preise
            </div>
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-balance leading-tight">
              Der richtige Plan für Ihre Praxis
            </h1>
            <p className="text-lg text-muted-foreground text-pretty mx-auto">
              Wählen Sie das passende Paket für Ihre Anforderungen. Alle Pläne beinhalten eine 14-tägige kostenlose
              Testphase.
            </p>

            <div className="flex items-center justify-center mt-8">
              <div className="inline-flex items-center rounded-full bg-muted p-1 shadow-sm">
                <button
                  onClick={() => setBillingInterval("monthly")}
                  className={`rounded-full px-6 py-2.5 text-sm font-medium transition-all duration-200 ${
                    billingInterval === "monthly"
                      ? "bg-background text-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Monatlich
                </button>
                <button
                  onClick={() => setBillingInterval("yearly")}
                  className={`rounded-full px-6 py-2.5 text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    billingInterval === "yearly"
                      ? "bg-background text-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Jährlich
                  {annualDiscount > 0 && (
                    <span className="rounded-full bg-green-500 px-2 py-0.5 text-xs font-semibold text-white">
                      -{annualDiscount}%
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 md:pb-32">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`relative rounded-2xl border p-8 ${
                  plan.popular ? "border-primary shadow-lg scale-105" : "bg-background"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-sm text-primary-foreground">
                    Beliebteste Wahl
                  </div>
                )}
                <div className="mb-8">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-muted-foreground mb-4">{plan.description}</p>
                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-2">
                      {plan.oldPrice && (
                        <span className="text-2xl font-medium text-muted-foreground line-through">{plan.oldPrice}</span>
                      )}
                      <span className="text-4xl font-bold">{plan.price}</span>
                      {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                    </div>
                    {plan.yearlyTotal && (
                      <span className="text-sm text-muted-foreground mt-1">{plan.yearlyTotal}</span>
                    )}
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 shrink-0">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/coming-soon">
                  <Button className="w-full" variant={plan.popular ? "default" : "outline"}>
                    {plan.price === "Individuell" ? "Kontakt aufnehmen" : "Jetzt starten"}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </LandingPageLayout>
  )
}
