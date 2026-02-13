"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Database, Zap, Shield, TrendingUp, RefreshCw, Download, Activity, FileCode, Server } from "lucide-react"
import type { OptimizationMetrics } from "./optimization/types"
import { NodejsTab } from "./optimization/nodejs-tab"
import { DatabaseTab } from "./optimization/database-tab"
import { PerformanceTab } from "./optimization/performance-tab"
import { SecurityTab } from "./optimization/security-tab"
import { RecommendationsTab } from "./optimization/recommendations-tab"

function SystemOptimizationReport() {
  const [metrics, setMetrics] = useState<OptimizationMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchOptimizationMetrics()
  }, [])

  const fetchOptimizationMetrics = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/super-admin/optimization-metrics")
      if (!response.ok) throw new Error("Failed to fetch optimization metrics")
      const data = await response.json()
      setMetrics(data)
    } catch (err) {
      console.error("Error fetching optimization metrics:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const performanceScore = useMemo(() => {
    if (!metrics) return 0
    const responseScore = Math.max(0, 100 - metrics.performance.avgResponseTime / 10)
    const queryScore = Math.max(0, 100 - metrics.performance.slowQueries * 5)
    const cacheScore = metrics.performance.cacheHitRate
    return Math.round((responseScore + queryScore + cacheScore) / 3)
  }, [metrics])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Fehler</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={fetchOptimizationMetrics} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Erneut versuchen
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!metrics) return null

  const nodejs = metrics.nodejsPerformance

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">System Optimierung</h2>
          <p className="text-muted-foreground">
            Umfassender Überblick über Systemleistung und Optimierungsmöglichkeiten
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fetchOptimizationMetrics} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Aktualisieren
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Bericht exportieren
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Datenbank Health</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.database.tablesWithRLS}/{metrics.database.totalTables}
            </div>
            <p className="text-xs text-muted-foreground">Tabellen mit RLS aktiviert</p>
            <Progress value={(metrics.database.tablesWithRLS / metrics.database.totalTables) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceScore}%</div>
            <p className="text-xs text-muted-foreground">Durchschnittliche Performance</p>
            <Progress value={performanceScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Node.js Score</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${nodejs?.overallScore && nodejs.overallScore >= 60 ? "text-yellow-600" : "text-red-600"}`}>
              {nodejs?.overallScore || 0}%
            </div>
            <p className="text-xs text-muted-foreground">Backend Performance</p>
            <Progress value={nodejs?.overallScore || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Status</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{metrics.security.vulnerabilities.length}</div>
            <p className="text-xs text-muted-foreground">Schwachstellen gefunden</p>
            {metrics.security.vulnerabilities.length > 0 && (
              <Badge variant="destructive" className="mt-2">Aktion erforderlich</Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verbesserungspotenzial</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.recommendations.length}</div>
            <p className="text-xs text-muted-foreground">Empfehlungen verfügbar</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="nodejs" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="nodejs">
            <Server className="mr-2 h-4 w-4" />
            Node.js
            <Badge variant={nodejs?.overallScore && nodejs.overallScore < 60 ? "destructive" : "secondary"} className="ml-2">
              {nodejs?.overallScore || 0}%
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="database">
            <Database className="mr-2 h-4 w-4" />
            Datenbank
            <Badge variant="secondary" className="ml-2">
              {metrics.database.tablesWithoutRLS.length + metrics.database.potentialIndexes.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="performance">
            <Activity className="mr-2 h-4 w-4" />
            Performance
            <Badge variant="secondary" className="ml-2">
              {metrics.performance.slowQueries > 5 ? 1 : 0}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="mr-2 h-4 w-4" />
            Sicherheit
            <Badge variant="secondary" className="ml-2">
              {metrics.security.vulnerabilities.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="recommendations">
            <FileCode className="mr-2 h-4 w-4" />
            Empfehlungen
            <Badge variant="secondary" className="ml-2">
              {metrics.recommendations.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="nodejs">
          {nodejs && <NodejsTab nodejs={nodejs} />}
        </TabsContent>

        <TabsContent value="database">
          <DatabaseTab database={metrics.database} />
        </TabsContent>

        <TabsContent value="performance">
          <PerformanceTab performance={metrics.performance} performanceScore={performanceScore} />
        </TabsContent>

        <TabsContent value="security">
          <SecurityTab security={metrics.security} />
        </TabsContent>

        <TabsContent value="recommendations">
          <RecommendationsTab recommendations={metrics.recommendations} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export { SystemOptimizationReport }
export default SystemOptimizationReport
