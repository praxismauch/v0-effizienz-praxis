"use client"

import useSWR from "swr"
import { useState, useMemo } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RefreshCw } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { SWR_KEYS } from "@/lib/swr-keys"
import { swrFetcher } from "@/lib/swr-fetcher"
import {
  AnalyticsStatCards,
  PracticeGrowthChart,
  TopFeaturesList,
  DailyActivityChart,
  CumulativeGrowthChart,
  FeatureUsageBarChart,
  FeatureAdoptionList,
  SubscriptionPieChart,
  RevenueByPlanChart,
  TrafficSourcesCharts,
  GrowthMetricsCards,
} from "@/components/analytics"

interface AnalyticsData {
  summary: {
    totalViews: number
    uniqueVisitors: number
    totalEvents: number
    avgViewsPerVisitor: string
  }
  pageStats: Array<{
    page: string
    views: number
    uniqueVisitors: number
  }>
  dailyData: Array<{
    date: string
    views: number
    uniqueVisitors: number
  }>
  deviceStats: Record<string, number>
  browserStats: Record<string, number>
  referrerStats: Record<string, number>
}

const EMPTY_ANALYTICS: AnalyticsData = {
  summary: {
    totalViews: 0,
    uniqueVisitors: 0,
    totalEvents: 0,
    avgViewsPerVisitor: "0",
  },
  pageStats: [],
  dailyData: [],
  deviceStats: {},
  browserStats: {},
  referrerStats: {},
}

export function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState("30")

  const { data: systemMetrics, mutate: mutateSystemMetrics } = useSWR(SWR_KEYS.systemMetrics(dateRange), swrFetcher, {
    revalidateOnFocus: false,
  })

  const { data: featureUsageData, mutate: mutateFeatureUsage } = useSWR(SWR_KEYS.featureUsage(dateRange), swrFetcher, {
    revalidateOnFocus: false,
  })

  const { data: practiceGrowthData, mutate: mutatePracticeGrowth } = useSWR(
    SWR_KEYS.practiceGrowth(dateRange),
    swrFetcher,
    { revalidateOnFocus: false },
  )

  const {
    data: subscriptionStats,
    mutate: mutateSubscriptionStats,
    isLoading: loading,
  } = useSWR(SWR_KEYS.subscriptionStats(), swrFetcher, { revalidateOnFocus: false })

  const featureUsage = useMemo(() => featureUsageData?.topFeatures || [], [featureUsageData])
  const practiceGrowth = useMemo(() => practiceGrowthData?.dailyGrowth || [], [practiceGrowthData])
  const analytics = EMPTY_ANALYTICS

  const deviceData = useMemo(
    () =>
      Object.entries(analytics.deviceStats).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      })),
    [analytics.deviceStats]
  )

  const topReferrers = useMemo(
    () =>
      Object.entries(analytics.referrerStats)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, value]) => ({ name, value })),
    [analytics.referrerStats]
  )

  const handleManualRefresh = async () => {
    try {
      await Promise.all([
        mutateSystemMetrics(),
        mutateFeatureUsage(),
        mutatePracticeGrowth(),
        mutateSubscriptionStats(),
      ])
      toast({
        title: "Aktualisiert",
        description: "Alle Analytics-Daten wurden neu geladen",
      })
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Daten konnten nicht aktualisiert werden",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">System Analytics</h2>
          <p className="text-muted-foreground">Umfassende Übersicht über Systemnutzung und Performance</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Letzte 7 Tage</SelectItem>
              <SelectItem value="30">Letzte 30 Tage</SelectItem>
              <SelectItem value="90">Letzte 90 Tage</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleManualRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Aktualisieren
          </Button>
        </div>
      </div>

      <AnalyticsStatCards
        systemMetrics={systemMetrics}
        subscriptionStats={subscriptionStats}
        totalViews={analytics.summary.totalViews}
        dateRange={dateRange}
      />

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="growth">Wachstum</TabsTrigger>
          <TabsTrigger value="features">Feature-Nutzung</TabsTrigger>
          <TabsTrigger value="subscriptions">Abonnements</TabsTrigger>
          <TabsTrigger value="landing">Landing Page</TabsTrigger>
          <TabsTrigger value="traffic">Traffic-Quellen</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <PracticeGrowthChart data={practiceGrowth} />
            <TopFeaturesList features={featureUsage} />
          </div>
          <DailyActivityChart data={analytics.dailyData} />
        </TabsContent>

        <TabsContent value="growth" className="space-y-4">
          <CumulativeGrowthChart data={practiceGrowth} />
          <GrowthMetricsCards
            growthRate={systemMetrics?.growthRate || 0}
            churnRate={subscriptionStats?.churnRate || 0}
            ltv={subscriptionStats?.ltv || 0}
            dateRange={dateRange}
          />
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <FeatureUsageBarChart features={featureUsage} />
          <FeatureAdoptionList features={featureUsage} totalPractices={systemMetrics?.totalPractices || 0} />
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <SubscriptionPieChart
              data={subscriptionStats?.byStatus || []}
              title="Abonnements nach Status"
              description="Verteilung der Abonnement-Status"
            />
            <RevenueByPlanChart data={subscriptionStats?.byPlan || []} />
          </div>
        </TabsContent>

        <TabsContent value="landing" className="space-y-4">
          <DailyActivityChart data={analytics.dailyData} />
        </TabsContent>

        <TabsContent value="traffic" className="space-y-4">
          <TrafficSourcesCharts deviceData={deviceData} referrerData={topReferrers} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AnalyticsDashboard
