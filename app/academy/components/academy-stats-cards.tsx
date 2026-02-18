"use client"

import { Star, CheckCircle, BookOpen, Target } from "lucide-react"
import { StatCard, statCardColors } from "@/components/ui/stat-card"
import type { UserStats } from "../types"
import { DEFAULT_STATS } from "../types"

interface AcademyStatsCardsProps {
  userStats: UserStats | null
}

export function AcademyStatsCards({ userStats }: AcademyStatsCardsProps) {
  const displayStats = userStats || DEFAULT_STATS

  const total_xp = Number(displayStats.total_xp) || 0
  const xp_for_next_level = Number(displayStats.xp_for_next_level) || 100
  const current_level = Number(displayStats.current_level) || 1
  const courses_completed = Number(displayStats.courses_completed) || 0
  const lessons_completed = Number(displayStats.lessons_completed) || 0
  const quizzes_passed = Number(displayStats.quizzes_passed) || 0

  const xpProgress = xp_for_next_level > 0 ? Math.min(100, (total_xp / xp_for_next_level) * 100) : 0
  const remaining_xp = Math.max(0, xp_for_next_level - total_xp)

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <StatCard
        label="Gesamte XP"
        value={total_xp.toLocaleString()}
        icon={Star}
        {...statCardColors.purple}
        description={remaining_xp > 0 ? `Noch ${remaining_xp.toLocaleString()} XP bis Level ${current_level + 1}` : "Nächstes Level erreicht!"}
        progress={xpProgress}
        progressLabel={`Level ${current_level}`}
      />
      <StatCard
        label="Kurse abgeschlossen"
        value={courses_completed}
        icon={CheckCircle}
        {...statCardColors.green}
      />
      <StatCard
        label="Lektionen abgeschlossen"
        value={lessons_completed}
        icon={BookOpen}
        {...statCardColors.blue}
      />
      <StatCard
        label="Quizze bestanden"
        value={quizzes_passed}
        icon={Target}
        {...statCardColors.amber}
      />
    </div>
  )
}
