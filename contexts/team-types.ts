import type { User } from "./user-context"

export interface TeamMember extends User {
  permissions: string[]
  lastActive: string
  teamIds: string[]
  dateOfBirth?: string
  status?: string
  first_name?: string
  last_name?: string
  user_id?: string
}

export interface Team {
  id: string
  name: string
  description: string
  color: string
  memberCount: number
  createdAt: string
  isActive: boolean
  sortOrder: number
}

export interface PendingInvite {
  id: string
  email: string
  role: User["role"]
  sentAt: string
  status: "pending" | "accepted" | "expired"
}

export interface TeamContextType {
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
