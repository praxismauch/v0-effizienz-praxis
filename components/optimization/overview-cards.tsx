import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Database, Zap, Shield, TrendingUp, Server } from "lucide-react"
import type { OptimizationMetrics } from "./types"

interface OverviewCardsProps {
  metrics: OptimizationMetrics
  performanceScore: number
}

export function OverviewCards({ metrics, performanceScore }: OverviewCardsProps) {
  const nodejs = metrics.nodejsPerformance

  return (
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
  )
}
