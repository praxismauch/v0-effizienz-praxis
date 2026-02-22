"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Lightbulb, AlertCircle, Info, CheckCircle, ListChecks, DollarSign } from "lucide-react"
import type { Recommendation } from "../types"
import { getPriorityColor } from "../types"

interface InsightsTabProps {
  recommendations?: Recommendation[]
}

export function InsightsTab({ recommendations = [] }: InsightsTabProps) {
  const getPriorityIcon = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case "hoch":
      case "high":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "mittel":
      case "medium":
        return <Info className="h-4 w-4 text-yellow-500" />
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />
    }
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">Keine Empfehlungen vorhanden</p>
          <p className="text-sm text-muted-foreground mt-1">
            Starten Sie eine KI-Analyse, um Empfehlungen zu generieren
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {recommendations.map((rec, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {getPriorityIcon(rec.priority)}
                <CardTitle className="text-base">{rec.title}</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                {rec.category && (
                  <Badge variant="outline">{rec.category}</Badge>
                )}
                {rec.priority && (
                  <Badge className={getPriorityColor(rec.priority)}>{rec.priority}</Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{rec.description}</p>
            {rec.expected_impact && (
              <div className="p-3 bg-primary/5 rounded-lg">
                <p className="text-sm"><strong>Erwartete Wirkung:</strong> {rec.expected_impact}</p>
              </div>
            )}
            {rec.implementation_steps && rec.implementation_steps.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-medium flex items-center gap-1">
                  <ListChecks className="h-4 w-4" /> Umsetzungsschritte:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground pl-1">
                  {rec.implementation_steps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>
            )}
            {rec.estimated_cost && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <DollarSign className="h-3 w-3" /> Geschätzte Kosten: {rec.estimated_cost}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
