"use client"

import { createContext, useContext, type ReactNode } from "react"
import type { User } from "./user-context"
import { toast } from "sonner"
import { useTeams as useTeamsSWR, useTeamMembers as useTeamMembersSWR } from "@/hooks/use-teams"

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
  invitedBy: string
  invitedAt: string
  status: "pending" | "accepted" | "declined"
}

const TeamContext = createContext<TeamContextType | undefined>(undefined)

const HARDCODED_PRACTICE_ID = "1"

const filterNonSuperAdmins = (members: TeamMember[]) => {
  return members.filter((member) => member.role !== "superadmin")
}

const mapMemberData = (member: any): TeamMember => ({
  ...member,
  dateOfBirth: member.date_of_birth,
  status: member.status,
  first_name: member.first_name,
  last_name: member.last_name,
  user_id: member.user_id,
})

const mapTeamData = (team: any): Team => ({
  ...team,
  memberCount: team.memberCount ?? team.member_count ?? 0,
  createdAt: team.createdAt ?? team.created_at,
  isActive: team.isActive ?? team.is_active ?? true,
  sortOrder: team.sortOrder ?? team.sort_order ?? 0,
})

export function TeamProvider({ children }: { children: ReactNode }) {
  const { data: teamsData, isLoading: teamsLoading, mutate: mutateTeams } = useTeamsSWR(HARDCODED_PRACTICE_ID)

  const {
    data: membersData,
    isLoading: membersLoading,
    mutate: mutateMembers,
  } = useTeamMembersSWR(HARDCODED_PRACTICE_ID)

  const teams: Team[] = (teamsData || []).map(mapTeamData)
  const teamMembers: TeamMember[] = (membersData || [])
    .filter((m: any) => m.id && m.id.trim() !== "")
    .map(mapMemberData)

  const loading = teamsLoading || membersLoading

  const refetchTeamMembers = async () => {
    await Promise.all([mutateTeams(), mutateMembers()])
  }

  const addTeam = async (teamData: Omit<Team, "id" | "createdAt" | "memberCount" | "sortOrder">) => {
    const optimisticTeam: Team = {
      ...teamData,
      id: `temp-${Date.now()}`,
      createdAt: new Date().toISOString(),
      memberCount: 0,
      sortOrder: teams.length,
    }

    try {
      // Optimistic update
      mutateTeams([...teams, optimisticTeam], false)

      const res = await fetch(`/api/practices/${HARDCODED_PRACTICE_ID}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(teamData),
      })

      if (res.ok) {
        toast.success("Team erfolgreich erstellt")
        // Revalidate to get real ID
        mutateTeams()
      } else {
        toast.error("Fehler beim Erstellen des Teams")
        // Rollback on error
        mutateTeams()
      }
    } catch (error) {
      toast.error("Fehler beim Erstellen des Teams")
      mutateTeams()
      console.error("Add team error:", error)
    }
  }

  const reorderTeams = async (teamIds: string[]) => {
    const reorderedTeams = teamIds
      .map((id, index) => {
        const team = teams.find((t) => t.id === id)
        return team ? { ...team, sortOrder: index } : null
      })
      .filter(Boolean) as Team[]

    try {
      // Optimistic update
      mutateTeams(reorderedTeams, false)

      const res = await fetch(`/api/practices/${HARDCODED_PRACTICE_ID}/teams`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamIds }),
      })

      if (!res.ok) {
        mutateTeams()
        toast.error("Fehler beim Speichern der Reihenfolge")
      } else {
        toast.success("Reihenfolge gespeichert")
      }
    } catch (error) {
      mutateTeams()
      toast.error("Fehler beim Speichern der Reihenfolge")
      console.error("Reorder teams error:", error)
    }
  }

  const updateTeam = async (id: string, updates: Partial<Team>) => {
    const updatedTeams = teams.map((team) => (team.id === id ? { ...team, ...updates } : team))

    try {
      // Optimistic update
      mutateTeams(updatedTeams, false)

      const res = await fetch(`/api/practices/${HARDCODED_PRACTICE_ID}/teams/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })

      if (res.ok) {
        toast.success("Team erfolgreich aktualisiert")
      } else {
        toast.error("Fehler beim Aktualisieren des Teams")
        mutateTeams()
      }
    } catch (error) {
      toast.error("Fehler beim Aktualisieren des Teams")
      mutateTeams()
      console.error("Update team error:", error)
    }
  }

  const deleteTeam = async (id: string) => {
    const filteredTeams = teams.filter((team) => team.id !== id)
    const updatedMembers = teamMembers.map((member) => ({
      ...member,
      teamIds: member.teamIds.filter((teamId) => teamId !== id),
    }))

    try {
      // Optimistic update
      mutateTeams(filteredTeams, false)
      mutateMembers(updatedMembers, false)

      const res = await fetch(`/api/practices/${HARDCODED_PRACTICE_ID}/teams/${id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        toast.success("Team erfolgreich gelöscht")
      } else {
        toast.error("Fehler beim Löschen des Teams")
        mutateTeams()
        mutateMembers()
      }
    } catch (error) {
      toast.error("Fehler beim Löschen des Teams")
      mutateTeams()
      mutateMembers()
      console.error("Delete team error:", error)
    }
  }

  const assignMemberToTeam = async (memberId: string, teamId: string) => {
    const member = teamMembers.find((m) => m.id === memberId)
    if (member?.role === "superadmin") return

    const updatedTeamIds = [...(member?.teamIds || []), teamId]
    const updatedMembers = teamMembers.map((m) =>
      m.id === memberId && !m.teamIds.includes(teamId) ? { ...m, teamIds: [...m.teamIds, teamId] } : m,
    )

    try {
      // Optimistic update
      mutateMembers(updatedMembers, false)

      const res = await fetch(`/api/practices/${HARDCODED_PRACTICE_ID}/team-members/${memberId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamIds: updatedTeamIds }),
      })

      if (res.ok) {
        toast.success("Mitglied erfolgreich zugewiesen")
      } else {
        toast.error("Fehler beim Zuweisen des Mitglieds")
        mutateMembers()
      }
    } catch (error) {
      toast.error("Fehler beim Zuweisen des Mitglieds")
      mutateMembers()
      console.error("Assign member error:", error)
    }
  }

  const removeMemberFromTeam = async (memberId: string, teamId: string) => {
    const member = teamMembers.find((m) => m.id === memberId)
    const updatedTeamIds = member?.teamIds.filter((id) => id !== teamId) || []
    const updatedMembers = teamMembers.map((m) =>
      m.id === memberId ? { ...m, teamIds: m.teamIds.filter((id) => id !== teamId) } : m,
    )

    try {
      // Optimistic update
      mutateMembers(updatedMembers, false)

      const res = await fetch(`/api/practices/${HARDCODED_PRACTICE_ID}/team-members/${memberId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamIds: updatedTeamIds }),
      })

      if (res.ok) {
        toast.success("Mitglied erfolgreich entfernt")
      } else {
        toast.error("Fehler beim Entfernen des Mitglieds")
        mutateMembers()
      }
    } catch (error) {
      toast.error("Fehler beim Entfernen des Mitglieds")
      mutateMembers()
      console.error("Remove member error:", error)
    }
  }

  const addTeamMember = async (memberData: Omit<TeamMember, "id" | "joinedAt">) => {
    if (memberData.role === "superadmin") return

    const optimisticMember: TeamMember = {
      ...memberData,
      id: `temp-${Date.now()}`,
      permissions: memberData.permissions || [],
      lastActive: new Date().toISOString(),
      teamIds: memberData.teamIds || [],
    }

    try {
      // Optimistic update
      mutateMembers([...teamMembers, optimisticMember], false)

      const res = await fetch(`/api/practices/${HARDCODED_PRACTICE_ID}/team-members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(memberData),
      })

      if (res.ok) {
        toast.success("Team-Mitglied erfolgreich hinzugefügt")
        mutateMembers()
      } else {
        toast.error("Fehler beim Hinzufügen des Team-Mitglieds")
        mutateMembers()
      }
    } catch (error) {
      toast.error("Fehler beim Hinzufügen des Team-Mitglieds")
      mutateMembers()
      console.error("Add team member error:", error)
    }
  }

  const updateTeamMember = async (id: string, updates: Partial<TeamMember>) => {
    if (updates.role === "superadmin") return

    const updatedMembers = teamMembers.map((member) => (member.id === id ? { ...member, ...updates } : member))

    try {
      // Optimistic update
      mutateMembers(updatedMembers, false)

      const res = await fetch(`/api/practices/${HARDCODED_PRACTICE_ID}/team-members/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })

      if (res.ok) {
        toast.success("Team-Mitglied erfolgreich aktualisiert")
      } else {
        toast.error("Fehler beim Aktualisieren des Team-Mitglieds")
        mutateMembers()
      }
    } catch (error) {
      toast.error("Fehler beim Aktualisieren des Team-Mitglieds")
      mutateMembers()
      console.error("Update team member error:", error)
    }
  }

  const removeTeamMember = async (id: string) => {
    const filteredMembers = teamMembers.filter((member) => member.id !== id)

    try {
      // Optimistic update
      mutateMembers(filteredMembers, false)

      const res = await fetch(`/api/practices/${HARDCODED_PRACTICE_ID}/team-members/${id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        toast.error(errorData.error || "Fehler beim Entfernen des Team-Mitglieds")
        mutateMembers()
        throw new Error(errorData.error || "Fehler beim Entfernen des Team-Mitglieds")
      }

      toast.success("Team-Mitglied erfolgreich entfernt")
    } catch (error) {
      mutateMembers()
      console.error("Error removing team member:", error)
      throw error
    }
  }

  // Pending invites stay local for now
  const [pendingInvites, setPendingInvites] = React.useState<PendingInvite[]>([])

  const inviteTeamMember = (email: string, role: User["role"]) => {
    if (role === "superadmin") return

    const newInvite: PendingInvite = {
      id: Date.now().toString(),
      email,
      role,
      invitedBy: "Admin",
      invitedAt: new Date().toISOString().split("T")[0],
      status: "pending",
    }
    setPendingInvites((prev) => [...prev, newInvite])
  }

  return (
    <TeamContext.Provider
      value={{
        teamMembers: filterNonSuperAdmins(teamMembers),
        teams,
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
      }}
    >
      {children}
    </TeamContext.Provider>
  )
}

import React from "react"

export function useTeam() {
  const context = useContext(TeamContext)
  if (context === undefined) {
    throw new Error("useTeam must be used within a TeamProvider")
  }
  return context
}

export default TeamProvider
