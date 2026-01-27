"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Star, CheckCircle, BookOpen, Target } from "lucide-react"
import type { UserStats } from "../types"
import { DEFAULT_STATS } from "../types"

interface AcademyStatsCardsProps {
  userStats: UserStats | null
}

export function AcademyStatsCards({ userStats }: AcademyStatsCardsProps) {
  const displayStats = userStats || DEFAULT_STATS
  const xpProgress =
    displayStats.xp_for_next_level > 0 ? (displayStats.total_xp / displayStats.xp_for_next_level) * 100 : 0

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
              <Star className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{displayStats.total_xp.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Gesamte XP</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Level {displayStats.current_level}</span>
              <span>Level {displayStats.current_level + 1}</span>
            </div>
            <Progress value={xpProgress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {displayStats.xp_for_next_level - displayStats.total_xp > 0
                ? `Noch ${(displayStats.xp_for_next_level - displayStats.total_xp).toLocaleString()} XP bis zum nächsten Level`
                : "Nächstes Level erreicht!"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{displayStats.courses_completed}</p>
              <p className="text-sm text-muted-foreground">Kurse abgeschlossen</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{displayStats.lessons_completed}</p>
              <p className="text-sm text-muted-foreground">Lektionen abgeschlossen</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
              <Target className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{displayStats.quizzes_passed}</p>
              <p className="text-sm text-muted-foreground">Quizze bestanden</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
