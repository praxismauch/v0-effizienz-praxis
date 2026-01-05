"use client"

import { SWRConfig } from "swr"
import type { ReactNode } from "react"

const swrConfig = {
  // Dedupe requests within 2 seconds
  dedupingInterval: 2000,
  // Focus revalidation disabled to reduce API calls
  revalidateOnFocus: false,
  // Revalidate on reconnect
  revalidateOnReconnect: true,
  // Keep previous data while revalidating
  keepPreviousData: true,
  // Retry failed requests
  errorRetryCount: 3,
  errorRetryInterval: 1000,
  // Custom fetcher with better error handling
  fetcher: async (url: string) => {
    const res = await fetch(url)
    if (!res.ok) {
      const error = new Error("An error occurred while fetching the data.")
      throw error
    }
    return res.json()
  },
}

export function SWRProvider({ children }: { children: ReactNode }) {
  return <SWRConfig value={swrConfig}>{children}</SWRConfig>
}

export default SWRProvider
