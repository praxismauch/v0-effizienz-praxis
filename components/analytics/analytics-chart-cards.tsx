"use client"

import { memo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts"

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]

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
            <XAxis
              dataKey="date"
              tickFormatter={(value) =>
                new Date(value).toLocaleDateString("de-DE", { month: "short", day: "numeric" })
              }
            />
            <YAxis />
            <Tooltip labelFormatter={(value) => new Date(value).toLocaleDateString("de-DE")} />
            <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
})

interface TopFeaturesListProps {
  features: Array<{ feature_name: string; usage_count: number }>
}

export const TopFeaturesList = memo(function TopFeaturesList({ features }: TopFeaturesListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 10 Features</CardTitle>
        <CardDescription>Meist genutzte Funktionen</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {features.slice(0, 10).map((feature, index) => (
            <div key={feature.feature_name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="w-6 h-6 flex items-center justify-center text-xs">
                  {index + 1}
                </Badge>
                <span className="text-sm font-medium">{feature.feature_name}</span>
              </div>
              <span className="text-sm text-muted-foreground">{feature.usage_count} Mal</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
})

interface DailyActivityChartProps {
  data: Array<{ date: string; views: number; uniqueVisitors: number }>
}

export const DailyActivityChart = memo(function DailyActivityChart({ data }: DailyActivityChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Benutzeraktivität</CardTitle>
        <CardDescription>Tägliche aktive Benutzer und Interaktionen</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(value) =>
                new Date(value).toLocaleDateString("de-DE", { month: "short", day: "numeric" })
              }
            />
            <YAxis />
            <Tooltip labelFormatter={(value) => new Date(value).toLocaleDateString("de-DE")} />
            <Legend />
            <Line type="monotone" dataKey="views" stroke="#3b82f6" name="Aufrufe" strokeWidth={2} />
            <Line
              type="monotone"
              dataKey="uniqueVisitors"
              stroke="#10b981"
              name="Eindeutige Besucher"
              strokeWidth={2}
            />
          </LineChart>
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
            <XAxis
              dataKey="date"
              tickFormatter={(value) =>
                new Date(value).toLocaleDateString("de-DE", { month: "short", day: "numeric" })
              }
            />
            <YAxis />
            <Tooltip labelFormatter={(value) => new Date(value).toLocaleDateString("de-DE")} />
            <Legend />
            <Area
              type="monotone"
              dataKey="cumulative"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.6}
              name="Kumulative Praxen"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
})

interface FeatureUsageBarChartProps {
  features: Array<{ feature_name: string; usage_count: number }>
}

export const FeatureUsageBarChart = memo(function FeatureUsageBarChart({ features }: FeatureUsageBarChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature-Nutzung nach Kategorie</CardTitle>
        <CardDescription>Verteilung der Funktionsnutzung</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={features.slice(0, 15)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="feature_name" angle={-45} textAnchor="end" height={120} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="usage_count" fill="#3b82f6" name="Nutzungen" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
})

interface FeatureAdoptionListProps {
  features: Array<{ feature_name: string; unique_practices?: number }>
  totalPractices: number
}

export const FeatureAdoptionList = memo(function FeatureAdoptionList({
  features,
  totalPractices,
}: FeatureAdoptionListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature-Adoption</CardTitle>
        <CardDescription>Wie viele Praxen nutzen welche Features</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {features.slice(0, 10).map((feature) => {
            const adoptionRate = totalPractices
              ? (((feature.unique_practices || 0) / totalPractices) * 100).toFixed(1)
              : 0

            return (
              <div key={feature.feature_name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{feature.feature_name}</span>
                  <span className="text-muted-foreground">{adoptionRate}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all" style={{ width: `${adoptionRate}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
})

interface SubscriptionPieChartProps {
  data: Array<{ name: string; value: number }>
  title: string
  description: string
}

export const SubscriptionPieChart = memo(function SubscriptionPieChart({
  data,
  title,
  description,
}: SubscriptionPieChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
})

interface RevenueByPlanChartProps {
  data: Array<{ name: string; revenue: number; count: number }>
}

export const RevenueByPlanChart = memo(function RevenueByPlanChart({ data }: RevenueByPlanChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Umsatz nach Plan</CardTitle>
        <CardDescription>Verteilung nach Abonnement-Typ</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="revenue" fill="#3b82f6" name="Umsatz (€)" />
            <Bar dataKey="count" fill="#10b981" name="Anzahl" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
})

interface TrafficSourcesChartProps {
  deviceData: Array<{ name: string; value: number }>
  referrerData: Array<{ name: string; value: number }>
}

export const TrafficSourcesCharts = memo(function TrafficSourcesCharts({
  deviceData,
  referrerData,
}: TrafficSourcesChartProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Geräte</CardTitle>
          <CardDescription>Verteilung nach Gerätetyp</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={deviceData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {deviceData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Referrer</CardTitle>
          <CardDescription>Herkunft der Besucher</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={referrerData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={150} />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" name="Besuche" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
})

interface GrowthMetricsCardsProps {
  growthRate: number
  churnRate: number
  ltv: number
  dateRange: string
}

export const GrowthMetricsCards = memo(function GrowthMetricsCards({
  growthRate,
  churnRate,
  ltv,
  dateRange,
}: GrowthMetricsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Wachstumsrate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">+{growthRate}%</div>
          <p className="text-sm text-muted-foreground mt-1">In den letzten {dateRange} Tagen</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Churn Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-orange-600">{churnRate}%</div>
          <p className="text-sm text-muted-foreground mt-1">Abonnement-Kündigungen</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>LTV (Customer Lifetime Value)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">€{ltv}</div>
          <p className="text-sm text-muted-foreground mt-1">Durchschnittlicher Kundenwert</p>
        </CardContent>
      </Card>
    </div>
  )
})
