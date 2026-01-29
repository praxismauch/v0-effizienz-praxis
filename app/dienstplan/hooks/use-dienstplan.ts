"use client"

import useSWR from "swr"
import { useMemo } from "react"
import type { Schedule, ShiftType, TeamMember, Availability } from "../types"

interface DienstplanData {
  schedules: Schedule[]
  shiftTypes: ShiftType[]
  teamMembers: TeamMember[]
  availabilities: Availability[]
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch")
  return res.json()
}

export function useDienstplan(practiceId: string | undefined, weekStart: string, weekEnd: string) {
  // Fetch schedules for the week
  const schedulesUrl = practiceId
    ? `/api/practices/${practiceId}/dienstplan/schedules?start=${weekStart}&end=${weekEnd}`
    : null

  const {
    data: schedulesData,
    error: schedulesError,
    mutate: mutateSchedules,
    isLoading: schedulesLoading,
  } = useSWR<{ schedules: Schedule[] }>(schedulesUrl, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 2000,
  })

  // Fetch shift types
  const shiftTypesUrl = practiceId ? `/api/practices/${practiceId}/dienstplan/shift-types` : null

  const {
    data: shiftTypesData,
    error: shiftTypesError,
    mutate: mutateShiftTypes,
    isLoading: shiftTypesLoading,
  } = useSWR<{ shiftTypes: ShiftType[] }>(shiftTypesUrl, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  })

  // Fetch team members
  const teamMembersUrl = practiceId ? `/api/practices/${practiceId}/team-members` : null

  const {
    data: teamMembersData,
    error: teamMembersError,
    mutate: mutateTeamMembers,
    isLoading: teamMembersLoading,
  } = useSWR<{ teamMembers: TeamMember[] }>(teamMembersUrl, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  })

  // Fetch availabilities
  const availabilitiesUrl = practiceId
    ? `/api/practices/${practiceId}/dienstplan/availability?start=${weekStart}&end=${weekEnd}`
    : null

  const {
    data: availabilitiesData,
    error: availabilitiesError,
    mutate: mutateAvailabilities,
    isLoading: availabilitiesLoading,
  } = useSWR<{ availabilities: Availability[] }>(availabilitiesUrl, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 2000,
  })

  const isLoading =
    schedulesLoading || shiftTypesLoading || teamMembersLoading || availabilitiesLoading

  const error =
    schedulesError || shiftTypesError || teamMembersError || availabilitiesError

  const data = useMemo<DienstplanData>(
    () => ({
      schedules: schedulesData?.schedules || [],
      shiftTypes: shiftTypesData?.shiftTypes || [],
      teamMembers: teamMembersData?.teamMembers || [],
      availabilities: availabilitiesData?.availabilities || [],
    }),
    [schedulesData, shiftTypesData, teamMembersData, availabilitiesData],
  )

  // Refresh all data
  const refresh = async () => {
    await Promise.all([
      mutateSchedules(),
      mutateShiftTypes(),
      mutateTeamMembers(),
      mutateAvailabilities(),
    ])
  }

  // Refresh only schedules (faster for schedule updates)
  const refreshSchedules = async () => {
    await mutateSchedules()
  }

  // Refresh only availabilities
  const refreshAvailabilities = async () => {
    await mutateAvailabilities()
  }

  return {
    data,
    isLoading,
    error,
    refresh,
    refreshSchedules,
    refreshAvailabilities,
    mutateSchedules,
    mutateShiftTypes,
    mutateTeamMembers,
    mutateAvailabilities,
  }
}
