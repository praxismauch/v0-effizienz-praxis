"use client"

import { memo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, Users, Building2, UserPlus, Zap, DollarSign, Clock, Target } from "lucide-react"

interface AnalyticsStatCardsProps {
  systemMetrics: {
    totalPractices?: number
    newPractices?: number
    activeUsers?: number
    userGrowthPercent?: number
    totalFeatureUsage?: number
    avgFeatureUsagePerUser?: number
    conversionRate?: number
    avgSessionDuration?: string
    waitlistCount?: number
  } | null
  subscriptionStats: {
    mrr?: number
    activeSubscriptions?: number
  } | null
  totalViews: number
  dateRange: string
}

export const AnalyticsStatCards = memo(function AnalyticsStatCards({
  systemMetrics,
  subscriptionStats,
  totalViews,
  dateRange,
}: AnalyticsStatCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Aktive Praxen</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{systemMetrics?.totalPractices || 0}</div>
          <p className="text-xs text-muted-foreground">
            +{systemMetrics?.newPractices || 0} in den letzten {dateRange} Tagen
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Aktive Benutzer</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{systemMetrics?.activeUsers || 0}</div>
          <p className="text-xs text-muted-foreground">{systemMetrics?.userGrowthPercent || 0}% Wachstum</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Feature-Nutzung</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{systemMetrics?.totalFeatureUsage || 0}</div>
          <p className="text-xs text-muted-foreground">Ø {systemMetrics?.avgFeatureUsagePerUser || 0} pro Benutzer</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">MRR (Monatlich)</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {subscriptionStats?.mrr ? `€${(subscriptionStats.mrr / 100).toLocaleString()}` : "€0"}
          </div>
          <p className="text-xs text-muted-foreground">{subscriptionStats?.activeSubscriptions || 0} aktive Abos</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Seitenaufrufe</CardTitle>
          <Eye className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalViews.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Landing Page Traffic</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {systemMetrics?.conversionRate ? `${systemMetrics.conversionRate.toFixed(1)}%` : "0%"}
          </div>
          <p className="text-xs text-muted-foreground">Besucher zu Registrierungen</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ø Session-Dauer</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{systemMetrics?.avgSessionDuration || "0m"}</div>
          <p className="text-xs text-muted-foreground">Pro Benutzer pro Tag</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Warteschlange</CardTitle>
          <UserPlus className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{systemMetrics?.waitlistCount || 0}</div>
          <p className="text-xs text-muted-foreground">Wartende Interessenten</p>
        </CardContent>
      </Card>
    </div>
  )
})
