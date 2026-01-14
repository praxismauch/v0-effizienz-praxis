"use client"

import { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo, type ReactNode } from "react"
import type { User } from "./user-context"
import { usePractice } from "./practice-context"
import { useUser } from "./user-context"
import { toast } from "sonner"

const HARDCODED_PRACTICE_ID = "1"

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
  const [teams, setTeams] = useState<Team[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([])
  const [loading, setLoading] = useState(true)
  const hasFetched = useRef(false)

  const { currentPractice, isLoading: practiceLoading } = usePractice()
  const { currentUser, loading: userLoading } = useUser()

  const practiceId = HARDCODED_PRACTICE_ID

  const fetchTeamsAndMembers = useCallback(async () => {
    if (!practiceId) return

    setLoading(true)

    try {
      // Fetch teams and members in parallel
      const [teamsResponse, membersResponse] = await Promise.all([
        fetch(`/api/practices/${practiceId}/teams`, { credentials: "include" }),
        fetch(`/api/practices/${practiceId}/team-members`, { credentials: "include" }),
      ])

      if (teamsResponse.ok) {
        const teamsData = await teamsResponse.json()
        const fetchedTeams = Array.isArray(teamsData) ? teamsData : teamsData.teams || []
        setTeams(fetchedTeams)
      }

      if (membersResponse.ok) {
        const membersData = await membersResponse.json()
        const fetchedMembers = Array.isArray(membersData) ? membersData : membersData.members || []
        setTeamMembers(
          fetchedMembers.map((m: any) => ({
            ...m,
            id: m.id || m.user_id,
            name: m.name || `${m.first_name || ""} ${m.last_name || ""}`.trim() || "Unknown",
            practiceId: m.practice_id?.toString() || practiceId,
            teamIds: m.team_ids || m.teamIds || [],
            permissions: m.permissions || [],
            lastActive: m.last_active || m.lastActive || new Date().toISOString(),
            isActive: m.is_active ?? true,
            joinedAt: m.created_at || m.joinedAt || new Date().toISOString(),
          })),
        )
      }
    } catch (error) {
      console.error("Error fetching teams/members:", error)
    } finally {
      setLoading(false)
    }
  }, [practiceId])

  useEffect(() => {
    if (userLoading || practiceLoading) return
    if (!currentUser?.id) {
      setLoading(false)
      return
    }
    if (hasFetched.current) return

    hasFetched.current = true
    fetchTeamsAndMembers()
  }, [currentUser, userLoading, practiceLoading, fetchTeamsAndMembers])

  const refetchTeamMembers = useCallback(async () => {
    hasFetched.current = false
    await fetchTeamsAndMembers()
  }, [fetchTeamsAndMembers])

  const addTeam = useCallback(
    async (team: Omit<Team, "id" | "createdAt" | "memberCount" | "sortOrder">) => {
      const newTeam: Team = {
        ...team,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        memberCount: 0,
        sortOrder: teams.length,
      }

      // Optimistic update
      setTeams((prev) => [...prev, newTeam])

      try {
        const response = await fetch(`/api/practices/${practiceId}/teams`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(team),
        })

        if (response.ok) {
          const data = await response.json()
          // Update with server response
          setTeams((prev) => prev.map((t) => (t.id === newTeam.id ? { ...newTeam, ...data } : t)))
          toast.success("Team erstellt")
        } else {
          // Rollback
          setTeams((prev) => prev.filter((t) => t.id !== newTeam.id))
          toast.error("Fehler beim Erstellen des Teams")
        }
      } catch (error) {
        setTeams((prev) => prev.filter((t) => t.id !== newTeam.id))
        toast.error("Fehler beim Erstellen des Teams")
      }
    },
    [practiceId, teams.length],
  )

  const updateTeam = useCallback(
    async (id: string, updates: Partial<Team>) => {
      const previousTeams = teams

      // Optimistic update
      setTeams((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)))

      try {
        const response = await fetch(`/api/practices/${practiceId}/teams/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(updates),
        })

        if (!response.ok) {
          setTeams(previousTeams)
          toast.error("Fehler beim Aktualisieren des Teams")
        }
      } catch (error) {
        setTeams(previousTeams)
        toast.error("Fehler beim Aktualisieren des Teams")
      }
    },
    [practiceId, teams],
  )

  const deleteTeam = useCallback(
    async (id: string) => {
      const previousTeams = teams

      // Optimistic update
      setTeams((prev) => prev.filter((t) => t.id !== id))

      try {
        const response = await fetch(`/api/practices/${practiceId}/teams/${id}`, {
          method: "DELETE",
          credentials: "include",
        })

        if (response.ok) {
          toast.success("Team gelöscht")
        } else {
          setTeams(previousTeams)
          toast.error("Fehler beim Löschen des Teams")
        }
      } catch (error) {
        setTeams(previousTeams)
        toast.error("Fehler beim Löschen des Teams")
      }
    },
    [practiceId, teams],
  )

  const reorderTeams = useCallback(
    async (teamIds: string[]) => {
      const reorderedTeams = teamIds
        .map((id, index) => {
          const team = teams.find((t) => t.id === id)
          return team ? { ...team, sortOrder: index } : null
        })
        .filter(Boolean) as Team[]

      setTeams(reorderedTeams)

      try {
        await fetch(`/api/practices/${practiceId}/teams/reorder`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ teamIds }),
        })
      } catch (error) {
        console.error("Error reordering teams:", error)
      }
    },
    [practiceId, teams],
  )

  const assignMemberToTeam = useCallback(
    async (memberId: string, teamId: string) => {
      setTeamMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, teamIds: [...new Set([...m.teamIds, teamId])] } : m)),
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
      }
    },
    [practiceId],
  )

  const removeMemberFromTeam = useCallback(
    async (memberId: string, teamId: string) => {
      setTeamMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, teamIds: m.teamIds.filter((t) => t !== teamId) } : m)),
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
      }
    },
    [practiceId],
  )

  const addTeamMember = useCallback(
    async (member: Omit<TeamMember, "id" | "joinedAt">) => {
      const newMember: TeamMember = {
        ...member,
        id: crypto.randomUUID(),
        joinedAt: new Date().toISOString(),
        practiceId: practiceId,
      }

      setTeamMembers((prev) => [...prev, newMember])

      try {
        await fetch(`/api/practices/${practiceId}/team-members`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(member),
        })
        toast.success("Teammitglied hinzugefügt")
      } catch (error) {
        setTeamMembers((prev) => prev.filter((m) => m.id !== newMember.id))
        toast.error("Fehler beim Hinzufügen")
      }
    },
    [practiceId],
  )

  const updateTeamMember = useCallback(
    async (id: string, updates: Partial<TeamMember>) => {
      const previousMembers = teamMembers

      setTeamMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)))

      try {
        await fetch(`/api/practices/${practiceId}/team-members/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(updates),
        })
      } catch (error) {
        setTeamMembers(previousMembers)
        toast.error("Fehler beim Aktualisieren")
      }
    },
    [practiceId, teamMembers],
  )

  const removeTeamMember = useCallback(
    async (id: string) => {
      const previousMembers = teamMembers

      setTeamMembers((prev) => prev.filter((m) => m.id !== id))

      try {
        const response = await fetch(`/api/practices/${practiceId}/team-members/${id}`, {
          method: "DELETE",
          credentials: "include",
        })

        if (response.ok) {
          toast.success("Teammitglied entfernt")
        } else {
          setTeamMembers(previousMembers)
          toast.error("Fehler beim Entfernen")
        }
      } catch (error) {
        setTeamMembers(previousMembers)
        toast.error("Fehler beim Entfernen")
      }
    },
    [practiceId, teamMembers],
  )

  const inviteTeamMember = useCallback(
    async (email: string, role: User["role"]) => {
      const invite: PendingInvite = {
        id: crypto.randomUUID(),
        email,
        role,
        sentAt: new Date().toISOString(),
        status: "pending",
      }

      setPendingInvites((prev) => [...prev, invite])

      try {
        await fetch(`/api/practices/${practiceId}/invites`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, role }),
        })
        toast.success("Einladung gesendet")
      } catch (error) {
        setPendingInvites((prev) => prev.filter((i) => i.id !== invite.id))
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
      loading,
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
      loading,
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
