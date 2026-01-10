"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SystemOptimizationReport } from "@/components/system-optimization-report"
import { Suspense, useState, useEffect, useRef, useCallback } from "react"
import { LayoutGrid, Activity, TrendingUp, Users, Building2, TicketCheck, RefreshCw, Map } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import dynamic from "next/dynamic"
import { useSearchParams, useRouter } from "next/navigation"

const RoadmapManager = dynamic(() => import("@/components/roadmap-manager"), {
  loading: () => <div className="flex items-center justify-center h-96">Lädt Roadmap...</div>,
})

interface DashboardStats {
  users: { total: number; active: number; superAdmins: number }
  practices: { total: number; active: number }
  tickets: { total: number; open: number; critical: number }
  system: { status: "online" | "degraded" | "offline"; uptime: number }
}

interface MetricsData {
  performance?: {
    avgResponseTime?: number
    slowQueries?: number
    cacheHitRate?: number
  }
  database?: {
    tablesWithRLS?: number
    totalTables?: number
  }
}

function DashboardContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const activeTab = searchParams.get("tab") || "overview"

  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [metrics, setMetrics] = useState<MetricsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const hasFetched = useRef(false)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setHasError(false)

    try {
      const [statsRes, metricsRes] = await Promise.all([
        fetch("/api/super-admin/dashboard-stats"),
        fetch("/api/super-admin/optimization-metrics"),
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json()
        setMetrics(metricsData)
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true
    fetchData()
  }, [fetchData])

  useEffect(() => {
    const interval = setInterval(() => {
      fetchData()
    }, 60000)
    return () => clearInterval(interval)
  }, [fetchData])

  const refreshStats = () => {
    fetchData()
  }

  // Calculate performance score from metrics
  const performanceScore = metrics
    ? Math.round(
        (Math.max(0, 100 - (metrics.performance?.avgResponseTime || 0) / 10) +
          Math.max(0, 100 - (metrics.performance?.slowQueries || 0) * 5) +
          (metrics.performance?.cacheHitRate || 0)) /
          3,
      )
    : 0

  const getPerformanceLabel = (score: number) => {
    if (score >= 90) return "Exzellent"
    if (score >= 75) return "Optimal"
    if (score >= 60) return "Gut"
    if (score >= 40) return "Akzeptabel"
    return "Verbesserungsbedarf"
  }

  const getSystemStatus = () => {
    if (!stats) return { label: "Laden...", color: "text-muted-foreground" }
    if (stats.system.status === "online") return { label: "Aktiv", color: "text-green-600" }
    if (stats.system.status === "degraded") return { label: "Eingeschränkt", color: "text-yellow-600" }
    return { label: "Offline", color: "text-red-600" }
  }

  const systemStatus = getSystemStatus()

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", value)
    router.push(`/super-admin?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-2 lg:w-auto">
          <TabsTrigger value="overview" className="gap-2">
            <LayoutGrid className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="roadmap" className="gap-2">
            <Map className="h-4 w-4" />
            Roadmap & KI-Ideen
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Super Admin Dashboard</h1>
              <p className="text-muted-foreground mt-2">Übersicht und Systemoptimierung</p>
            </div>
            <button
              onClick={() => refreshStats()}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              {isLoading ? "Laden..." : "Aktualisieren"}
            </button>
          </div>

          {/* Main Status Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dashboard</CardTitle>
                <LayoutGrid className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${systemStatus.color}`}>{systemStatus.label}</div>
                <p className="text-xs text-muted-foreground">
                  {stats ? "Alle Systeme betriebsbereit" : "Status wird geladen..."}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System-Status</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats ? `${stats.system.uptime.toFixed(1)}%` : "..."}</div>
                <p className="text-xs text-muted-foreground">Verfügbarkeit (30 Tage)</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Performance</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${performanceScore >= 75 ? "text-green-600" : performanceScore >= 50 ? "text-yellow-600" : "text-red-600"}`}
                >
                  {metrics ? getPerformanceLabel(performanceScore) : "..."}
                </div>
                <p className="text-xs text-muted-foreground">
                  {metrics ? `Score: ${performanceScore}%` : "System wird analysiert..."}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Secondary Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Benutzer</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.users.total ?? "..."}</div>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-muted-foreground">{stats ? `${stats.users.active} aktiv` : "Laden..."}</p>
                  {stats && stats.users.superAdmins > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {stats.users.superAdmins} Super Admins
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Praxen</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.practices.total ?? "..."}</div>
                <p className="text-xs text-muted-foreground">
                  {stats ? `${stats.practices.active} aktiv` : "Laden..."}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tickets</CardTitle>
                <TicketCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.tickets.total ?? "..."}</div>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-muted-foreground">{stats ? `${stats.tickets.open} offen` : "Laden..."}</p>
                  {stats && stats.tickets.critical > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {stats.tickets.critical} kritisch
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Datenbank</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics ? `${metrics.database?.tablesWithRLS ?? 0}/${metrics.database?.totalTables ?? 0}` : "..."}
                </div>
                <p className="text-xs text-muted-foreground">Tabellen mit RLS</p>
              </CardContent>
            </Card>
          </div>

          <SystemOptimizationReport />
        </TabsContent>

        <TabsContent value="roadmap" className="mt-6">
          <RoadmapManager userId="super-admin" />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function SuperAdminPageClient() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
            <p className="mt-4 text-sm text-muted-foreground">Lade Super Admin Dashboard...</p>
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  )
}
