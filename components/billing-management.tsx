"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TrendingUp, Users, CheckCircle, Edit, Euro, Settings, Save, Trash2, RefreshCcw } from "lucide-react"
import { formatDateDE } from "@/lib/utils"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { formatCurrency } from "@/lib/format-currency"

interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price_monthly: number
  price_yearly?: number | null
  old_price_monthly?: number | null
  old_price_yearly?: number | null
  features: string[]
  max_users: number | null
  max_team_members: number | null
  is_active: boolean
}

interface PracticeSubscription {
  id: string
  practice_id: string
  plan_id: string
  status: string
  current_period_start: string
  current_period_end: string
  trial_end: string | null
  practices: { id: string; name: string; email: string }
  subscription_plans: SubscriptionPlan
}

interface PlanConfigData {
  name: string
  description: string
  priceMonthly: string
  priceYearly?: string
  oldPriceMonthly?: string
  oldPriceYearly?: string
  isActive: boolean
  maxUsers: number | null
  maxTeamMembers: number | null
  features: string[]
  billingInterval?: string
  autoRenew?: boolean
  maxPractices?: number
  storageLimit?: number
  featureTodos?: boolean
  featureGoals?: boolean
  featureWorkflows?: boolean
  featureTeam?: boolean
  featureReports?: boolean
  featureAi?: boolean
  featureApi?: boolean
  featurePrioritySupport?: boolean
  trialDays?: string
  allowDowngrades?: boolean
}

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
      console.log("[v0] Loading subscription plans...")
      const plansRes = await fetch("/api/superadmin/billing/plans", {
        credentials: "include",
      })

      if (plansRes.ok) {
        const plansData = await plansRes.json()
        console.log("[v0] Loaded plans:", plansData.length)
        console.log(
          "[v0] Plan IDs in database:",
          plansData.map((p: any) => ({ id: p.id, name: p.name })),
        )

        const STANDARD_PLAN_NAMES = ["Starter", "Professional", "Premium"]
        const standardPlans = plansData.filter((plan: any) => STANDARD_PLAN_NAMES.includes(plan.name))

        // Keep the first occurrence of each plan name to avoid duplicates
        const uniquePlans = standardPlans.reduce((acc: any[], plan: any) => {
          const existingPlan = acc.find((p) => p.name === plan.name)
          if (!existingPlan) {
            acc.push(plan)
          }
          return acc
        }, [])

        // Sort plans by standard order: Starter, Professional, Premium
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
          if (contentType && contentType.includes("application/json")) {
            const discountData = await discountRes.json()
            setAnnualDiscountPercentage(discountData.percentage)
          }
        } else {
          console.log("[v0] Annual discount API not available, using default 20%")
        }
      } catch (discountError) {
        console.log("[v0] Failed to load annual discount, using default 20%:", discountError)
      }
    } catch (error) {
      console.error("Error loading plans:", error)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      trial: "bg-blue-100 text-blue-800",
      active: "bg-green-100 text-green-800",
      past_due: "bg-orange-100 text-orange-800",
      canceled: "bg-gray-100 text-gray-800",
      unpaid: "bg-red-100 text-red-800",
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  const totalRevenue =
    subscriptions
      .filter((s) => s.status === "active")
      .reduce((sum, s) => sum + (s.subscription_plans?.price_monthly || 0), 0) / 100

  const activeSubscriptions = subscriptions.filter((s) => s.status === "active").length
  const trialSubscriptions = subscriptions.filter((s) => s.status === "trial").length

  const handleSavePlanConfig = async () => {
    if (!selectedPlanForConfig) return

    try {
      setSaving(true)

      console.log("[v0] Checking if plan exists before saving...")
      const checkResponse = await fetch("/api/superadmin/billing/plans", {
        credentials: "include",
      })

      if (checkResponse.ok) {
        const currentPlans = await checkResponse.json()
        const planExists = currentPlans.some((p: any) => p.id === selectedPlanForConfig.id)

        if (!planExists) {
          toast({
            title: "Fehler",
            description: "Der ausgewählte Plan existiert nicht mehr. Die Seite wird neu geladen.",
            variant: "destructive",
          })
          // Reload plans and close dialog
          await loadPlans()
          setShowPlanConfigDialog(false)
          return
        }
      }

      const updates = {
        name: planConfigData?.name || "",
        description: planConfigData?.description || "",
        priceMonthly: planConfigData?.priceMonthly || "0",
        priceYearly: planConfigData?.priceYearly || "",
        oldPriceMonthly: planConfigData?.oldPriceMonthly || "",
        oldPriceYearly: planConfigData?.oldPriceYearly || "",
        isActive: planConfigData?.isActive || false,
        maxUsers: planConfigData?.maxUsers,
        maxTeamMembers: planConfigData?.maxTeamMembers,
        features: planConfigData?.features || [],
        trialDays: planConfigData?.trialDays,
      }

      console.log("[v0] Saving plan config:", {
        planId: selectedPlanForConfig.id,
        planName: selectedPlanForConfig.name,
        updates,
      })

      const response = await fetch(`/api/super-admin/pricing`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          planId: selectedPlanForConfig.id,
          updates,
        }),
      })

      const responseData = await response.json()
      console.log("[v0] Save response:", { ok: response.ok, status: response.status, data: responseData })

      if (response.ok) {
        toast({
          title: "Erfolgreich gespeichert",
          description: "Die Plan-Konfiguration wurde aktualisiert.",
        })
        setShowPlanConfigDialog(false)
        await loadPlans() // Already calls loadPlans() - good!
        await loadData() // Also refetch subscriptions to show updated data
      } else {
        const errorMessage = responseData.details || responseData.error || "Failed to save configuration"
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error("Error saving plan config:", error)
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Die Konfiguration konnte nicht gespeichert werden.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePlan = async (planId: string, planName: string) => {
    if (
      !confirm(
        `Sind Sie sicher, dass Sie den Plan "${planName}" löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.`,
      )
    )
      return

    try {
      const response = await fetch(`/api/super-admin/pricing`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ planId }),
      })

      if (response.ok) {
        toast({
          title: "Plan gelöscht",
          description: `Der Plan "${planName}" wurde erfolgreich gelöscht.`,
        })
        await loadPlans() // Refetch plans after deletion
        await loadData() // Also refetch subscriptions
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete plan")
      }
    } catch (error) {
      console.error("Error deleting plan:", error)
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Der Plan konnte nicht gelöscht werden.",
        variant: "destructive",
      })
    }
  }

  const handleManualRefresh = async () => {
    setLoading(true)
    try {
      await Promise.all([loadData(), loadPlans()])
      toast({
        title: "Aktualisiert",
        description: "Alle Daten wurden neu geladen",
      })
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Daten konnten nicht aktualisiert werden",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchData = () => {
    loadData()
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
          {/* Metrics Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monatlicher Umsatz</CardTitle>
                <Euro className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
                <p className="text-xs text-muted-foreground">Aus aktiven Abonnements</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aktive Abos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeSubscriptions}</div>
                <p className="text-xs text-muted-foreground">Zahlende Praxen</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Testversionen</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{trialSubscriptions}</div>
                <p className="text-xs text-muted-foreground">Aktive Trials</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Jahresrabatt-Einstellungen</CardTitle>
              <CardDescription>
                Konfigurieren Sie den globalen Rabatt für jährliche Abonnements. Jahrespreise werden automatisch
                berechnet: Monatspreis × 12 × (1 - Rabatt%)
              </CardDescription>
              <div className="absolute top-4 right-4">
                <Button variant="outline" size="sm" onClick={handleManualRefresh}>
                  <RefreshCcw className="h-4 w-4 mr-2" /> Aktualisieren
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor="annual-discount">Jahresrabatt (%)</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      id="annual-discount"
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={annualDiscountPercentage}
                      onChange={(e) => setAnnualDiscountPercentage(Number(e.target.value))}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                    <Button
                      onClick={async () => {
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
                        } catch (error) {
                          toast({
                            title: "Fehler",
                            description: "Konnte Jahresrabatt nicht speichern",
                            variant: "destructive",
                          })
                        }
                      }}
                      size="sm"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Speichern
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Aktueller Rabatt: {annualDiscountPercentage}% - Beispiel: 99€/Monat wird zu{" "}
                    {(99 * 12 * (1 - annualDiscountPercentage / 100)).toLocaleString("de-DE", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    €/Jahr
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Abonnement-Pläne verwalten</CardTitle>
              <CardDescription>
                Verfügbare Preismodelle für Praxen. Klicken Sie auf "Bearbeiten" um Preise, Limits und Features
                anzupassen.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {plans.map((plan) => (
                  <Card key={plan.id} className="border-2">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{plan.name}</CardTitle>
                            <Badge variant={plan.is_active ? "default" : "secondary"}>
                              {plan.is_active ? "Aktiv" : "Inaktiv"}
                            </Badge>
                          </div>
                          <CardDescription className="mt-1">{plan.description}</CardDescription>
                          <div className="mt-4 flex flex-wrap gap-4">
                            <div className="flex items-baseline gap-2">
                              {plan.old_price_monthly && (
                                <span className="line-through text-muted-foreground">
                                  {formatCurrency(plan.old_price_monthly / 100)}
                                </span>
                              )}
                              <span className="text-2xl font-bold">{formatCurrency(plan.price_monthly / 100)}</span>
                              <span className="text-sm font-normal text-muted-foreground">/Monat</span>
                            </div>
                            {plan.price_yearly && (
                              <div className="flex items-baseline gap-2">
                                {plan.old_price_yearly && (
                                  <span className="line-through text-muted-foreground">
                                    {formatCurrency(plan.old_price_yearly / 100)}
                                  </span>
                                )}
                                <span className="text-2xl font-bold">{formatCurrency(plan.price_yearly / 100)}</span>
                                <span className="text-sm font-normal text-muted-foreground">/Jahr</span>
                                <Badge variant="secondary" className="bg-green-100 text-green-800">
                                  {annualDiscountPercentage}% Ersparnis
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedPlanForConfig(plan)
                              setPlanConfigData({
                                name: plan.name,
                                description: plan.description,
                                priceMonthly: (plan.price_monthly / 100).toFixed(2),
                                priceYearly: plan.price_yearly ? (plan.price_yearly / 100).toFixed(2) : "",
                                oldPriceMonthly: plan.old_price_monthly
                                  ? (plan.old_price_monthly / 100).toFixed(2)
                                  : "",
                                oldPriceYearly: plan.old_price_yearly ? (plan.old_price_yearly / 100).toFixed(2) : "",
                                isActive: plan.is_active,
                                maxUsers: plan.max_users,
                                maxTeamMembers: plan.max_team_members,
                                features: plan.features,
                                trialDays: (plan as any).trial_days?.toString() || "30",
                              })
                              setShowPlanConfigDialog(true)
                            }}
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Bearbeiten
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeletePlan(plan.id, plan.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                        <div>
                          <div className="font-medium text-muted-foreground">Monatlicher Preis</div>
                          <div className="text-lg font-bold">{formatCurrency(plan.price_monthly / 100)}</div>
                        </div>
                        {plan.price_yearly && (
                          <div>
                            <div className="font-medium text-muted-foreground">Jährlicher Preis</div>
                            <div className="text-lg font-bold">{formatCurrency(plan.price_yearly / 100)}</div>
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-muted-foreground">Max. Benutzer</div>
                          <div className="text-lg font-bold">{plan.max_users || "Unbegrenzt"}</div>
                        </div>
                        <div>
                          <div className="font-medium text-muted-foreground">Max. Teammitglieder</div>
                          <div className="text-lg font-bold">{plan.max_team_members || "Unbegrenzt"}</div>
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-sm text-muted-foreground mb-2">Enthaltene Features:</div>
                        <div className="flex flex-wrap gap-2">
                          {plan.features.map((feature, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Praxis-Abonnements</CardTitle>
              <CardDescription>Übersicht aller Abonnements</CardDescription>
              <div className="absolute top-4 right-4">
                <Button variant="outline" size="sm" onClick={handleManualRefresh}>
                  <RefreshCcw className="h-4 w-4 mr-2" /> Aktualisieren
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Lade Daten...</div>
              ) : subscriptions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Keine Abonnements vorhanden</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Praxis</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Preis</TableHead>
                      <TableHead>Periode</TableHead>
                      <TableHead>Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{sub.practices?.name}</div>
                            <div className="text-sm text-muted-foreground">{sub.practices?.email}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{sub.subscription_plans?.name}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(sub.status)}>
                            {sub.status === "trial" && "Testversion"}
                            {sub.status === "active" && "Aktiv"}
                            {sub.status === "past_due" && "Überfällig"}
                            {sub.status === "canceled" && "Gekündigt"}
                            {sub.status === "unpaid" && "Unbezahlt"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {((sub.subscription_plans?.price_monthly || 0) / 100).toLocaleString("de-DE", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                          €
                        </TableCell>
                        <TableCell className="text-sm">
                          {sub.current_period_start && formatDateDE(new Date(sub.current_period_start))} -{" "}
                          {sub.current_period_end && formatDateDE(new Date(sub.current_period_end))}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedSubscription(sub)
                              setSelectedPlanId(sub.plan_id)
                              setShowEditDialog(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs remain unchanged */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Abonnement bearbeiten</DialogTitle>
            <DialogDescription>Ändern Sie den Plan für {selectedSubscription?.practices?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Neuer Plan</Label>
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - {formatCurrency(plan.price_monthly / 100)}/Monat
                      {plan.price_yearly && <span> - {formatCurrency(plan.price_yearly / 100)}/Jahr</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={async () => {
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
              }}
            >
              Speichern
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPlanConfigDialog} onOpenChange={setShowPlanConfigDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Plan konfigurieren: <span className="font-bold">{selectedPlanForConfig?.name}</span>
            </DialogTitle>
            <DialogDescription>Passen Sie die detaillierten Parameter für diesen Abonnement-Plan an</DialogDescription>
          </DialogHeader>

          {selectedPlanForConfig && planConfigData && (
            <div className="space-y-6 py-4">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Grundeinstellungen</h3>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="plan-name">Plan-Name</Label>
                    <Input
                      id="plan-name"
                      value={planConfigData.name || ""}
                      onChange={(e) => setPlanConfigData({ ...planConfigData, name: e.target.value })}
                      placeholder="z.B. Professional"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plan-description">Beschreibung</Label>
                    <Textarea
                      id="plan-description"
                      value={planConfigData.description || ""}
                      onChange={(e) => setPlanConfigData({ ...planConfigData, description: e.target.value })}
                      placeholder="Kurze Beschreibung des Plans"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Preisgestaltung</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="price-monthly">Monatlicher Preis (€)</Label>
                        <Input
                          id="price-monthly"
                          type="number"
                          step="0.01"
                          value={planConfigData.priceMonthly || ""}
                          onChange={(e) => {
                            const monthly = Number.parseFloat(e.target.value) || 0
                            const yearly = (monthly * 12 * (1 - annualDiscountPercentage / 100)).toFixed(2)
                            setPlanConfigData({
                              ...planConfigData,
                              priceMonthly: e.target.value,
                              priceYearly: yearly,
                            })
                          }}
                          placeholder="99,00"
                        />
                        <p className="text-xs text-muted-foreground">Aktueller Preis pro Monat</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="old-price-monthly">Alter Monatspreis (€)</Label>
                        <Input
                          id="old-price-monthly"
                          type="number"
                          step="0.01"
                          value={planConfigData.oldPriceMonthly || ""}
                          onChange={(e) => setPlanConfigData({ ...planConfigData, oldPriceMonthly: e.target.value })}
                          placeholder="149,00"
                        />
                        <p className="text-xs text-muted-foreground">Optional: Durchgestrichener Vergleichspreis</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="price-yearly">Jährlicher Preis (€)</Label>
                        <Input
                          id="price-yearly"
                          type="number"
                          step="0.01"
                          value={planConfigData.priceYearly || ""}
                          readOnly
                          className="bg-muted"
                          placeholder="Wird automatisch berechnet"
                        />
                        <p className="text-xs text-muted-foreground">
                          Automatisch berechnet mit {annualDiscountPercentage}% Rabatt
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="old-price-yearly">Alter Jahrespreis (€)</Label>
                        <Input
                          id="old-price-yearly"
                          type="number"
                          step="0.01"
                          value={planConfigData.oldPriceYearly || ""}
                          onChange={(e) => setPlanConfigData({ ...planConfigData, oldPriceYearly: e.target.value })}
                          placeholder="1788,00"
                        />
                        <p className="text-xs text-muted-foreground">Optional: Durchgestrichener Vergleichspreis</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is-active"
                      checked={planConfigData.isActive}
                      onCheckedChange={(checked) => setPlanConfigData({ ...planConfigData, isActive: checked })}
                    />
                    <Label htmlFor="is-active">Plan aktiv (sichtbar auf Preisseite)</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Nutzungslimits</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="max-users">Max. Benutzer</Label>
                    <Input
                      id="max-users"
                      type="number"
                      value={planConfigData.maxUsers === null ? "" : planConfigData.maxUsers}
                      onChange={(e) =>
                        setPlanConfigData({
                          ...planConfigData,
                          maxUsers: e.target.value === "" ? null : Number.parseInt(e.target.value, 10),
                        })
                      }
                      placeholder="Unbegrenzt"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max-team-members">Max. Teammitglieder</Label>
                    <Input
                      id="max-team-members"
                      type="number"
                      value={planConfigData.maxTeamMembers === null ? "" : planConfigData.maxTeamMembers}
                      onChange={(e) =>
                        setPlanConfigData({
                          ...planConfigData,
                          maxTeamMembers: e.target.value === "" ? null : Number.parseInt(e.target.value, 10),
                        })
                      }
                      placeholder="Unbegrenzt"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max-practices">Max. Praxisstandorte</Label>
                    <Input
                      id="max-practices"
                      type="number"
                      value={planConfigData.maxPractices === null ? "" : planConfigData.maxPractices}
                      onChange={(e) =>
                        setPlanConfigData({
                          ...planConfigData,
                          maxPractices: e.target.value === "" ? null : Number.parseInt(e.target.value, 10),
                        })
                      }
                      placeholder="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storage-limit">Speicherplatz (GB)</Label>
                    <Input
                      id="storage-limit"
                      type="number"
                      value={planConfigData.storageLimit === null ? "" : planConfigData.storageLimit}
                      onChange={(e) =>
                        setPlanConfigData({
                          ...planConfigData,
                          storageLimit: e.target.value === "" ? null : Number.parseInt(e.target.value, 10),
                        })
                      }
                      placeholder="10"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Features & Funktionen</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="feature-todos">To-Do-Verwaltung</Label>
                    <Switch
                      id="feature-todos"
                      checked={planConfigData.featureTodos ?? true}
                      onCheckedChange={(checked) => setPlanConfigData({ ...planConfigData, featureTodos: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="feature-goals">Zielverwaltung</Label>
                    <Switch
                      id="feature-goals"
                      checked={planConfigData.featureGoals ?? true}
                      onCheckedChange={(checked) => setPlanConfigData({ ...planConfigData, featureGoals: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="feature-workflows">Workflows</Label>
                    <Switch
                      id="feature-workflows"
                      checked={planConfigData.featureWorkflows ?? true}
                      onCheckedChange={(checked) => setPlanConfigData({ ...planConfigData, featureWorkflows: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="feature-team">Team-Management</Label>
                    <Switch
                      id="feature-team"
                      checked={planConfigData.featureTeam ?? true}
                      onCheckedChange={(checked) => setPlanConfigData({ ...planConfigData, featureTeam: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="feature-reports">Erweiterte Berichte</Label>
                    <Switch
                      id="feature-reports"
                      checked={planConfigData.featureReports ?? false}
                      onCheckedChange={(checked) => setPlanConfigData({ ...planConfigData, featureReports: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="feature-ai">KI-Funktionen</Label>
                    <Switch
                      id="feature-ai"
                      checked={planConfigData.featureAi ?? false}
                      onCheckedChange={(checked) => setPlanConfigData({ ...planConfigData, featureAi: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="feature-api">API-Zugriff</Label>
                    <Switch
                      id="feature-api"
                      checked={planConfigData.featureApi ?? false}
                      onCheckedChange={(checked) => setPlanConfigData({ ...planConfigData, featureApi: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="feature-priority-support">Prioritäts-Support</Label>
                    <Switch
                      id="feature-priority-support"
                      checked={planConfigData.featurePrioritySupport ?? false}
                      onCheckedChange={(checked) =>
                        setPlanConfigData({ ...planConfigData, featurePrioritySupport: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Erweiterte Einstellungen</h3>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="trial-days">Testphase (Tage)</Label>
                    <Input
                      id="trial-days"
                      type="number"
                      value={planConfigData.trialDays === null ? "" : planConfigData.trialDays}
                      onChange={(e) =>
                        setPlanConfigData({
                          ...planConfigData,
                          trialDays: e.target.value === "" ? null : e.target.value,
                        })
                      }
                      placeholder="30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billing-interval">Abrechnungsintervall</Label>
                    <Select
                      value={planConfigData.billingInterval || "monthly"}
                      onValueChange={(value) => setPlanConfigData({ ...planConfigData, billingInterval: value })}
                    >
                      <SelectTrigger id="billing-interval">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monatlich</SelectItem>
                        <SelectItem value="quarterly">Vierteljährlich</SelectItem>
                        <SelectItem value="yearly">Jährlich</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="auto-renew"
                      checked={planConfigData.autoRenew ?? true}
                      onCheckedChange={(checked) => setPlanConfigData({ ...planConfigData, autoRenew: checked })}
                    />
                    <Label htmlFor="auto-renew">Automatische Verlängerung</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="allow-downgrades"
                      checked={planConfigData.allowDowngrades ?? false}
                      onCheckedChange={(checked) => setPlanConfigData({ ...planConfigData, allowDowngrades: checked })}
                    />
                    <Label htmlFor="allow-downgrades">Downgrade erlauben</Label>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowPlanConfigDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSavePlanConfig} disabled={saving}>
              {saving ? "Speichern..." : "Änderungen speichern"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default BillingManagement
