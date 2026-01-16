"use client"

import useSWR from "swr"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts"
import { Eye, Users, RefreshCw, Building2, UserPlus, Zap, DollarSign, Clock, Target } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { SWR_KEYS } from "@/lib/swr-keys"
import { swrFetcher } from "@/lib/swr-fetcher"

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

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]

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
  const [selectedPage, setSelectedPage] = useState("all")

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

  const featureUsage = featureUsageData?.topFeatures || []
  const practiceGrowth = practiceGrowthData?.dailyGrowth || []
  const analytics = EMPTY_ANALYTICS

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

  const deviceData = Object.entries(analytics.deviceStats).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }))

  const browserData = Object.entries(analytics.browserStats).map(([name, value]) => ({
    name,
    value,
  }))

  const topReferrers = Object.entries(analytics.referrerStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }))

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
            <div className="text-2xl font-bold">{analytics.summary.totalViews.toLocaleString()}</div>
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
            <Card>
              <CardHeader>
                <CardTitle>Praxen-Wachstum</CardTitle>
                <CardDescription>Neue Praxen über Zeit</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={practiceGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) =>
                        new Date(value).toLocaleDateString("de-DE", { month: "short", day: "numeric" })
                      }
                    />
                    <YAxis />
                    <Tooltip labelFormatter={(value) => new Date(value).toLocaleDateString("de-DE")} />
                    <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top 10 Features</CardTitle>
                <CardDescription>Meist genutzte Funktionen</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {featureUsage.slice(0, 10).map((feature: any, index: number) => (
                    <div key={feature.feature_name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="w-6 h-6 flex items-center justify-center text-xs">
                          {index + 1}
                        </Badge>
                        <span className="text-sm font-medium">{feature.feature_name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{feature.usage_count} Mal</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Benutzeraktivität</CardTitle>
              <CardDescription>Tägliche aktive Benutzer und Interaktionen</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={analytics.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString("de-DE", { month: "short", day: "numeric" })
                    }
                  />
                  <YAxis />
                  <Tooltip labelFormatter={(value) => new Date(value).toLocaleDateString("de-DE")} />
                  <Legend />
                  <Line type="monotone" dataKey="views" stroke="#3b82f6" name="Aufrufe" strokeWidth={2} />
                  <Line
                    type="monotone"
                    dataKey="uniqueVisitors"
                    stroke="#10b981"
                    name="Eindeutige Besucher"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="growth" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Praxen- und Benutzer-Wachstum</CardTitle>
              <CardDescription>Kumulative Entwicklung über Zeit</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={practiceGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString("de-DE", { month: "short", day: "numeric" })
                    }
                  />
                  <YAxis />
                  <Tooltip labelFormatter={(value) => new Date(value).toLocaleDateString("de-DE")} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="cumulative"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.6}
                    name="Kumulative Praxen"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Wachstumsrate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">+{systemMetrics?.growthRate || 0}%</div>
                <p className="text-sm text-muted-foreground mt-1">In den letzten {dateRange} Tagen</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Churn Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">{subscriptionStats?.churnRate || 0}%</div>
                <p className="text-sm text-muted-foreground mt-1">Abonnement-Kündigungen</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>LTV (Customer Lifetime Value)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">€{subscriptionStats?.ltv || 0}</div>
                <p className="text-sm text-muted-foreground mt-1">Durchschnittlicher Kundenwert</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Feature-Nutzung nach Kategorie</CardTitle>
              <CardDescription>Verteilung der Funktionsnutzung</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={featureUsage.slice(0, 15)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="feature_name" angle={-45} textAnchor="end" height={120} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="usage_count" fill="#3b82f6" name="Nutzungen" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Feature-Adoption</CardTitle>
              <CardDescription>Wie viele Praxen nutzen welche Features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {featureUsage.slice(0, 10).map((feature: any) => {
                  const adoptionRate = systemMetrics?.totalPractices
                    ? (((feature.unique_practices || 0) / systemMetrics.totalPractices) * 100).toFixed(1)
                    : 0

                  return (
                    <div key={feature.feature_name} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{feature.feature_name}</span>
                        <span className="text-muted-foreground">{adoptionRate}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all" style={{ width: `${adoptionRate}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Abonnements nach Status</CardTitle>
                <CardDescription>Verteilung der Abonnement-Status</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={subscriptionStats?.byStatus || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {(subscriptionStats?.byStatus || []).map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Umsatz nach Plan</CardTitle>
                <CardDescription>Verteilung nach Abonnement-Typ</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={subscriptionStats?.byPlan || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="#3b82f6" name="Umsatz (€)" />
                    <Bar dataKey="count" fill="#10b981" name="Anzahl" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="landing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Landing Page Performance</CardTitle>
              <CardDescription>Aufrufe und Besucher über Zeit</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={analytics.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString("de-DE", { month: "short", day: "numeric" })
                    }
                  />
                  <YAxis />
                  <Tooltip labelFormatter={(value) => new Date(value).toLocaleDateString("de-DE")} />
                  <Legend />
                  <Line type="monotone" dataKey="views" stroke="#3b82f6" name="Aufrufe" strokeWidth={2} />
                  <Line
                    type="monotone"
                    dataKey="uniqueVisitors"
                    stroke="#10b981"
                    name="Eindeutige Besucher"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="traffic" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Geräte</CardTitle>
                <CardDescription>Verteilung nach Gerätetyp</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={deviceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {deviceData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Referrer</CardTitle>
                <CardDescription>Herkunft der Besucher</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topReferrers} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" name="Besuche" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AnalyticsDashboard
