"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Euro, Users, TrendingUp } from "lucide-react"
import { formatCurrency } from "@/lib/format-currency"

interface BillingMetricsCardsProps {
  totalRevenue: number
  activeSubscriptions: number
  trialSubscriptions: number
}

export function BillingMetricsCards({
  totalRevenue,
  activeSubscriptions,
  trialSubscriptions,
}: BillingMetricsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monatlicher Umsatz</CardTitle>
          <Euro className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
          <p className="text-xs text-muted-foreground">Aus aktiven Abonnements</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Aktive Abos</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeSubscriptions}</div>
          <p className="text-xs text-muted-foreground">Zahlende Praxen</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Testversionen</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{trialSubscriptions}</div>
          <p className="text-xs text-muted-foreground">Aktive Trials</p>
        </CardContent>
      </Card>
    </div>
  )
}
