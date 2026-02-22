"use client"

import { AnalyticsOverview } from "@/components/analytics-overview"
import { PerformanceMetrics } from "@/components/performance-metrics"
import { KpiTrendsChart } from "@/components/kpi-trends-chart"
import { CustomAnalyticsChart } from "@/components/custom-analytics-chart"
import { SickDaysChart } from "@/components/sick-days-chart"
import {
  RevenueMonthlyChart,
  PatientFlowChart,
  AppointmentAnalysisChart,
  CostBreakdownChart,
  TeamWorkloadChart,
  WaitTimeChart,
  TreatmentMixChart,
  MonthlyComparisonChart,
  CancellationRateChart,
  NewVsReturningChart,
  RevenuePerDoctorChart,
  SeasonalPatternsChart,
  InsuranceMixChart,
  EmployeeAbsenceChart,
  PatientSatisfactionChart,
  CapacityUtilizationChart,
} from "./practice-charts"
import { Button } from "@/components/ui/button"
import { Star, StarOff, LayoutDashboard, Trash2 } from "lucide-react"
import type { SystemDiagram } from "./types"

interface DiagramCardProps {
  diagram: SystemDiagram
  isCustom?: boolean
  onToggleFavorite: (id: string, isCustom: boolean) => void
  onToggleDashboard: (id: string, isCustom: boolean) => void
  onDelete?: (id: string) => void
}

function renderDiagram(diagram: SystemDiagram) {
  switch (diagram.component) {
    case "AnalyticsOverview":
      return <AnalyticsOverview key={diagram.id} />
    case "PerformanceMetrics":
      return <PerformanceMetrics key={diagram.id} />
    case "KpiTrendsChart":
      return <KpiTrendsChart key={diagram.id} />
    case "SickDaysChart":
      return <SickDaysChart key={diagram.id} />
    case "RevenueMonthlyChart":
      return <RevenueMonthlyChart key={diagram.id} />
    case "PatientFlowChart":
      return <PatientFlowChart key={diagram.id} />
    case "AppointmentAnalysisChart":
      return <AppointmentAnalysisChart key={diagram.id} />
    case "CostBreakdownChart":
      return <CostBreakdownChart key={diagram.id} />
    case "TeamWorkloadChart":
      return <TeamWorkloadChart key={diagram.id} />
    case "WaitTimeChart":
      return <WaitTimeChart key={diagram.id} />
    case "TreatmentMixChart":
      return <TreatmentMixChart key={diagram.id} />
    case "MonthlyComparisonChart":
      return <MonthlyComparisonChart key={diagram.id} />
    case "CancellationRateChart":
      return <CancellationRateChart key={diagram.id} />
    case "NewVsReturningChart":
      return <NewVsReturningChart key={diagram.id} />
    case "RevenuePerDoctorChart":
      return <RevenuePerDoctorChart key={diagram.id} />
    case "SeasonalPatternsChart":
      return <SeasonalPatternsChart key={diagram.id} />
    case "InsuranceMixChart":
      return <InsuranceMixChart key={diagram.id} />
    case "EmployeeAbsenceChart":
      return <EmployeeAbsenceChart key={diagram.id} />
    case "PatientSatisfactionChart":
      return <PatientSatisfactionChart key={diagram.id} />
    case "CapacityUtilizationChart":
      return <CapacityUtilizationChart key={diagram.id} />
    case "CustomChart":
      return (
        <CustomAnalyticsChart
          key={diagram.id}
          title={diagram.title}
          description={diagram.description}
          chartType={diagram.chartType || "line"}
          parameterIds={diagram.selectedParameters || []}
        />
      )
    default:
      return null
  }
}

export function DiagramCard({ diagram, isCustom = false, onToggleFavorite, onToggleDashboard, onDelete }: DiagramCardProps) {
  const rendered = renderDiagram(diagram)

  if (!rendered) {
    return (
      <div className="border rounded-lg p-6 text-center text-muted-foreground">
        <p>Diagramm konnte nicht geladen werden: {diagram.title}</p>
      </div>
    )
  }

  return (
    <div className="relative group min-h-[200px]">
      <div className="absolute top-4 right-4 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant={diagram.isFavorite ? "default" : "secondary"}
          size="sm"
          onClick={() => onToggleFavorite(diagram.id, isCustom)}
          title={diagram.isFavorite ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
        >
          {diagram.isFavorite ? <Star className="h-4 w-4 fill-current" /> : <StarOff className="h-4 w-4" />}
        </Button>
        <Button
          variant={diagram.showOnDashboard ? "default" : "secondary"}
          size="sm"
          onClick={() => onToggleDashboard(diagram.id, isCustom)}
          title={diagram.showOnDashboard ? "Vom Dashboard entfernen" : "Zum Dashboard hinzufügen"}
        >
          <LayoutDashboard className="h-4 w-4" />
        </Button>
        {isCustom && onDelete && (
          <Button variant="destructive" size="sm" onClick={() => onDelete(diagram.id)} title="Diagramm löschen">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      {rendered}
    </div>
  )
}
