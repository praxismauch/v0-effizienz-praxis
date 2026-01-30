"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { usePractice } from "@/contexts/practice-context"
import { useAuth } from "@/contexts/auth-context"
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

export default function TeamPageClient() {
  const router = useRouter()
  const { currentPractice, isLoading: practiceLoading } = usePractice()
  const { user } = useAuth()

  const [activeTab, setActiveTab] = useState("members")
  const [isLoading, setIsLoading] = useState(true)

  // Data states - using useState with functional updates
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [responsibilities, setResponsibilities] = useState<Responsibility[]>([])
  const [staffingPlans, setStaffingPlans] = useState<StaffingPlan[]>([])
  const [holidayRequests, setHolidayRequests] = useState<HolidayRequest[]>([])
  const [sickLeaves, setSickLeaves] = useState<SickLeave[]>([])

  const practiceId = currentPractice?.id?.toString()

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

  // Initial load
  useEffect(() => {
    if (!practiceLoading && practiceId) {
      setIsLoading(true)
      fetchData().finally(() => setIsLoading(false))
    }
  }, [fetchData, practiceLoading, practiceId])

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

  const handleCreateTeam = () => toast.info("Team erstellen - Coming soon")
  const handleEditTeam = (team: Team) => toast.info(`Team bearbeiten: ${team.name}`)
  const handleDeleteTeam = (team: Team) => toast.info(`Team löschen: ${team.name}`)

  const handleCreateStaffingPlan = () => toast.info("Stellenplan erstellen - Coming soon")
  const handleEditStaffingPlan = (plan: StaffingPlan) => toast.info(`Stellenplan: ${plan.name}`)

  const handleCreateHolidayRequest = () => toast.info("Urlaubsantrag - Coming soon")
  const handleApproveHolidayRequest = (request: HolidayRequest) =>
    toast.success("Antrag genehmigt")
  const handleRejectHolidayRequest = (request: HolidayRequest) => toast.error("Antrag abgelehnt")

  const handleCreateSickLeave = () => toast.info("Krankmeldung erfassen - Coming soon")

  if (practiceLoading || isLoading) {
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
            <span className="hidden sm:inline">Stellenpläne</span>
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
            onAddMember={handleAddMember}
            onEditMember={handleEditMember}
            onDeleteMember={handleDeleteMember}
          />
        </TabsContent>

        <TabsContent value="responsibilities" className="mt-6">
          <ResponsibilitiesTab
            responsibilities={responsibilities}
            teamMembers={teamMembers}
            onCreateResponsibility={() => router.push("/responsibilities")}
          />
        </TabsContent>

        <TabsContent value="staffing" className="mt-6">
          <StaffingTab
            staffingPlans={staffingPlans}
            teamMembers={teamMembers}
            onCreatePlan={handleCreateStaffingPlan}
            onEditPlan={handleEditStaffingPlan}
          />
        </TabsContent>

        <TabsContent value="teams" className="mt-6">
          <TeamsTab
            teams={teams}
            teamMembers={teamMembers}
            onCreateTeam={handleCreateTeam}
            onEditTeam={handleEditTeam}
            onDeleteTeam={handleDeleteTeam}
          />
        </TabsContent>

        <TabsContent value="holidays" className="mt-6">
          <HolidaysTab
            holidayRequests={holidayRequests}
            teamMembers={teamMembers}
            onCreateRequest={handleCreateHolidayRequest}
            onApproveRequest={handleApproveHolidayRequest}
            onRejectRequest={handleRejectHolidayRequest}
          />
        </TabsContent>

        <TabsContent value="sickleaves" className="mt-6">
          <SickLeavesTab
            sickLeaves={sickLeaves}
            teamMembers={teamMembers}
            onCreateSickLeave={handleCreateSickLeave}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
