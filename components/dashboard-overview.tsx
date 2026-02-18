"use client"

import type React from "react"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import {
  Users,
  Target,
  Workflow,
  FileText,
  Settings,
  Briefcase,
  CheckSquare,
  Calendar,
  Sparkles,
  Pencil,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  DashboardEditorDialog,
  type DashboardConfig,
  type WidgetConfig,
  DEFAULT_ORDER,
  isLinebreakWidget,
  WIDGET_DEFINITIONS,
} from "./dashboard-editor-dialog"
import { DashboardEditMode } from "./dashboard/dashboard-edit-mode"
import { useToast } from "@/hooks/use-toast"
import { usePractice } from "@/contexts/practice-context"
import { useAiEnabled } from "@/lib/hooks/use-ai-enabled"
import { GoogleReviewsWidget } from "./google-reviews-widget"
import { JournalActionItemsCard } from "@/components/dashboard/insights-action-items-card"
import { BulletinWidget } from "@/components/dashboard/bulletin-widget"
import { TimeTrackingWidget } from "@/components/dashboard/time-tracking-widget"
import { useTranslation } from "@/contexts/translation-context"
import { PageHeader } from "@/components/page-layout"
import {
  StatCard,
  WeeklyTasksWidget,
  TodayScheduleWidget,
  ActivityChartWidget,
  KPIWidget,
  RecentActivitiesWidget,
} from "@/components/dashboard"

interface DashboardStats {
  teamMembers: number
  activeGoals: number
  workflows: number
  documents: number
  teamMembersTrend: number
  goalsTrend: number
  workflowsTrend: number
  documentsTrend: number
  activityData: Array<{ date: string; value: number }>
  kpiScore?: number
  kpiTrend?: number
  openPositions?: number
  applications?: number
  recruitingTrend?: number
  activeCandidates?: number
  candidatesTrend?: number
  openTasks?: number
  tasksTrend?: number
  todayAppointments?: number
  appointmentsTrend?: number
  drafts?: number
  draftsTrend?: number
  weeklyTasksData?: Array<{ day: string; completed: number; pending: number }>
  todayScheduleData?: Array<{ time: string; appointments: number }>
  recentActivities?: Array<{ id: string; title: string; description: string; timestamp: string; priority: string }>
  filteredTodos?: number
}

interface DashboardOverviewProps {
  practiceId: string
  userId: string
}

interface CockpitCardSetting {
  widget_id: string
  column_span: number
  row_span: number
  min_height: string
  card_style?: {
    variant: string
    showBorder: boolean
    showShadow: boolean
  }
}

const DEFAULT_WIDGETS = {
  showTeamMembers: false,
  showGoals: true,
  showWorkflows: true,
  showDocuments: false,
  showActivityChart: true,
  showQuickActions: true,
  showKPIs: true,
  showRecruiting: false,
  showActiveCandidates: true,
  showOpenTasks: true,
  showTodayAppointments: true,
  showDrafts: false,
  showWeeklyTasks: true,
  showTodaySchedule: true,
  showRecentActivities: true,
  showGoogleReviews: true,
  showJournalActions: true,
  showBulletin: true,
  showTimeTracking: true,
  showTodos: true,
  todosFilterWichtig: undefined,
  todosFilterDringend: undefined,
  todosFilterPriority: undefined,
  widgetOrder: DEFAULT_ORDER,
}

interface DashboardOverviewPropsExtended extends DashboardOverviewProps {
  initialData?: {
    totalTeams: number
    totalMembers: number
    activeTodos: number
    completedTodos: number
    upcomingEvents: number
  } | null
}

export function DashboardOverview({ practiceId, userId, initialData }: DashboardOverviewPropsExtended) {
  const { toast } = useToast()
  const { currentPractice } = usePractice()
  const { isEnabled } = useAiEnabled()
  const { t } = useTranslation()
  
  // Use initialData from server if available, otherwise fetch client-side
  const [stats, setStats] = useState<DashboardStats | null>(
    initialData ? {
      teamMembers: initialData.totalMembers || 0,
      activeGoals: initialData.activeTodos || 0,
      workflows: 0,
      documents: 0,
      teamMembersTrend: 0,
      goalsTrend: 0,
      workflowsTrend: 0,
      documentsTrend: 0,
      activityData: [],
      openTasks: initialData.activeTodos || 0,
      todayAppointments: initialData.upcomingEvents || 0,
    } : null
  )
  const [loading, setLoading] = useState(!initialData)
  const [error, setError] = useState<string | null>(null)
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig>({
    widgets: DEFAULT_WIDGETS,
  })
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [cockpitCardSettings, setCockpitCardSettings] = useState<CockpitCardSetting[]>([])

  const hasLoadedRef = useRef(!!initialData)
  const loadingPracticeIdRef = useRef<string | null>(initialData ? practiceId : null)

  useEffect(() => {
    const fetchCockpitSettings = async () => {
      try {
        const response = await fetch("/api/cockpit-settings")
        if (response.ok) {
          const data = await response.json()
          setCockpitCardSettings(data.settings || [])
        }
      } catch (error) {
        console.error("Error fetching cockpit card settings:", error)
      }
    }
    fetchCockpitSettings()
  }, [])

  const fetchDashboardData = useCallback(async () => {
    // Get practice ID from context - should never be hardcoded
    if (!practiceId || practiceId === "undefined" || practiceId === "null" || practiceId === "0") {
      return
    }

    if (!userId) {
      return
    }

    if (loadingPracticeIdRef.current === practiceId && hasLoadedRef.current) {
      return
    }

    loadingPracticeIdRef.current = practiceId
    setLoading(true)
    setError(null)

    try {
      // Helper to safely fetch and parse JSON with rate limit handling
      const safeFetch = async <T = unknown>(url: string, fallback: T | null = null): Promise<T | null> => {
        try {
          const response = await fetch(url)
          if (!response.ok) {
            return fallback
          }
          const contentType = response.headers.get("content-type")
          if (!contentType || !contentType.includes("application/json")) {
            return fallback
          }
          const text = await response.text()
          if (text.startsWith("Too Many") || text.includes("rate limit")) {
            return fallback
          }
          return JSON.parse(text) as T
        } catch {
          return fallback
        }
      }

      // Fetch in batches with small delays to avoid rate limiting
      const preferences = await safeFetch(
        `/api/practices/${practiceId}/dashboard-preferences?userId=${userId}`,
        null,
      )

      // Small delay between batches
      await new Promise((resolve) => setTimeout(resolve, 100))

      const [statsData, activities] = await Promise.all([
        safeFetch(`/api/practices/${practiceId}/dashboard-stats`, null),
        safeFetch(`/api/dashboard/recent-activities?practiceId=${practiceId}&limit=5`, null),
      ])

      await new Promise((resolve) => setTimeout(resolve, 100))

      const documents = await safeFetch(`/api/practices/${practiceId}/documents?limit=5`, null)



      if (preferences?.config) {
        setDashboardConfig({
          widgets: {
            ...DEFAULT_WIDGETS,
            ...(preferences.config.widgets || {}),
          },
        })
      }

      setStats({
        teamMembers: statsData?.teamMembers || 0,
        activeGoals: statsData?.activeGoals || 0,
        workflows: statsData?.workflows || 0,
        documents: statsData?.documents || 0,
        teamMembersTrend: statsData?.teamMembersTrend || 0,
        goalsTrend: statsData?.goalsTrend || 0,
        workflowsTrend: statsData?.workflowsTrend || 0,
        documentsTrend: statsData?.documentsTrend || 0,
        activityData: statsData?.activityData || [],
        kpiScore: statsData?.kpiScore,
        kpiTrend: statsData?.kpiTrend,
        openPositions: statsData?.openPositions,
        applications: statsData?.applications,
        recruitingTrend: statsData?.recruitingTrend,
        activeCandidates: statsData?.activeCandidates,
        candidatesTrend: statsData?.candidatesTrend,
        openTasks: statsData?.openTasks,
        tasksTrend: statsData?.tasksTrend,
        todayAppointments: statsData?.todayAppointments,
        appointmentsTrend: statsData?.appointmentsTrend,
        drafts: statsData?.drafts,
        draftsTrend: statsData?.draftsTrend,
        weeklyTasksData: statsData?.weeklyTasksData,
        todayScheduleData: statsData?.todayScheduleData,
        recentActivities: activities?.activities || statsData?.recentActivities || [],
        filteredTodos: statsData?.filteredTodos,
      })

      hasLoadedRef.current = true
      console.log("[v0] Dashboard data loaded successfully")
    } catch (err) {
      console.error("[v0] Dashboard fetch error:", err)
      setError("Fehler beim Laden des Dashboards")
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (loadingPracticeIdRef.current !== practiceId) {
      hasLoadedRef.current = false
    }
    fetchDashboardData()
  }, [fetchDashboardData])

  const FULL_WIDTH_WIDGETS = new Set([
    "showBulletin",
    "showJournalActions",
  ])

  const getColumnSpanClass = (widgetId: string): string => {
    const widgets = dashboardConfig?.widgets || DEFAULT_WIDGETS
    // 1. User's per-widget override from the editor dialog (Breite buttons)
    const userSpan = widgets.columnSpans?.[widgetId]
    // 2. Super-admin default from cockpit-settings API
    const setting = cockpitCardSettings.find((s) => s.widget_id === widgetId)
    const adminSpan = setting?.column_span
    // 3. Built-in default
    const defaultSpan = FULL_WIDTH_WIDGETS.has(widgetId) ? 5 : 1
    // User span > 0 takes priority, then admin, then default
    const colSpan = (userSpan && userSpan > 0) ? userSpan : (adminSpan || defaultSpan)

    switch (colSpan) {
      case 2:
        return "md:col-span-2"
      case 3:
        return "md:col-span-3"
      case 4:
        return "md:col-span-4"
      case 5:
        return "col-span-full"
      default:
        return ""
    }
  }

  const getRowSpanClass = (widgetId: string): string => {
    const setting = cockpitCardSettings.find((s) => s.widget_id === widgetId)
    const rowSpan = setting?.row_span || 1

    return rowSpan === 2 ? "md:row-span-2" : ""
  }

  const getMinHeightStyle = (widgetId: string): React.CSSProperties => {
    const setting = cockpitCardSettings.find((s) => s.widget_id === widgetId)
    if (setting?.min_height && setting.min_height !== "auto") {
      return { minHeight: setting.min_height }
    }
    return {}
  }

  const renderWidget = useCallback(
    (widgetId: string) => {
      const widgets = dashboardConfig?.widgets || DEFAULT_WIDGETS

      if (isLinebreakWidget(widgetId)) {
        return (
          <div key={widgetId} className="col-span-full">
            <div className="w-full h-px bg-border my-4" />
          </div>
        )
      }

      const wrapWithSpan = (content: React.ReactNode, id: string) => (
        <div key={id} className={`${getColumnSpanClass(id)} ${getRowSpanClass(id)}`} style={getMinHeightStyle(id)}>
          {content}
        </div>
      )

      switch (widgetId) {
        case "showTeamMembers":
          if (!widgets.showTeamMembers || !stats) return null
          return wrapWithSpan(
            <StatCard
              key="team"
              title={t("Team-Mitglieder", "Team-Mitglieder")}
              value={stats.teamMembers}
              trend={stats.teamMembersTrend}
              icon={Users}
              color="blue"
              href="/team"
            />,
            widgetId,
          )
        case "showGoals":
          if (!widgets.showGoals || !stats) return null
          return wrapWithSpan(
            <StatCard
              key="goals"
              title={t("Aktive Ziele", "Aktive Ziele")}
              value={stats.activeGoals}
              trend={stats.goalsTrend}
              icon={Target}
              color="green"
              href="/goals"
            />,
            widgetId,
          )
        case "showWorkflows":
          if (!widgets.showWorkflows || !stats) return null
          return wrapWithSpan(
            <StatCard
              key="workflows"
              title={t("Workflows", "Workflows")}
              value={stats.workflows}
              trend={stats.workflowsTrend}
              icon={Workflow}
              color="purple"
              href="/workflows"
            />,
            widgetId,
          )
        case "showDocuments":
          if (!widgets.showDocuments || !stats) return null
          return wrapWithSpan(
            <StatCard
              key="documents"
              title={t("Dokumente", "Dokumente")}
              value={stats.documents}
              trend={stats.documentsTrend}
              icon={FileText}
              color="amber"
              href="/documents"
            />,
            widgetId,
          )
        case "showRecruiting":
          if (!widgets.showRecruiting || !stats || stats.openPositions === undefined) return null
          return wrapWithSpan(
            <StatCard
              key="recruiting"
              title={t("Offene Stellen", "Offene Stellen")}
              value={stats.openPositions || 0}
              trend={stats.recruitingTrend}
              icon={Briefcase}
              color="pink"
              href="/hiring"
              subtitle={`${stats.applications || 0} Bewerbungen`}
            />,
            widgetId,
          )
        case "showOpenTasks":
          if (!widgets.showOpenTasks || !stats || stats.openTasks === undefined) return null
          return wrapWithSpan(
            <StatCard
              key="openTasks"
              title={t("Offene Aufgaben", "Offene Aufgaben")}
              value={stats.openTasks}
              trend={stats.tasksTrend}
              icon={CheckSquare}
              color="orange"
              href="/todos"
            />,
            widgetId,
          )
        case "showTodayAppointments":
          if (!widgets.showTodayAppointments || !stats || stats.todayAppointments === undefined) return null
          return wrapWithSpan(
            <StatCard
              key="appointments"
              title={t("Termine heute", "Termine heute")}
              value={stats.todayAppointments}
              trend={stats.appointmentsTrend}
              icon={Calendar}
              color="blue"
              href="/calendar"
            />,
            widgetId,
          )
        case "showActiveCandidates":
          if (!widgets.showActiveCandidates || !stats || stats.activeCandidates === undefined) return null
          return wrapWithSpan(
            <StatCard
              key="candidates"
              title={t("Aktive Kandidaten", "Aktive Kandidaten")}
              value={stats.activeCandidates}
              trend={stats.candidatesTrend}
              icon={Users}
              color="green"
              href="/hiring"
            />,
            widgetId,
          )
        case "showDrafts":
          if (!widgets.showDrafts || !stats || stats.drafts === undefined) return null
          return wrapWithSpan(
            <StatCard
              key="drafts"
              title={t("Entwürfe", "Entwürfe")}
              value={stats.drafts}
              trend={stats.draftsTrend}
              icon={FileText}
              color="gray"
              href="/goals?tab=draft"
            />,
            widgetId,
          )
        case "showTodos":
          if (!widgets.showTodos || !stats || stats.filteredTodos === undefined) return null
          return wrapWithSpan(
            <StatCard
              key="filtered-todos"
              title={t("Gefilterte Aufgaben", "Gefilterte Aufgaben")}
              value={stats.filteredTodos}
              icon={CheckSquare}
              color="purple"
              href="/todos"
            />,
            widgetId,
          )
        case "showGoogleReviews":
          if (!widgets.showGoogleReviews || !currentPractice) return null
          return wrapWithSpan(
            <GoogleReviewsWidget
              key="google-reviews"
              practiceId={currentPractice.id}
              practiceName={currentPractice.name}
              practiceWebsiteUrl={currentPractice.website}
            />,
            widgetId,
          )

        case "showWeeklyTasks":
          if (!widgets.showWeeklyTasks || !stats?.weeklyTasksData) return null
          return wrapWithSpan(
            <WeeklyTasksWidget key="weekly-tasks" data={stats.weeklyTasksData} />,
            widgetId,
          )
        case "showTodaySchedule":
          if (!widgets.showTodaySchedule || !stats?.todayScheduleData) return null
          return wrapWithSpan(
            <TodayScheduleWidget key="today-schedule" data={stats.todayScheduleData} />,
            widgetId,
          )
        case "showActivityChart":
          if (!widgets.showActivityChart || !stats?.activityData) return null
          return wrapWithSpan(
            <ActivityChartWidget key="activity-chart" data={stats.activityData} />,
            widgetId,
          )
        case "showKPIs":
          if (!widgets.showKPIs || !stats) return null
          return wrapWithSpan(
            <KPIWidget key="kpis" kpiScore={stats.kpiScore} kpiTrend={stats.kpiTrend} />,
            widgetId,
          )
        case "showRecentActivities":
          if (!widgets.showRecentActivities || !stats?.recentActivities?.length) return null
          return wrapWithSpan(
            <RecentActivitiesWidget key="recent-activities" activities={stats.recentActivities} />,
            widgetId,
          )
        case "showJournalActions":
          if (widgets.showJournalActions === false || !practiceId) return null
          return wrapWithSpan(
            <JournalActionItemsCard key="journal-actions" practiceId={practiceId} className="col-span-full" />,
            widgetId,
          )
        case "showBulletin":
          if (widgets.showBulletin === false || !practiceId) return null
          return wrapWithSpan(
            <BulletinWidget key="bulletin" practiceId={practiceId} userId={userId} />,
            widgetId,
          )
        case "showTimeTracking":
          if (widgets.showTimeTracking === false || !practiceId || !userId) return null
          return wrapWithSpan(
            <TimeTrackingWidget key="time-tracking" practiceId={practiceId} userId={userId} />,
            widgetId,
          )
        case "showQuickActions":
          return null
        default:
          return null
      }
    },
    [
      dashboardConfig,
      stats,
      currentPractice,
      t,
      practiceId,
      userId,
      cockpitCardSettings,
    ],
  )

  const orderedWidgets = useMemo(() => {
    const widgets = dashboardConfig?.widgets || DEFAULT_WIDGETS
    const savedOrder = widgets.widgetOrder || DEFAULT_ORDER

    if (!Array.isArray(savedOrder)) {
      console.error("[v0] widgetOrder is not an array:", savedOrder)
      return []
    }

    // Ensure any new widget IDs from DEFAULT_ORDER are appended if missing from saved order
    const order = [...savedOrder]
    for (const id of DEFAULT_ORDER) {
      if (!order.includes(id)) {
        order.push(id)
      }
    }

    return order.map((id) => renderWidget(id)).filter(Boolean)
  }, [dashboardConfig, renderWidget])

  const getNumericColumnSpan = useCallback((widgetId: string): number => {
    const widgets = dashboardConfig?.widgets || DEFAULT_WIDGETS
    const userSpan = widgets.columnSpans?.[widgetId]
    const setting = cockpitCardSettings.find((s) => s.widget_id === widgetId)
    const adminSpan = setting?.column_span
    const defaultSpan = FULL_WIDTH_WIDGETS.has(widgetId) ? 5 : 1
    return (userSpan && userSpan > 0) ? userSpan : (adminSpan || defaultSpan)
  }, [dashboardConfig, cockpitCardSettings])

  const handleSaveConfig = useCallback(async (newConfig: { widgets: any }) => {
    const widgets = newConfig?.widgets
      ? (newConfig.widgets.widgets || newConfig.widgets)
      : DEFAULT_WIDGETS
    
    // Update local state immediately
    setDashboardConfig({ widgets })

    // Persist to database
    if (practiceId && userId) {
      try {
        const response = await fetch(`/api/practices/${practiceId}/dashboard-preferences`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ config: { widgets } }),
        })
        if (!response.ok) {
          console.error("Failed to save dashboard config:", await response.text())
          toast({
            title: "Fehler",
            description: "Dashboard-Einstellungen konnten nicht gespeichert werden.",
            variant: "destructive",
          })
        } else {
          toast({
            title: "Gespeichert",
            description: "Dashboard-Einstellungen wurden erfolgreich gespeichert.",
          })
        }
      } catch (err) {
        console.error("Error saving dashboard config:", err)
        toast({
          title: "Fehler",
          description: "Dashboard-Einstellungen konnten nicht gespeichert werden.",
          variant: "destructive",
        })
      }
    }
  }, [practiceId, userId, toast])

  const handleEditModeSave = useCallback((updatedWidgets: WidgetConfig) => {
    setIsEditMode(false)
    handleSaveConfig({ widgets: updatedWidgets })
  }, [handleSaveConfig])

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

  const currentWidgets = dashboardConfig?.widgets || DEFAULT_WIDGETS
  const currentOrder = currentWidgets.widgetOrder || DEFAULT_ORDER
  const currentLinebreaks = currentWidgets.linebreaks || []

  if (isEditMode) {
    return (
      <div className="space-y-6 max-w-full">
        <DashboardEditMode
          config={currentWidgets}
          widgetOrder={Array.isArray(currentOrder) ? currentOrder : DEFAULT_ORDER}
          linebreaks={currentLinebreaks}
          onSave={handleEditModeSave}
          onCancel={() => setIsEditMode(false)}
          renderWidgetPreview={renderWidget}
          getColumnSpan={getNumericColumnSpan}
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
