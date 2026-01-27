import { AreaChart, LineChart, PieChart, BarChart3 } from "lucide-react"

export interface AnalyticsTab {
  id: string
  name: string
  order: number
  enabled: boolean
}

export interface AnalyticsItem {
  id: string
  title: string
  component: string
  enabled: boolean
  order: number
  category: "overview" | "performance" | "charts"
  description: string
  chartType: "area" | "line" | "pie" | "bar"
  selectedParameters?: string[]
  displayIn: "analytics" | "dashboard" | "both"
  tabIds?: string[]
}

export const chartTypeIcons = {
  area: AreaChart,
  line: LineChart,
  pie: PieChart,
  bar: BarChart3,
}

export const getChartTypeLabel = (chartType: "area" | "line" | "pie" | "bar", t: (key: string, fallback: string) => string) => {
  const labels = {
    area: t("analytics.chartType.area", "Fläche"),
    line: t("analytics.chartType.line", "Linie"),
    pie: t("analytics.chartType.pie", "Kreis"),
    bar: t("analytics.chartType.bar", "Balken"),
  }
  return labels[chartType]
}

export const categoryLabels = {
  overview: "Übersicht",
  performance: "Leistung",
  charts: "Diagramme",
}

export const categoryColors = {
  overview: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  performance: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  charts: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
}
