"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Suspense, useState, useEffect, useRef, useCallback } from "react"
import { Activity, Users, Building2, TicketCheck, RefreshCw, CheckCircle2, AlertTriangle, XCircle, ArrowUpRight, Database } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"

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
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [metrics, setMetrics] = useState<MetricsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const hasFetched = useRef(false)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
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
    const interval = setInterval(fetchData, 60000)
    return () => clearInterval(interval)
  }, [fetchData])

  const getSystemStatusIcon = () => {
    if (!stats) return <Activity className="h-5 w-5 text-muted-foreground animate-pulse" />
    if (stats.system.status === "online") return <CheckCircle2 className="h-5 w-5 text-emerald-500" />
    if (stats.system.status === "degraded") return <AlertTriangle className="h-5 w-5 text-amber-500" />
    return <XCircle className="h-5 w-5 text-red-500" />
  }

  const getSystemStatusLabel = () => {
    if (!stats) return "Wird geprüft..."
    if (stats.system.status === "online") return "Alle Systeme online"
    if (stats.system.status === "degraded") return "Eingeschränkter Betrieb"
    return "Systemausfall"
  }

  const rlsPercentage = metrics?.database?.totalTables 
    ? Math.round((metrics.database.tablesWithRLS / metrics.database.totalTables) * 100)
    : 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Systemübersicht und wichtige Kennzahlen</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Aktualisieren
        </Button>
      </div>

      {/* System Status Banner */}
      <Card className="border-l-4 border-l-emerald-500">
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            {getSystemStatusIcon()}
            <div>
              <p className="font-medium">{getSystemStatusLabel()}</p>
              <p className="text-sm text-muted-foreground">
                Verfügbarkeit: {stats ? `${stats.system.uptime.toFixed(1)}%` : "..."}
              </p>
            </div>
          </div>
          {stats && stats.tickets.critical > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              {stats.tickets.critical} kritische Tickets
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Benutzer</CardDescription>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.users.total ?? "-"}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats ? `${stats.users.active} aktiv` : "Laden..."}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Praxen</CardDescription>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.practices.total ?? "-"}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats ? `${stats.practices.active} aktiv` : "Laden..."}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Offene Tickets</CardDescription>
              <TicketCheck className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.tickets.open ?? "-"}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats ? `von ${stats.tickets.total} gesamt` : "Laden..."}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>RLS-Abdeckung</CardDescription>
              <Database className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{rlsPercentage}%</div>
            <Progress value={rlsPercentage} className="h-1.5 mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/super-admin/tickets">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Tickets verwalten</CardTitle>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <CardDescription>Support-Anfragen und Bug-Reports bearbeiten</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/super-admin/practices">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Praxen verwalten</CardTitle>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <CardDescription>Praxis-Einstellungen und Benutzer administrieren</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/super-admin/roadmap">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Roadmap & Ideen</CardTitle>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <CardDescription>Feature-Planung und KI-generierte Vorschläge</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
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
