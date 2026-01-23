"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Users } from "lucide-react"
import { PermaScores, PermaModelItem, PracticeAverages } from "../types"

interface TeamTabProps {
  practiceAverages: PracticeAverages | null
  permaVModel: PermaModelItem[]
}

export function TeamTab({ practiceAverages, permaVModel }: TeamTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-indigo-500" />
          Team PERMA-V Übersicht
        </CardTitle>
        <CardDescription>Vergleichen Sie die PERMA-V Scores im Team (anonymisiert)</CardDescription>
      </CardHeader>
      <CardContent>
        {practiceAverages ? (
          <div className="space-y-4">
            {permaVModel.map((dim) => {
              const avgScore = Math.round(practiceAverages[dim.dbKey as keyof PracticeAverages] || 0)
              return (
                <div key={dim.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-lg ${dim.textColor}`}>{dim.letter}</span>
                      <span className="font-medium">{dim.title}</span>
                    </div>
                    <span className="font-semibold">{avgScore}%</span>
                  </div>
                  <Progress value={avgScore} className="h-3" />
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Noch keine Team-Daten verfügbar</p>
            <p className="text-sm">Team-Mitglieder müssen erst ihre PERMA-V Bewertungen abgeben</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
