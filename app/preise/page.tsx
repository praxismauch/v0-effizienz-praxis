"use client"

import { LandingPageLayout } from "@/components/landing-page-layout"
import { Button } from "@/components/ui/button"
import { Check, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

type PricingPlan = {
  name: string
  price: string
  oldPrice?: string
  period: string
  description: string
  features: string[]
  popular?: boolean
}

export default function PreisePage() {
  const [plans, setPlans] = useState<PricingPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly")
  const [annualDiscount, setAnnualDiscount] = useState(0)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    async function fetchPricing() {
      try {
        const response = await fetch("/api/pricing/public")
        if (!response.ok) throw new Error("Failed to fetch pricing")
        const data = await response.json()

        setAnnualDiscount(data.annualDiscountPercentage || 0)

        const mappedPlans = data.plans.map((plan: any) => {
          const isYearly = billingInterval === "yearly"
          const price = isYearly ? plan.price_yearly : plan.price_monthly
          const oldPrice = isYearly ? plan.old_price_yearly : plan.old_price_monthly

          return {
            name: plan.name,
            price: price ? `${(price / 100).toFixed(0)}€` : "Individuell",
            oldPrice: oldPrice ? `${(oldPrice / 100).toFixed(0)}€` : undefined,
            period: price ? (isYearly ? "pro Jahr" : "pro Monat") : "",
            description: plan.description,
            features: plan.features,
            popular: plan.name === "Professional",
          }
        })
        setPlans(mappedPlans)
      } catch (error) {
        console.error("Error fetching pricing:", error)
        setPlans([
          {
            name: "Starter",
            price: "79€",
            period: "pro Monat",
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
            price: "149€",
            period: "pro Monat",
            description: "Für wachsende Praxen",
            popular: true,
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
            price: "Individuell",
            period: "",
            description: "Für gehobene Ansprüche",
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
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchPricing()
  }, [billingInterval])

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
            {plans.map((plan, index) => (
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
                  <div className="flex items-baseline gap-2">
                    {plan.oldPrice && (
                      <span className="text-2xl font-medium text-muted-foreground line-through">{plan.oldPrice}</span>
                    )}
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
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
