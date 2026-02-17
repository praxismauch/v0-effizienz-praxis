"use client"

import { FileText, Bell, MessageSquare, TrendingUp } from "lucide-react"
import { StatCard, statCardColors } from "@/components/ui/stat-card"

interface SurveyStatsCardsProps {
  stats: {
    total: number
    active: number
    totalResponses: number
    avgResponseRate: number
  }
}

export function SurveyStatsCards({ stats }: SurveyStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
      <StatCard
        label="Gesamt"
        value={stats.total}
        icon={FileText}
        {...statCardColors.purple}
      />
      <StatCard
        label="Aktiv"
        value={stats.active}
        icon={Bell}
        {...statCardColors.green}
      />
      <StatCard
        label="Antworten"
        value={stats.totalResponses}
        icon={MessageSquare}
        {...statCardColors.blue}
      />
      <StatCard
        label="Ø Antworten"
        value={stats.avgResponseRate}
        icon={TrendingUp}
        {...statCardColors.amber}
      />
    </div>
  )
}
