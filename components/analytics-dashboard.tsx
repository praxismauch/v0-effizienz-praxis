"use client"

import { useState, useEffect } from "react"
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
import { Eye, Users, Globe, RefreshCw, Building2, UserPlus, Zap, DollarSign, Clock, Target } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"

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
  const [analytics, setAnalytics] = useState<AnalyticsData>(EMPTY_ANALYTICS)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState("30")
  const [selectedPage, setSelectedPage] = useState("all")

  // New states for enhanced analytics
  const [systemMetrics, setSystemMetrics] = useState<any>(null)
  const [featureUsage, setFeatureUsage] = useState<any[]>([])
  const [practiceGrowth, setPracticeGrowth] = useState<any[]>([])
  const [subscriptionStats, setSubscriptionStats] = useState<any>(null)

  useEffect(() => {
    fetchAnalyticsData()
  }, [dateRange])

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)

      // Fetch system metrics
      const metricsRes = await fetch(`/api/super-admin/analytics/system-metrics?days=${dateRange}`)
      if (metricsRes.ok) {
        const data = await metricsRes.json()
        setSystemMetrics(data)
      }

      // Fetch feature usage
      const featureRes = await fetch(`/api/super-admin/analytics/feature-usage?days=${dateRange}`)
      if (featureRes.ok) {
        const data = await featureRes.json()
        setFeatureUsage(data.topFeatures || [])
      }

      // Fetch practice growth
      const growthRes = await fetch(`/api/super-admin/analytics/practice-growth?days=${dateRange}`)
      if (growthRes.ok) {
        const data = await growthRes.json()
        setPracticeGrowth(data.dailyGrowth || [])
      }

      // Fetch subscription stats
      const subsRes = await fetch(`/api/super-admin/analytics/subscriptions`)
      if (subsRes.ok) {
        const data = await subsRes.json()
        setSubscriptionStats(data)
      }
    } catch (error) {
      console.error("[v0] Error fetching analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleManualRefresh = async () => {
    setLoading(true)
    try {
      await fetchAnalyticsData()
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
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Set up interval for auto-refresh every 5 minutes (optional)
    const interval = setInterval(
      () => {
        console.log("[v0] Auto-refreshing analytics data...")
        fetchAnalyticsData()
      },
      5 * 60 * 1000,
    ) // 5 minutes

    return () => clearInterval(interval)
  }, [dateRange])

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
                  {featureUsage.slice(0, 10).map((feature, index) => (
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
                {featureUsage.slice(0, 10).map((feature) => {
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
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {(subscriptionStats?.byStatus || []).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Abonnements nach Plan</CardTitle>
                <CardDescription>Verteilung der Abonnement-Pläne</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={subscriptionStats?.byPlan || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="plan_name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#10b981" name="Anzahl" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Umsatz-Metriken</CardTitle>
              <CardDescription>Finanzielle Kennzahlen</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <p className="text-sm text-muted-foreground">MRR (Monatlich)</p>
                  <p className="text-2xl font-bold">
                    €{subscriptionStats?.mrr ? (subscriptionStats.mrr / 100).toLocaleString() : 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ARR (Jährlich)</p>
                  <p className="text-2xl font-bold">
                    €{subscriptionStats?.arr ? (subscriptionStats.arr / 100).toLocaleString() : 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ARPU</p>
                  <p className="text-2xl font-bold">
                    €{subscriptionStats?.arpu ? (subscriptionStats.arpu / 100).toFixed(2) : 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Aktive Abos</p>
                  <p className="text-2xl font-bold">{subscriptionStats?.activeSubscriptions || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="landing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Landing Page Performance</CardTitle>
              <CardDescription>Seitenaufrufe nach Seite</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={analytics.pageStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="page" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="views" fill="#3b82f6" name="Aufrufe" />
                  <Bar dataKey="uniqueVisitors" fill="#10b981" name="Eindeutige Besucher" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Gerätetypen</CardTitle>
                <CardDescription>Verteilung nach Geräten</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={deviceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {deviceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Browser</CardTitle>
                <CardDescription>Verteilung nach Browser</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={browserData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {browserData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="traffic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Traffic-Quellen</CardTitle>
              <CardDescription>Woher kommen die Besucher</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topReferrers.map(({ name, value }, index) => (
                  <div key={name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{name}</span>
                    </div>
                    <span className="text-muted-foreground">{value} Aufrufe</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AnalyticsDashboard
