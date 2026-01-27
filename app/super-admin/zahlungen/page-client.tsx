"use client"

import { useState, useEffect, useCallback, Suspense, lazy } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useSearchParams, useRouter } from "next/navigation"
import { CreditCard, Receipt, Users, Settings, Euro, TrendingUp, Activity, Tag, Loader2 } from "lucide-react"
import { formatCurrency } from "@/lib/format-currency"

const StripeBillingDashboard = lazy(() => import("@/components/super-admin/stripe-billing-dashboard"))
const BillingManagement = lazy(() => import("@/components/billing-management"))

interface BillingStats {
  mrr: number
  arr: number
  totalCustomers: number
  activeSubscriptions: number
  trialSubscriptions: number
  canceledSubscriptions: number
  newSubscriptionsThisMonth: number
  churnRate: number
  averageRevenuePerUser: number
  lifetimeValue: number
  totalRevenue: number
  totalRefunds: number
  couponDiscounts: number
  customDiscounts: number
  growthRate: number
}

function ZahlungenContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const activeTab = searchParams.get("tab") || "uebersicht"

  const [stats, setStats] = useState<BillingStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)

  // Load stats for the top cards
  const loadStats = useCallback(async () => {
    setLoadingStats(true)
    try {
      const statsRes = await fetch("/api/super-admin/stripe/stats")
      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error("[v0] Error loading billing stats:", error)
    } finally {
      setLoadingStats(false)
    }
  }, [])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", value)
    router.push(`/super-admin/zahlungen?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Zahlungsverwaltung</h1>
        <p className="text-muted-foreground mt-2">Verwalten Sie Preismodelle, Stripe-Zahlungen und Abonnements</p>
      </div>

      {/* Stats Cards - Moved to top */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monatlicher Umsatz</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(stats?.mrr || 0)}</div>
                <p className="text-xs text-muted-foreground">Aus aktiven Abonnements</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktive Abos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.activeSubscriptions || 0}</div>
                <p className="text-xs text-muted-foreground">Zahlende Praxen</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Testversionen</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.trialSubscriptions || 0}</div>
                <p className="text-xs text-muted-foreground">Aktive Trials</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abwanderung</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.churnRate || 0}%</div>
                <p className="text-xs text-muted-foreground">{stats?.canceledSubscriptions || 0} Kündigungen</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Merged Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 h-auto gap-1">
          <TabsTrigger value="uebersicht" className="gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Übersicht</span>
          </TabsTrigger>
          <TabsTrigger value="preismodelle" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Preismodelle</span>
          </TabsTrigger>
          <TabsTrigger value="abonnements" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Abonnements</span>
          </TabsTrigger>
          <TabsTrigger value="transaktionen" className="gap-2">
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">Transaktionen</span>
          </TabsTrigger>
          <TabsTrigger value="rabatte" className="gap-2">
            <Tag className="h-4 w-4" />
            <span className="hidden sm:inline">Rabatte</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="uebersicht" className="mt-6">
          <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
            <StripeBillingDashboard initialTab="overview" hideStats />
          </Suspense>
        </TabsContent>

        <TabsContent value="preismodelle" className="mt-6">
          <Suspense fallback={<Skeleton className="h-[800px] w-full" />}>
            <BillingManagement />
          </Suspense>
        </TabsContent>

        <TabsContent value="abonnements" className="mt-6">
          <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
            <StripeBillingDashboard initialTab="subscriptions" hideStats />
          </Suspense>
        </TabsContent>

        <TabsContent value="transaktionen" className="mt-6">
          <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
            <StripeBillingDashboard initialTab="payments" hideStats />
          </Suspense>
        </TabsContent>

        <TabsContent value="rabatte" className="mt-6">
          <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
            <StripeBillingDashboard initialTab="coupons" hideStats />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function ZahlungenClient() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <ZahlungenContent />
    </Suspense>
  )
}
