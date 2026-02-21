"use client"

import { createContext, useContext, useMemo, useCallback, type ReactNode } from "react"
import useSWR from "swr"
import { usePractice } from "./practice-context"
import { useUser } from "./user-context"
import { SWR_KEYS, DEFAULT_PRACTICE_ID } from "@/lib/swr-keys"
import { swrFetcher } from "@/lib/swr-fetcher"
import type { TeamMember, Team, TeamContextType, PendingInvite } from "./team-types"
import { createTeamActions, createMemberActions } from "./team-api"

export type { TeamMember, Team, TeamContextType, PendingInvite } from "./team-types"

const TeamContext = createContext<TeamContextType | undefined>(undefined)

export function TeamProvider({ children }: { children: ReactNode }) {
  const { currentPractice, isLoading: practiceLoading } = usePractice()
  const { currentUser, loading: userLoading } = useUser()

  const practiceId = currentPractice?.id || DEFAULT_PRACTICE_ID

  const {
    data: teamsData,
    isLoading: teamsLoading,
    mutate: mutateTeams,
  } = useSWR<Team[] | { teams: Team[] }>(
    !userLoading && !practiceLoading && currentUser?.id ? SWR_KEYS.teams(practiceId) : null,
    swrFetcher,
    { revalidateOnFocus: false, dedupingInterval: 5000 },
  )

  const {
    data: membersData,
    isLoading: membersLoading,
    mutate: mutateMembers,
  } = useSWR<TeamMember[] | { members: TeamMember[] }>(
    !userLoading && !practiceLoading && currentUser?.id ? SWR_KEYS.teamMembers(practiceId) : null,
    swrFetcher,
    { revalidateOnFocus: false, dedupingInterval: 5000 },
  )

  // Normalize data
  const teams = useMemo(() => {
    if (!teamsData) return []
    return Array.isArray(teamsData) ? teamsData : (teamsData as { teams: Team[] }).teams || []
  }, [teamsData])

  const teamMembers = useMemo(() => {
    if (!membersData) return []
    const rawMembers = Array.isArray(membersData)
      ? membersData
      : (membersData as { teamMembers?: TeamMember[]; members?: TeamMember[] }).teamMembers ||
        (membersData as { members?: TeamMember[] }).members || []
    return rawMembers.map((m: Partial<TeamMember> & Record<string, unknown>) => ({
      ...m,
      id: (m.id || m.user_id) as string,
      team_member_id: m.team_member_id as string | undefined,
      user_id: m.user_id as string | undefined,
      first_name: (m.first_name as string) || "",
      last_name: (m.last_name as string) || "",
      name: m.name || `${m.first_name || ""} ${m.last_name || ""}`.trim() || "Unknown",
      email: (m.email as string) || "",
      role: (m.role as string) || "user",
      avatar: (m.avatar as string) || (m.avatar_url as string) || "",
      date_of_birth: (m.date_of_birth as string) || "",
      practiceId: (m.practice_id as string)?.toString() || practiceId,
      practice_id: (m.practice_id as string) || practiceId,
      teamIds: (m.team_ids as string[]) || m.teamIds || [],
      permissions: m.permissions || [],
      lastActive: (m.last_active as string) || m.lastActive || new Date().toISOString(),
      isActive: (m.is_active as boolean) ?? true,
      joinedAt: (m.created_at as string) || m.joinedAt || new Date().toISOString(),
    })) as TeamMember[]
  }, [membersData, practiceId])

  const pendingInvites: PendingInvite[] = []

  const refetchTeamMembers = useCallback(async () => {
    await Promise.all([mutateTeams(), mutateMembers()])
  }, [mutateTeams, mutateMembers])

  const teamActions = useMemo(
    () => createTeamActions(practiceId, teams, mutateTeams, mutateMembers),
    [practiceId, teams, mutateTeams, mutateMembers],
  )

  const memberActions = useMemo(
    () => createMemberActions(practiceId, mutateTeams, mutateMembers),
    [practiceId, mutateTeams, mutateMembers],
  )

  const contextValue = useMemo<TeamContextType>(
    () => ({
      teams,
      teamMembers,
      practiceId,
      ...teamActions,
      ...memberActions,
      pendingInvites,
      loading: userLoading || practiceLoading || teamsLoading || membersLoading,
      refetchTeamMembers,
    }),
    [teams, teamMembers, practiceId, teamActions, memberActions, pendingInvites, userLoading, practiceLoading, teamsLoading, membersLoading, refetchTeamMembers],
  )

  return <TeamContext.Provider value={contextValue}>{children}</TeamContext.Provider>
}

export function useTeam() {
  const context = useContext(TeamContext)
  if (context === undefined) {
    throw new Error("useTeam must be used within a TeamProvider")
  }
  return context
}

export default TeamProvider
