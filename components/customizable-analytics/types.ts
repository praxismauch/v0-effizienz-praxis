export interface SystemDiagram {
  id: string
  title: string
  description: string
  component: "AnalyticsOverview" | "PerformanceMetrics" | "KpiTrendsChart" | "CustomChart" | "SickDaysChart"
  category: "overview" | "performance" | "trends" | "custom"
  isFavorite: boolean
  showOnDashboard: boolean
  chartType?: "area" | "line" | "bar" | "pie"
  selectedParameters?: string[]
}

export interface DashboardTile {
  id: string
  title: string
  description: string
  type: "stat" | "chart" | "progress" | "list" | "info"
  color: "default" | "blue" | "green" | "yellow" | "red" | "purple"
  size: "small" | "medium" | "large"
  dataSource?: string
  value?: string
  unit?: string
  trend?: "up" | "down" | "neutral"
  trendValue?: string
  showOnDashboard: boolean
  chartType?: "line" | "bar" | "pie" | "area"
  parameterIds?: string[]
}

export const defaultSystemDiagrams: SystemDiagram[] = [
  {
    id: "analytics-overview",
    title: "Praxiswachstum & Übersicht",
    description: "Wachstumstrends, Aufgabenverteilung und Teamzufriedenheit",
    component: "AnalyticsOverview",
    category: "overview",
    isFavorite: false,
    showOnDashboard: false,
  },
  {
    id: "performance-metrics",
    title: "Leistungskennzahlen",
    description: "Effizienz- und Qualitätsmetriken der Praxis",
    component: "PerformanceMetrics",
    category: "performance",
    isFavorite: false,
    showOnDashboard: false,
  },
  {
    id: "kpi-trends",
    title: "KPI Trends",
    description: "Zeitliche Entwicklung Ihrer wichtigsten Kennzahlen",
    component: "KpiTrendsChart",
    category: "trends",
    isFavorite: false,
    showOnDashboard: false,
  },
  {
    id: "sick-days",
    title: "Kranktage Übersicht",
    description: "Verteilung der Kranktage nach Monat und Mitarbeiter",
    component: "SickDaysChart",
    category: "overview",
    isFavorite: false,
    showOnDashboard: false,
  },
]

export const defaultTiles: DashboardTile[] = [
  {
    id: "tile-patients",
    title: "Patienten heute",
    description: "Anzahl der Patienten fur heute",
    type: "stat",
    color: "blue",
    size: "small",
    value: "24",
    trend: "up",
    trendValue: "+12%",
    showOnDashboard: true,
  },
  {
    id: "tile-revenue",
    title: "Monatsumsatz",
    description: "Aktueller Monatsumsatz",
    type: "stat",
    color: "green",
    size: "small",
    value: "\u20AC45.230",
    trend: "up",
    trendValue: "+8%",
    showOnDashboard: true,
  },
  {
    id: "tile-tasks",
    title: "Offene Aufgaben",
    description: "Noch zu erledigende Aufgaben",
    type: "stat",
    color: "yellow",
    size: "small",
    value: "7",
    trend: "down",
    trendValue: "-3",
    showOnDashboard: false,
  },
]
