import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

// Hook for all quality circle data
export function useQualityCircles(practiceId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    practiceId ? `/api/practices/${practiceId}/quality-circles` : null,
    fetcher,
    { revalidateOnFocus: true }
  )

  return {
    sessions: data?.sessions || [],
    topics: data?.topics || [],
    actions: data?.actions || [],
    benchmarks: data?.benchmarks || [],
    isLoading,
    error,
    mutate,
  }
}

export function useQualityCircleSessions(practiceId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    practiceId ? `/api/practices/${practiceId}/quality-circles?type=sessions` : null,
    fetcher,
    { revalidateOnFocus: true }
  )

  return {
    sessions: data || [],
    isLoading,
    error,
    mutate,
  }
}

export function useQualityCircleTopics(practiceId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    practiceId ? `/api/practices/${practiceId}/quality-circles?type=topics` : null,
    fetcher,
    { revalidateOnFocus: true }
  )

  return {
    topics: data || [],
    isLoading,
    error,
    mutate,
  }
}

export function useQualityCircleActions(practiceId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    practiceId ? `/api/practices/${practiceId}/quality-circles?type=actions` : null,
    fetcher,
    { revalidateOnFocus: true }
  )

  return {
    actions: data || [],
    isLoading,
    error,
    mutate,
  }
}

export function useQualityBenchmarks(practiceId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    practiceId ? `/api/practices/${practiceId}/quality-circles?type=benchmarks` : null,
    fetcher,
    { revalidateOnFocus: true }
  )

  return {
    benchmarks: data || [],
    isLoading,
    error,
    mutate,
  }
}

export function useTeamMembersForQuality(practiceId: string | null) {
  const { data, error, isLoading } = useSWR(
    practiceId ? `/api/practices/${practiceId}/team-members` : null,
    fetcher
  )

  return {
    teamMembers: data || [],
    isLoading,
    error,
  }
}

// Mutation helpers
export async function createQualityCircleItem(
  practiceId: string,
  type: "session" | "topic" | "action",
  data: Record<string, any>
) {
  const response = await fetch(`/api/practices/${practiceId}/quality-circles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, ...data }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to create item")
  }

  return response.json()
}

export async function updateQualityCircleItem(
  practiceId: string,
  type: "session" | "topic" | "action",
  id: string,
  updates: Record<string, any>
) {
  const response = await fetch(`/api/practices/${practiceId}/quality-circles`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, id, ...updates }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to update item")
  }

  return response.json()
}
