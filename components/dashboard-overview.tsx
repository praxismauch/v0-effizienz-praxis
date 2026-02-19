"use client"

import { useMemo } from "react"
import { Sparkles, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  DashboardEditorDialog,
  DEFAULT_ORDER,
} from "./dashboard-editor-dialog"
import { DashboardEditMode } from "./dashboard/dashboard-edit-mode"
import { usePractice } from "@/contexts/practice-context"
import { useAiEnabled } from "@/lib/hooks/use-ai-enabled"
import { PageHeader } from "@/components/page-layout"
import { useDashboardOverview, type DashboardInitialData } from "@/hooks/use-dashboard-overview"
import { useDashboardWidgets, resolveWidgets } from "@/components/dashboard/render-widget"

interface DashboardOverviewProps {
  practiceId: string
  userId: string
  initialData?: DashboardInitialData | null
}

export function DashboardOverview({ practiceId, userId, initialData }: DashboardOverviewProps) {
  const { currentPractice } = usePractice()
  const { isEnabled } = useAiEnabled()

  const {
    stats,
    loading,
    dashboardConfig,
    cockpitCardSettings,
    isEditorOpen,
    setIsEditorOpen,
    isEditMode,
    setIsEditMode,
    fetchDashboardData,
    handleSaveConfig,
    handleEditModeSave,
  } = useDashboardOverview({ practiceId, userId, initialData })

  const { renderWidget, orderedWidgets, getColumnSpanForEdit } = useDashboardWidgets({
    dashboardConfig,
    stats,
    cockpitCardSettings,
    practiceId,
    userId,
    currentPractice,
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Keine Dashboard-Daten verfügbar</p>
          <Button onClick={fetchDashboardData}>Erneut laden</Button>
        </div>
      </div>
    )
  }

  // dashboardConfig may be { widgets: WidgetConfig } (from hook) or flat WidgetConfig
  const currentWidgets = resolveWidgets(dashboardConfig)
  const currentOrder = currentWidgets?.widgetOrder || DEFAULT_ORDER
  const currentLinebreaks = currentWidgets?.linebreaks || []

  if (isEditMode) {
    return (
      <div className="space-y-6 max-w-full">
        <DashboardEditMode
          config={currentWidgets!}
          widgetOrder={Array.isArray(currentOrder) ? currentOrder : DEFAULT_ORDER}
          linebreaks={currentLinebreaks}
          onSave={handleEditModeSave}
          onCancel={() => setIsEditMode(false)}
          renderWidgetPreview={(id) => renderWidget(id, true)}
          getColumnSpan={getColumnSpanForEdit}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-full">
      <PageHeader
        title="Cockpit"
        subtitle="Willkommen zurück! Hier ist ein 360-Grad-Überblick über Ihre Praxis."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsEditMode(true)} className="gap-2">
              <Pencil className="h-4 w-4" />
              Cockpit bearbeiten
            </Button>
            <Link href={isEnabled ? "/analysis" : "#"}>
              <Button size="sm" variant="outline" disabled={!isEnabled} className="gap-2 bg-transparent">
                <Sparkles className="h-4 w-4" />
                KI-Analyse starten
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 min-w-0 auto-rows-min">{orderedWidgets}</div>

      <DashboardEditorDialog
        open={isEditorOpen}
        onOpenChange={setIsEditorOpen}
        config={dashboardConfig}
        onSave={handleSaveConfig}
      />
    </div>
  )
}

export default DashboardOverview
