"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import {
  type SubscriptionPlan,
  type PracticeSubscription,
  type PlanConfigData,
  planToPlanConfigData,
  BillingMetricsCards,
  AnnualDiscountSettings,
  PlanCard,
  SubscriptionsTable,
  EditSubscriptionDialog,
  PlanConfigDialog,
} from "@/components/billing"

const BillingManagement = () => {
  const [subscriptions, setSubscriptions] = useState<PracticeSubscription[]>([])
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedSubscription, setSelectedSubscription] = useState<PracticeSubscription | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState("")
  const [selectedPlanForConfig, setSelectedPlanForConfig] = useState<SubscriptionPlan | null>(null)
  const [showPlanConfigDialog, setShowPlanConfigDialog] = useState(false)
  const [planConfigData, setPlanConfigData] = useState<PlanConfigData | null>(null)
  const [annualDiscountPercentage, setAnnualDiscountPercentage] = useState<number>(20)

  useEffect(() => {
    loadData()
    loadPlans()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const subsRes = await fetch("/api/superadmin/billing/subscriptions")
      if (subsRes.ok) {
        const subsData = await subsRes.json()
        setSubscriptions(subsData)
      }
    } catch (error) {
      console.error("Error loading billing data:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadPlans = async () => {
    try {
      const plansRes = await fetch("/api/superadmin/billing/plans", { credentials: "include" })

      if (plansRes.ok) {
        const plansData = await plansRes.json()
        const STANDARD_PLAN_NAMES = ["Starter", "Professional", "Premium"]
        const standardPlans = plansData.filter((plan: SubscriptionPlan) => STANDARD_PLAN_NAMES.includes(plan.name))

        const uniquePlans = standardPlans.reduce((acc: SubscriptionPlan[], plan: SubscriptionPlan) => {
          const existingPlan = acc.find((p) => p.name === plan.name)
          if (!existingPlan) acc.push(plan)
          return acc
        }, [])

        const sortedPlans = uniquePlans.sort((a, b) => {
          const order = ["Starter", "Professional", "Premium"]
          return order.indexOf(a.name) - order.indexOf(b.name)
        })

        setPlans(sortedPlans)
      } else {
        throw new Error(await plansRes.text())
      }

      try {
        const discountRes = await fetch("/api/super-admin/annual-discount")
        if (discountRes.ok) {
          const contentType = discountRes.headers.get("content-type")
          if (contentType?.includes("application/json")) {
            const discountData = await discountRes.json()
            setAnnualDiscountPercentage(discountData.percentage)
          }
        }
      } catch {
        // Use default 20%
      }
    } catch (error) {
      console.error("Error loading plans:", error)
    }
  }

  const totalRevenue =
    subscriptions.filter((s) => s.status === "active").reduce((sum, s) => sum + (s.subscription_plans?.price_monthly || 0), 0) / 100
  const activeSubscriptions = subscriptions.filter((s) => s.status === "active").length
  const trialSubscriptions = subscriptions.filter((s) => s.status === "trial").length

  const handleManualRefresh = async () => {
    setLoading(true)
    try {
      await Promise.all([loadData(), loadPlans()])
      toast({ title: "Aktualisiert", description: "Alle Daten wurden neu geladen" })
    } catch {
      toast({ title: "Fehler", description: "Daten konnten nicht aktualisiert werden", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAnnualDiscount = async () => {
    try {
      const response = await fetch("/api/super-admin/annual-discount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ percentage: annualDiscountPercentage }),
      })
      if (!response.ok) throw new Error("Failed to save")
      toast({ title: "Jahresrabatt gespeichert" })
      await loadPlans()
      await loadData()
    } catch {
      toast({ title: "Fehler", description: "Konnte Jahresrabatt nicht speichern", variant: "destructive" })
    }
  }

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setSelectedPlanForConfig(plan)
    setPlanConfigData(planToPlanConfigData(plan))
    setShowPlanConfigDialog(true)
  }

  const handleDeletePlan = async (planId: string, planName: string) => {
    if (!confirm(`Sind Sie sicher, dass Sie den Plan "${planName}" löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.`))
      return

    try {
      const response = await fetch(`/api/super-admin/pricing`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ planId }),
      })

      if (response.ok) {
        toast({ title: "Plan gelöscht", description: `Der Plan "${planName}" wurde erfolgreich gelöscht.` })
        await loadPlans()
        await loadData()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete plan")
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Der Plan konnte nicht gelöscht werden.",
        variant: "destructive",
      })
    }
  }

  const handleSavePlanConfig = async () => {
    if (!selectedPlanForConfig || !planConfigData) return

    try {
      setSaving(true)

      const checkResponse = await fetch("/api/superadmin/billing/plans", { credentials: "include" })
      if (checkResponse.ok) {
        const currentPlans = await checkResponse.json()
        const planExists = currentPlans.some((p: SubscriptionPlan) => p.id === selectedPlanForConfig.id)

        if (!planExists) {
          toast({ title: "Fehler", description: "Der ausgewählte Plan existiert nicht mehr. Die Seite wird neu geladen.", variant: "destructive" })
          await loadPlans()
          setShowPlanConfigDialog(false)
          return
        }
      }

      const updates = {
        name: planConfigData.name || "",
        description: planConfigData.description || "",
        priceMonthly: planConfigData.priceMonthly || "0",
        priceYearly: planConfigData.priceYearly || "",
        oldPriceMonthly: planConfigData.oldPriceMonthly || "",
        oldPriceYearly: planConfigData.oldPriceYearly || "",
        isActive: planConfigData.isActive || false,
        maxUsers: planConfigData.maxUsers,
        maxTeamMembers: planConfigData.maxTeamMembers,
        features: planConfigData.features || [],
        trialDays: planConfigData.trialDays,
      }

      const response = await fetch(`/api/super-admin/pricing`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ planId: selectedPlanForConfig.id, updates }),
      })

      const responseData = await response.json()

      if (response.ok) {
        toast({ title: "Erfolgreich gespeichert", description: "Die Plan-Konfiguration wurde aktualisiert." })
        setShowPlanConfigDialog(false)
        await loadPlans()
        await loadData()
      } else {
        throw new Error(responseData.details || responseData.error || "Failed to save configuration")
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Die Konfiguration konnte nicht gespeichert werden.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleEditSubscription = (subscription: PracticeSubscription) => {
    setSelectedSubscription(subscription)
    setSelectedPlanId(subscription.plan_id)
    setShowEditDialog(true)
  }

  const handleSaveSubscription = async () => {
    if (!selectedSubscription) return

    try {
      const res = await fetch(`/api/practices/${selectedSubscription.practice_id}/billing/subscription`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: selectedPlanId }),
      })

      if (res.ok) {
        await loadData()
        setShowEditDialog(false)
      }
    } catch (error) {
      console.error("Error updating subscription:", error)
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Übersicht & Einstellungen</TabsTrigger>
          <TabsTrigger value="subscriptions" className="flex items-center gap-2">
            Abonnements
            {activeSubscriptions > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeSubscriptions}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <BillingMetricsCards
            totalRevenue={totalRevenue}
            activeSubscriptions={activeSubscriptions}
            trialSubscriptions={trialSubscriptions}
          />

          <AnnualDiscountSettings
            annualDiscountPercentage={annualDiscountPercentage}
            onDiscountChange={setAnnualDiscountPercentage}
            onSave={handleSaveAnnualDiscount}
            onRefresh={handleManualRefresh}
          />

          <Card>
            <CardHeader>
              <CardTitle>Abonnement-Pläne verwalten</CardTitle>
              <CardDescription>
                Verfügbare Preismodelle für Praxen. Klicken Sie auf "Bearbeiten" um Preise, Limits und Features anzupassen.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {plans.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    annualDiscountPercentage={annualDiscountPercentage}
                    onEdit={handleEditPlan}
                    onDelete={handleDeletePlan}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-6">
          <SubscriptionsTable
            subscriptions={subscriptions}
            loading={loading}
            onEdit={handleEditSubscription}
            onRefresh={handleManualRefresh}
          />
        </TabsContent>
      </Tabs>

      <EditSubscriptionDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        subscription={selectedSubscription}
        plans={plans}
        selectedPlanId={selectedPlanId}
        onPlanChange={setSelectedPlanId}
        onSave={handleSaveSubscription}
      />

      <PlanConfigDialog
        open={showPlanConfigDialog}
        onOpenChange={setShowPlanConfigDialog}
        plan={selectedPlanForConfig}
        configData={planConfigData}
        onConfigChange={setPlanConfigData}
        onSave={handleSavePlanConfig}
        saving={saving}
        annualDiscountPercentage={annualDiscountPercentage}
      />
    </div>
  )
}

export default BillingManagement
