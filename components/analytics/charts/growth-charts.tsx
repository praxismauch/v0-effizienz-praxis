"use client"

import { memo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts"

interface PracticeGrowthChartProps {
  data: Array<{ date: string; count: number; cumulative?: number }>
}

export const PracticeGrowthChart = memo(function PracticeGrowthChart({ data }: PracticeGrowthChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Praxen-Wachstum</CardTitle>
        <CardDescription>Neue Praxen über Zeit</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString("de-DE", { month: "short", day: "numeric" })} />
            <YAxis />
            <Tooltip labelFormatter={(value) => new Date(value).toLocaleDateString("de-DE")} />
            <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
})

interface CumulativeGrowthChartProps {
  data: Array<{ date: string; cumulative: number }>
}

export const CumulativeGrowthChart = memo(function CumulativeGrowthChart({ data }: CumulativeGrowthChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Praxen- und Benutzer-Wachstum</CardTitle>
        <CardDescription>Kumulative Entwicklung über Zeit</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString("de-DE", { month: "short", day: "numeric" })} />
            <YAxis />
            <Tooltip labelFormatter={(value) => new Date(value).toLocaleDateString("de-DE")} />
            <Legend />
            <Area type="monotone" dataKey="cumulative" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="Kumulative Praxen" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
})

interface GrowthMetricsCardsProps {
  growthRate: number
  churnRate: number
  ltv: number
  dateRange: string
}

export const GrowthMetricsCards = memo(function GrowthMetricsCards({ growthRate, churnRate, ltv, dateRange }: GrowthMetricsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader><CardTitle>Wachstumsrate</CardTitle></CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">+{growthRate}%</div>
          <p className="text-sm text-muted-foreground mt-1">In den letzten {dateRange} Tagen</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Churn Rate</CardTitle></CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-orange-600">{churnRate}%</div>
          <p className="text-sm text-muted-foreground mt-1">Abonnement-Kündigungen</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>LTV (Customer Lifetime Value)</CardTitle></CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{"€"}{ltv}</div>
          <p className="text-sm text-muted-foreground mt-1">Durchschnittlicher Kundenwert</p>
        </CardContent>
      </Card>
    </div>
  )
})
