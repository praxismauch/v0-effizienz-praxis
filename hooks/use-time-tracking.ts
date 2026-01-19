import useSWR from "swr"
import { format } from "date-fns"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

// Hook for current user's time tracking status
export function useTimeTrackingStatus(practiceId: string | null, userId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    practiceId && userId ? `/api/practices/${practiceId}/time/current-status?userId=${userId}` : null,
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
    }
  )

  return {
    status: data?.status || "idle",
    currentBlock: data?.block || null,
    activeBreak: data?.activeBreak || null,
    isLoading,
    error,
    mutate,
  }
}

// Hook for team live view
export function useTeamLiveView(practiceId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    practiceId ? `/api/practices/${practiceId}/time/team-live` : null,
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
    }
  )

  return {
    members: data?.members || [],
    isLoading,
    error,
    mutate,
  }
}

export function useTimeBlocks(
  practiceId: string | null,
  userId: string | null,
  startDate?: string,
  endDate?: string
) {
  const params = new URLSearchParams()
  if (userId) params.append("userId", userId)
  if (startDate) params.append("startDate", startDate)
  if (endDate) params.append("endDate", endDate)

  const { data, error, isLoading, mutate } = useSWR(
    practiceId && userId ? `/api/practices/${practiceId}/time/blocks?${params.toString()}` : null,
    fetcher,
    {
      revalidateOnFocus: true,
    }
  )

  return {
    blocks: data?.blocks || [],
    isLoading,
    error,
    mutate,
  }
}

export async function createTimeStamp(
  practiceId: string,
  userId: string,
  location: string,
  comment?: string
) {
  const response = await fetch(`/api/practices/${practiceId}/time/stamps`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, location, comment }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to create time stamp")
  }

  return response.json()
}

export async function createTimeBlock(
  practiceId: string,
  userId: string,
  startTime: string,
  endTime: string | null,
  type: string,
  location: string,
  comment?: string
) {
  const response = await fetch(`/api/practices/${practiceId}/time/blocks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, startTime, endTime, type, location, comment }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to create time block")
  }

  return response.json()
}

export async function updateTimeBlock(
  practiceId: string,
  blockId: string,
  updates: Record<string, any>
) {
  const response = await fetch(`/api/practices/${practiceId}/time/blocks/${blockId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to update time block")
  }

  return response.json()
}

export async function createTimeBreak(
  practiceId: string,
  blockId: string,
  startTime: string,
  endTime: string | null
) {
  const response = await fetch(`/api/practices/${practiceId}/time/breaks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ blockId, startTime, endTime }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to create break")
  }

  return response.json()
}

export async function updateTimeBreak(
  practiceId: string,
  breakId: string,
  updates: Record<string, any>
) {
  const response = await fetch(`/api/practices/${practiceId}/time/breaks/${breakId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to update break")
  }

  return response.json()
}

// Hook for correction requests
export function useCorrectionRequests(practiceId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    practiceId ? `/api/practices/${practiceId}/time/corrections` : null,
    fetcher,
    {
      revalidateOnFocus: true,
    }
  )

  return {
    corrections: data || [],
    isLoading,
    error,
    mutate,
  }
}

// Hook for time tracking actions
export function useTimeActions(practiceId: string | null, userId: string | undefined) {
  const clockIn = async (location: string, comment?: string) => {
    if (!practiceId || !userId) throw new Error("Missing practiceId or userId")
    
    const res = await fetch(`/api/practices/${practiceId}/time/stamps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, action: "clock_in", location, comment }),
    })
    if (!res.ok) throw new Error("Failed to clock in")
    return res.json()
  }

  const clockOut = async (comment?: string) => {
    if (!practiceId || !userId) throw new Error("Missing practiceId or userId")
    
    const res = await fetch(`/api/practices/${practiceId}/time/stamps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, action: "clock_out", comment }),
    })
    if (!res.ok) throw new Error("Failed to clock out")
    return res.json()
  }

  const startBreak = async () => {
    if (!practiceId || !userId) throw new Error("Missing practiceId or userId")
    
    const res = await fetch(`/api/practices/${practiceId}/time/breaks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    })
    if (!res.ok) throw new Error("Failed to start break")
    return res.json()
  }

  const endBreak = async (breakId: string) => {
    if (!practiceId || !userId) throw new Error("Missing practiceId or userId")
    
    const res = await fetch(`/api/practices/${practiceId}/time/breaks/${breakId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ end_time: new Date().toISOString() }),
    })
    if (!res.ok) throw new Error("Failed to end break")
    return res.json()
  }

  return { clockIn, clockOut, startBreak, endBreak }
}

// Hook for plausibility issues
export function usePlausibilityIssues(practiceId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    practiceId ? `/api/practices/${practiceId}/time/plausibility-checks` : null,
    fetcher,
    {
      revalidateOnFocus: true,
    }
  )

  return {
    issues: data || [],
    isLoading,
    error,
    mutate,
  }
}
