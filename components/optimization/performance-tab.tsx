import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2 } from "lucide-react"
import type { OptimizationMetrics } from "./types"

interface PerformanceTabProps {
  performance: OptimizationMetrics["performance"]
  performanceScore: number
}

export function PerformanceTab({ performance, performanceScore }: PerformanceTabProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Performance Analyse</CardTitle>
          <CardDescription>Detaillierte Performance-Metriken des Systems</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <span className="text-sm font-medium">Durchschn. Antwortzeit</span>
              <div className="text-3xl font-bold">{performance.avgResponseTime}ms</div>
              <Progress value={Math.max(0, 100 - performance.avgResponseTime / 10)} />
            </div>
            <div className="space-y-2">
              <span className="text-sm font-medium">Cache Hit Rate</span>
              <div className="text-3xl font-bold">{performance.cacheHitRate}%</div>
              <Progress value={performance.cacheHitRate} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <span className="text-sm font-medium">Langsame Queries</span>
              <div className="text-3xl font-bold">{performance.slowQueries}</div>
              {performance.slowQueries > 5 && <Badge variant="destructive">Optimierung erforderlich</Badge>}
            </div>
            <div className="space-y-2">
              <span className="text-sm font-medium">Speichernutzung</span>
              <div className="text-3xl font-bold">{performance.memoryUsage}%</div>
              <Progress value={performance.memoryUsage} />
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
    </div>
  )
}
