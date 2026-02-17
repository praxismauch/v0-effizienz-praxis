"use client"

import { Ticket, Clock, AlertCircle, AlertTriangle } from "lucide-react"
import { StatCard, statCardColors } from "@/components/ui/stat-card"
import type { TicketItem } from "./ticket-types"

interface TicketStatsCardsProps {
  tickets: TicketItem[]
}

export function TicketStatsCards({ tickets }: TicketStatsCardsProps) {
  const avgResolutionDays = (() => {
    const resolvedTickets = tickets.filter((t) => t.resolved_at && t.created_at)
    if (resolvedTickets.length === 0) return "0d"
    const totalDays = resolvedTickets.reduce((sum, ticket) => {
      const created = new Date(ticket.created_at).getTime()
      const resolved = new Date(ticket.resolved_at!).getTime()
      return sum + (resolved - created) / (1000 * 60 * 60 * 24)
    }, 0)
    return `${Math.round(totalDays / resolvedTickets.length)}d`
  })()

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        label="Gesamt"
        value={tickets.length}
        icon={Ticket}
        {...statCardColors.primary}
      />
      <StatCard
        label="Offen"
        value={tickets.filter((t) => t.status === "open").length}
        icon={AlertCircle}
        {...statCardColors.orange}
      />
      <StatCard
        label="Durchschn. Lösungszeit"
        value={avgResolutionDays}
        icon={Clock}
        {...statCardColors.blue}
      />
      <StatCard
        label="Hohe Priorität"
        value={tickets.filter((t) => t.priority === "high").length}
        icon={AlertTriangle}
        {...statCardColors.red}
      />
    </div>
  )
}
