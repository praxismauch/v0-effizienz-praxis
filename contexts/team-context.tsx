"use client"

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react"
import type { User } from "./user-context"
import { usePractice } from "./practice-context"
import { fetchWithRetry, safeJsonParse } from "@/lib/fetch-with-retry"
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

export function TeamProvider({ children }: { children: ReactNode }) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const fetchInProgress = useRef(false)
  const lastFetchTime = useRef(0)
  const { currentPractice, isLoading: practiceLoading } = usePractice()

  const HARDCODED_PRACTICE_ID = "1"

  const filterNonSuperAdmins = (members: TeamMember[]) => {
    return members.filter((member) => member.role !== "superadmin")
  }

  const fetchData = useCallback(async (practiceId: string, isMounted: { current: boolean }) => {
    const effectivePracticeId = HARDCODED_PRACTICE_ID
    console.log("[v0] TeamContext: Using hardcoded practice ID:", effectivePracticeId)

    const now = Date.now()
    if (fetchInProgress.current) {
      console.log("[v0] TeamContext: Fetch already in progress")
      return
    }
    if (now - lastFetchTime.current < 2000) {
      console.log("[v0] TeamContext: Skipping fetch, too soon since last fetch")
      return
    }

    fetchInProgress.current = true
    lastFetchTime.current = now

    try {
      setLoading(true)
      console.log("[v0] TeamContext: Fetching teams for practice:", effectivePracticeId)

      const teamsRes = await fetchWithRetry(`/api/practices/${effectivePracticeId}/teams`, undefined, { maxRetries: 3 })
      if (!isMounted.current) return

      const teamsData = teamsRes.ok ? await safeJsonParse(teamsRes, []) : []
      if (!isMounted.current) return

      console.log("[v0] TeamContext: Teams loaded:", teamsData.length)
      setTeams(teamsData.map((t: any) => ({ ...t, sortOrder: t.sortOrder ?? 0 })))

      await new Promise((resolve) => setTimeout(resolve, 500))

      console.log("[v0] TeamContext: Fetching team members for practice:", effectivePracticeId)
      const membersRes = await fetchWithRetry(`/api/practices/${effectivePracticeId}/team-members`, undefined, {
        maxRetries: 3,
      })
      if (!isMounted.current) return

      console.log("[v0] TeamContext: Members API response status:", membersRes.status)

      if (membersRes.status === 503) {
        console.warn("[v0] TeamContext: Service unavailable")
        setTeamMembers([])
        return
      }

      if (!membersRes.ok) {
        const errorText = await membersRes.text()
        console.error("[v0] TeamContext: Failed to fetch members:", membersRes.status, errorText.substring(0, 200))
        setTeamMembers([])
        return
      }

      const membersData = await safeJsonParse(membersRes, [])
      if (!isMounted.current) return

      console.log("[v0] TeamContext: Raw members data:", membersData.length)
      if (membersData.length > 0) {
        console.log("[v0] TeamContext: Sample member from API:", JSON.stringify(membersData[0]).substring(0, 300))
      }

      const mappedMembers = membersData
        .filter((member: any) => member.id && member.id.trim() !== "")
        .map((member: any) => ({
          ...member,
          dateOfBirth: member.date_of_birth,
          status: member.status,
          first_name: member.first_name,
          last_name: member.last_name,
          user_id: member.user_id,
        }))

      const uniqueMembersMap = new Map<string, any>()
      mappedMembers.forEach((member: any) => {
        if (!uniqueMembersMap.has(member.id)) {
          uniqueMembersMap.set(member.id, member)
        }
      })
      const deduplicatedMembers = Array.from(uniqueMembersMap.values())

      console.log("[v0] TeamContext: Final team members count:", deduplicatedMembers.length)
      setTeamMembers(deduplicatedMembers)
    } catch (error) {
      if (!isMounted.current) return
      console.error("[v0] TeamContext: Team fetch error:", error)
      setTeams([])
      setTeamMembers([])
    } finally {
      fetchInProgress.current = false
      if (isMounted.current) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    const isMounted = { current: true }

    console.log("[v0] TeamContext: Starting fetch with hardcoded practice ID")
    fetchData(HARDCODED_PRACTICE_ID, isMounted)

    return () => {
      isMounted.current = false
    }
  }, [fetchData])

  const refetchTeamMembers = async () => {
    await fetchData(HARDCODED_PRACTICE_ID, { current: true })
  }

  const getEffectivePracticeId = () => currentPractice?.id || HARDCODED_PRACTICE_ID

  const addTeam = async (teamData: Omit<Team, "id" | "createdAt" | "memberCount" | "sortOrder">) => {
    const practiceId = getEffectivePracticeId()

    try {
      const res = await fetch(`/api/practices/${practiceId}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(teamData),
      })

      if (res.ok) {
        const newTeam = await res.json()
        setTeams((prev) => [
          ...prev,
          {
            ...newTeam,
            memberCount: 0,
            createdAt: newTeam.created_at,
            isActive: newTeam.is_active,
            sortOrder: newTeam.sort_order ?? prev.length,
          },
        ])
        toast.success("Team erfolgreich erstellt")
      } else {
        toast.error("Fehler beim Erstellen des Teams")
      }
    } catch (error) {
      toast.error("Fehler beim Erstellen des Teams")
      console.error("Add team error:", error)
    }
  }

  const reorderTeams = async (teamIds: string[]) => {
    const practiceId = getEffectivePracticeId()

    const reorderedTeams = teamIds
      .map((id, index) => {
        const team = teams.find((t) => t.id === id)
        return team ? { ...team, sortOrder: index } : null
      })
      .filter(Boolean) as Team[]

    setTeams(reorderedTeams)

    try {
      const res = await fetch(`/api/practices/${practiceId}/teams`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamIds }),
      })

      if (!res.ok) {
        await fetchData(practiceId, { current: true })
        toast.error("Fehler beim Speichern der Reihenfolge")
      } else {
        toast.success("Reihenfolge gespeichert")
      }
    } catch (error) {
      await fetchData(practiceId, { current: true })
      toast.error("Fehler beim Speichern der Reihenfolge")
      console.error("Reorder teams error:", error)
    }
  }

  const updateTeam = async (id: string, updates: Partial<Team>) => {
    const practiceId = getEffectivePracticeId()

    try {
      const res = await fetch(`/api/practices/${practiceId}/teams/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })

      if (res.ok) {
        setTeams((prev) => prev.map((team) => (team.id === id ? { ...team, ...updates } : team)))
        toast.success("Team erfolgreich aktualisiert")
      } else {
        toast.error("Fehler beim Aktualisieren des Teams")
      }
    } catch (error) {
      toast.error("Fehler beim Aktualisieren des Teams")
      console.error("Update team error:", error)
    }
  }

  const deleteTeam = async (id: string) => {
    const practiceId = getEffectivePracticeId()

    try {
      const res = await fetch(`/api/practices/${practiceId}/teams/${id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        setTeams((prev) => prev.filter((team) => team.id !== id))
        setTeamMembers((prev) =>
          prev.map((member) => ({
            ...member,
            teamIds: member.teamIds.filter((teamId) => teamId !== id),
          })),
        )
        toast.success("Team erfolgreich gelöscht")
      } else {
        toast.error("Fehler beim Löschen des Teams")
      }
    } catch (error) {
      toast.error("Fehler beim Löschen des Teams")
      console.error("Delete team error:", error)
    }
  }

  const assignMemberToTeam = async (memberId: string, teamId: string) => {
    const member = teamMembers.find((m) => m.id === memberId)
    if (member?.role === "superadmin") return
    const practiceId = getEffectivePracticeId()

    const updatedTeamIds = [...(member?.teamIds || []), teamId]

    try {
      const res = await fetch(`/api/practices/${practiceId}/team-members/${memberId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamIds: updatedTeamIds }),
      })

      if (res.ok) {
        setTeamMembers((prev) =>
          prev.map((m) =>
            m.id === memberId && !m.teamIds.includes(teamId) ? { ...m, teamIds: [...m.teamIds, teamId] } : m,
          ),
        )
        toast.success("Mitglied erfolgreich zugewiesen")
      } else {
        toast.error("Fehler beim Zuweisen des Mitglieds")
      }
    } catch (error) {
      toast.error("Fehler beim Zuweisen des Mitglieds")
      console.error("Assign member error:", error)
    }
  }

  const removeMemberFromTeam = async (memberId: string, teamId: string) => {
    const practiceId = getEffectivePracticeId()

    const member = teamMembers.find((m) => m.id === memberId)
    const updatedTeamIds = member?.teamIds.filter((id) => id !== teamId) || []

    try {
      const res = await fetch(`/api/practices/${practiceId}/team-members/${memberId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamIds: updatedTeamIds }),
      })

      if (res.ok) {
        setTeamMembers((prev) =>
          prev.map((m) => (m.id === memberId ? { ...m, teamIds: m.teamIds.filter((id) => id !== teamId) } : m)),
        )
        toast.success("Mitglied erfolgreich entfernt")
      } else {
        toast.error("Fehler beim Entfernen des Mitglieds")
      }
    } catch (error) {
      toast.error("Fehler beim Entfernen des Mitglieds")
      console.error("Remove member error:", error)
    }
  }

  const addTeamMember = async (memberData: Omit<TeamMember, "id" | "joinedAt">) => {
    if (memberData.role === "superadmin") return
    const practiceId = getEffectivePracticeId()

    try {
      const res = await fetch(`/api/practices/${practiceId}/team-members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(memberData),
      })

      if (res.ok) {
        const newMember = await res.json()
        setTeamMembers((prev) => [...prev, newMember])
        toast.success("Team-Mitglied erfolgreich hinzugefügt")
      } else {
        toast.error("Fehler beim Hinzufügen des Team-Mitglieds")
      }
    } catch (error) {
      toast.error("Fehler beim Hinzufügen des Team-Mitglieds")
      console.error("Add team member error:", error)
    }
  }

  const updateTeamMember = async (id: string, updates: Partial<TeamMember>) => {
    if (updates.role === "superadmin") return
    const practiceId = getEffectivePracticeId()

    try {
      const res = await fetch(`/api/practices/${practiceId}/team-members/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })

      if (res.ok) {
        setTeamMembers((prev) => prev.map((member) => (member.id === id ? { ...member, ...updates } : member)))
        toast.success("Team-Mitglied erfolgreich aktualisiert")
      } else {
        toast.error("Fehler beim Aktualisieren des Team-Mitglieds")
      }
    } catch (error) {
      toast.error("Fehler beim Aktualisieren des Team-Mitglieds")
      console.error("Update team member error:", error)
    }
  }

  const removeTeamMember = async (id: string) => {
    const practiceId = getEffectivePracticeId()

    try {
      const res = await fetch(`/api/practices/${practiceId}/team-members/${id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        toast.error(errorData.error || "Fehler beim Entfernen des Team-Mitglieds")
        throw new Error(errorData.error || "Fehler beim Entfernen des Team-Mitglieds")
      }

      await new Promise((resolve) => setTimeout(resolve, 500))
      await fetchData(practiceId, { current: true })
      toast.success("Team-Mitglied erfolgreich entfernt")
    } catch (error) {
      console.error("Error removing team member:", error)
      throw error
    }
  }

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

export function useTeam() {
  const context = useContext(TeamContext)
  if (context === undefined) {
    throw new Error("useTeam must be used within a TeamProvider")
  }
  return context
}

export default TeamProvider
