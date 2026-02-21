import type { KeyedMutator } from "swr"
import type { Team, TeamMember } from "./team-types"
import type { User } from "./user-context"
import { SWR_KEYS } from "@/lib/swr-keys"
import { mutationFetcher } from "@/lib/swr-fetcher"
import { toast } from "sonner"
import Logger from "@/lib/logger"

type TeamsData = Team[] | { teams: Team[] }
type MembersData = TeamMember[] | { members: TeamMember[] }

function getTeamsArray(current: TeamsData | undefined): Team[] {
  if (!current) return []
  return Array.isArray(current) ? current : (current as { teams: Team[] }).teams || []
}

function getMembersArray(current: MembersData | undefined): TeamMember[] {
  if (!current) return []
  return Array.isArray(current) ? current : (current as any)?.members || []
}

export function createTeamActions(
  practiceId: string,
  teams: Team[],
  mutateTeams: KeyedMutator<TeamsData>,
  mutateMembers: KeyedMutator<MembersData>,
) {
  const addTeam = async (team: Omit<Team, "id" | "createdAt" | "memberCount" | "sortOrder">) => {
    const newTeam: Team = { ...team, id: crypto.randomUUID(), createdAt: new Date().toISOString(), memberCount: 0, sortOrder: teams.length }
    await mutateTeams((current) => [...getTeamsArray(current), newTeam], { revalidate: false })
    try {
      await mutationFetcher(SWR_KEYS.teams(practiceId), { method: "POST", body: team })
      toast.success("Team erstellt")
      await mutateTeams()
    } catch {
      await mutateTeams()
      toast.error("Fehler beim Erstellen des Teams")
    }
  }

  const updateTeam = async (id: string, updates: Partial<Team>) => {
    await mutateTeams((current) => getTeamsArray(current).map((t) => (t.id === id ? { ...t, ...updates } : t)), { revalidate: false })
    try {
      await mutationFetcher(`${SWR_KEYS.teams(practiceId)}/${id}`, { method: "PUT", body: updates })
    } catch {
      await mutateTeams()
      toast.error("Fehler beim Aktualisieren des Teams")
    }
  }

  const deleteTeam = async (id: string) => {
    await mutateTeams((current) => getTeamsArray(current).filter((t) => t.id !== id), { revalidate: false })
    try {
      await mutationFetcher(`${SWR_KEYS.teams(practiceId)}/${id}`, { method: "DELETE" })
      toast.success("Team gelöscht")
    } catch {
      await mutateTeams()
      toast.error("Fehler beim Löschen des Teams")
    }
  }

  const reorderTeams = async (teamIds: string[]) => {
    const reorderedTeams = teamIds
      .map((id, index) => { const team = teams.find((t) => t.id === id); return team ? { ...team, sortOrder: index } : null })
      .filter(Boolean) as Team[]
    await mutateTeams(reorderedTeams, { revalidate: false })
    try {
      await fetch(`/api/practices/${practiceId}/teams/reorder`, { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ teamIds }) })
    } catch (error) {
      Logger.warn("context", "Error reordering teams", { error })
      await mutateTeams()
    }
  }

  return { addTeam, updateTeam, deleteTeam, reorderTeams }
}

export function createMemberActions(
  practiceId: string,
  mutateTeams: KeyedMutator<TeamsData>,
  mutateMembers: KeyedMutator<MembersData>,
) {
  const assignMemberToTeam = async (memberId: string, teamId: string) => {
    await mutateMembers((current) => getMembersArray(current).map((m) => m.id === memberId ? { ...m, teamIds: [...new Set([...(m.teamIds || []), teamId])] } : m), { revalidate: false })
    try {
      await fetch(`/api/practices/${practiceId}/team-members/${memberId}/assign`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ teamId }) })
    } catch (error) {
      Logger.warn("context", "Error assigning member to team", { error })
      await mutateMembers()
    }
  }

  const removeMemberFromTeam = async (memberId: string, teamId: string) => {
    await mutateMembers((current) => getMembersArray(current).map((m) => m.id === memberId ? { ...m, teamIds: (m.teamIds || []).filter((t) => t !== teamId) } : m), { revalidate: false })
    try {
      await fetch(`/api/practices/${practiceId}/team-members/${memberId}/unassign`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ teamId }) })
    } catch (error) {
      Logger.warn("context", "Error removing member from team", { error })
      await mutateMembers()
    }
  }

  const addTeamMember = async (member: Omit<TeamMember, "id" | "joinedAt">) => {
    const newMember: TeamMember = { ...member, id: crypto.randomUUID(), joinedAt: new Date().toISOString(), practiceId }
    await mutateMembers((current) => [...getMembersArray(current), newMember], { revalidate: false })
    try {
      await mutationFetcher(SWR_KEYS.teamMembers(practiceId), { method: "POST", body: member })
      toast.success("Teammitglied hinzugefügt")
      await mutateMembers()
    } catch {
      await mutateMembers()
      toast.error("Fehler beim Hinzufügen")
    }
  }

  const updateTeamMember = async (id: string, updates: Partial<TeamMember>) => {
    await mutateMembers((current) => getMembersArray(current).map((m) => (m.id === id ? { ...m, ...updates } : m)), { revalidate: false })
    try {
      await mutationFetcher(SWR_KEYS.teamMember(practiceId, id), { method: "PUT", body: updates })
    } catch {
      await mutateMembers()
      toast.error("Fehler beim Aktualisieren")
    }
  }

  const removeTeamMember = async (id: string) => {
    await mutateMembers((current) => getMembersArray(current).filter((m) => m.id !== id), { revalidate: false })
    try {
      await mutationFetcher(SWR_KEYS.teamMember(practiceId, id), { method: "DELETE" })
      toast.success("Teammitglied entfernt")
    } catch {
      await mutateMembers()
      toast.error("Fehler beim Entfernen")
    }
  }

  const inviteTeamMember = async (email: string, role: User["role"]) => {
    try {
      await fetch(`/api/practices/${practiceId}/invites`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ email, role }) })
      toast.success("Einladung gesendet")
    } catch {
      toast.error("Fehler beim Senden der Einladung")
    }
  }

  return { assignMemberToTeam, removeMemberFromTeam, addTeamMember, updateTeamMember, removeTeamMember, inviteTeamMember }
}
