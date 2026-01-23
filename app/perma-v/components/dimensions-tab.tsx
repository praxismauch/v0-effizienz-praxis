"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ChevronRight } from "lucide-react"
import { PermaScores, PermaModelItem, PracticeAverages } from "../types"

interface DimensionsTabProps {
  permaScores: PermaScores
  practiceAverages: PracticeAverages | null
  permaVModel: PermaModelItem[]
}

export function DimensionsTab({ permaScores, practiceAverages, permaVModel }: DimensionsTabProps) {
  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-emerald-600"
    if (score >= 40) return "text-amber-600"
    return "text-red-600"
  }

  const getComparison = (userScore: number, avgScore: number) => {
    const diff = userScore - avgScore
    if (Math.abs(diff) < 5) return { text: "Im Durchschnitt", color: "text-slate-600" }
    if (diff > 0) return { text: `+${diff}% über Durchschnitt`, color: "text-emerald-600" }
    return { text: `${diff}% unter Durchschnitt`, color: "text-amber-600" }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {permaVModel.map((dim) => {
        const score = permaScores[dim.key]
        const avgScore = practiceAverages
          ? Math.round(practiceAverages[dim.dbKey as keyof PracticeAverages] || 0)
          : null

        return (
          <Card key={dim.key} className={`${dim.lightColor} border-2 hover:shadow-lg transition-shadow`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${dim.color} text-white`}>{dim.icon}</div>
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span className={`font-bold ${dim.textColor}`}>{dim.letter}</span>
                      {dim.title}
                    </CardTitle>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">{dim.description}</CardDescription>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Ihr Score</span>
                  <span className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}%</span>
                </div>
                <Progress value={score} className="h-3" />

                {avgScore !== null && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Praxis-Durchschnitt: {avgScore}%</span>
                    <Badge variant="outline" className={getComparison(score, avgScore).color}>
                      {getComparison(score, avgScore).text}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
