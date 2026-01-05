"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts"
import { useTranslation } from "@/contexts/translation-context"
import { usePractice } from "@/contexts/practice-context"
import { Loader2 } from "lucide-react"

interface CustomAnalyticsChartProps {
  title: string
  description?: string
  chartType: "area" | "line" | "bar" | "pie"
  parameterIds: string[]
}

interface ChartDataPoint {
  date: string
  [key: string]: string | number | null
}

export function CustomAnalyticsChart({ title, description, chartType, parameterIds }: CustomAnalyticsChartProps) {
  const { t } = useTranslation()
  const { currentPractice } = usePractice()
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [parameters, setParameters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      if (!currentPractice?.id || !parameterIds.length) {
        setLoading(false)
        return
      }

      try {
        console.log("[v0] Fetching parameters for chart:", parameterIds)

        // Fetch parameter details
        const paramsResponse = await fetch(`/api/practices/${currentPractice.id}/parameters`)
        const paramsData = await paramsResponse.json()
        const allParams = Array.isArray(paramsData) ? paramsData : paramsData.parameters || []

        console.log("[v0] Fetched parameters:", allParams.length)

        const selectedParams = allParams.filter((p: any) => parameterIds.includes(p.id))
        console.log(
          "[v0] Selected parameters for chart:",
          selectedParams.length,
          selectedParams.map((p: any) => p.name),
        )
        setParameters(selectedParams)

        // Fetch parameter values for each selected parameter
        const valuesPromises = parameterIds.map((paramId) =>
          fetch(`/api/practices/${currentPractice.id}/parameter-values?parameterId=${paramId}`).then((r) => r.json()),
        )
        const valuesResults = await Promise.all(valuesPromises)

        console.log(
          "[v0] Fetched values for all parameters:",
          valuesResults.map((v) => v.length),
        )

        // Combine data from all parameters
        const dataMap = new Map<string, ChartDataPoint>()

        valuesResults.forEach((values, index) => {
          const param = selectedParams[index]
          if (!param) {
            console.log("[v0] No parameter found for index:", index)
            return
          }

          const valuesArray = Array.isArray(values) ? values : []
          console.log("[v0] Processing values for parameter:", param.name, "count:", valuesArray.length)

          valuesArray.forEach((value: any) => {
            console.log("[v0] Processing value:", {
              parameter: param.name,
              raw_date: value.recorded_date || value.date,
              value: value.value,
            })

            const dateKey = new Date(value.recorded_date || value.date).toLocaleDateString("de-DE", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })

            if (!dataMap.has(dateKey)) {
              dataMap.set(dateKey, { date: dateKey })
            }

            const dataPoint = dataMap.get(dateKey)!
            const currentValue = dataPoint[param.name] || 0
            const newValue = Number.parseFloat(value.value) || 0
            dataPoint[param.name] = (currentValue as number) + newValue

            console.log("[v0] Updated data point for date:", dateKey, dataPoint)
          })
        })

        // Convert map to array and sort by date
        const sortedData = Array.from(dataMap.values()).sort((a, b) => {
          const parseDate = (dateStr: string) => {
            const [day, month, year] = dateStr.split(/[.\s]+/)
            const monthMap: Record<string, string> = {
              Jan: "01",
              Feb: "02",
              Mär: "03",
              Apr: "04",
              Mai: "05",
              Jun: "06",
              Jul: "07",
              Aug: "08",
              Sep: "09",
              Okt: "10",
              Nov: "11",
              Dez: "12",
            }
            return new Date(`${year}-${monthMap[month] || month}-${day.padStart(2, "0")}`)
          }
          return parseDate(a.date).getTime() - parseDate(b.date).getTime()
        })

        // For each parameter, fill missing dates with null so lines stay connected
        const allDates = sortedData.map((d) => d.date)
        const filledData = sortedData.map((dataPoint) => {
          const filled = { ...dataPoint }
          selectedParams.forEach((param) => {
            // If parameter doesn't have a value for this date, set it to null
            // This allows connectNulls to draw continuous lines
            if (!(param.name in filled)) {
              filled[param.name] = null
            }
          })
          return filled
        })

        setChartData(filledData)
        console.log("[v0] Chart data prepared:", filledData.length, "data points with filled gaps")
      } catch (error) {
        console.error("[v0] Failed to fetch chart data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [currentPractice?.id, parameterIds])

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

  const chartConfig = parameters.reduce(
    (acc, param, index) => {
      acc[param.name] = {
        label: param.name,
        color: colors[index % colors.length],
      }
      return acc
    },
    {} as Record<string, { label: string; color: string }>,
  )

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (!chartData.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8 text-muted-foreground">
          {t("analytics.noData", "Keine Daten verfügbar")}
        </CardContent>
      </Card>
    )
  }

  const renderChart = () => {
    switch (chartType) {
      case "area":
        return (
          <ChartContainer config={chartConfig}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} interval={0} />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              {parameters.map((param, index) => (
                <Area
                  key={param.id}
                  type="monotone"
                  dataKey={param.name}
                  stroke={colors[index % colors.length]}
                  fill={colors[index % colors.length]}
                  fillOpacity={0.6}
                  connectNulls={true}
                />
              ))}
            </AreaChart>
          </ChartContainer>
        )

      case "line":
        return (
          <ChartContainer config={chartConfig}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} interval={0} />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              {parameters.map((param, index) => (
                <Line
                  key={param.id}
                  type="monotone"
                  dataKey={param.name}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  connectNulls={true}
                />
              ))}
            </LineChart>
          </ChartContainer>
        )

      case "bar":
        return (
          <ChartContainer config={chartConfig}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} interval={0} />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              {parameters.map((param, index) => (
                <Bar key={param.id} dataKey={param.name} fill={colors[index % colors.length]} />
              ))}
            </BarChart>
          </ChartContainer>
        )

      case "pie":
        // For pie chart, use the latest data point
        const latestData = chartData[chartData.length - 1]
        const pieData = parameters.map((param, index) => ({
          name: param.name,
          value: latestData[param.name] || 0,
          fill: colors[index % colors.length],
        }))

        return (
          <ChartContainer config={chartConfig}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
            </PieChart>
          </ChartContainer>
        )

      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{renderChart()}</CardContent>
    </Card>
  )
}

export default CustomAnalyticsChart
