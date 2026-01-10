"use client"

import useSWR from "swr"
import { SWR_KEYS, DEFAULT_PRACTICE_ID } from "@/lib/swr-keys"
import { swrFetcher, mutationFetcher } from "@/lib/swr-fetcher"

// Types
export interface Practice {
  id: number
  name: string
  type: string | null
  address: string | null
  phone: string | null
  email: string | null
  website: string | null
  color: string | null
  logo_url: string | null
  is_active: boolean
  subscription_tier: string
  subscription_status: string
  created_at: string
  updated_at: string | null
}

export interface PracticeSettings {
  practice_id: number
  working_hours: unknown
  notification_settings: unknown
  feature_flags: unknown
  branding: unknown
  updated_at: string | null
}

const SWR_CONFIG = {
  revalidateOnFocus: false,
  dedupingInterval: 300,
}

/**
 * Hook for fetching practice data (hardcoded to practice 1)
 */
export function usePractice(practiceId = DEFAULT_PRACTICE_ID) {
  const { data, error, isLoading, mutate } = useSWR<Practice>(SWR_KEYS.practice(practiceId), swrFetcher, SWR_CONFIG)

  return {
    practice: data || null,
    isLoading,
    error,
    refresh: () => mutate(),
    mutate,
  }
}

/**
 * Hook for fetching practice settings
 */
export function usePracticeSettings(practiceId = DEFAULT_PRACTICE_ID) {
  const { data, error, isLoading, mutate } = useSWR<PracticeSettings>(
    SWR_KEYS.practiceSettings(practiceId),
    swrFetcher,
    SWR_CONFIG,
  )

  const updateSettings = async (settings: Partial<PracticeSettings>) => {
    const result = await mutationFetcher<PracticeSettings>(SWR_KEYS.practiceSettings(practiceId), {
      method: "PATCH",
      body: settings,
    })
    await mutate()
    return result
  }

  return {
    settings: data || null,
    isLoading,
    error,
    updateSettings,
    refresh: () => mutate(),
    mutate,
  }
}

/**
 * Combined hook for practice data and settings
 */
export function usePracticeData(practiceId = DEFAULT_PRACTICE_ID) {
  const { practice, isLoading: practiceLoading, error: practiceError, mutate: mutatePractice } = usePractice(practiceId)
  const {
    settings,
    isLoading: settingsLoading,
    updateSettings,
    mutate: mutateSettings,
  } = usePracticeSettings(practiceId)

  const refreshAll = async () => {
    await Promise.all([mutatePractice(), mutateSettings()])
  }

  return {
    practice,
    settings,
    isLoading: practiceLoading || settingsLoading,
    error: practiceError,
    updateSettings,
    refresh: refreshAll,
  }
}
