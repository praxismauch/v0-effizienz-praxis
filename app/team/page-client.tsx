"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import {
  Users,
  UserPlus,
  Briefcase,
  Calendar,
  Stethoscope,
  Building2,
  Loader2,
} from "lucide-react"

// Import extracted tab components
import MembersTab from "./components/members-tab"
import ResponsibilitiesTab from "./components/responsibilities-tab"
import StaffingTab from "./components/staffing-tab"
import TeamsTab from "./components/teams-tab"
import HolidaysTab from "./components/holidays-tab"
import SickLeavesTab from "./components/sickleaves-tab"

// Import types
import type {
  TeamMember,
  Team,
  Responsibility,
  StaffingPlan,
  HolidayRequest,
  SickLeave,
} from "./types"

interface TeamPageClientProps {
  initialData: {
    teamMembers: TeamMember[]
    teams: Team[]
    responsibilities: Responsibility[]
    staffingPlans: StaffingPlan[]
    holidayRequests: HolidayRequest[]
    sickLeaves: SickLeave[]
  } | null
  practiceId: string | null | undefined
  userId: string
}

export default function TeamPageClient({ initialData, practiceId, userId }: TeamPageClientProps) {
  const router = useRouter()

  console.log("[v0] TeamPageClient received initialData:", {
    hasData: !!initialData,
    teamMembers: initialData?.teamMembers?.length,
    teams: initialData?.teams?.length,
  })

  const [activeTab, setActiveTab] = useState("members")
  const [isLoading, setIsLoading] = useState(!initialData)

  // Data states - initialize with server data
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(initialData?.teamMembers || [])
  const [teams, setTeams] = useState<Team[]>(initialData?.teams || [])
  const [responsibilities, setResponsibilities] = useState<Responsibility[]>(initialData?.responsibilities || [])
  const [staffingPlans, setStaffingPlans] = useState<StaffingPlan[]>(initialData?.staffingPlans || [])
  const [holidayRequests, setHolidayRequests] = useState<HolidayRequest[]>(initialData?.holidayRequests || [])
  const [sickLeaves, setSickLeaves] = useState<SickLeave[]>(initialData?.sickLeaves || [])

  // Fetch data function
  const fetchData = useCallback(async () => {
    if (!practiceId) return

    try {
      const [membersRes, teamsRes, responsibilitiesRes, staffingRes, holidaysRes, sickLeavesRes] = await Promise.all([
        fetch(`/api/practices/${practiceId}/team-members`),
        fetch(`/api/practices/${practiceId}/teams`),
        fetch(`/api/practices/${practiceId}/responsibilities`),
        fetch(`/api/practices/${practiceId}/staffing-plans`),
        fetch(`/api/practices/${practiceId}/holiday-requests`),
        fetch(`/api/practices/${practiceId}/sick-leaves`),
      ])

      if (membersRes.ok) {
        const data = await membersRes.json()
        setTeamMembers(() => data.teamMembers || [])
      }
      if (teamsRes.ok) {
        const data = await teamsRes.json()
        setTeams(() => data.teams || [])
      }
      if (responsibilitiesRes.ok) {
        const data = await responsibilitiesRes.json()
        setResponsibilities(() => data.responsibilities || [])
      }
      if (staffingRes.ok) {
        const data = await staffingRes.json()
        setStaffingPlans(() => data.staffingPlans || [])
      }
      if (holidaysRes.ok) {
        const data = await holidaysRes.json()
        setHolidayRequests(() => data.holidayRequests || [])
      }
      if (sickLeavesRes.ok) {
        const data = await sickLeavesRes.json()
        setSickLeaves(() => data.sickLeaves || [])
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

  const handleHolidayRequestCreated = (request: HolidayRequest) => {
    setHolidayRequests(prev => [request, ...prev])
    toast.success("Urlaubsantrag erstellt")
  }
  const handleApproveHolidayRequest = (request: HolidayRequest) =>
    toast.success("Antrag genehmigt")
  const handleRejectHolidayRequest = (request: HolidayRequest) => toast.error("Antrag abgelehnt")

  const handleSickLeaveCreated = (sickLeave: SickLeave) => {
    setSickLeaves(prev => [sickLeave, ...prev])
    toast.success("Krankmeldung erfasst")
  }

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
    totalTeams: (teams || []).length,
    openHolidayRequests: (holidayRequests || []).filter((r) => r.status === "pending").length,
    currentSickLeaves: (sickLeaves || []).filter(
      (s) => !s.end_date || new Date(s.end_date) >= new Date()
    ).length,
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Mitarbeiter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMembers}</div>
            <p className="text-xs text-muted-foreground">{stats.activeMembers} aktiv</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Teams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTeams}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Zuständigkeiten</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{responsibilities.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-700">Offene Anträge</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openHolidayRequests}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-red-100/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Krankmeldungen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.currentSickLeaves}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 h-auto gap-1">
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Mitarbeiter</span>
          </TabsTrigger>
          <TabsTrigger value="responsibilities" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            <span className="hidden sm:inline">Zuständigkeiten</span>
          </TabsTrigger>
          <TabsTrigger value="staffing" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Bedarfsplanung</span>
          </TabsTrigger>
          <TabsTrigger value="teams" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Teams</span>
          </TabsTrigger>
          <TabsTrigger value="holidays" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Urlaub</span>
          </TabsTrigger>
          <TabsTrigger value="sickleaves" className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4" />
            <span className="hidden sm:inline">Krankmeldungen</span>
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

        <TabsContent value="responsibilities" className="mt-6">
          <ResponsibilitiesTab
            responsibilities={responsibilities}
            isAdmin={!!userId}
          />
        </TabsContent>

        <TabsContent value="staffing" className="mt-6">
          <StaffingTab
            staffingPlans={staffingPlans}
            teamMembers={teamMembers}
            teams={teams}
            responsibilities={responsibilities}
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

        <TabsContent value="holidays" className="mt-6">
          <HolidaysTab
            holidayRequests={holidayRequests}
            teamMembers={teamMembers}
            onRequestCreated={handleHolidayRequestCreated}
            onApproveRequest={handleApproveHolidayRequest}
            onRejectRequest={handleRejectHolidayRequest}
          />
        </TabsContent>

        <TabsContent value="sickleaves" className="mt-6">
          <SickLeavesTab
            sickLeaves={sickLeaves}
            teamMembers={teamMembers}
            onSickLeaveCreated={handleSickLeaveCreated}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
