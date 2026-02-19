"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  type DashboardConfig,
  type WidgetConfig,
  DEFAULT_ORDER,
} from "@/components/dashboard-editor-dialog"

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
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig>({
    widgets: DEFAULT_WIDGETS,
  })
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [cockpitCardSettings, setCockpitCardSettings] = useState<CockpitCardSetting[]>([])

  const hasLoadedRef = useRef(!!initialData)
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

  // Fetch main dashboard data
  const fetchDashboardData = useCallback(async () => {
    if (!practiceId || practiceId === "undefined" || practiceId === "null" || practiceId === "0") return
    if (!userId) return
    if (loadingPracticeIdRef.current === practiceId && hasLoadedRef.current) return

    loadingPracticeIdRef.current = practiceId
    setLoading(true)
    setError(null)

    try {
      const preferences = await safeFetch(
        `/api/practices/${practiceId}/dashboard-preferences?userId=${userId}`,
        null,
      )
      await new Promise((resolve) => setTimeout(resolve, 100))

      const [statsData, activities] = await Promise.all([
        safeFetch(`/api/practices/${practiceId}/dashboard-stats`, null),
        safeFetch(`/api/dashboard/recent-activities?practiceId=${practiceId}&limit=5`, null),
      ])
      await new Promise((resolve) => setTimeout(resolve, 100))

      await safeFetch(`/api/practices/${practiceId}/documents?limit=5`, null)

      if (preferences?.config) {
        setDashboardConfig({
          widgets: { ...DEFAULT_WIDGETS, ...(preferences.config.widgets || {}) },
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
    } catch (err) {
      console.error("[v0] Dashboard fetch error:", err)
      setError("Fehler beim Laden des Dashboards")
    } finally {
      setLoading(false)
    }
  }, [userId, practiceId])

  useEffect(() => {
    if (loadingPracticeIdRef.current !== practiceId) {
      hasLoadedRef.current = false
    }
    fetchDashboardData()
  }, [fetchDashboardData])

  // Save config
  const handleSaveConfig = useCallback(
    async (newConfig: { widgets: any }) => {
      const widgets = newConfig?.widgets
        ? newConfig.widgets.widgets || newConfig.widgets
        : DEFAULT_WIDGETS

      setDashboardConfig({ widgets })

      if (practiceId && userId) {
        try {
          const response = await fetch(`/api/practices/${practiceId}/dashboard-preferences`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, config: { widgets } }),
          })
          if (!response.ok) {
            const errText = await response.text()
            console.error("[v0] Failed to save dashboard config:", response.status, errText)
            toast({ title: "Fehler", description: "Dashboard-Einstellungen konnten nicht gespeichert werden.", variant: "destructive" })
          } else {
            toast({ title: "Gespeichert", description: "Dashboard-Einstellungen wurden erfolgreich gespeichert." })
          }
        } catch (err) {
          console.error("[v0] Error saving dashboard config:", err)
          toast({ title: "Fehler", description: "Dashboard-Einstellungen konnten nicht gespeichert werden.", variant: "destructive" })
        }
      }
    },
    [practiceId, userId, toast],
  )

  const handleEditModeSave = useCallback(
    (updatedWidgets: WidgetConfig) => {
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
