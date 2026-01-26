"use client"

import { Users, UserCheck, AlertCircle, Clock } from "lucide-react"
import { StatCard, statCardColors } from "@/components/ui/stat-card"
import { formatGermanNumber } from "@/lib/utils/number-format"
import type { ResponsibilityStats } from "../types"

interface ResponsibilityStatsProps {
  stats: ResponsibilityStats
}

export function ResponsibilityStatsCards({ stats }: ResponsibilityStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <StatCard label="Gesamt" value={stats.total} icon={Users} {...statCardColors.primary} />
      <StatCard label="Zugewiesen" value={stats.assigned} icon={UserCheck} {...statCardColors.success} />
      <StatCard label="Offen" value={stats.unassigned} icon={AlertCircle} {...statCardColors.warning} />
      <StatCard
        label="Stunden/Woche"
        value={formatGermanNumber(stats.totalHours)}
        icon={Clock}
        {...statCardColors.info}
      />
    </div>
  )
}
