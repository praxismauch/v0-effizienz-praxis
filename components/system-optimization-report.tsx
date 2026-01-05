"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Zap,
  Shield,
  TrendingUp,
  RefreshCw,
  Download,
  Activity,
  FileCode,
  Server,
  Clock,
  HardDrive,
  Repeat,
  Timer,
  Gauge,
  FileWarning,
  Network,
  Copy,
  Check,
} from "lucide-react"

interface NodejsPerformanceMetrics {
  eventLoop: {
    score: number
    status: "good" | "warning" | "critical"
    blockingOperations: Array<{
      file: string
      line?: number
      issue: string
      severity: "high" | "medium" | "low" | "info"
    }>
    recommendations: string[]
  }
  concurrency: {
    score: number
    status: "good" | "warning" | "critical"
    unboundedOperations: Array<{
      file: string
      issue: string
      severity: "high" | "medium" | "low"
    }>
    recommendations: string[]
  }
  memoryLeaks: {
    score: number
    status: "good" | "warning" | "critical"
    potentialLeaks: Array<{
      file: string
      issue: string
      severity: "high" | "medium" | "low" | "info"
    }>
    recommendations: string[]
  }
  dbQueryEfficiency: {
    score: number
    status: "good" | "warning" | "critical"
    inefficientQueries: Array<{
      pattern: string
      count: number
      issue: string
      severity: "high" | "medium" | "low"
    }>
    recommendations: string[]
  }
  caching: {
    score: number
    status: "good" | "warning" | "critical"
    currentCaching: Array<{
      endpoint: string
      cached: boolean
      ttl: string
    }>
    missingCaching: Array<{
      endpoint: string
      frequency: string
      impact: string
    }>
    recommendations: string[]
  }
  timeouts: {
    score: number
    status: "good" | "warning" | "critical"
    missingTimeouts: Array<{
      file: string
      line?: number
      issue: string
      severity: "high" | "medium" | "low"
    }>
    recommendations: string[]
  }
  coldStart: {
    score: number
    status: "good" | "warning" | "critical"
    issues: Array<{
      issue: string
      impact: string
      severity: "high" | "medium" | "low"
    }>
    recommendations: string[]
  }
  logging: {
    score: number
    status: "good" | "warning" | "critical"
    issues: Array<{
      issue: string
      severity: "high" | "medium" | "low"
    }>
    recommendations: string[]
  }
  horizontalScalability: {
    score: number
    status: "good" | "warning" | "critical"
    issues: Array<{
      issue: string
      impact: string
      severity: "high" | "medium" | "low"
    }>
    recommendations: string[]
  }
  overallScore: number
}

interface OptimizationMetrics {
  database: {
    totalTables: number
    tablesWithRLS: number
    tablesWithoutRLS: string[]
    indexCoverage: number
    potentialIndexes: string[]
  }
  performance: {
    avgResponseTime: number
    slowQueries: number
    cacheHitRate: number
    memoryUsage: number
  }
  security: {
    rlsCompliance: number
    vulnerabilities: Array<{ type: string; severity: string; description: string }>
    functionSecurityIssues?: number
    passwordProtectionEnabled?: boolean
  }
  nodejsPerformance?: NodejsPerformanceMetrics
  recommendations: Array<{
    category: string
    priority: "high" | "medium" | "low"
    title: string
    description: string
    impact: string
    action: string
  }>
}

function StatusBadge({ status }: { status: "good" | "warning" | "critical" }) {
  if (status === "good") {
    return <Badge className="bg-green-100 text-green-800">Gut</Badge>
  } else if (status === "warning") {
    return <Badge className="bg-yellow-100 text-yellow-800">Warnung</Badge>
  }
  return <Badge variant="destructive">Kritisch</Badge>
}

function SeverityBadge({ severity }: { severity: "high" | "medium" | "low" | "info" }) {
  switch (severity) {
    case "high":
      return <Badge variant="destructive">Hoch</Badge>
    case "medium":
      return <Badge className="bg-orange-100 text-orange-800">Mittel</Badge>
    case "low":
      return <Badge className="bg-yellow-100 text-yellow-800">Niedrig</Badge>
    default:
      return <Badge variant="secondary">Info</Badge>
  }
}

function ScoreDisplay({ score, label }: { score: number; label: string }) {
  const getColor = (s: number) => {
    if (s >= 80) return "text-green-600"
    if (s >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className="text-center">
      <div className={`text-2xl font-bold ${getColor(score)}`}>{score}%</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}

function SystemOptimizationReport() {
  const [metrics, setMetrics] = useState<OptimizationMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false) // Added copied state

  useEffect(() => {
    fetchOptimizationMetrics()
  }, [])

  const fetchOptimizationMetrics = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/super-admin/optimization-metrics")

      if (!response.ok) {
        throw new Error("Failed to fetch optimization metrics")
      }

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

  const securityScore = useMemo(() => {
    if (!metrics) return 0
    const rlsScore = metrics.security.rlsCompliance
    const vulnScore = Math.max(0, 100 - metrics.security.vulnerabilities.length * 10)
    const functionPenalty = (metrics.security.functionSecurityIssues || 0) * 2
    const passwordPenalty = metrics.security.passwordProtectionEnabled === false ? 10 : 0
    return Math.max(0, Math.round((rlsScore + vulnScore - functionPenalty - passwordPenalty) / 2))
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

  const copyRecommendationsForV0 = () => {
    if (!metrics) return

    const nodejs = metrics.nodejsPerformance

    const formatSection = (title: string, recommendations: string[], priority: string) => {
      if (recommendations.length === 0) return ""
      return `### ${title} (${priority})\n${recommendations.map((r) => `- ${r}`).join("\n")}\n`
    }

    const text = `## Node.js Performance Optimierungen für v0

Bitte implementiere die folgenden Backend-Performance-Optimierungen in meinem Next.js Projekt:

${formatSection("Datenbank-Abfragen", nodejs.dbQueryEfficiency.recommendations, "Hohe Priorität")}
${formatSection("Timeout-Konfiguration", nodejs.timeouts.recommendations, "Hohe Priorität")}
${formatSection("Event Loop Optimierung", nodejs.eventLoop.recommendations, "Hohe Priorität")}
${formatSection("Parallelverarbeitung", nodejs.concurrency.recommendations, "Mittlere Priorität")}
${formatSection("Logging Optimierung", nodejs.logging.recommendations, "Mittlere Priorität")}
${formatSection("Caching Strategien", nodejs.caching.recommendations, "Mittlere Priorität")}

### Aktuelle Scores:
- Event Loop: ${nodejs.eventLoop.score}/100
- Datenbank-Effizienz: ${nodejs.dbQueryEfficiency.score}/100
- Timeouts: ${nodejs.timeouts.score}/100
- Caching: ${nodejs.caching.score}/100
- Logging: ${nodejs.logging.score}/100
- Parallelverarbeitung: ${nodejs.concurrency.score}/100

Bitte analysiere meinen Code und implementiere diese Optimierungen schrittweise. Beginne mit den Empfehlungen mit hoher Priorität.`

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

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
            <div
              className={`text-2xl font-bold ${nodejs?.overallScore && nodejs.overallScore >= 60 ? "text-yellow-600" : "text-red-600"}`}
            >
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
              <Badge variant="destructive" className="mt-2">
                Aktion erforderlich
              </Badge>
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
            <Badge
              variant={nodejs?.overallScore && nodejs.overallScore < 60 ? "destructive" : "secondary"}
              className="ml-2"
            >
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

        <TabsContent value="nodejs" className="space-y-4">
          {nodejs && (
            <>
              {/* Score Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    Node.js Performance Übersicht
                  </CardTitle>
                  <CardDescription>Detaillierte Analyse der Backend-Performance mit 9 Kategorien</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 md:grid-cols-9 gap-4">
                    <ScoreDisplay score={nodejs.eventLoop.score} label="Event Loop" />
                    <ScoreDisplay score={nodejs.concurrency.score} label="Concurrency" />
                    <ScoreDisplay score={nodejs.memoryLeaks.score} label="Memory" />
                    <ScoreDisplay score={nodejs.dbQueryEfficiency.score} label="DB Queries" />
                    <ScoreDisplay score={nodejs.caching.score} label="Caching" />
                    <ScoreDisplay score={nodejs.timeouts.score} label="Timeouts" />
                    <ScoreDisplay score={nodejs.coldStart.score} label="Cold Start" />
                    <ScoreDisplay score={nodejs.logging.score} label="Logging" />
                    <ScoreDisplay score={nodejs.horizontalScalability.score} label="Skalierung" />
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Event Loop */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Repeat className="h-4 w-4" />
                        Event Loop Blocking
                      </CardTitle>
                      <StatusBadge status={nodejs.eventLoop.status} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Progress value={nodejs.eventLoop.score} />
                    {nodejs.eventLoop.blockingOperations.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Blockierende Operationen:</p>
                        {nodejs.eventLoop.blockingOperations.map((op, i) => (
                          <div key={i} className="text-sm bg-muted p-2 rounded flex items-start justify-between gap-2">
                            <div>
                              <code className="text-xs">
                                {op.file}
                                {op.line ? `:${op.line}` : ""}
                              </code>
                              <p className="text-muted-foreground text-xs mt-1">{op.issue}</p>
                            </div>
                            <SeverityBadge severity={op.severity} />
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Concurrency */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Network className="h-4 w-4" />
                        Unbounded Concurrency
                      </CardTitle>
                      <StatusBadge status={nodejs.concurrency.status} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Progress value={nodejs.concurrency.score} />
                    {nodejs.concurrency.unboundedOperations.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Unbegrenzte Operationen:</p>
                        {nodejs.concurrency.unboundedOperations.map((op, i) => (
                          <div key={i} className="text-sm bg-muted p-2 rounded flex items-start justify-between gap-2">
                            <div>
                              <code className="text-xs">{op.file}</code>
                              <p className="text-muted-foreground text-xs mt-1">{op.issue}</p>
                            </div>
                            <SeverityBadge severity={op.severity} />
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* DB Query Efficiency */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        DB Query Effizienz
                      </CardTitle>
                      <StatusBadge status={nodejs.dbQueryEfficiency.status} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Progress value={nodejs.dbQueryEfficiency.score} />
                    {nodejs.dbQueryEfficiency.inefficientQueries.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Ineffiziente Queries:</p>
                        {nodejs.dbQueryEfficiency.inefficientQueries.map((q, i) => (
                          <div key={i} className="text-sm bg-muted p-2 rounded">
                            <div className="flex items-center justify-between mb-1">
                              <code className="text-xs font-mono">{q.pattern}</code>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{q.count}x</Badge>
                                <SeverityBadge severity={q.severity} />
                              </div>
                            </div>
                            <p className="text-muted-foreground text-xs">{q.issue}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Caching */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <HardDrive className="h-4 w-4" />
                        Caching
                      </CardTitle>
                      <StatusBadge status={nodejs.caching.status} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Progress value={nodejs.caching.score} />
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-green-700">
                        Gecached ({nodejs.caching.currentCaching.length}):
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {nodejs.caching.currentCaching.map((c, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {c.endpoint.split("/").pop()} ({c.ttl})
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {nodejs.caching.missingCaching.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-orange-700">Fehlendes Caching:</p>
                        {nodejs.caching.missingCaching.slice(0, 3).map((m, i) => (
                          <div key={i} className="text-xs bg-orange-50 p-2 rounded">
                            <code>{m.endpoint}</code>
                            <span className="text-muted-foreground ml-2">Frequenz: {m.frequency}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Timeouts */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Timer className="h-4 w-4" />
                        Missing Timeouts
                      </CardTitle>
                      <StatusBadge status={nodejs.timeouts.status} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Progress value={nodejs.timeouts.score} />
                    {nodejs.timeouts.missingTimeouts.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Fehlende Timeouts:</p>
                        {nodejs.timeouts.missingTimeouts.map((t, i) => (
                          <div key={i} className="text-sm bg-muted p-2 rounded flex items-start justify-between gap-2">
                            <div>
                              <code className="text-xs">
                                {t.file}
                                {t.line ? `:${t.line}` : ""}
                              </code>
                              <p className="text-muted-foreground text-xs mt-1">{t.issue}</p>
                            </div>
                            <SeverityBadge severity={t.severity} />
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Logging */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileWarning className="h-4 w-4" />
                        Logging Overhead
                      </CardTitle>
                      <StatusBadge status={nodejs.logging.status} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Progress value={nodejs.logging.score} />
                    {nodejs.logging.issues.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Probleme:</p>
                        {nodejs.logging.issues.map((issue, i) => (
                          <div key={i} className="text-sm bg-muted p-2 rounded flex items-start justify-between gap-2">
                            <p className="text-muted-foreground text-xs">{issue.issue}</p>
                            <SeverityBadge severity={issue.severity} />
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Cold Start */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Cold Start Performance
                      </CardTitle>
                      <StatusBadge status={nodejs.coldStart.status} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Progress value={nodejs.coldStart.score} />
                    {nodejs.coldStart.issues.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Probleme:</p>
                        {nodejs.coldStart.issues.map((issue, i) => (
                          <div key={i} className="text-sm bg-muted p-2 rounded flex items-start justify-between gap-2">
                            <div>
                              <p className="text-xs">{issue.issue}</p>
                              <p className="text-muted-foreground text-xs mt-1">{issue.impact}</p>
                            </div>
                            <SeverityBadge severity={issue.severity} />
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Horizontal Scalability */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Gauge className="h-4 w-4" />
                        Horizontale Skalierbarkeit
                      </CardTitle>
                      <StatusBadge status={nodejs.horizontalScalability.status} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Progress value={nodejs.horizontalScalability.score} />
                    {nodejs.horizontalScalability.issues.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Probleme:</p>
                        {nodejs.horizontalScalability.issues.map((issue, i) => (
                          <div key={i} className="text-sm bg-muted p-2 rounded flex items-start justify-between gap-2">
                            <div>
                              <p className="text-xs">{issue.issue}</p>
                              <p className="text-muted-foreground text-xs mt-1">{issue.impact}</p>
                            </div>
                            <SeverityBadge severity={issue.severity} />
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Recommendations Summary */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Top Node.js Empfehlungen</CardTitle>
                      <CardDescription>Priorisierte Maßnahmen zur Verbesserung der Backend-Performance</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyRecommendationsForV0}
                      className="gap-2 bg-transparent"
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 text-green-600" />
                          Kopiert!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Für v0 kopieren
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {nodejs.dbQueryEfficiency.recommendations.slice(0, 2).map((rec, i) => (
                      <div
                        key={`db-${i}`}
                        className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200"
                      >
                        <Database className="h-5 w-5 text-red-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-red-900">{rec}</p>
                          <Badge variant="destructive" className="mt-1">
                            Hoch
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {nodejs.timeouts.recommendations.slice(0, 1).map((rec, i) => (
                      <div
                        key={`timeout-${i}`}
                        className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200"
                      >
                        <Timer className="h-5 w-5 text-red-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-red-900">{rec}</p>
                          <Badge variant="destructive" className="mt-1">
                            Hoch
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {nodejs.logging.recommendations.slice(0, 1).map((rec, i) => (
                      <div
                        key={`log-${i}`}
                        className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200"
                      >
                        <FileWarning className="h-5 w-5 text-orange-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-orange-900">{rec}</p>
                          <Badge className="bg-orange-100 text-orange-800 mt-1">Mittel</Badge>
                        </div>
                      </div>
                    ))}
                    {nodejs.caching.recommendations.slice(0, 1).map((rec, i) => (
                      <div
                        key={`cache-${i}`}
                        className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200"
                      >
                        <HardDrive className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-blue-900">{rec}</p>
                          <Badge className="bg-blue-100 text-blue-800 mt-1">Mittel</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Datenbank Metriken</CardTitle>
              <CardDescription>Übersicht über Ihre Datenbankressourcen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Gesamttabellen</span>
                  <span className="text-2xl font-bold">{metrics.database.totalTables}</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Tabellen mit RLS</span>
                  <span className="text-2xl font-bold">{metrics.database.tablesWithRLS}</span>
                </div>
                <Progress value={(metrics.database.tablesWithRLS / metrics.database.totalTables) * 100} />
              </div>

              {metrics.database.tablesWithoutRLS.length > 0 && (
                <div className="border-l-4 border-orange-500 bg-orange-50 p-4 rounded">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-orange-900 mb-2">Warnung: Tabellen ohne RLS</h4>
                      <p className="text-sm text-orange-800 mb-2">
                        {metrics.database.tablesWithoutRLS.length} Tabelle(n) haben Row Level Security nicht aktiviert.
                        Dies stellt ein Sicherheitsrisiko dar.
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        {metrics.database.tablesWithoutRLS.map((table) => (
                          <li key={table} className="text-sm text-orange-800">
                            {table}
                          </li>
                        ))}
                      </ul>
                      <Button size="sm" className="mt-3 bg-transparent" variant="outline">
                        SQL Script ausführen
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Index Coverage</span>
                  <span className="text-2xl font-bold">{metrics.database.indexCoverage}%</span>
                </div>
                <Progress value={metrics.database.indexCoverage} />
              </div>

              {metrics.database.potentialIndexes.length > 0 && (
                <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-blue-900 mb-2">Empfohlene Indexe</h4>
                      <p className="text-sm text-blue-800 mb-2">
                        Diese Indexe könnten die Query-Performance verbessern:
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        {metrics.database.potentialIndexes.map((index, i) => (
                          <li key={i} className="text-sm text-blue-800 font-mono">
                            {index}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Analyse</CardTitle>
              <CardDescription>Detaillierte Performance-Metriken des Systems</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-sm font-medium">Durchschn. Antwortzeit</span>
                  <div className="text-3xl font-bold">{metrics.performance.avgResponseTime}ms</div>
                  <Progress value={Math.max(0, 100 - metrics.performance.avgResponseTime / 10)} />
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium">Cache Hit Rate</span>
                  <div className="text-3xl font-bold">{metrics.performance.cacheHitRate}%</div>
                  <Progress value={metrics.performance.cacheHitRate} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-sm font-medium">Langsame Queries</span>
                  <div className="text-3xl font-bold">{metrics.performance.slowQueries}</div>
                  {metrics.performance.slowQueries > 5 && <Badge variant="destructive">Optimierung erforderlich</Badge>}
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium">Speichernutzung</span>
                  <div className="text-3xl font-bold">{metrics.performance.memoryUsage}%</div>
                  <Progress value={metrics.performance.memoryUsage} />
                </div>
              </div>

              <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-green-900 mb-1">Performance Score: {performanceScore}%</h4>
                    <p className="text-sm text-green-800">
                      {performanceScore >= 80
                        ? "Ihr System läuft optimal!"
                        : performanceScore >= 60
                          ? "Gute Performance, aber es gibt Verbesserungspotenzial."
                          : "Performance-Optimierung dringend empfohlen."}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sicherheitsanalyse</CardTitle>
              <CardDescription>Sicherheitsstatus und Schwachstellen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">RLS Compliance</span>
                  <span className="text-2xl font-bold">{metrics.security.rlsCompliance.toFixed(0)}%</span>
                </div>
                <Progress value={metrics.security.rlsCompliance} />
              </div>

              {metrics.security.functionSecurityIssues && metrics.security.functionSecurityIssues > 0 && (
                <div className="border-l-4 border-orange-500 bg-orange-50 p-4 rounded">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-orange-900 mb-2">Funktions-Sicherheit</h4>
                      <p className="text-sm text-orange-800 mb-2">
                        {metrics.security.functionSecurityIssues} Datenbankfunktionen haben keinen festen search_path
                        und sind anfällig für Manipulationsangriffe.
                      </p>
                      <code className="text-xs bg-orange-100 px-2 py-1 rounded">
                        scripts/fix-function-search-path-security.sql
                      </code>
                    </div>
                  </div>
                </div>
              )}

              {metrics.security.passwordProtectionEnabled === false && (
                <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-red-900 mb-2">Passwort-Schutz deaktiviert</h4>
                      <p className="text-sm text-red-800 mb-2">
                        Schutz vor kompromittierten Passwörtern (HaveIBeenPwned) ist nicht aktiviert. Aktivieren Sie
                        dies in der Supabase-Konsole unter Authentication - Policies.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {metrics.security.vulnerabilities.length === 0 ? (
                    <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-green-900">Keine Schwachstellen gefunden</h4>
                          <p className="text-sm text-green-800">Ihr System erfüllt alle Sicherheitsstandards.</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    metrics.security.vulnerabilities.map((vuln, index) => (
                      <Card
                        key={index}
                        className={`border-l-4 ${
                          vuln.severity === "high"
                            ? "border-red-500"
                            : vuln.severity === "medium"
                              ? "border-orange-500"
                              : "border-yellow-500"
                        }`}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-base">{vuln.type}</CardTitle>
                            <Badge
                              variant={vuln.severity === "high" ? "destructive" : "secondary"}
                              className="capitalize"
                            >
                              {vuln.severity === "high" ? "Hoch" : vuln.severity === "medium" ? "Mittel" : "Niedrig"}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">{vuln.description}</p>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <ScrollArea className="h-[600px]">
            <div className="space-y-4 pr-4">
              {metrics.recommendations.map((rec, index) => (
                <Card
                  key={index}
                  className={`border-l-4 ${
                    rec.priority === "high"
                      ? "border-red-500"
                      : rec.priority === "medium"
                        ? "border-orange-500"
                        : "border-blue-500"
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge variant="outline" className="mb-2">
                          {rec.category}
                        </Badge>
                        <CardTitle className="text-base">{rec.title}</CardTitle>
                      </div>
                      <Badge variant={rec.priority === "high" ? "destructive" : "secondary"} className="capitalize">
                        {rec.priority === "high" ? "Hoch" : rec.priority === "medium" ? "Mittel" : "Niedrig"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{rec.description}</p>
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-sm font-medium mb-1">Auswirkung:</p>
                      <p className="text-sm text-muted-foreground">{rec.impact}</p>
                    </div>
                    <div className="bg-primary/5 p-3 rounded-lg">
                      <p className="text-sm font-medium mb-1">Empfohlene Aktion:</p>
                      <p className="text-sm">{rec.action}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export { SystemOptimizationReport }
export default SystemOptimizationReport
