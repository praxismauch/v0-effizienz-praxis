"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SystemOptimizationReport } from "@/components/system-optimization-report"
import { Suspense } from "react"
import { LayoutGrid, Activity, TrendingUp, Users, Building2, TicketCheck, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface DashboardStats {
  users: { total: number; active: number; superAdmins: number }
  practices: { total: number; active: number }
  tickets: { total: number; open: number; critical: number }
  system: { status: "online" | "degraded" | "offline"; uptime: number }
}

function DashboardContent() {
  const {
    data: stats,
    error: statsError,
    isLoading: statsLoading,
    mutate: refreshStats,
  } = useSWR<DashboardStats>(
    "/api/super-admin/dashboard-stats",
    fetcher,
    { refreshInterval: 60000 }, // Refresh every minute
  )

  const {
    data: metrics,
    error: metricsError,
    isLoading: metricsLoading,
  } = useSWR(
    "/api/super-admin/optimization-metrics",
    fetcher,
    { refreshInterval: 300000 }, // Refresh every 5 minutes
  )

  const isLoading = statsLoading || metricsLoading
  const hasError = statsError || metricsError

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

  return (
    <div className="space-y-6">
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
            <p className="text-xs text-muted-foreground">{stats ? `${stats.practices.active} aktiv` : "Laden..."}</p>
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
