import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

/**
 * Hook for fetching a team member's responsibilities
 */
export function useTeamMemberResponsibilities(practiceId: string | null, memberId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    practiceId && memberId ? `/api/practices/${practiceId}/team-members/${memberId}/responsibilities` : null,
    fetcher,
    {
      revalidateOnFocus: true,
    }
  )

  return {
    responsibilities: data || [],
    isLoading,
    error,
    mutate,
  }
}

/**
 * Hook for fetching team member arbeitsmittel assignments
 */
export function useTeamMemberArbeitsmittel(practiceId: string | null, memberId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    practiceId && memberId ? `/api/practices/${practiceId}/team-members/${memberId}/arbeitsmittel` : null,
    fetcher,
    {
      revalidateOnFocus: true,
    }
  )

  return {
    assignments: data || [],
    isLoading,
    error,
    mutate,
  }
}
