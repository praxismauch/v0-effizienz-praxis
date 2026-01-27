"use client"

import type React from "react"

import { useState, useEffect, useMemo, useCallback, memo, useRef } from "react"
import { Card } from "@/components/ui/card"
import {
  Users,
  Target,
  Workflow,
  FileText,
  TrendingUp,
  TrendingDown,
  Settings,
  Briefcase,
  CheckSquare,
  Calendar,
  Clock,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  DashboardEditorDialog,
  type DashboardConfig,
  DEFAULT_ORDER,
  isLinebreakWidget,
} from "./dashboard-editor-dialog"
import { useToast } from "@/hooks/use-toast"
import { usePractice } from "@/contexts/practice-context"
import { useAiEnabled } from "@/lib/hooks/use-ai-enabled"
import { GoogleReviewsWidget } from "./google-reviews-widget"
import { JournalActionItemsCard } from "@/components/dashboard/insights-action-items-card"
import { useTranslation } from "@/contexts/translation-context"

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
  showInsightsActions: true,
  showJournalActions: true,
  showTodos: true,
  todosFilterWichtig: undefined,
  todosFilterDringend: undefined,
  todosFilterPriority: undefined,
  widgetOrder: DEFAULT_ORDER,
}

const StatCard = memo(function StatCard({
  title,
  value,
  trend,
  icon: Icon,
  color,
  href,
  subtitle,
}: {
  title: string
  value: number | string
  trend?: number
  icon: any
  color: string
  href: string
  subtitle?: string
}) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    amber: "bg-amber-50 text-amber-600",
    pink: "bg-pink-50 text-pink-600",
    orange: "bg-orange-50 text-orange-600",
    gray: "bg-gray-50 text-gray-600",
  }

  return (
    <Link href={href}>
      <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className={`p-2 rounded-lg ${colorClasses[color] || colorClasses.blue}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {trend !== undefined && (
          <div className="mt-2 flex items-center gap-1 text-xs">
            {trend >= 0 ? (
              <TrendingUp className="h-3 w-3 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            <span className={trend >= 0 ? "text-green-500" : "text-red-500"}>{Math.abs(trend)}%</span>
            <span className="text-muted-foreground">vs letzte Woche</span>
          </div>
        )}
      </Card>
    </Link>
  )
})

export function DashboardOverview({ practiceId, userId }: DashboardOverviewProps) {
  const { toast } = useToast()
  const { currentPractice } = usePractice()
  const { isEnabled } = useAiEnabled()
  const { t } = useTranslation()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig>({
    widgets: DEFAULT_WIDGETS,
  })
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [cockpitCardSettings, setCockpitCardSettings] = useState<CockpitCardSetting[]>([])

  const hasLoadedRef = useRef(false)
  const loadingPracticeIdRef = useRef<string | null>(null)

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

  const renderBarChart = useCallback((data: Array<{ day: string; completed: number; pending: number }>) => {
    if (!data || data.length === 0) {
      return <div className="h-64 flex items-center justify-center text-muted-foreground">Keine Daten verfügbar</div>
    }

    const maxValue = Math.max(...data.flatMap((d) => [d.completed, d.pending]), 1)

    return (
      <div className="h-64 flex items-end justify-around gap-2 px-4">
        {data.map((item, index) => {
          const completedHeight = ((item.completed || 0) / maxValue) * 100
          const pendingHeight = ((item.pending || 0) / maxValue) * 100

          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex gap-1 items-end h-48">
                <div
                  className="flex-1 bg-primary rounded-t transition-all hover:opacity-80"
                  style={{ height: `${completedHeight}%` }}
                  title={`Erledigt: ${item.completed}`}
                />
                <div
                  className="flex-1 bg-muted rounded-t transition-all hover:opacity-80"
                  style={{ height: `${pendingHeight}%` }}
                  title={`Ausstehend: ${item.pending}`}
                />
              </div>
              <span className="text-xs text-muted-foreground">{item.day}</span>
            </div>
          )
        })}
      </div>
    )
  }, [])

  const renderLineChart = useCallback((data: Array<{ time: string; appointments: number }>) => {
    if (!data || data.length === 0) {
      return <div className="h-64 flex items-center justify-center text-muted-foreground">Keine Daten verfügbar</div>
    }

    const maxValue = Math.max(...data.map((d) => d.appointments), 1)
    const points = data
      .map((item, index) => {
        const x = (index / Math.max(data.length - 1, 1)) * 100
        const y = 100 - ((item.appointments || 0) / maxValue) * 80
        return `${x},${y}`
      })
      .join(" ")

    return (
      <div className="h-64 relative px-4">
        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
          <polyline
            points={points}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
          {data.map((item, index) => {
            const x = (index / Math.max(data.length - 1, 1)) * 100
            const y = 100 - ((item.appointments || 0) / maxValue) * 80
            if (isNaN(x) || isNaN(y)) return null

            return (
              <circle key={index} cx={x} cy={y} r="1.5" fill="hsl(var(--primary))" className="hover:r-2 transition-all">
                <title>{`${item.time}: ${item.appointments} Termine`}</title>
              </circle>
            )
          })}
        </svg>
        <div className="flex justify-between mt-2">
          {data.map((item, index) => (
            <span key={index} className="text-xs text-muted-foreground">
              {item.time}
            </span>
          ))}
        </div>
      </div>
    )
  }, [])

  const renderAreaChart = useCallback((data: Array<{ date: string; value: number }>) => {
    if (!data || data.length === 0) {
      return <div className="h-64 flex items-center justify-center text-muted-foreground">Keine Daten verfügbar</div>
    }

    const maxValue = Math.max(...data.map((d) => d.value), 1)
    const points = data
      .map((item, index) => {
        const x = (index / (data.length - 1)) * 100
        const y = 100 - (item.value / maxValue) * 80
        return `${x},${y}`
      })
      .join(" ")

    const areaPoints = `0,100 ${points} 100,100`

    return (
      <div className="h-64 relative px-4">
        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <polygon points={areaPoints} fill="url(#areaGradient)" />
          <polyline
            points={points}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <div className="flex justify-between mt-2">
          {data.map((item, index) => (
            <span key={index} className="text-xs text-muted-foreground">
              {item.date}
            </span>
          ))}
        </div>
      </div>
    )
  }, [])

  const getColumnSpanClass = (widgetId: string): string => {
    const setting = cockpitCardSettings.find((s) => s.widget_id === widgetId)
    const colSpan = setting?.column_span || 1

    switch (colSpan) {
      case 2:
        return "md:col-span-2"
      case 3:
        return "md:col-span-3"
      case 4:
        return "md:col-span-4"
      case 5:
        return "md:col-span-5"
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
            <Card key="weekly-tasks" className="p-6 border-muted col-span-full">
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">Wöchentliche Aufgaben</h2>
                  <p className="text-sm text-muted-foreground">Erledigte und ausstehende Aufgaben diese Woche</p>
                </div>
                {renderBarChart(stats.weeklyTasksData)}
                <div className="flex items-center justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-primary rounded" />
                    <span className="text-muted-foreground">Erledigt</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-muted rounded" />
                    <span className="text-muted-foreground">Ausstehend</span>
                  </div>
                </div>
              </div>
            </Card>,
            widgetId,
          )
        case "showTodaySchedule":
          if (!widgets.showTodaySchedule || !stats?.todayScheduleData) return null
          return wrapWithSpan(
            <Card key="today-schedule" className="p-6 border-muted col-span-full">
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">Heutiger Terminplan</h2>
                  <p className="text-sm text-muted-foreground">Verteilung der Termine über den Tag</p>
                </div>
                {renderLineChart(stats.todayScheduleData)}
              </div>
            </Card>,
            widgetId,
          )
        case "showActivityChart":
          if (!widgets.showActivityChart || !stats?.activityData) return null
          return wrapWithSpan(
            <Card key="activity-chart" className="p-6 border-muted col-span-full">
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">Aktivität</h2>
                  <p className="text-sm text-muted-foreground">Praxisaktivität der letzten 7 Tage</p>
                </div>
                {renderAreaChart(stats.activityData)}
              </div>
            </Card>,
            widgetId,
          )
        case "showKPIs":
          if (!widgets.showKPIs || !stats) return null
          return wrapWithSpan(
            <Card key="kpis" className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Praxis-Score</p>
                  <p className="text-2xl font-bold">{stats.kpiScore || 85}/100</p>
                  <p className="text-xs text-muted-foreground">Gesamtbewertung Ihrer Praxisleistung</p>
                </div>
                <div className="bg-primary/10 text-primary p-2 rounded-lg">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
              {(stats.kpiTrend || 5) !== 0 && (
                <div className="mt-2 flex items-center gap-1 text-xs">
                  {(stats.kpiTrend || 5) >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className={(stats.kpiTrend || 5) >= 0 ? "text-green-500" : "text-red-500"}>
                    {Math.abs(stats.kpiTrend || 5)}%
                  </span>
                  <span className="text-muted-foreground">vs letzte Woche</span>
                </div>
              )}
            </Card>,
            widgetId,
          )
        case "showRecentActivities":
          if (!widgets.showRecentActivities || !stats?.recentActivities?.length) return null
          return wrapWithSpan(
            <Card key="recent-activities" className="p-6 border-muted col-span-full">
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">Letzte Aktivitäten</h2>
                  <p className="text-sm text-muted-foreground">Die neuesten Ereignisse in Ihrer Praxis</p>
                </div>
                <div className="space-y-3">
                  {stats.recentActivities.slice(0, 5).map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div
                        className={`p-2 rounded-lg ${activity.priority === "high" ? "bg-red-500/10 text-red-500" : activity.priority === "medium" ? "bg-amber-500/10 text-amber-500" : "bg-blue-500/10 text-blue-500"}`}
                      >
                        <Clock className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{activity.title}</p>
                        <p className="text-sm text-muted-foreground">{activity.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">{activity.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>,
            widgetId,
          )
        case "showInsightsActions":
          if (widgets.showInsightsActions === false || !practiceId) return null
          return wrapWithSpan(
            <JournalActionItemsCard key="insights-actions" practiceId={practiceId} className="col-span-full" />,
            widgetId,
          )
        case "showJournalActions":
          if (widgets.showJournalActions === false || !practiceId) return null
          return wrapWithSpan(
            <JournalActionItemsCard key="journal-actions" practiceId={practiceId} className="col-span-full" />,
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
      renderBarChart,
      renderLineChart,
      renderAreaChart,
      cockpitCardSettings,
    ],
  )

  const orderedWidgets = useMemo(() => {
    const widgets = dashboardConfig?.widgets || DEFAULT_WIDGETS
    const order = widgets.widgetOrder || DEFAULT_ORDER

    if (!Array.isArray(order)) {
      console.error("[v0] widgetOrder is not an array:", order)
      return []
    }
    return order.map((id) => renderWidget(id)).filter(Boolean)
  }, [dashboardConfig, renderWidget])

  const handleSaveConfig = useCallback((newConfig: { widgets: any }) => {
    if (newConfig && newConfig.widgets) {
      const widgets = newConfig.widgets.widgets || newConfig.widgets
      setDashboardConfig({ widgets })
    } else {
      setDashboardConfig({ widgets: DEFAULT_WIDGETS })
    }
  }, [])

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

  return (
    <div className="space-y-6 max-w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cockpit</h1>
          <p className="text-muted-foreground mt-1">Willkommen zurück! Hier ist ein 360° Überblick über Ihre Praxis.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsEditorOpen(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Cockpit bearbeiten
          </Button>
          <Link href={isEnabled ? "/analysis" : "#"}>
            <Button size="sm" variant="outline" disabled={!isEnabled} className="gap-2 bg-transparent">
              <Sparkles className="h-4 w-4" />
              KI-Analyse starten
            </Button>
          </Link>
        </div>
      </div>

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
