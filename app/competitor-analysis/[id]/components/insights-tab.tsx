"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Lightbulb, CheckCircle, AlertCircle, Info } from "lucide-react"
import type { CompetitorAnalysis, Insight } from "../types"

interface InsightsTabProps {
  analysis: CompetitorAnalysis
}

export function InsightsTab({ analysis }: InsightsTabProps) {
  const insights: Insight[] = analysis.insights || []

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "medium":
        return <Info className="h-4 w-4 text-yellow-500" />
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />
    }
  }

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, "destructive" | "default" | "secondary"> = {
      high: "destructive",
      medium: "default",
      low: "secondary",
    }
    const labels: Record<string, string> = {
      high: "Hoch",
      medium: "Mittel",
      low: "Niedrig",
    }
    return <Badge variant={variants[priority] || "secondary"}>{labels[priority] || priority}</Badge>
  }

  if (insights.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">Keine Erkenntnisse erfasst</p>
          <p className="text-sm text-muted-foreground mt-1">
            Führen Sie eine AI-Analyse durch, um Erkenntnisse zu generieren
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {insights.map((insight, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {getPriorityIcon(insight.priority || "low")}
                <CardTitle className="text-base">{insight.title}</CardTitle>
              </div>
              {getPriorityBadge(insight.priority || "low")}
            </div>
            {insight.category && (
              <Badge variant="outline" className="w-fit mt-1">{insight.category}</Badge>
            )}
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{insight.description}</p>
            {insight.recommendation && (
              <div className="mt-3 p-3 bg-primary/5 rounded-lg">
                <p className="text-sm font-medium">Empfehlung:</p>
                <p className="text-sm text-muted-foreground">{insight.recommendation}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
