"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import {
  Users,
  UserPlus,
  Building2,
  Loader2,
  UserCheck,
  ClipboardList,
} from "lucide-react"
import { StatCard, statCardColors } from "@/components/ui/stat-card"

// Import extracted tab components
import MembersTab from "./components/members-tab"
import StaffingTab from "./components/staffing-tab"
import TeamsTab from "./components/teams-tab"


// Import types
import type {
  TeamMember,
  Team,
  StaffingPlan,
} from "./types"

interface TeamPageClientProps {
  initialData: {
    teamMembers: TeamMember[]
    teams: Team[]
    staffingPlans: StaffingPlan[]
  } | null
  practiceId: string | null | undefined
  userId: string
}

export default function TeamPageClient({ initialData, practiceId, userId }: TeamPageClientProps) {
  const router = useRouter()

  const [activeTab, setActiveTab] = useState("members")
  const [isLoading, setIsLoading] = useState(!initialData)

  // Data states - initialize with server data
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(initialData?.teamMembers || [])
  const [teams, setTeams] = useState<Team[]>(initialData?.teams || [])
  const [staffingPlans, setStaffingPlans] = useState<StaffingPlan[]>(initialData?.staffingPlans || [])

  // Fetch data function
  const fetchData = useCallback(async () => {
    if (!practiceId) return

    try {
      const [membersRes, teamsRes, staffingRes] = await Promise.all([
        fetch(`/api/practices/${practiceId}/team-members`),
        fetch(`/api/practices/${practiceId}/teams`),
        fetch(`/api/practices/${practiceId}/staffing-plans`),
      ])

      if (membersRes.ok) {
        const data = await membersRes.json()
        setTeamMembers(() => data.teamMembers || [])
      }
      if (teamsRes.ok) {
        const data = await teamsRes.json()
        setTeams(() => data.teams || [])
      }
      if (staffingRes.ok) {
        const data = await staffingRes.json()
        setStaffingPlans(() => data.staffingPlans || [])
      }
    } catch (error) {
      console.error("Error fetching team data:", error)
      toast.error("Fehler beim Laden der Teamdaten")
    }
  }, [practiceId])

  // Only fetch if we don't have initial data
  useEffect(() => {
    if (!initialData && practiceId) {
      setIsLoading(true)
      fetchData().finally(() => setIsLoading(false))
    }
  }, [fetchData, practiceId, initialData])

  // Handler stubs - implement as needed
  const handleAddMember = () => router.push("/team/add")
  const handleEditMember = (member: TeamMember) => router.push(`/team/${member.id}`)
  const handleDeleteMember = async (member: TeamMember) => {
    if (!confirm(`${member.first_name} ${member.last_name} wirklich entfernen?`)) return
    try {
      const res = await fetch(`/api/practices/${practiceId}/team-members/${member.id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        // Instant update using functional state
        setTeamMembers(prev => prev.filter(m => m.id !== member.id))
        toast.success("Mitarbeiter entfernt")
      }
    } catch {
      toast.error("Fehler beim Entfernen")
    }
  }

  const handleTeamCreated = (team: Team) => {
    setTeams(prev => [team, ...prev])
    toast.success("Team erstellt")
  }
  const handleEditTeam = (team: Team) => toast.info(`Team bearbeiten: ${team.name}`)
  const handleDeleteTeam = (team: Team) => toast.info(`Team löschen: ${team.name}`)

  const handleStaffingPlanCreated = (plan: StaffingPlan) => {
    setStaffingPlans(prev => [plan, ...prev])
    toast.success("Bedarfsplan erstellt")
  }
  const handleEditStaffingPlan = (plan: StaffingPlan) => toast.info(`Bedarfsplan: ${plan.name}`)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Stats
  const stats = {
    totalMembers: (teamMembers || []).length,
    activeMembers: (teamMembers || []).filter((m) => m.status === "active").length,
    inactiveMembers: (teamMembers || []).filter((m) => m.status !== "active").length,
    totalTeams: (teams || []).length,
    totalStaffingPlans: (staffingPlans || []).length,
  }

  return (
    <div className="w-full p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Team</h1>
          <p className="text-muted-foreground">
            Verwalten Sie Ihr Team und die Personalplanung
          </p>
        </div>
        <Button onClick={handleAddMember}>
          <UserPlus className="h-4 w-4 mr-2" />
          Mitarbeiter hinzufügen
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Mitarbeiter"
          value={stats.totalMembers}
          icon={Users}
          color={statCardColors.blue}
          description={`${stats.activeMembers} aktiv`}
        />
        <StatCard
          label="Aktiv"
          value={stats.activeMembers}
          icon={UserCheck}
          color={statCardColors.green}
          description={`${stats.inactiveMembers} inaktiv`}
        />
        <StatCard
          label="Teams"
          value={stats.totalTeams}
          icon={Building2}
          color={statCardColors.purple}
        />
        <StatCard
          label="Bedarfspläne"
          value={stats.totalStaffingPlans}
          icon={ClipboardList}
          color={statCardColors.amber}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 h-auto gap-1">
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Mitarbeiter</span>
          </TabsTrigger>
          <TabsTrigger value="staffing" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Bedarfsplanung</span>
          </TabsTrigger>
          <TabsTrigger value="teams" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Teams</span>
          </TabsTrigger>
        </TabsList>

            <TabsContent value="members" className="mt-6">
              <MembersTab
                teamMembers={teamMembers}
                teams={teams}
                onAddMember={handleAddMember}
                onEditMember={handleEditMember}
                onDeleteMember={handleDeleteMember}
              />
        </TabsContent>

        <TabsContent value="staffing" className="mt-6">
          <StaffingTab
            staffingPlans={staffingPlans}
            teamMembers={teamMembers}
            teams={teams}
            onPlanCreated={handleStaffingPlanCreated}
            onEditPlan={handleEditStaffingPlan}
            onRefresh={fetchData}
          />
        </TabsContent>

        <TabsContent value="teams" className="mt-6">
          <TeamsTab
            teams={teams}
            teamMembers={teamMembers}
            onTeamCreated={handleTeamCreated}
            onEditTeam={handleEditTeam}
            onDeleteTeam={handleDeleteTeam}
          />
        </TabsContent>


      </Tabs>
    </div>
  )
}
