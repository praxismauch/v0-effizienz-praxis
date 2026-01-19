import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useIgelAnalyses(practiceId: string | number | null | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    practiceId ? `/api/practices/${practiceId}/igel` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  )

  return {
    analyses: data || [],
    isLoading,
    error,
    mutate,
  }
}

// Helper functions for mutations
export async function createIgelAnalysis(
  practiceId: string | number,
  data: Record<string, any>
) {
  const response = await fetch(`/api/practices/${practiceId}/igel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to create IGEL analysis")
  }

  return response.json()
}

export async function updateIgelAnalysis(
  practiceId: string | number,
  id: string,
  data: Record<string, any>
) {
  const response = await fetch(`/api/practices/${practiceId}/igel/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to update IGEL analysis")
  }

  return response.json()
}

export async function deleteIgelAnalysis(
  practiceId: string | number,
  id: string
) {
  const response = await fetch(`/api/practices/${practiceId}/igel/${id}`, {
    method: "DELETE",
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to delete IGEL analysis")
  }

  return response.json()
}
