"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Database,
  Server,
  Repeat,
  Timer,
  HardDrive,
  FileWarning,
  Clock,
  Gauge,
  Network,
  Copy,
  Check,
} from "lucide-react"
import type { NodejsPerformanceMetrics } from "./types"
import { StatusBadge, SeverityBadge, ScoreDisplay } from "./shared-badges"

interface NodejsTabProps {
  nodejs: NodejsPerformanceMetrics
}

export function NodejsTab({ nodejs }: NodejsTabProps) {
  const [copied, setCopied] = useState(false)

  const copyRecommendationsForV0 = () => {
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
    <div className="space-y-4">
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
                      <code className="text-xs">{op.file}{op.line ? `:${op.line}` : ""}</code>
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
                      <code className="text-xs">{t.file}{t.line ? `:${t.line}` : ""}</code>
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
            <Button variant="outline" size="sm" onClick={copyRecommendationsForV0} className="gap-2 bg-transparent">
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
              <div key={`db-${i}`} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                <Database className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-900">{rec}</p>
                  <Badge variant="destructive" className="mt-1">Hoch</Badge>
                </div>
              </div>
            ))}
            {nodejs.timeouts.recommendations.slice(0, 1).map((rec, i) => (
              <div key={`timeout-${i}`} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                <Timer className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-900">{rec}</p>
                  <Badge variant="destructive" className="mt-1">Hoch</Badge>
                </div>
              </div>
            ))}
            {nodejs.logging.recommendations.slice(0, 1).map((rec, i) => (
              <div key={`log-${i}`} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                <FileWarning className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-orange-900">{rec}</p>
                  <Badge className="bg-orange-100 text-orange-800 mt-1">Mittel</Badge>
                </div>
              </div>
            ))}
            {nodejs.caching.recommendations.slice(0, 1).map((rec, i) => (
              <div key={`cache-${i}`} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
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
    </div>
  )
}
