"use client"

import { createContext, useContext, useMemo, useCallback, type ReactNode } from "react"
import useSWR, { useSWRConfig } from "swr"
import type { User } from "./user-context"
import { usePractice } from "./practice-context"
import { useUser } from "./user-context"
import { SWR_KEYS, DEFAULT_PRACTICE_ID } from "@/lib/swr-keys"
import { swrFetcher, mutationFetcher } from "@/lib/swr-fetcher"
import { toast } from "sonner"

interface TeamMember extends User {
  permissions: string[]
  lastActive: string
  teamIds: string[]
  dateOfBirth?: string
  status?: string
  first_name?: string
  last_name?: string
  user_id?: string
}

interface Team {
  id: string
  name: string
  description: string
  color: string
  memberCount: number
  createdAt: string
  isActive: boolean
  sortOrder: number
}

interface TeamContextType {
  teamMembers: TeamMember[]
  teams: Team[]
  practiceId: string
  addTeam: (team: Omit<Team, "id" | "createdAt" | "memberCount" | "sortOrder">) => void
  updateTeam: (id: string, updates: Partial<Team>) => void
  deleteTeam: (id: string) => void
  reorderTeams: (teamIds: string[]) => Promise<void>
  assignMemberToTeam: (memberId: string, teamId: string) => void
  removeMemberFromTeam: (memberId: string, teamId: string) => void
  addTeamMember: (member: Omit<TeamMember, "id" | "joinedAt">) => void
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => void
  removeTeamMember: (id: string) => void
  inviteTeamMember: (email: string, role: User["role"]) => void
  pendingInvites: PendingInvite[]
  loading: boolean
  refetchTeamMembers: () => Promise<void>
}

interface PendingInvite {
  id: string
  email: string
  role: User["role"]
  sentAt: string
  status: "pending" | "accepted" | "expired"
}

const TeamContext = createContext<TeamContextType | undefined>(undefined)

export function TeamProvider({ children }: { children: ReactNode }) {
  const { currentPractice, isLoading: practiceLoading } = usePractice()
  const { currentUser, loading: userLoading } = useUser()
  const { mutate: globalMutate } = useSWRConfig()

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

  // Normalize data (handle both array and object responses)
  const teams = useMemo(() => {
    if (!teamsData) return []
    const result = Array.isArray(teamsData) ? teamsData : (teamsData as { teams: Team[] }).teams || []
    console.log("[v0] TeamContext - teams processed:", { teamsData, result: result.length })
    return result
  }, [teamsData])

  const teamMembers = useMemo(() => {
    if (!membersData) return []
    const rawMembers = Array.isArray(membersData)
      ? membersData
      : (membersData as { members: TeamMember[] }).members || []
    const result = rawMembers.map((m: Partial<TeamMember> & Record<string, unknown>) => ({
      ...m,
      id: (m.id || m.user_id) as string,
      name: m.name || `${m.first_name || ""} ${m.last_name || ""}`.trim() || "Unknown",
      practiceId: (m.practice_id as string)?.toString() || practiceId,
      teamIds: (m.team_ids as string[]) || m.teamIds || [],
      permissions: m.permissions || [],
      lastActive: (m.last_active as string) || m.lastActive || new Date().toISOString(),
      isActive: (m.is_active as boolean) ?? true,
      joinedAt: (m.created_at as string) || m.joinedAt || new Date().toISOString(),
    })) as TeamMember[]
    console.log("[v0] TeamContext - teamMembers processed:", { membersData, result: result.length })
    return result
  }, [membersData, practiceId])

  // Pending invites local state (not fetched from server yet)
  const pendingInvites: PendingInvite[] = []

  const refetchTeamMembers = useCallback(async () => {
    await Promise.all([mutateTeams(), mutateMembers()])
  }, [mutateTeams, mutateMembers])

  const addTeam = useCallback(
    async (team: Omit<Team, "id" | "createdAt" | "memberCount" | "sortOrder">) => {
      const newTeam: Team = {
        ...team,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        memberCount: 0,
        sortOrder: teams.length,
      }

      await mutateTeams(
        (current) => {
          const arr = Array.isArray(current) ? current : (current as any)?.teams || []
          return [...arr, newTeam]
        },
        { revalidate: false },
      )

      try {
        await mutationFetcher(SWR_KEYS.teams(practiceId), {
          method: "POST",
          body: team,
        })
        toast.success("Team erstellt")
        await mutateTeams()
      } catch (error) {
        // Rollback
        await mutateTeams()
        toast.error("Fehler beim Erstellen des Teams")
      }
    },
    [practiceId, teams.length, mutateTeams],
  )

  const updateTeam = useCallback(
    async (id: string, updates: Partial<Team>) => {
      await mutateTeams(
        (current) => {
          const arr = Array.isArray(current) ? current : (current as any)?.teams || []
          return arr.map((t: Team) => (t.id === id ? { ...t, ...updates } : t))
        },
        { revalidate: false },
      )

      try {
        await mutationFetcher(`${SWR_KEYS.teams(practiceId)}/${id}`, {
          method: "PUT",
          body: updates,
        })
      } catch (error) {
        await mutateTeams()
        toast.error("Fehler beim Aktualisieren des Teams")
      }
    },
    [practiceId, mutateTeams],
  )

  const deleteTeam = useCallback(
    async (id: string) => {
      await mutateTeams(
        (current) => {
          const arr = Array.isArray(current) ? current : (current as any)?.teams || []
          return arr.filter((t: Team) => t.id !== id)
        },
        { revalidate: false },
      )

      try {
        await mutationFetcher(`${SWR_KEYS.teams(practiceId)}/${id}`, {
          method: "DELETE",
        })
        toast.success("Team gelöscht")
      } catch (error) {
        await mutateTeams()
        toast.error("Fehler beim Löschen des Teams")
      }
    },
    [practiceId, mutateTeams],
  )

  const reorderTeams = useCallback(
    async (teamIds: string[]) => {
      const reorderedTeams = teamIds
        .map((id, index) => {
          const team = teams.find((t) => t.id === id)
          return team ? { ...team, sortOrder: index } : null
        })
        .filter(Boolean) as Team[]

      await mutateTeams(reorderedTeams, { revalidate: false })

      try {
        await fetch(`/api/practices/${practiceId}/teams/reorder`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ teamIds }),
        })
      } catch (error) {
        console.error("Error reordering teams:", error)
        await mutateTeams()
      }
    },
    [practiceId, teams, mutateTeams],
  )

  const assignMemberToTeam = useCallback(
    async (memberId: string, teamId: string) => {
      await mutateMembers(
        (current) => {
          const arr = Array.isArray(current) ? current : (current as any)?.members || []
          return arr.map((m: TeamMember) =>
            m.id === memberId ? { ...m, teamIds: [...new Set([...(m.teamIds || []), teamId])] } : m,
          )
        },
        { revalidate: false },
      )

      try {
        await fetch(`/api/practices/${practiceId}/team-members/${memberId}/assign`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ teamId }),
        })
      } catch (error) {
        console.error("Error assigning member:", error)
        await mutateMembers()
      }
    },
    [practiceId, mutateMembers],
  )

  const removeMemberFromTeam = useCallback(
    async (memberId: string, teamId: string) => {
      await mutateMembers(
        (current) => {
          const arr = Array.isArray(current) ? current : (current as any)?.members || []
          return arr.map((m: TeamMember) =>
            m.id === memberId ? { ...m, teamIds: (m.teamIds || []).filter((t) => t !== teamId) } : m,
          )
        },
        { revalidate: false },
      )

      try {
        await fetch(`/api/practices/${practiceId}/team-members/${memberId}/unassign`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ teamId }),
        })
      } catch (error) {
        console.error("Error removing member:", error)
        await mutateMembers()
      }
    },
    [practiceId, mutateMembers],
  )

  const addTeamMember = useCallback(
    async (member: Omit<TeamMember, "id" | "joinedAt">) => {
      const newMember: TeamMember = {
        ...member,
        id: crypto.randomUUID(),
        joinedAt: new Date().toISOString(),
        practiceId: practiceId,
      }

      await mutateMembers(
        (current) => {
          const arr = Array.isArray(current) ? current : (current as any)?.members || []
          return [...arr, newMember]
        },
        { revalidate: false },
      )

      try {
        await mutationFetcher(SWR_KEYS.teamMembers(practiceId), {
          method: "POST",
          body: member,
        })
        toast.success("Teammitglied hinzugefügt")
        await mutateMembers()
      } catch (error) {
        await mutateMembers()
        toast.error("Fehler beim Hinzufügen")
      }
    },
    [practiceId, mutateMembers],
  )

  const updateTeamMember = useCallback(
    async (id: string, updates: Partial<TeamMember>) => {
      await mutateMembers(
        (current) => {
          const arr = Array.isArray(current) ? current : (current as any)?.members || []
          return arr.map((m: TeamMember) => (m.id === id ? { ...m, ...updates } : m))
        },
        { revalidate: false },
      )

      try {
        await mutationFetcher(`${SWR_KEYS.teamMembers(practiceId)}/${id}`, {
          method: "PUT",
          body: updates,
        })
      } catch (error) {
        await mutateMembers()
        toast.error("Fehler beim Aktualisieren")
      }
    },
    [practiceId, mutateMembers],
  )

  const removeTeamMember = useCallback(
    async (id: string) => {
      await mutateMembers(
        (current) => {
          const arr = Array.isArray(current) ? current : (current as any)?.members || []
          return arr.filter((m: TeamMember) => m.id !== id)
        },
        { revalidate: false },
      )

      try {
        await mutationFetcher(`${SWR_KEYS.teamMembers(practiceId)}/${id}`, {
          method: "DELETE",
        })
        toast.success("Teammitglied entfernt")
      } catch (error) {
        await mutateMembers()
        toast.error("Fehler beim Entfernen")
      }
    },
    [practiceId, mutateMembers],
  )

  const inviteTeamMember = useCallback(
    async (email: string, role: User["role"]) => {
      try {
        await fetch(`/api/practices/${practiceId}/invites`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, role }),
        })
        toast.success("Einladung gesendet")
      } catch (error) {
        toast.error("Fehler beim Senden der Einladung")
      }
    },
    [practiceId],
  )

  const contextValue = useMemo(
    () => ({
      teams,
      teamMembers,
      practiceId,
      addTeam,
      updateTeam,
      deleteTeam,
      reorderTeams,
      assignMemberToTeam,
      removeMemberFromTeam,
      addTeamMember,
      updateTeamMember,
      removeTeamMember,
      inviteTeamMember,
      pendingInvites,
      loading: userLoading || practiceLoading || teamsLoading || membersLoading,
      refetchTeamMembers,
    }),
    [
      teams,
      teamMembers,
      practiceId,
      addTeam,
      updateTeam,
      deleteTeam,
      reorderTeams,
      assignMemberToTeam,
      removeMemberFromTeam,
      addTeamMember,
      updateTeamMember,
      removeTeamMember,
      inviteTeamMember,
      pendingInvites,
      userLoading,
      practiceLoading,
      teamsLoading,
      membersLoading,
      refetchTeamMembers,
    ],
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
