"use client"

import type React from "react"
import { useCallback, useMemo } from "react"
import {
  Users,
  Target,
  Workflow,
  FileText,
  Briefcase,
  CheckSquare,
  Calendar,
} from "lucide-react"
import {
  type DashboardConfig,
  type WidgetConfig,
  DEFAULT_ORDER,
  DEFAULT_ROW_SPANS,
  isLinebreakWidget,
} from "@/components/dashboard-editor-dialog"
import { GoogleReviewsWidget } from "@/components/google-reviews-widget"
import { JournalActionItemsCard } from "@/components/dashboard/insights-action-items-card"
import { BulletinWidget } from "@/components/dashboard/bulletin-widget"
import { TimeTrackingWidget } from "@/components/dashboard/time-tracking-widget"
import { useTranslation } from "@/contexts/translation-context"
import {
  StatCard,
  WeeklyTasksWidget,
  TodayScheduleWidget,
  ActivityChartWidget,
  KPIWidget,
  RecentActivitiesWidget,
} from "@/components/dashboard"
import type { DashboardStats, CockpitCardSetting } from "@/hooks/use-dashboard-overview"
import { DEFAULT_WIDGETS } from "@/hooks/use-dashboard-overview"

// ── Layout helpers ─────────────────────────────────────────────────────────────

export const FULL_WIDTH_WIDGETS = new Set(["showBulletin", "showJournalActions"])

// Safely resolve the flat WidgetConfig from either shape:
// - { widgets: WidgetConfig }  (wrapper from hook)
// - WidgetConfig               (flat, as typed)
export function resolveWidgets(cfg: any): WidgetConfig {
  if (!cfg) return DEFAULT_WIDGETS
  // If cfg has a nested `widgets` property that looks like a WidgetConfig
  if (cfg.widgets && typeof cfg.widgets === "object" && ("showGoals" in cfg.widgets || "widgetOrder" in cfg.widgets)) {
    return cfg.widgets
  }
  // cfg is already a flat WidgetConfig
  if ("showGoals" in cfg || "widgetOrder" in cfg) {
    return cfg as WidgetConfig
  }
  return DEFAULT_WIDGETS
}

export function getColumnSpanClass(
  widgetId: string,
  dashboardConfig: DashboardConfig | null,
  cockpitCardSettings: CockpitCardSetting[],
): string {
  const widgets = resolveWidgets(dashboardConfig)
  const userSpan = widgets.columnSpans?.[widgetId]
  const setting = cockpitCardSettings.find((s) => s.widget_id === widgetId)
  const adminSpan = setting?.column_span
  const defaultSpan = FULL_WIDTH_WIDGETS.has(widgetId) ? 5 : 1
  const colSpan = userSpan && userSpan > 0 ? userSpan : adminSpan || defaultSpan

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

export function getRowSpanClass(
  widgetId: string,
  dashboardConfig: DashboardConfig | null,
  cockpitCardSettings: CockpitCardSetting[],
): string {
  const widgets = resolveWidgets(dashboardConfig)
  // Priority: user setting > admin setting > predefined default > 1
  const userRowSpan = widgets.rowSpans?.[widgetId]
  const setting = cockpitCardSettings.find((s) => s.widget_id === widgetId)
  const adminRowSpan = setting?.row_span
  const defaultRowSpan = DEFAULT_ROW_SPANS[widgetId] || 1
  const rowSpan = (userRowSpan && userRowSpan > 0 ? userRowSpan : null)
    ?? (adminRowSpan && adminRowSpan > 0 ? adminRowSpan : null)
    ?? defaultRowSpan

  if (rowSpan === 3) return "md:row-span-3"
  if (rowSpan === 2) return "md:row-span-2"
  return ""
}

export function getMinHeightStyle(
  widgetId: string,
  cockpitCardSettings: CockpitCardSetting[],
): React.CSSProperties {
  const setting = cockpitCardSettings.find((s) => s.widget_id === widgetId)
  if (setting?.min_height && setting.min_height !== "auto") {
    return { minHeight: setting.min_height }
  }
  return {}
}

export function getNumericColumnSpan(
  widgetId: string,
  dashboardConfig: DashboardConfig | null,
  cockpitCardSettings: CockpitCardSetting[],
): number {
  const widgets = resolveWidgets(dashboardConfig)
  const userSpan = widgets.columnSpans?.[widgetId]
  const setting = cockpitCardSettings.find((s) => s.widget_id === widgetId)
  const adminSpan = setting?.column_span
  const defaultSpan = FULL_WIDTH_WIDGETS.has(widgetId) ? 5 : 1
  return userSpan && userSpan > 0 ? userSpan : adminSpan || defaultSpan
}

// ── Default stats for edit mode ────────────────────────────────────────────────

const EMPTY_STATS: DashboardStats = {
  teamMembers: 0,
  activeGoals: 0,
  workflows: 0,
  documents: 0,
  teamMembersTrend: 0,
  goalsTrend: 0,
  workflowsTrend: 0,
  documentsTrend: 0,
  activityData: [],
  openTasks: 0,
  tasksTrend: 0,
  todayAppointments: 0,
  appointmentsTrend: 0,
  kpiScore: 0,
  kpiTrend: 0,
  drafts: 0,
  draftsTrend: 0,
  activeCandidates: 0,
  candidatesTrend: 0,
  openPositions: 0,
  applications: 0,
  recruitingTrend: 0,
  filteredTodos: 0,
  weeklyTasksData: [{ day: "Mo", completed: 3, pending: 2 }],
  todayScheduleData: [{ time: "09:00", appointments: 2 }],
  recentActivities: [],
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useDashboardWidgets({
  dashboardConfig,
  stats,
  cockpitCardSettings,
  practiceId,
  userId,
  currentPractice,
}: {
  dashboardConfig: DashboardConfig
  stats: DashboardStats | null
  cockpitCardSettings: CockpitCardSetting[]
  practiceId: string
  userId: string
  currentPractice: any
}) {
  const { t } = useTranslation()

  const renderWidget = useCallback(
    (widgetId: string, forEditMode = false) => {
      const widgets = resolveWidgets(dashboardConfig)

      if (isLinebreakWidget(widgetId)) {
        return (
          <div key={widgetId} className="col-span-full">
            <div className="w-full h-px bg-border my-4" />
          </div>
        )
      }

      const wrapWithSpan = (content: React.ReactNode, id: string) => {
        if (forEditMode) return content
        const colClass = getColumnSpanClass(id, dashboardConfig, cockpitCardSettings)
        const rowClass = getRowSpanClass(id, dashboardConfig, cockpitCardSettings)
        return (
          <div
            key={id}
            className={`${colClass} ${rowClass} self-stretch [&>*]:h-full [&>*]:overflow-auto`}
            style={getMinHeightStyle(id, cockpitCardSettings)}
          >
            {content}
          </div>
        )
      }

      const s = stats || EMPTY_STATS
      const isEnabled = (key: keyof typeof widgets) => forEditMode || widgets[key]

      switch (widgetId) {
        case "showTeamMembers":
          if (!isEnabled("showTeamMembers")) return null
          return wrapWithSpan(
            <StatCard key="team" title={t("Team-Mitglieder", "Team-Mitglieder")} value={s.teamMembers} trend={s.teamMembersTrend} icon={Users} color="blue" href="/team" />,
            widgetId,
          )
        case "showGoals":
          if (!isEnabled("showGoals")) return null
          return wrapWithSpan(
            <StatCard key="goals" title={t("Aktive Ziele", "Aktive Ziele")} value={s.activeGoals} trend={s.goalsTrend} icon={Target} color="green" href="/goals" />,
            widgetId,
          )
        case "showWorkflows":
          if (!isEnabled("showWorkflows")) return null
          return wrapWithSpan(
            <StatCard key="workflows" title={t("Workflows", "Workflows")} value={s.workflows} trend={s.workflowsTrend} icon={Workflow} color="purple" href="/workflows" />,
            widgetId,
          )
        case "showDocuments":
          if (!isEnabled("showDocuments")) return null
          return wrapWithSpan(
            <StatCard key="documents" title={t("Dokumente", "Dokumente")} value={s.documents} trend={s.documentsTrend} icon={FileText} color="amber" href="/documents" />,
            widgetId,
          )
        case "showRecruiting":
          if (!isEnabled("showRecruiting")) return null
          return wrapWithSpan(
            <StatCard key="recruiting" title={t("Offene Stellen", "Offene Stellen")} value={s.openPositions || 0} trend={s.recruitingTrend} icon={Briefcase} color="pink" href="/hiring" subtitle={`${s.applications || 0} Bewerbungen`} />,
            widgetId,
          )
        case "showOpenTasks":
          if (!isEnabled("showOpenTasks")) return null
          return wrapWithSpan(
            <StatCard key="openTasks" title={t("Offene Aufgaben", "Offene Aufgaben")} value={s.openTasks || 0} trend={s.tasksTrend} icon={CheckSquare} color="orange" href="/todos" />,
            widgetId,
          )
        case "showTodayAppointments":
          if (!isEnabled("showTodayAppointments")) return null
          return wrapWithSpan(
            <StatCard key="appointments" title={t("Termine heute", "Termine heute")} value={s.todayAppointments || 0} trend={s.appointmentsTrend} icon={Calendar} color="blue" href="/calendar" />,
            widgetId,
          )
        case "showActiveCandidates":
          if (!isEnabled("showActiveCandidates")) return null
          return wrapWithSpan(
            <StatCard key="candidates" title={t("Aktive Kandidaten", "Aktive Kandidaten")} value={s.activeCandidates || 0} trend={s.candidatesTrend} icon={Users} color="green" href="/hiring" />,
            widgetId,
          )
        case "showDrafts":
          if (!isEnabled("showDrafts")) return null
          return wrapWithSpan(
            <StatCard key="drafts" title={t("Entwürfe", "Entwürfe")} value={s.drafts || 0} trend={s.draftsTrend} icon={FileText} color="gray" href="/goals?tab=draft" />,
            widgetId,
          )
        case "showTodos":
          if (!isEnabled("showTodos")) return null
          return wrapWithSpan(
            <StatCard key="filtered-todos" title={t("Gefilterte Aufgaben", "Gefilterte Aufgaben")} value={s.filteredTodos || 0} icon={CheckSquare} color="purple" href="/todos" />,
            widgetId,
          )
        case "showGoogleReviews":
          if (!isEnabled("showGoogleReviews")) return null
          if (!currentPractice && !forEditMode) return null
          return wrapWithSpan(
            <GoogleReviewsWidget key="google-reviews" practiceId={currentPractice?.id || practiceId} practiceName={currentPractice?.name || "Praxis"} practiceWebsiteUrl={currentPractice?.website} />,
            widgetId,
          )
        case "showWeeklyTasks":
          if (!isEnabled("showWeeklyTasks")) return null
          return wrapWithSpan(
            <WeeklyTasksWidget key="weekly-tasks" data={s.weeklyTasksData || [{ day: "Mo", completed: 3, pending: 2 }]} />,
            widgetId,
          )
        case "showTodaySchedule":
          if (!isEnabled("showTodaySchedule")) return null
          return wrapWithSpan(
            <TodayScheduleWidget key="today-schedule" data={s.todayScheduleData || [{ time: "09:00", appointments: 2 }]} />,
            widgetId,
          )
        case "showActivityChart":
          if (!isEnabled("showActivityChart")) return null
          return wrapWithSpan(
            <ActivityChartWidget key="activity-chart" data={s.activityData || []} />,
            widgetId,
          )
        case "showKPIs":
          if (!isEnabled("showKPIs")) return null
          return wrapWithSpan(
            <KPIWidget key="kpis" kpiScore={s.kpiScore} kpiTrend={s.kpiTrend} />,
            widgetId,
          )
        case "showRecentActivities":
          if (!isEnabled("showRecentActivities")) return null
          return wrapWithSpan(
            <RecentActivitiesWidget key="recent-activities" activities={s.recentActivities || []} />,
            widgetId,
          )
        case "showJournalActions":
          if (!isEnabled("showJournalActions")) return null
          if (!practiceId && !forEditMode) return null
          return wrapWithSpan(
            <JournalActionItemsCard key="journal-actions" practiceId={practiceId} className="col-span-full" />,
            widgetId,
          )
        case "showBulletin":
          if (!isEnabled("showBulletin")) return null
          if (!practiceId && !forEditMode) return null
          return wrapWithSpan(
            <BulletinWidget key="bulletin" practiceId={practiceId} userId={userId} />,
            widgetId,
          )
        case "showTimeTracking":
          if (!isEnabled("showTimeTracking")) return null
          if ((!practiceId || !userId) && !forEditMode) return null
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
    [dashboardConfig, stats, currentPractice, t, practiceId, userId, cockpitCardSettings],
  )

  const orderedWidgets = useMemo(() => {
    const widgets = resolveWidgets(dashboardConfig)
    const savedOrder = widgets.widgetOrder || DEFAULT_ORDER

    if (!Array.isArray(savedOrder)) {
      console.error("[v0] widgetOrder is not an array:", savedOrder)
      return []
    }

    const order = [...savedOrder]
    for (const id of DEFAULT_ORDER) {
      if (!order.includes(id)) {
        order.push(id)
      }
    }

    return order.map((id) => renderWidget(id)).filter(Boolean)
  }, [dashboardConfig, renderWidget])

  const getColumnSpanForEdit = useCallback(
    (widgetId: string): number => getNumericColumnSpan(widgetId, dashboardConfig, cockpitCardSettings),
    [dashboardConfig, cockpitCardSettings],
  )

  return {
    renderWidget,
    orderedWidgets,
    getColumnSpanForEdit,
  }
}
