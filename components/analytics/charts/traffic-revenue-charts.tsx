"use client"

import { memo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts"

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]

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
            <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString("de-DE", { month: "short", day: "numeric" })} />
            <YAxis />
            <Tooltip labelFormatter={(value) => new Date(value).toLocaleDateString("de-DE")} />
            <Legend />
            <Line type="monotone" dataKey="views" stroke="#3b82f6" name="Aufrufe" strokeWidth={2} />
            <Line type="monotone" dataKey="uniqueVisitors" stroke="#10b981" name="Eindeutige Besucher" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
})

interface SubscriptionPieChartProps {
  data: Array<{ name: string; value: number }>
  title: string
  description: string
}

export const SubscriptionPieChart = memo(function SubscriptionPieChart({ data, title, description }: SubscriptionPieChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={80} fill="#8884d8" dataKey="value">
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
            <Bar dataKey="revenue" fill="#3b82f6" name="Umsatz" />
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

export const TrafficSourcesCharts = memo(function TrafficSourcesCharts({ deviceData, referrerData }: TrafficSourcesChartProps) {
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
              <Pie data={deviceData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={80} fill="#8884d8" dataKey="value">
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
