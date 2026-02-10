"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Ticket, AlertCircle, PlayCircle, AlertTriangle, FlaskConical } from "lucide-react"
import type { TicketStats } from "../types"

interface TicketStatsCardsProps {
  stats: TicketStats
}

export function TicketStatsCards({ stats }: TicketStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Gesamt</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </div>
            <Ticket className="h-10 w-10 text-muted-foreground opacity-50" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Offen</p>
              <p className="text-3xl font-bold text-orange-600">{stats.open}</p>
            </div>
            <AlertCircle className="h-10 w-10 text-orange-600 opacity-50" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">In Bearbeitung</p>
              <p className="text-3xl font-bold text-blue-600">{stats.in_progress}</p>
            </div>
            <PlayCircle className="h-10 w-10 text-blue-600 opacity-50" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Zu testen</p>
              <p className="text-3xl font-bold text-purple-600">{stats.to_test}</p>
            </div>
            <FlaskConical className="h-10 w-10 text-purple-600 opacity-50" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Dringend</p>
              <p className="text-3xl font-bold text-red-600">{stats.urgent}</p>
            </div>
            <AlertTriangle className="h-10 w-10 text-red-600 opacity-50" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
