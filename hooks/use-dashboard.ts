"use client"

import useSWR from "swr"
import { SWR_KEYS, DEFAULT_PRACTICE_ID } from "@/lib/swr-keys"
import { swrFetcher } from "@/lib/swr-fetcher"
import { REALTIME_SWR_CONFIG, SHARED_SWR_CONFIG } from "@/lib/swr-config"

// Types
export interface DashboardStats {
  totalTeams: number
  totalMembers: number
  activeTodos: number
  completedTodos: number
  upcomingEvents: number
  recentActivity: unknown[]
}

/**
 * Hook for fetching dashboard stats with real-time refresh
 */
export function useDashboardStats(practiceId = DEFAULT_PRACTICE_ID) {
  const { data, error, isLoading, mutate } = useSWR<DashboardStats>(
    SWR_KEYS.dashboardStats(practiceId),
    swrFetcher,
    { ...REALTIME_SWR_CONFIG, refreshInterval: 60000 }
  )

  return {
    stats: data || {
      totalTeams: 0,
      totalMembers: 0,
      activeTodos: 0,
      completedTodos: 0,
      upcomingEvents: 0,
      recentActivity: [],
    },
    isLoading,
    error,
    refresh: () => mutate(),
    mutate,
  }
}

/**
 * Hook for super admin dashboard stats
 */
export function useSuperAdminStats() {
  const { data, error, isLoading, mutate } = useSWR<{
    practices: number
    users: number
    teams: number
    tickets: number
    revenue: number
  }>(SWR_KEYS.superAdminStats(), swrFetcher, SHARED_SWR_CONFIG)

  return {
    stats: data || {
      practices: 0,
      users: 0,
      teams: 0,
      tickets: 0,
      revenue: 0,
    },
    isLoading,
    error,
    refresh: () => mutate(),
    mutate,
  }
}
