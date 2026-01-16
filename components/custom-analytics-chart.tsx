"use client"

import { useMemo } from "react"
import useSWR from "swr"
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
import { swrFetcher } from "@/lib/swr-fetcher"
import { SWR_KEYS } from "@/lib/swr-keys"

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

  const { data: paramsData } = useSWR(currentPractice?.id ? SWR_KEYS.parameters(currentPractice.id) : null, swrFetcher)

  const parameterValuesKeys = parameterIds.map((paramId) =>
    currentPractice?.id ? SWR_KEYS.parameterValues(currentPractice.id, paramId) : null,
  )

  // Fetch all parameter values in parallel using individual SWR hooks
  const { data: valuesData0 } = useSWR(parameterValuesKeys[0], swrFetcher)
  const { data: valuesData1 } = useSWR(parameterValuesKeys[1], swrFetcher)
  const { data: valuesData2 } = useSWR(parameterValuesKeys[2], swrFetcher)
  const { data: valuesData3 } = useSWR(parameterValuesKeys[3], swrFetcher)
  const { data: valuesData4 } = useSWR(parameterValuesKeys[4], swrFetcher)

  const valuesResults = [valuesData0, valuesData1, valuesData2, valuesData3, valuesData4].filter(Boolean)

  const allParams = Array.isArray(paramsData) ? paramsData : paramsData?.parameters || []
  const selectedParams = allParams.filter((p: any) => parameterIds.includes(p.id))

  const loading = !paramsData || (parameterIds.length > 0 && valuesResults.length < parameterIds.length)

  const chartData = useMemo(() => {
    if (!selectedParams.length || !valuesResults.length) return []

    const dataMap = new Map<string, ChartDataPoint>()

    valuesResults.forEach((values, index) => {
      const param = selectedParams[index]
      if (!param) return

      const valuesArray = Array.isArray(values) ? values : []

      valuesArray.forEach((value: any) => {
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

    // Fill missing dates with null
    const filledData = sortedData.map((dataPoint) => {
      const filled = { ...dataPoint }
      selectedParams.forEach((param: any) => {
        if (!(param.name in filled)) {
          filled[param.name] = null
        }
      })
      return filled
    })

    return filledData
  }, [selectedParams, valuesResults])

  const colors = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
    "#f97316",
    "#14b8a6",
    "#a855f7",
    "#f43f5e",
    "#22c55e",
  ]

  const chartConfig = selectedParams.reduce(
    (acc: Record<string, { label: string; color: string }>, param: any, index: number) => {
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
              {selectedParams.map((param: any, index: number) => (
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
              {selectedParams.map((param: any, index: number) => (
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
              {selectedParams.map((param: any, index: number) => (
                <Bar key={param.id} dataKey={param.name} fill={colors[index % colors.length]} />
              ))}
            </BarChart>
          </ChartContainer>
        )

      case "pie":
        const latestData = chartData[chartData.length - 1]
        const pieData = selectedParams.map((param: any, index: number) => ({
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
