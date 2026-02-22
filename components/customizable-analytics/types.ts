export type DiagramComponent =
  | "AnalyticsOverview"
  | "PerformanceMetrics"
  | "KpiTrendsChart"
  | "CustomChart"
  | "SickDaysChart"
  | "RevenueMonthlyChart"
  | "PatientFlowChart"
  | "AppointmentAnalysisChart"
  | "CostBreakdownChart"
  | "TeamWorkloadChart"
  | "WaitTimeChart"
  | "TreatmentMixChart"
  | "MonthlyComparisonChart"
  | "CancellationRateChart"
  | "NewVsReturningChart"
  | "RevenuePerDoctorChart"
  | "SeasonalPatternsChart"
  | "InsuranceMixChart"
  | "EmployeeAbsenceChart"
  | "PatientSatisfactionChart"
  | "CapacityUtilizationChart"

export interface SystemDiagram {
  id: string
  title: string
  description: string
  component: DiagramComponent
  category: "overview" | "performance" | "trends" | "custom" | "financial" | "patients" | "team" | "operations"
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
    id: "revenue-monthly",
    title: "Umsatzentwicklung",
    description: "Monatliche Umsatzentwicklung mit Vorjahresvergleich und Trendlinie",
    component: "RevenueMonthlyChart",
    category: "financial",
    isFavorite: true,
    showOnDashboard: true,
  },
  {
    id: "patient-flow",
    title: "Patientenaufkommen",
    description: "Tages- und Wochenverlauf der Patientenfrequenz",
    component: "PatientFlowChart",
    category: "patients",
    isFavorite: true,
    showOnDashboard: true,
  },
  {
    id: "appointment-analysis",
    title: "Terminauslastung",
    description: "Terminslots vs. tatsächliche Termine und Auslastungsgrad",
    component: "AppointmentAnalysisChart",
    category: "operations",
    isFavorite: false,
    showOnDashboard: false,
  },
  {
    id: "cost-breakdown",
    title: "Kostenstruktur",
    description: "Aufschlüsselung der Praxiskosten nach Kategorien",
    component: "CostBreakdownChart",
    category: "financial",
    isFavorite: false,
    showOnDashboard: false,
  },
  {
    id: "team-workload",
    title: "Team-Auslastung",
    description: "Arbeitsbelastung und Aufgabenverteilung im Team",
    component: "TeamWorkloadChart",
    category: "team",
    isFavorite: false,
    showOnDashboard: false,
  },
  {
    id: "wait-time",
    title: "Wartezeiten-Analyse",
    description: "Durchschnittliche Wartezeiten nach Tageszeit und Wochentag",
    component: "WaitTimeChart",
    category: "operations",
    isFavorite: false,
    showOnDashboard: false,
  },
  {
    id: "treatment-mix",
    title: "Leistungsmix",
    description: "Verteilung der erbrachten Leistungen nach Art und Vergütung",
    component: "TreatmentMixChart",
    category: "performance",
    isFavorite: false,
    showOnDashboard: false,
  },
  {
    id: "monthly-comparison",
    title: "Monatsvergleich",
    description: "Kennzahlen-Vergleich der letzten 12 Monate",
    component: "MonthlyComparisonChart",
    category: "overview",
    isFavorite: true,
    showOnDashboard: false,
  },
  {
    id: "cancellation-rate",
    title: "Absage-Quote",
    description: "Terminabsagen und No-Shows im Zeitverlauf",
    component: "CancellationRateChart",
    category: "operations",
    isFavorite: false,
    showOnDashboard: false,
  },
  {
    id: "new-vs-returning",
    title: "Neue vs. Bestandspatienten",
    description: "Verhältnis Neupatientengewinnung zu Bestandspatienten",
    component: "NewVsReturningChart",
    category: "patients",
    isFavorite: false,
    showOnDashboard: false,
  },
  {
    id: "revenue-per-doctor",
    title: "Umsatz pro Behandler",
    description: "Umsatzverteilung nach Behandler mit Durchschnittswerten",
    component: "RevenuePerDoctorChart",
    category: "financial",
    isFavorite: false,
    showOnDashboard: false,
  },
  {
    id: "seasonal-patterns",
    title: "Saisonale Muster",
    description: "Erkennbare Muster im Patientenaufkommen über das Jahr",
    component: "SeasonalPatternsChart",
    category: "patients",
    isFavorite: false,
    showOnDashboard: false,
  },
  {
    id: "insurance-mix",
    title: "Kassenart-Verteilung",
    description: "Verteilung GKV, PKV und Selbstzahler mit Umsatzanteilen",
    component: "InsuranceMixChart",
    category: "financial",
    isFavorite: false,
    showOnDashboard: false,
  },
  {
    id: "employee-absence",
    title: "Abwesenheiten & Kranktage",
    description: "Krankheits- und Urlaubstage nach Mitarbeiter und Monat",
    component: "EmployeeAbsenceChart",
    category: "team",
    isFavorite: false,
    showOnDashboard: false,
  },
  {
    id: "patient-satisfaction",
    title: "Patientenzufriedenheit",
    description: "Bewertungsverlauf und Zufriedenheitsindex über alle Plattformen",
    component: "PatientSatisfactionChart",
    category: "patients",
    isFavorite: false,
    showOnDashboard: false,
  },
  {
    id: "capacity-utilization",
    title: "Kapazitätsauslastung",
    description: "Raumauslastung und Gerätenutzung nach Tageszeit",
    component: "CapacityUtilizationChart",
    category: "operations",
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
