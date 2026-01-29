import useSWR from "swr"

const fetcher = async (url: string) => {
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to fetch")
  return res.json()
}

export function useTrainingData(practiceId: string | undefined) {
  const coursesUrl = practiceId ? `/api/practices/${practiceId}/training/courses` : null
  const eventsUrl = practiceId ? `/api/practices/${practiceId}/training/events` : null
  const certificationsUrl = practiceId ? `/api/practices/${practiceId}/training/certifications` : null
  const teamMemberCertificationsUrl = practiceId ? `/api/practices/${practiceId}/training/team-member-certifications` : null
  const budgetsUrl = practiceId ? `/api/practices/${practiceId}/training/budgets` : null

  const { data: coursesData, error: coursesError, mutate: mutateCourses } = useSWR(
    coursesUrl,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 2000 }
  )

  const { data: eventsData, error: eventsError, mutate: mutateEvents } = useSWR(
    eventsUrl,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 2000 }
  )

  const { data: certificationsData, error: certificationsError, mutate: mutateCertifications } = useSWR(
    certificationsUrl,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 2000 }
  )

  const { data: teamMemberCertificationsData, error: teamMemberCertificationsError, mutate: mutateTeamMemberCertifications } = useSWR(
    teamMemberCertificationsUrl,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 2000 }
  )

  const { data: budgetsData, error: budgetsError, mutate: mutateBudgets } = useSWR(
    budgetsUrl,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 2000 }
  )

  const isLoading =
    !coursesData && !coursesError ||
    !eventsData && !eventsError ||
    !certificationsData && !certificationsError ||
    !teamMemberCertificationsData && !teamMemberCertificationsError ||
    !budgetsData && !budgetsError

  const error =
    coursesError ||
    eventsError ||
    certificationsError ||
    teamMemberCertificationsError ||
    budgetsError

  // Refresh all data
  const refresh = async () => {
    await Promise.all([
      mutateCourses(),
      mutateEvents(),
      mutateCertifications(),
      mutateTeamMemberCertifications(),
      mutateBudgets(),
    ])
  }

  return {
    data: {
      courses: coursesData?.courses || [],
      events: eventsData?.events || [],
      certifications: certificationsData?.certifications || [],
      teamMemberCertifications: teamMemberCertificationsData?.teamMemberCertifications || [],
      budgets: budgetsData?.budgets || [],
    },
    isLoading,
    error,
    refresh,
    mutateCourses,
    mutateEvents,
    mutateCertifications,
    mutateTeamMemberCertifications,
    mutateBudgets,
  }
}
