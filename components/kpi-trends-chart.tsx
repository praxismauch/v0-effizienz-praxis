"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"
import { usePractice } from "@/contexts/practice-context"
import { useTranslation } from "@/contexts/translation-context"
import { formatDateDE } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ParameterValue {
  id: string
  parameterId: string
  value: number
  date: string
  notes?: string
  interval?: "weekly" | "monthly" | "quarterly" | "yearly"
}

interface Parameter {
  id: string
  name: string
  interval?: "weekly" | "monthly" | "quarterly" | "yearly"
}

export function KpiTrendsChart() {
  const { currentPractice } = usePractice()
  const { t } = useTranslation()
  const [parameterValues, setParameterValues] = useState<ParameterValue[]>([])
  const [parameters, setParameters] = useState<Parameter[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedInterval, setSelectedInterval] = useState<"weekly" | "monthly">("monthly")

  useEffect(() => {
    const fetchData = async () => {
      if (!currentPractice?.id) return

      try {
        setIsLoading(true)

        const paramsResponse = await fetch(`/api/practices/${currentPractice.id}/parameters`)
        const paramsData = await paramsResponse.json()
        setParameters(paramsData.parameters || [])

        const valuesResponse = await fetch(`/api/practices/${currentPractice.id}/parameter-values`)
        const valuesData = await valuesResponse.json()

        const transformedValues = (Array.isArray(valuesData) ? valuesData : []).map((value: any) => ({
          ...value,
          value: Number(value.value),
          date: value.date || value.created_at || value.recorded_date,
        }))

        setParameterValues(transformedValues)
      } catch (error) {
        console.error("[v0] Error fetching KPI data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [currentPractice?.id])

  const processChartData = (interval: "weekly" | "monthly") => {
    const filteredValues = parameterValues.filter((v) => v.interval === interval)
    const filteredParams = parameters.filter((p) => p.interval === interval)

    // Group values by date
    const groupedByDate = filteredValues.reduce(
      (acc, value) => {
        const dateKey = formatDateDE(value.date, interval === "weekly" ? "yyyy-'W'ww" : "yyyy-MM")
        if (!acc[dateKey]) {
          acc[dateKey] = { date: dateKey, displayDate: "" }
        }

        const param = filteredParams.find((p) => p.id === value.parameterId)
        if (param) {
          acc[dateKey][param.name] = value.value
        }

        return acc
      },
      {} as Record<string, any>,
    )

    // Convert to array and sort by date
    const chartData = Object.values(groupedByDate)
      .map((item: any) => ({
        ...item,
        displayDate:
          interval === "weekly" ? `KW ${item.date.split("-W")[1]}` : formatDateDE(`${item.date}-01`, "MMM yyyy"),
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-12) // Show last 12 periods

    return { chartData, paramNames: filteredParams.map((p) => p.name) }
  }

  const { chartData, paramNames } = processChartData(selectedInterval)

  const colors = [
    "#3b82f6", // Vibrant Blue
    "#10b981", // Emerald Green
    "#f59e0b", // Amber Orange
    "#ef4444", // Red
    "#8b5cf6", // Purple
    "#ec4899", // Pink
    "#06b6d4", // Cyan
    "#f97316", // Orange
    "#14b8a6", // Teal
    "#a855f7", // Violet
    "#f43f5e", // Rose
    "#22c55e", // Green
  ]

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("kpi.trends.title", "KPI Trends")}</CardTitle>
          <CardDescription>{t("kpi.trends.loading", "Lade KPI-Daten...")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">{t("common.loading", "Lädt...")}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("kpi.trends.title", "KPI Trends")}</CardTitle>
        <CardDescription>{t("kpi.trends.description", "Entwicklung Ihrer Kennzahlen über Zeit")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedInterval} onValueChange={(v) => setSelectedInterval(v as "weekly" | "monthly")}>
          <TabsList className="mb-4">
            <TabsTrigger value="monthly">{t("kpi.month", "Monat")}</TabsTrigger>
            <TabsTrigger value="weekly">{t("kpi.week", "Woche")}</TabsTrigger>
          </TabsList>
          <TabsContent value={selectedInterval}>
            {chartData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-muted-foreground">
                  {t("kpi.trends.noData", "Keine Daten für diesen Zeitraum verfügbar")}
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="displayDate" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                    }}
                  />
                  <Legend />
                  {paramNames.map((name, index) => (
                    <Line
                      key={name}
                      type="monotone"
                      dataKey={name}
                      stroke={colors[index % colors.length]}
                      strokeWidth={2}
                      dot={{ fill: colors[index % colors.length] }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default KpiTrendsChart
