"use client"

import { Suspense, useState, useEffect, useCallback, useRef } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BarChart3, FolderOpen, Database, Info, Loader2, RefreshCw, TrendingUp, CheckCircle2, Building2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const GlobalParameterManagement = dynamic(
  () => import("@/components/global-parameter-management"),
  {
    loading: () => (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Lädt KPI-Verwaltung...</p>
        </div>
      </div>
    ),
    ssr: false,
  }
)

interface KpiStats {
  categoriesCount: number
  parametersCount: number
  activeParametersCount: number
  totalUsageCount: number
}

function KpiKategorienContent() {
  const [stats, setStats] = useState<KpiStats>({
    categoriesCount: 0,
    parametersCount: 0,
    activeParametersCount: 0,
    totalUsageCount: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const hasFetched = useRef(false)

  const fetchStats = useCallback(async () => {
    try {
      const [categoriesRes, parametersRes] = await Promise.all([
        fetch("/api/global-parameter-groups"),
        fetch("/api/global-parameters"),
      ])

      let categoriesCount = 0
      let parametersCount = 0
      let activeParametersCount = 0
      let totalUsageCount = 0

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json()
        const categories = categoriesData.categories || []
        categoriesCount = categories.length
        totalUsageCount = categories.reduce((sum: number, cat: any) => sum + (cat.usage_count || 0), 0)
      }

      if (parametersRes.ok) {
        const parametersData = await parametersRes.json()
        const parameters = parametersData.parameters || []
        parametersCount = parameters.length
        activeParametersCount = parameters.filter((p: any) => p.is_active !== false).length
      }

      setStats({
        categoriesCount,
        parametersCount,
        activeParametersCount,
        totalUsageCount,
      })
    } catch (error) {
      console.error("Error fetching KPI stats:", error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true
    fetchStats()
  }, [fetchStats])

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchStats()
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">KPI-Kategorien</h1>
          <p className="text-muted-foreground mt-2">
            Verwalten Sie globale Kennzahlen (KPIs) und Kategorien, die allen Praxen zur Verfügung stehen
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Aktualisieren..." : "Aktualisieren"}
        </Button>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Globale KPI-Verwaltung</AlertTitle>
        <AlertDescription>
          Hier definierte KPIs und Kategorien dienen als Vorlagen für alle Praxen im System. Praxen können diese
          Vorlagen übernehmen und nach Bedarf anpassen. Änderungen an globalen KPIs wirken sich nicht automatisch auf
          bereits importierte Praxis-KPIs aus.
        </AlertDescription>
      </Alert>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">KPI-Kategorien</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : stats.categoriesCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Thematische Gruppen für Kennzahlen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Globale KPIs</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : stats.parametersCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Definierte Kennzahlen-Vorlagen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktive KPIs</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-green-600">
                {isLoading ? "..." : stats.activeParametersCount}
              </div>
              {!isLoading && stats.parametersCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {Math.round((stats.activeParametersCount / stats.parametersCount) * 100)}%
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Verfügbar für Praxen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nutzung</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">
                {isLoading ? "..." : stats.totalUsageCount}
              </div>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Praxis-Verwendungen gesamt
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - Full Width Management Component */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Globale Kennzahlen & Kategorien
          </CardTitle>
          <CardDescription>
            Erstellen und verwalten Sie KPI-Kategorien und die dazugehörigen Kennzahlen. Diese Vorlagen können von
            Praxen importiert und verwendet werden.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 md:p-6">
          <GlobalParameterManagement />
        </CardContent>
      </Card>
    </div>
  )
}

export default function KpiKategorienClient() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
            <p className="mt-4 text-sm text-muted-foreground">Lade KPI-Kategorien...</p>
          </div>
        </div>
      }
    >
      <KpiKategorienContent />
    </Suspense>
  )
}
