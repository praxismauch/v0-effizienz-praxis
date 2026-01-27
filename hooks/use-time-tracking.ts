import useSWR from "swr"
import { format } from "date-fns"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

// Hook for current user's time tracking status
export function useTimeTrackingStatus(practiceId: string | null, userId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    practiceId && userId ? `/api/practices/${practiceId}/time/current-status?userId=${userId}` : null,
    fetcher,
    {
      refreshInterval: 60000, // Refresh every 60 seconds (1 minute)
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
      refreshInterval: 60000, // Refresh every 60 seconds (1 minute)
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
export function useCorrectionRequests(practiceId: string | null, userId?: string) {
  const { data, error, isLoading, mutate } = useSWR(
    practiceId ? `/api/practices/${practiceId}/time/corrections` : null,
    fetcher,
    {
      revalidateOnFocus: true,
    }
  )

  const submitCorrection = async (blockId: string, newStart: string, newEnd: string, reason: string) => {
    if (!practiceId || !userId) {
      return { success: false, error: "Missing practiceId or userId" }
    }
    
    try {
      const res = await fetch(`/api/practices/${practiceId}/time/corrections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          user_id: userId, 
          block_id: blockId, 
          requested_start: newStart, 
          requested_end: newEnd, 
          reason 
        }),
      })
      const responseData = await res.json()
      if (!res.ok) {
        return { success: false, error: responseData.error || "Failed to submit correction" }
      }
      mutate()
      return { success: true, ...responseData }
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to submit correction" }
    }
  }

  // Ensure we always return an array, even if data is undefined or null
  const corrections = Array.isArray(data) ? data : []

  return {
    corrections,
    isLoading,
    error,
    mutate,
    submitCorrection,
  }
}

// Hook for time tracking actions
export function useTimeActions(practiceId: string | null, userId: string | undefined) {
  const clockIn = async (location: string, comment?: string) => {
    if (!practiceId || !userId) {
      return { success: false, error: "Missing practiceId or userId" }
    }
    
    try {
      const res = await fetch(`/api/practices/${practiceId}/time/stamps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, action: "clock_in", location, comment }),
      })
      const data = await res.json()
      if (!res.ok) {
        return { success: false, error: data.error || "Failed to clock in" }
      }
      return { success: true, ...data }
    } catch (error: any) {
      return { success: false, error: error.message || "Failed to clock in" }
    }
  }

  const clockOut = async (blockId?: string, comment?: string) => {
    if (!practiceId || !userId) {
      return { success: false, error: "Missing practiceId or userId" }
    }
    
    try {
      const res = await fetch(`/api/practices/${practiceId}/time/stamps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, action: "clock_out", comment }),
      })
      const data = await res.json()
      if (!res.ok) {
        return { success: false, error: data.error || "Failed to clock out" }
      }
      return { success: true, ...data }
    } catch (error: any) {
      return { success: false, error: error.message || "Failed to clock out" }
    }
  }

  const startBreak = async (blockId?: string) => {
    if (!practiceId || !userId) {
      return { success: false, error: "Missing practiceId or userId" }
    }
    
    try {
      const res = await fetch(`/api/practices/${practiceId}/time/breaks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, block_id: blockId }),
      })
      const data = await res.json()
      if (!res.ok) {
        return { success: false, error: data.error || "Failed to start break" }
      }
      return { success: true, ...data }
    } catch (error: any) {
      return { success: false, error: error.message || "Failed to start break" }
    }
  }

  const endBreak = async (breakId: string) => {
    if (!practiceId || !userId) {
      return { success: false, error: "Missing practiceId or userId" }
    }
    
    try {
      const res = await fetch(`/api/practices/${practiceId}/time/breaks/${breakId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ end_time: new Date().toISOString() }),
      })
      const data = await res.json()
      if (!res.ok) {
        return { success: false, error: data.error || "Failed to end break" }
      }
      return { success: true, ...data }
    } catch (error: any) {
      return { success: false, error: error.message || "Failed to end break" }
    }
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

  // Ensure we always return an array, even if data is undefined or null
  const issues = Array.isArray(data) ? data : []

  return {
    issues,
    isLoading,
    error,
    mutate,
  }
}

// Main hook combining all time tracking functionality
export function useTimeTracking(practiceId: string | null, userId: string | undefined) {
  const status = useTimeTrackingStatus(practiceId, userId)
  const actions = useTimeActions(practiceId, userId)
  
  return {
    ...status,
    ...actions,
  }
}
