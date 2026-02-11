"use client"

import useSWR from "swr"

interface FeatureFlag {
  feature_key: string
  route_path: string | null
  is_beta: boolean
  is_enabled: boolean
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

/**
 * Fetches feature flags from the API and returns a Set of route_paths
 * that are currently marked as beta. Usable by any sidebar.
 */
export function useFeatureBetaFlags(): Set<string> {
  const { data } = useSWR<{ features: FeatureFlag[] }>(
    "/api/super-admin/features",
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // Cache for 60s
      errorRetryCount: 1,
    }
  )

  if (!data?.features) return new Set()

  const betaPaths = new Set<string>()
  for (const f of data.features) {
    if (f.is_beta && f.route_path) {
      betaPaths.add(f.route_path)
    }
    // Also add the feature_key for matching super-admin items that don't have route_path
    if (f.is_beta) {
      betaPaths.add(f.feature_key)
    }
  }

  return betaPaths
}
