"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Clock, Circle, TrendingUp, Target, Sparkles } from "lucide-react"

interface StrategyProgressOverviewProps {
  summary: {
    total: number
    completed: number
    inProgress: number
    notStarted: number
    overallProgress: number
  }
}

export function StrategyProgressOverview({ summary }: StrategyProgressOverviewProps) {
  const progressPercentage = summary.overallProgress

  const getProgressColor = () => {
    if (progressPercentage >= 75) return "bg-emerald-600"
    if (progressPercentage >= 50) return "bg-blue-600"
    if (progressPercentage >= 25) return "bg-amber-600"
    return "bg-slate-400"
  }

  const getMotivationalMessage = () => {
    if (progressPercentage === 0) return "Bereit für den Start? Jede Reise beginnt mit dem ersten Schritt!"
    if (progressPercentage < 25) return "Großartiger Start! Sie sind auf dem richtigen Weg."
    if (progressPercentage < 50) return "Weiter so! Sie machen bereits beachtliche Fortschritte."
    if (progressPercentage < 75) return "Beeindruckend! Sie sind schon über die Hälfte!"
    if (progressPercentage < 100) return "Fast geschafft! Nur noch wenige Schritte bis zum Ziel."
    return "Glückwunsch! Sie haben die Strategie-Reise erfolgreich abgeschlossen!"
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 via-white to-purple-50 border-2 border-blue-100">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Target className="h-6 w-6 text-blue-600" />
              Ihr Fortschritt
            </CardTitle>
            <CardDescription className="mt-1">Überblick über Ihre Strategie-Entwicklung</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-blue-600">{progressPercentage}%</div>
            <div className="text-xs text-muted-foreground mt-1">abgeschlossen</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Gesamtfortschritt</span>
            <span className="font-medium">
              {summary.completed} von {summary.total} Schritten
            </span>
          </div>
          <Progress value={progressPercentage} className="h-3" indicatorClassName={getProgressColor()} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-medium">Erledigt</span>
            </div>
            <div className="text-2xl font-bold text-emerald-600">{summary.completed}</div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">In Arbeit</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{summary.inProgress}</div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Circle className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-medium">Offen</span>
            </div>
            <div className="text-2xl font-bold text-slate-600">{summary.notStarted}</div>
          </div>
        </div>

        <Card className="bg-white/80 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900 mb-1">Motivationsnachricht</p>
                <p className="text-sm text-blue-800 leading-relaxed">{getMotivationalMessage()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {progressPercentage > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            <span>
              Sie haben bereits{" "}
              <span className="font-semibold text-emerald-600">
                {Math.round((summary.completed / summary.total) * 100)}%
              </span>{" "}
              der strategischen Grundlagen erarbeitet
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
