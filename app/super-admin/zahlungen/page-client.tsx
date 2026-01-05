"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreditCard, Receipt, Users, SettingsIcon } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"
import { Suspense, lazy } from "react"
import { Skeleton } from "@/components/ui/skeleton"

const StripeBillingDashboard = lazy(() => import("@/components/super-admin/stripe-billing-dashboard"))
const BillingManagement = lazy(() => import("@/components/billing-management"))

function ZahlungenContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const activeTab = searchParams.get("tab") || "preismodelle"

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", value)
    router.push(`/super-admin/zahlungen?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Zahlungsverwaltung</h1>
        <p className="text-muted-foreground mt-2">Verwalten Sie Preismodelle, Stripe-Zahlungen und Abonnements</p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="preismodelle" className="gap-2">
            <SettingsIcon className="h-4 w-4" />
            Preismodelle
          </TabsTrigger>
          <TabsTrigger value="stripe" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Stripe Dashboard
          </TabsTrigger>
          <TabsTrigger value="transaktionen" className="gap-2">
            <Receipt className="h-4 w-4" />
            Transaktionen
          </TabsTrigger>
          <TabsTrigger value="abonnements" className="gap-2">
            <Users className="h-4 w-4" />
            Abonnements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preismodelle" className="mt-6">
          <Suspense fallback={<Skeleton className="h-[800px] w-full" />}>
            <BillingManagement />
          </Suspense>
        </TabsContent>

        <TabsContent value="stripe" className="mt-6">
          <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
            <StripeBillingDashboard />
          </Suspense>
        </TabsContent>

        <TabsContent value="transaktionen" className="mt-6">
          <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
            <StripeBillingDashboard />
          </Suspense>
        </TabsContent>

        <TabsContent value="abonnements" className="mt-6">
          <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
            <StripeBillingDashboard />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function ZahlungenClient() {
  return (
    <Suspense fallback={<div>Lädt...</div>}>
      <ZahlungenContent />
    </Suspense>
  )
}
