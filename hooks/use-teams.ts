"use client"

import useSWR from "swr"
import { SWR_KEYS, DEFAULT_PRACTICE_ID } from "@/lib/swr-keys"
import { swrFetcher, mutationFetcher } from "@/lib/swr-fetcher"

// Types
export interface Team {
  id: string
  practice_id: number
  name: string
  description: string | null
  color: string
  is_active: boolean
  is_default: boolean
  member_count?: number
  created_at: string
  updated_at: string | null
}

export interface TeamMember {
  id: string
  team_id: string
  user_id: string
  practice_id: number
  role: string
  position: string | null
  is_leader: boolean
  joined_at: string
  user?: {
    id: string
    email: string
    name: string | null
    avatar_url: string | null
  }
  team?: {
    id: string
    name: string
    color: string
  }
}

interface TeamsResponse {
  teams?: Team[]
  data?: Team[]
}

interface TeamMembersResponse {
  members?: TeamMember[]
  teamMembers?: TeamMember[]
  data?: TeamMember[]
}

const SWR_CONFIG = {
  revalidateOnFocus: false,
  dedupingInterval: 300, // Reduced from 5000ms
}

/**
 * Hook for fetching teams for a practice (hardcoded to practice 1)
 */
export function useTeams(practiceId = DEFAULT_PRACTICE_ID) {
  const { data, error, isLoading, mutate } = useSWR<TeamsResponse>(SWR_KEYS.teams(practiceId), swrFetcher, SWR_CONFIG)

  // Handle both array and object responses
  const teams = Array.isArray(data) ? data : data?.teams || data?.data || []

  return {
    teams,
    isLoading,
    error,
    refresh: () => mutate(),
    mutate,
  }
}

/**
 * Hook for fetching team members for a practice (hardcoded to practice 1)
 */
export function useTeamMembers(practiceId = DEFAULT_PRACTICE_ID) {
  const { data, error, isLoading, mutate } = useSWR<TeamMembersResponse>(
    SWR_KEYS.teamMembers(practiceId),
    swrFetcher,
    SWR_CONFIG,
  )

  // Handle different response formats: { teamMembers: [...] }, { members: [...] }, { data: [...] }, or direct array
  const members = Array.isArray(data) ? data : data?.teamMembers || data?.members || data?.data || []

  return {
    members,
    isLoading,
    error,
    refresh: () => mutate(),
    mutate,
  }
}

/**
 * Hook with team mutations (create, update, delete)
 */
export function useTeamMutations(practiceId = DEFAULT_PRACTICE_ID) {
  const { mutate: mutateTeams } = useTeams(practiceId)
  const { mutate: mutateMembers } = useTeamMembers(practiceId)

  const createTeam = async (teamData: {
    name: string
    color: string
    description?: string
  }) => {
    const result = await mutationFetcher<Team>(SWR_KEYS.teams(practiceId), {
      method: "POST",
      body: teamData,
    })
    await mutateTeams()
    return result
  }

  const updateTeam = async (teamId: string, teamData: Partial<Team>) => {
    const result = await mutationFetcher<Team>(`${SWR_KEYS.teams(practiceId)}/${teamId}`, {
      method: "PUT",
      body: teamData,
    })
    await mutateTeams()
    return result
  }

  const deleteTeam = async (teamId: string) => {
    await mutationFetcher<void>(`${SWR_KEYS.teams(practiceId)}/${teamId}`, {
      method: "DELETE",
    })
    await mutateTeams()
  }

  const addTeamMember = async (memberData: {
    team_id: string
    user_id: string
    role?: string
    position?: string
    is_leader?: boolean
  }) => {
    const result = await mutationFetcher<TeamMember>(SWR_KEYS.teamMembers(practiceId), {
      method: "POST",
      body: memberData,
    })
    await Promise.all([mutateTeams(), mutateMembers()])
    return result
  }

  const removeTeamMember = async (memberId: string) => {
    await mutationFetcher<void>(`${SWR_KEYS.teamMembers(practiceId)}/${memberId}`, {
      method: "DELETE",
    })
    await Promise.all([mutateTeams(), mutateMembers()])
  }

  return {
    createTeam,
    updateTeam,
    deleteTeam,
    addTeamMember,
    removeTeamMember,
  }
}
