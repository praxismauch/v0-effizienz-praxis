"use client"

import useSWR from "swr"
import { SWR_KEYS } from "@/lib/swr-keys"
import { swrFetcher, mutationFetcher } from "@/lib/swr-fetcher"
import { SHARED_SWR_CONFIG } from "@/lib/swr-config"

// Types
export interface User {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  phone: string | null
  role: string
  is_super_admin: boolean
  is_active: boolean
  practice_id: number | null
  language: string
  created_at: string
  updated_at: string | null
}

export interface UserPreferences {
  theme: "light" | "dark" | "system"
  language: string
  notifications_enabled: boolean
  email_notifications: boolean
  sidebar_collapsed: boolean
}

/**
 * Hook for fetching current user data
 */
export function useCurrentUser() {
  const { data, error, isLoading, mutate } = useSWR<User>(
    SWR_KEYS.currentUser(),
    swrFetcher,
    SHARED_SWR_CONFIG
  )

  return {
    user: data || null,
    isLoading,
    isAuthenticated: !!data && !error,
    error,
    refresh: () => mutate(),
    mutate,
  }
}

/**
 * Hook for fetching user preferences
 */
export function useUserPreferences() {
  const { data, error, isLoading, mutate } = useSWR<UserPreferences>(
    SWR_KEYS.userPreferences(),
    swrFetcher,
    SHARED_SWR_CONFIG
  )

  const updatePreferences = async (preferences: Partial<UserPreferences>) => {
    const result = await mutationFetcher<UserPreferences>(SWR_KEYS.userPreferences(), {
      method: "PATCH",
      body: preferences,
    })
    await mutate()
    return result
  }

  return {
    preferences: data || {
      theme: "system" as const,
      language: "de",
      notifications_enabled: true,
      email_notifications: true,
      sidebar_collapsed: false,
    },
    isLoading,
    error,
    updatePreferences,
    refresh: () => mutate(),
    mutate,
  }
}

/**
 * Combined hook for user and preferences
 */
export function useAuth() {
  const { user, isLoading: userLoading, isAuthenticated, error: userError, mutate: mutateUser } = useCurrentUser()
  const { preferences, isLoading: prefsLoading, updatePreferences, mutate: mutatePrefs } = useUserPreferences()

  const refreshAll = async () => {
    await Promise.all([mutateUser(), mutatePrefs()])
  }

  return {
    user,
    preferences,
    isLoading: userLoading || prefsLoading,
    isAuthenticated,
    error: userError,
    updatePreferences,
    refresh: refreshAll,
  }
}

/**
 * Alias for useCurrentUser for backward compatibility
 */
export function useUser() {
  return useCurrentUser()
}
