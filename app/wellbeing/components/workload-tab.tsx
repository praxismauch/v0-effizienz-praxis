"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Activity, AlertTriangle, Brain, Lightbulb, Sparkles, RefreshCw } from "lucide-react"
import type { WorkloadAnalysis } from "../types"
import { getBurnoutRiskColor, getBurnoutRiskLabel } from "../types"

interface WorkloadTabProps {
  workloadAnalysis: WorkloadAnalysis | null
  isAnalyzingWorkload: boolean
  onAnalyzeWorkload: () => void
}

export function WorkloadTab({ workloadAnalysis, isAnalyzingWorkload, onAnalyzeWorkload }: WorkloadTabProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              KI-Arbeitsbelastungs-Analyse
            </CardTitle>
            <CardDescription>{"Erkennung von Überlastungsmustern und Burnout-Risiken"}</CardDescription>
          </div>
          <Button onClick={onAnalyzeWorkload} disabled={isAnalyzingWorkload}>
            {isAnalyzingWorkload ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Neue Analyse
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {workloadAnalysis ? (
          <div className="space-y-6">
            {/* Burnout Risk Score */}
            <div className="text-center p-6 rounded-lg bg-muted/50">
              <div className="text-sm text-muted-foreground mb-2">Burnout-Risiko-Score</div>
              <div className={`inline-block text-4xl font-bold px-6 py-3 rounded-xl text-white ${getBurnoutRiskColor(workloadAnalysis.burnout_risk_score)}`}>
                {workloadAnalysis.burnout_risk_score}%
              </div>
              <div className="mt-2 text-sm font-medium">
                {getBurnoutRiskLabel(workloadAnalysis.burnout_risk_score)}
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid gap-4 md:grid-cols-4">
              <div className="p-4 rounded-lg border">
                <div className="text-2xl font-bold">{workloadAnalysis.avg_weekly_hours?.toFixed(1) || "\u2013"}h</div>
                <p className="text-sm text-muted-foreground">{"Ø Wochenstunden"}</p>
              </div>
              <div className="p-4 rounded-lg border">
                <div className="text-2xl font-bold">{workloadAnalysis.overtime_percentage?.toFixed(0) || "\u2013"}%</div>
                <p className="text-sm text-muted-foreground">{"Überstundenquote"}</p>
              </div>
              <div className="p-4 rounded-lg border">
                <div className="text-2xl font-bold">{workloadAnalysis.sick_leave_rate?.toFixed(1) || "\u2013"}%</div>
                <p className="text-sm text-muted-foreground">Krankenquote</p>
              </div>
              <div className="p-4 rounded-lg border">
                <div className="text-2xl font-bold">{workloadAnalysis.vacation_usage_rate?.toFixed(0) || "\u2013"}%</div>
                <p className="text-sm text-muted-foreground">Urlaubsnutzung</p>
              </div>
            </div>

            {/* Risk Factors */}
            {workloadAnalysis.risk_factors && workloadAnalysis.risk_factors.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Erkannte Risikofaktoren
                </h3>
                <div className="space-y-2">
                  {workloadAnalysis.risk_factors.map((factor, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
                      <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                      <span className="text-sm">{factor}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Insights */}
            {workloadAnalysis.ai_insights && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-500" />
                  {"KI-Einschätzung"}
                </h3>
                <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
                  <p className="text-sm whitespace-pre-wrap">{workloadAnalysis.ai_insights}</p>
                </div>
              </div>
            )}

            {/* Recommendations */}
            {workloadAnalysis.ai_recommendations && workloadAnalysis.ai_recommendations.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-green-500" />
                  Empfehlungen
                </h3>
                <div className="space-y-3">
                  {workloadAnalysis.ai_recommendations.map((rec, idx) => (
                    <div key={idx} className="p-4 rounded-lg border">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{rec.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                        </div>
                        <Badge variant={rec.priority === "high" ? "destructive" : rec.priority === "medium" ? "default" : "secondary"}>
                          {rec.priority === "high" ? "Hoch" : rec.priority === "medium" ? "Mittel" : "Niedrig"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Activity className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Keine Analyse vorhanden</h3>
            <p className="text-muted-foreground mb-4">
              {"Starten Sie eine KI-Analyse, um Überlastungsmuster zu erkennen."}
            </p>
            <Button onClick={onAnalyzeWorkload} disabled={isAnalyzingWorkload}>
              {isAnalyzingWorkload ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Analyse starten
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
