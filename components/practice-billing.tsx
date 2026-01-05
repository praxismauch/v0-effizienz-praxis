"use client"

import { useState, useEffect } from "react"
import { usePractice } from "@/contexts/practice-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Download } from "lucide-react"
import { formatDateDE } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function PracticeBilling() {
  const { currentPractice } = usePractice()
  const [subscription, setSubscription] = useState<any>(null)
  const [plans, setPlans] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly")
  const [annualDiscountPercentage, setAnnualDiscountPercentage] = useState<number>(20)

  useEffect(() => {
    if (currentPractice?.id) {
      loadData()
    }
  }, [currentPractice?.id])

  const loadData = async () => {
    if (!currentPractice?.id) return

    try {
      setLoading(true)

      const [subRes, plansRes, historyRes, discountRes] = await Promise.all([
        fetch(`/api/practices/${currentPractice.id}/billing/subscription`),
        fetch("/api/superadmin/billing/plans"),
        fetch(`/api/practices/${currentPractice.id}/billing/history`),
        fetch("/api/super-admin/annual-discount"),
      ])

      if (subRes.ok) {
        const data = await subRes.json()
        setSubscription(data)
      }

      if (plansRes.ok) {
        const data = await plansRes.json()
        setPlans(data)
      }

      if (historyRes.ok) {
        const data = await historyRes.json()
        setHistory(data)
      }

      if (discountRes.ok) {
        const discountData = await discountRes.json()
        setAnnualDiscountPercentage(discountData.percentage || 20)
      }
    } catch (error) {
      console.error("Error loading billing:", error)
    } finally {
      setLoading(false)
    }
  }

  const changePlan = async (planId: string) => {
    if (!currentPractice?.id) return

    try {
      const res = await fetch(`/api/practices/${currentPractice.id}/billing/subscription`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      })

      if (res.ok) {
        await loadData()
      }
    } catch (error) {
      console.error("Error changing plan:", error)
    }
  }

  if (loading) {
    return <div>Lade...</div>
  }

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Aktueller Plan</CardTitle>
          <CardDescription>Ihr aktuelles Abonnement</CardDescription>
        </CardHeader>
        <CardContent>
          {subscription ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold">{subscription.subscription_plans?.name}</h3>
                  <p className="text-muted-foreground">{subscription.subscription_plans?.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">
                    {billingInterval === "monthly"
                      ? ((subscription.subscription_plans?.price_monthly || 0) / 100).toFixed(2)
                      : ((subscription.subscription_plans?.price_yearly || 0) / 100).toFixed(2)}{" "}
                    €
                  </div>
                  <p className="text-sm text-muted-foreground">/{billingInterval === "monthly" ? "Monat" : "Jahr"}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={subscription.status === "trial" ? "secondary" : "default"}>
                  {subscription.status === "trial" && "Testversion"}
                  {subscription.status === "active" && "Aktiv"}
                </Badge>
                {subscription.trial_end && subscription.status === "trial" && (
                  <span className="text-sm text-muted-foreground">
                    Testversion endet am {formatDateDE(new Date(subscription.trial_end))}
                  </span>
                )}
              </div>

              <ul className="space-y-2">
                {subscription.subscription_plans?.features?.map((feature: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-muted-foreground">Kein aktives Abonnement</p>
          )}
        </CardContent>
      </Card>

      {/* Available Plans */}
      <Card>
        <CardHeader>
          <CardTitle>Verfügbare Pläne</CardTitle>
          <CardDescription>Wählen Sie das passende Preismodell</CardDescription>
          <div className="flex justify-center mt-4">
            <div className="inline-flex items-center rounded-full bg-muted p-1 shadow-sm">
              <button
                onClick={() => setBillingInterval("monthly")}
                className={`rounded-full px-5 py-2 text-sm font-medium transition-all duration-200 ${
                  billingInterval === "monthly"
                    ? "bg-background text-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Monatlich
              </button>
              <button
                onClick={() => setBillingInterval("yearly")}
                className={`rounded-full px-5 py-2 text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  billingInterval === "yearly"
                    ? "bg-background text-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Jährlich
                <span className="rounded-full bg-green-500 px-2 py-0.5 text-xs font-semibold text-white">
                  -{annualDiscountPercentage}%
                </span>
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {plans.map((plan) => (
              <Card key={plan.id} className={subscription?.plan_id === plan.id ? "border-primary" : ""}>
                <CardHeader>
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-2">
                    {billingInterval === "monthly" && plan.old_price_monthly && (
                      <div className="text-lg text-muted-foreground line-through">
                        {(plan.old_price_monthly / 100).toFixed(2)} €
                      </div>
                    )}
                    {billingInterval === "yearly" && plan.old_price_yearly && (
                      <div className="text-lg text-muted-foreground line-through">
                        {(plan.old_price_yearly / 100).toFixed(2)} €
                      </div>
                    )}
                    <div className="text-2xl font-bold">
                      {billingInterval === "monthly"
                        ? (plan.price_monthly / 100).toFixed(2)
                        : (plan.price_yearly / 100).toFixed(2)}{" "}
                      €
                      <span className="text-sm font-normal text-muted-foreground">
                        /{billingInterval === "monthly" ? "Monat" : "Jahr"}
                      </span>
                    </div>
                  </div>
                  {billingInterval === "yearly" && plan.price_monthly && plan.price_yearly && (
                    <p className="text-xs text-green-600 font-medium">
                      Spare{" "}
                      {(((plan.price_monthly * 12 - plan.price_yearly) / (plan.price_monthly * 12)) * 100).toFixed(0)}%
                      bei jährlicher Zahlung
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm">
                    {plan.features.map((feature: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {subscription?.plan_id === plan.id ? (
                    <Button className="w-full" disabled>
                      Aktueller Plan
                    </Button>
                  ) : (
                    <Button className="w-full" onClick={() => changePlan(plan.id)}>
                      Plan wählen
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Rechnungshistorie</CardTitle>
            <CardDescription>Ihre bisherigen Zahlungen</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Betrag</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rechnung</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.payment_date && formatDateDE(new Date(item.payment_date))}</TableCell>
                    <TableCell className="font-medium">{(item.amount / 100).toFixed(2)} €</TableCell>
                    <TableCell>
                      <Badge variant={item.status === "paid" ? "default" : "secondary"}>
                        {item.status === "paid" && "Bezahlt"}
                        {item.status === "pending" && "Ausstehend"}
                        {item.status === "failed" && "Fehlgeschlagen"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.invoice_pdf_url && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={item.invoice_pdf_url} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default PracticeBilling
