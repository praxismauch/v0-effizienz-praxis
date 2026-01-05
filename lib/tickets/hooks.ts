/**
 * Ticket Configuration Hooks
 *
 * React hooks for fetching and caching ticket configurations using SWR.
 * These hooks replace hard-coded arrays with database-driven configs.
 */

"use client"

import useSWR from "swr"
import type { TicketConfig, TicketStatusConfig, TicketPriorityConfig, TicketTypeConfig } from "./types"

// Fetcher function for SWR
const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    }
    return res.json()
  })

// SWR configuration for ticket configs
const swrConfig = {
  revalidateOnFocus: false, // Don't refetch when window regains focus
  revalidateOnReconnect: true, // Refetch when reconnecting
  dedupingInterval: 60000, // Dedupe requests within 1 minute
  refreshInterval: 0, // Don't auto-refresh (configs change rarely)
  shouldRetryOnError: true, // Retry on error
  errorRetryCount: 3, // Max 3 retries
}

/**
 * Hook to fetch all ticket configurations
 *
 * @returns {object} - { data, error, isLoading, statuses, priorities, types }
 *
 * @example
 * const { statuses, priorities, types, isLoading } = useTicketConfig()
 */
export function useTicketConfig() {
  const { data, error, isLoading, mutate } = useSWR<TicketConfig>("/api/tickets/config", fetcher, swrConfig)

  return {
    data,
    error,
    isLoading,
    statuses: data?.statuses || [],
    priorities: data?.priorities || [],
    types: data?.types || [],
    mutate, // Allows manual revalidation
  }
}

/**
 * Hook to fetch only ticket statuses
 *
 * @returns {object} - { statuses, error, isLoading }
 */
export function useTicketStatuses() {
  const { data, error, isLoading, mutate } = useSWR<{ statuses: TicketStatusConfig[] }>(
    "/api/tickets/config?type=statuses",
    fetcher,
    swrConfig,
  )

  return {
    statuses: data?.statuses || [],
    error,
    isLoading,
    mutate,
  }
}

/**
 * Hook to fetch only ticket priorities
 *
 * @returns {object} - { priorities, error, isLoading }
 */
export function useTicketPriorities() {
  const { data, error, isLoading, mutate } = useSWR<{ priorities: TicketPriorityConfig[] }>(
    "/api/tickets/config?type=priorities",
    fetcher,
    swrConfig,
  )

  return {
    priorities: data?.priorities || [],
    error,
    isLoading,
    mutate,
  }
}

/**
 * Hook to fetch only ticket types
 *
 * @returns {object} - { types, error, isLoading }
 */
export function useTicketTypes() {
  const { data, error, isLoading, mutate } = useSWR<{ types: TicketTypeConfig[] }>(
    "/api/tickets/config?type=types",
    fetcher,
    swrConfig,
  )

  return {
    types: data?.types || [],
    error,
    isLoading,
    mutate,
  }
}

/**
 * Hook with optimistic updates for ticket configuration changes
 *
 * Used in admin UI to update configs without full page reload
 */
export function useTicketConfigMutations() {
  const { mutate } = useSWR<TicketConfig>("/api/tickets/config")

  const updateConfig = async (newConfig: Partial<TicketConfig>) => {
    // Optimistically update the local cache
    await mutate(
      async (currentData) => {
        if (!currentData) return currentData
        return { ...currentData, ...newConfig }
      },
      {
        revalidate: true, // Revalidate after mutation
      },
    )
  }

  const resetToDefaults = async () => {
    try {
      const response = await fetch("/api/tickets/config/seed", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to reset configurations")
      }

      // Revalidate cache after reset
      await mutate()
    } catch (error) {
      console.error("[v0] Failed to reset ticket configurations:", error)
      throw error
    }
  }

  return {
    updateConfig,
    resetToDefaults,
  }
}
