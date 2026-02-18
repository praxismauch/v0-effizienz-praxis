"use client"

import { Ticket, AlertCircle, PlayCircle, AlertTriangle, FlaskConical } from "lucide-react"
import { StatCard, statCardColors } from "@/components/ui/stat-card"
import type { TicketStats } from "../types"

interface TicketStatsCardsProps {
  stats: TicketStats
}

export function TicketStatsCards({ stats }: TicketStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <StatCard
        label="Gesamt"
        value={stats.total}
        icon={Ticket}
        {...statCardColors.primary}
      />
      <StatCard
        label="Offen"
        value={stats.open}
        icon={AlertCircle}
        {...statCardColors.orange}
      />
      <StatCard
        label="In Bearbeitung"
        value={stats.in_progress}
        icon={PlayCircle}
        {...statCardColors.blue}
      />
      <StatCard
        label="Zu testen"
        value={stats.to_test}
        icon={FlaskConical}
        {...statCardColors.purple}
      />
      <StatCard
        label="Dringend"
        value={stats.urgent}
        icon={AlertTriangle}
        {...statCardColors.red}
      />
    </div>
  )
}
