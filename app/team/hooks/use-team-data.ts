import useSWR from "swr"

const fetcher = async (url: string) => {
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to fetch")
  return res.json()
}

export function useTeamData(practiceId: string | undefined) {
  const teamMembersUrl = practiceId ? `/api/practices/${practiceId}/team-members` : null
  const teamsUrl = practiceId ? `/api/practices/${practiceId}/teams` : null
  const responsibilitiesUrl = practiceId ? `/api/practices/${practiceId}/responsibilities` : null
  const staffingPlansUrl = practiceId ? `/api/practices/${practiceId}/staffing-plans` : null
  const holidayRequestsUrl = practiceId ? `/api/practices/${practiceId}/holiday-requests` : null
  const sickLeavesUrl = practiceId ? `/api/practices/${practiceId}/sick-leaves` : null

  const { data: teamMembersData, error: teamMembersError, mutate: mutateTeamMembers } = useSWR(
    teamMembersUrl,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 2000 }
  )

  const { data: teamsData, error: teamsError, mutate: mutateTeams } = useSWR(
    teamsUrl,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 2000 }
  )

  const { data: responsibilitiesData, error: responsibilitiesError, mutate: mutateResponsibilities } = useSWR(
    responsibilitiesUrl,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 2000 }
  )

  const { data: staffingPlansData, error: staffingPlansError, mutate: mutateStaffingPlans } = useSWR(
    staffingPlansUrl,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 2000 }
  )

  const { data: holidayRequestsData, error: holidayRequestsError, mutate: mutateHolidayRequests } = useSWR(
    holidayRequestsUrl,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 2000 }
  )

  const { data: sickLeavesData, error: sickLeavesError, mutate: mutateSickLeaves } = useSWR(
    sickLeavesUrl,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 2000 }
  )

  const isLoading =
    !teamMembersData && !teamMembersError ||
    !teamsData && !teamsError ||
    !responsibilitiesData && !responsibilitiesError ||
    !staffingPlansData && !staffingPlansError ||
    !holidayRequestsData && !holidayRequestsError ||
    !sickLeavesData && !sickLeavesError

  const error =
    teamMembersError ||
    teamsError ||
    responsibilitiesError ||
    staffingPlansError ||
    holidayRequestsError ||
    sickLeavesError

  // Refresh all data
  const refresh = async () => {
    await Promise.all([
      mutateTeamMembers(),
      mutateTeams(),
      mutateResponsibilities(),
      mutateStaffingPlans(),
      mutateHolidayRequests(),
      mutateSickLeaves(),
    ])
  }

  return {
    data: {
      teamMembers: teamMembersData?.teamMembers || [],
      teams: teamsData?.teams || [],
      responsibilities: responsibilitiesData?.responsibilities || [],
      staffingPlans: staffingPlansData?.staffingPlans || [],
      holidayRequests: holidayRequestsData?.holidayRequests || [],
      sickLeaves: sickLeavesData?.sickLeaves || [],
    },
    isLoading,
    error,
    refresh,
    mutateTeamMembers,
    mutateTeams,
    mutateResponsibilities,
    mutateStaffingPlans,
    mutateHolidayRequests,
    mutateSickLeaves,
  }
}
