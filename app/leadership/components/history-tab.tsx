"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { History, Calendar, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import type { PermaAssessment } from "../types"
import { getAverageScore, getScoreColor } from "../types"

interface HistoryTabProps {
  assessments: PermaAssessment[]
  isLoading: boolean
}

export default function HistoryTab({ assessments, isLoading }: HistoryTabProps) {
  const getTrend = (current: number, previous: number | undefined) => {
    if (!previous) return "stable"
    if (current > previous + 5) return "up"
    if (current < previous - 5) return "down"
    return "stable"
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-emerald-500" />
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-500" />
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (assessments.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <History className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Noch keine Selbsteinschätzungen vorhanden</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Verlauf Ihrer Selbsteinschätzungen
        </CardTitle>
        <CardDescription>
          Ihre letzten {assessments.length} Einschätzungen im Überblick
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {assessments.map((assessment, index) => {
            const scores = {
              positiveEmotions: assessment.positive_emotions,
              engagement: assessment.engagement,
              relationships: assessment.relationships,
              meaning: assessment.meaning,
              accomplishment: assessment.accomplishment,
              vitality: assessment.vitality,
            }
            const avgScore = getAverageScore(scores)
            const previousAssessment = assessments[index + 1]
            const previousAvg = previousAssessment
              ? getAverageScore({
                  positiveEmotions: previousAssessment.positive_emotions,
                  engagement: previousAssessment.engagement,
                  relationships: previousAssessment.relationships,
                  meaning: previousAssessment.meaning,
                  accomplishment: previousAssessment.accomplishment,
                  vitality: previousAssessment.vitality,
                })
              : undefined
            const trend = getTrend(avgScore, previousAvg)

            return (
              <div
                key={assessment.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(assessment.assessment_date), "dd. MMMM yyyy", { locale: de })}
                  </div>
                  <Badge variant="outline">{assessment.assessment_type}</Badge>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {getTrendIcon(trend)}
                    <span className={`font-semibold ${getScoreColor(avgScore)}`}>{avgScore}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
