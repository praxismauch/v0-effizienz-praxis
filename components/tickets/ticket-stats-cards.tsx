"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Ticket, Clock, AlertCircle, AlertTriangle } from "lucide-react"
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
    <div className="grid grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Gesamt</p>
              <p className="text-2xl font-bold">{tickets.length}</p>
            </div>
            <Ticket className="h-8 w-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Offen</p>
              <p className="text-2xl font-bold text-orange-600">
                {tickets.filter((t) => t.status === "open").length}
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-orange-600" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Durchschn. Lösungszeit</p>
              <p className="text-2xl font-bold">{avgResolutionDays}</p>
            </div>
            <Clock className="h-8 w-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Hohe Priorität</p>
              <p className="text-2xl font-bold text-red-600">
                {tickets.filter((t) => t.priority === "high").length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
