"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Suspense, useState, useEffect, useRef, useCallback } from "react"
import { Activity, Users, Building2, TicketCheck, RefreshCw, CheckCircle2, AlertTriangle, XCircle, ArrowUpRight, Database, HardDrive, Shield, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { useUser } from "@/contexts/user-context"
import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"

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

interface BackupStatus {
  overallStatus: "success" | "warning" | "error"
  today: { total: number; verified: number; completed: number; failed: number }
  latestBackup: {
    id: string
    status: string
    created_at: string
    file_size: number
    backup_type: string
  } | null
  dailyHistory: Array<{
    date: string
    total: number
    verified: number
    failed: number
    status: "success" | "warning" | "error" | "missing"
  }>
  errors: string[]
  totalLast7Days: number
}

function DashboardContent() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [metrics, setMetrics] = useState<MetricsData | null>(null)
  const [backupStatus, setBackupStatus] = useState<BackupStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const hasFetched = useRef(false)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [statsRes, metricsRes, backupRes] = await Promise.all([
        fetch("/api/super-admin/dashboard-stats"),
        fetch("/api/super-admin/optimization-metrics"),
        fetch("/api/super-admin/backup-status"),
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json()
        setMetrics(metricsData)
      }

      if (backupRes.ok) {
        const backupData = await backupRes.json()
        setBackupStatus(backupData)
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

      {/* Backup Monitoring Card */}
      <Card className={`border-l-4 ${
        backupStatus?.overallStatus === "success"
          ? "border-l-emerald-500"
          : backupStatus?.overallStatus === "warning"
            ? "border-l-amber-500"
            : backupStatus?.overallStatus === "error"
              ? "border-l-red-500"
              : "border-l-muted"
      }`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex items-center justify-center h-10 w-10 rounded-lg ${
                backupStatus?.overallStatus === "success"
                  ? "bg-emerald-500/10"
                  : backupStatus?.overallStatus === "warning"
                    ? "bg-amber-500/10"
                    : backupStatus?.overallStatus === "error"
                      ? "bg-red-500/10"
                      : "bg-muted"
              }`}>
                {backupStatus?.overallStatus === "success" ? (
                  <Shield className="h-5 w-5 text-emerald-500" />
                ) : backupStatus?.overallStatus === "error" ? (
                  <XCircle className="h-5 w-5 text-red-500" />
                ) : (
                  <HardDrive className="h-5 w-5 text-amber-500" />
                )}
              </div>
              <div>
                <CardTitle className="text-base">Tägliche Backups</CardTitle>
                <CardDescription>
                  {backupStatus?.overallStatus === "success"
                    ? "Alle Backups erfolgreich"
                    : backupStatus?.overallStatus === "warning"
                      ? "Backups ausstehend oder nicht verifiziert"
                      : backupStatus?.overallStatus === "error"
                        ? "Backup-Fehler erkannt"
                        : "Status wird geladen..."}
                </CardDescription>
              </div>
            </div>
            <Link href="/super-admin/backups">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                Details
                <ArrowUpRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 7-Day History Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-medium">Letzte 7 Tage</span>
              <span className="text-xs text-muted-foreground">
                {backupStatus?.totalLast7Days ?? 0} Backups gesamt
              </span>
            </div>
            <div className="flex items-center gap-1">
              {backupStatus?.dailyHistory ? (
                [...backupStatus.dailyHistory].reverse().map((day, i) => {
                  const dayDate = new Date(day.date)
                  const dayLabel = dayDate.toLocaleDateString("de-DE", { weekday: "short", day: "numeric" })
                  return (
                    <div key={day.date} className="flex-1 group relative">
                      <div
                        className={`h-8 rounded-sm transition-colors ${
                          day.status === "success"
                            ? "bg-emerald-500"
                            : day.status === "warning"
                              ? "bg-amber-400"
                              : day.status === "error"
                                ? "bg-red-500"
                                : "bg-muted"
                        }`}
                        title={`${dayLabel}: ${day.total} Backups (${day.verified} verifiziert${day.failed > 0 ? `, ${day.failed} fehlgeschlagen` : ""})`}
                      />
                      <span className="text-[10px] text-muted-foreground text-center block mt-1">
                        {dayDate.toLocaleDateString("de-DE", { weekday: "narrow" })}
                      </span>
                    </div>
                  )
                })
              ) : (
                Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="flex-1">
                    <Skeleton className="h-8 rounded-sm" />
                  </div>
                ))
              )}
            </div>
            {/* Legend */}
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
                <span className="text-[10px] text-muted-foreground">Verifiziert</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-sm bg-amber-400" />
                <span className="text-[10px] text-muted-foreground">Ausstehend</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-sm bg-red-500" />
                <span className="text-[10px] text-muted-foreground">Fehler</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-sm bg-muted" />
                <span className="text-[10px] text-muted-foreground">Kein Backup</span>
              </div>
            </div>
          </div>

          {/* Latest Backup Info */}
          {backupStatus?.latestBackup && (
            <div className="flex items-center justify-between pt-3 border-t">
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Letztes Backup: {new Date(backupStatus.latestBackup.created_at).toLocaleString("de-DE", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <Badge
                variant={
                  backupStatus.latestBackup.status === "verified"
                    ? "default"
                    : backupStatus.latestBackup.status === "completed"
                      ? "secondary"
                      : "destructive"
                }
                className={`text-[10px] ${backupStatus.latestBackup.status === "verified" ? "bg-emerald-500/10 text-emerald-600 border-emerald-200" : ""}`}
              >
                {backupStatus.latestBackup.status === "verified"
                  ? "Verifiziert"
                  : backupStatus.latestBackup.status === "completed"
                    ? "Abgeschlossen"
                    : "Fehlgeschlagen"}
              </Badge>
            </div>
          )}

          {/* Error Messages */}
          {backupStatus?.errors && backupStatus.errors.length > 0 && (
            <div className="rounded-md bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-xs font-medium text-red-800 dark:text-red-400">Backup-Fehler</p>
                  {backupStatus.errors.slice(0, 3).map((err, i) => (
                    <p key={i} className="text-xs text-red-600 dark:text-red-400/80">{err}</p>
                  ))}
                  {backupStatus.errors.length > 3 && (
                    <p className="text-xs text-red-500">
                      +{backupStatus.errors.length - 3} weitere Fehler
                    </p>
                  )}
                </div>
              </div>
            </div>
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
  const { isSuperAdmin, loading, currentUser } = useUser()
  const router = useRouter()

  // Redirect if not super admin - use useEffect to avoid setState during render
  useEffect(() => {
    if (!loading && !isSuperAdmin) {
      router.push("/dashboard?error=access_denied")
    }
  }, [isSuperAdmin, loading, router])

  // Show loading skeleton while checking auth
  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
        </div>
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    )
  }

  // Show access denied while redirecting
  if (!isSuperAdmin) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Zugriff verweigert</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Sie haben keine Berechtigung für diesen Bereich.
            </p>
            <Button asChild>
              <Link href="/dashboard">Zurück zum Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Render dashboard for super admins
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
