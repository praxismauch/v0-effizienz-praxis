"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  type WidgetConfig,
  DEFAULT_ORDER,
} from "@/components/dashboard-editor-dialog"

// Internal wrapper type — keeps widgets nested under a `widgets` key
// so the rest of the app always accesses dashboardConfig.widgets.*
interface DashboardConfigWrapper {
  widgets: WidgetConfig
}

// ── Types ──────────────────────────────────────────────────────────────────────

export interface DashboardStats {
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

export interface CockpitCardSetting {
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

export interface DashboardInitialData {
  totalTeams: number
  totalMembers: number
  activeTodos: number
  completedTodos: number
  upcomingEvents: number
}

export const DEFAULT_WIDGETS: WidgetConfig = {
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

// ── Safe fetcher ───────────────────────────────────────────────────────────────

async function safeFetch<T = unknown>(url: string, fallback: T | null = null): Promise<T | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) return fallback
    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) return fallback
    const text = await response.text()
    if (text.startsWith("Too Many") || text.includes("rate limit")) return fallback
    return JSON.parse(text) as T
  } catch {
    return fallback
  }
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useDashboardOverview({
  practiceId,
  userId,
  initialData,
}: {
  practiceId: string
  userId: string
  initialData?: DashboardInitialData | null
}) {
  const { toast } = useToast()

  const [stats, setStats] = useState<DashboardStats | null>(
    initialData
      ? {
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
        }
      : null,
  )
  const [loading, setLoading] = useState(!initialData)
  const [error, setError] = useState<string | null>(null)
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfigWrapper>({
    widgets: { ...DEFAULT_WIDGETS },
  })
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [cockpitCardSettings, setCockpitCardSettings] = useState<CockpitCardSetting[]>([])

  const hasLoadedStatsRef = useRef(!!initialData)
  const hasLoadedConfigRef = useRef(false)
  const loadingPracticeIdRef = useRef<string | null>(initialData ? practiceId : null)

  // Fetch cockpit card settings once on mount
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

  // Always fetch dashboard preferences (config) on mount — separate from stats
  useEffect(() => {
    if (!practiceId || !userId || hasLoadedConfigRef.current) return
    hasLoadedConfigRef.current = true

    const fetchPreferences = async () => {
      try {
        const preferences = await safeFetch<{ config: any }>(
          `/api/practices/${practiceId}/dashboard-preferences?userId=${userId}`,
          null,
        )
        if (preferences?.config) {
          const savedWidgets = preferences.config.widgets || preferences.config
          const mergedWidgets = { ...DEFAULT_WIDGETS, ...savedWidgets }
          console.log("[v0] Loaded dashboard config: widgetOrder=", mergedWidgets.widgetOrder?.slice(0, 5), "columnSpans=", mergedWidgets.columnSpans)
          setDashboardConfig({ widgets: mergedWidgets })
        } else {
          console.log("[v0] No saved dashboard config found, using defaults")
        }
      } catch (err) {
        console.error("[v0] Error fetching dashboard preferences:", err)
      }
    }
    fetchPreferences()
  }, [practiceId, userId])

  // Fetch main dashboard stats (can skip if initialData was provided)
  const fetchDashboardData = useCallback(async () => {
    if (!practiceId || practiceId === "undefined" || practiceId === "null" || practiceId === "0") return
    if (!userId) return
    if (loadingPracticeIdRef.current === practiceId && hasLoadedStatsRef.current) return

    loadingPracticeIdRef.current = practiceId
    setLoading(true)
    setError(null)

    try {
      const [statsData, activities] = await Promise.all([
        safeFetch(`/api/practices/${practiceId}/dashboard-stats`, null),
        safeFetch(`/api/dashboard/recent-activities?practiceId=${practiceId}&limit=5`, null),
      ])

      await safeFetch(`/api/practices/${practiceId}/documents?limit=5`, null)

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

      hasLoadedStatsRef.current = true
    } catch (err) {
      console.error("[v0] Dashboard fetch error:", err)
      setError("Fehler beim Laden des Dashboards")
    } finally {
      setLoading(false)
    }
  }, [userId, practiceId])

  useEffect(() => {
    if (loadingPracticeIdRef.current !== practiceId) {
      hasLoadedStatsRef.current = false
      hasLoadedConfigRef.current = false
    }
    fetchDashboardData()
  }, [fetchDashboardData])

  // Save config -- accepts either { widgets: WidgetConfig } or a flat WidgetConfig
  const handleSaveConfig = useCallback(
    async (newConfig: { widgets?: any } | WidgetConfig) => {
      // Normalize: extract the flat WidgetConfig regardless of wrapping
      let flatWidgets: WidgetConfig
      if (newConfig && "widgets" in newConfig && newConfig.widgets && typeof newConfig.widgets === "object" && "showGoals" in newConfig.widgets) {
        // Wrapped: { widgets: WidgetConfig }
        flatWidgets = { ...DEFAULT_WIDGETS, ...newConfig.widgets }
      } else if (newConfig && "showGoals" in newConfig) {
        // Already flat WidgetConfig
        flatWidgets = { ...DEFAULT_WIDGETS, ...(newConfig as WidgetConfig) }
      } else {
        console.error("[v0] handleSaveConfig: unexpected shape, using defaults", newConfig)
        flatWidgets = { ...DEFAULT_WIDGETS }
      }

      console.log("[v0] handleSaveConfig: saving widgetOrder=", flatWidgets.widgetOrder?.slice(0, 5), "linebreaks=", flatWidgets.linebreaks, "columnSpans=", flatWidgets.columnSpans)

      setDashboardConfig({ widgets: flatWidgets })

      if (practiceId && userId) {
        try {
          const payload = { userId, config: { widgets: flatWidgets } }
          console.log("[v0] handleSaveConfig: POSTing to API, practiceId=", practiceId)
          const response = await fetch(`/api/practices/${practiceId}/dashboard-preferences`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
          if (!response.ok) {
            const errText = await response.text()
            console.error("[v0] Failed to save dashboard config:", response.status, errText)
            toast({ title: "Fehler", description: "Dashboard-Einstellungen konnten nicht gespeichert werden.", variant: "destructive" })
          } else {
            const result = await response.json()
            console.log("[v0] handleSaveConfig: saved successfully, result=", result?.success)
            toast({ title: "Gespeichert", description: "Dashboard-Einstellungen wurden erfolgreich gespeichert." })
          }
        } catch (err) {
          console.error("[v0] Error saving dashboard config:", err)
          toast({ title: "Fehler", description: "Dashboard-Einstellungen konnten nicht gespeichert werden.", variant: "destructive" })
        }
      } else {
        console.error("[v0] handleSaveConfig: missing practiceId or userId!", { practiceId, userId })
      }
    },
    [practiceId, userId, toast],
  )

  const handleEditModeSave = useCallback(
    (updatedWidgets: WidgetConfig) => {
      console.log("[v0] handleEditModeSave called, widgetOrder=", updatedWidgets.widgetOrder?.slice(0, 5), "columnSpans=", updatedWidgets.columnSpans)
      setIsEditMode(false)
      handleSaveConfig({ widgets: updatedWidgets })
    },
    [handleSaveConfig],
  )

  return {
    stats,
    loading,
    error,
    dashboardConfig,
    cockpitCardSettings,
    isEditorOpen,
    setIsEditorOpen,
    isEditMode,
    setIsEditMode,
    fetchDashboardData,
    handleSaveConfig,
    handleEditModeSave,
  }
}
