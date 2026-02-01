"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"
import { AppLayout } from "@/components/app-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  GraduationCap,
  Award,
  Calendar,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Users,
  Euro,
  TrendingUp,
  Filter,
  ChevronDown,
  BookOpen,
  Sparkles,
  Target,
  Loader2,
  Building,
} from "lucide-react"
import { cn, formatCurrencyDE } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { format, parseISO } from "date-fns"
import { de } from "date-fns/locale"
import { StatCard, statCardColors } from "@/components/ui/stat-card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"

// ** Import useTeam hook **
import { useTeam } from "@/contexts/team-context"

interface Team {
  id: string
  name: string
  color?: string
}

interface Certification {
  id: string
  name: string
  description?: string
  category: string
  issuing_authority?: string
  validity_months?: number
  reminder_days_before: number
  is_mandatory: boolean
  icon?: string
  color: string
  team_id?: string | null
}

interface TeamMemberCertification {
  id: string
  team_member_id: string
  team_member_name?: string
  certification_id: string
  certification_name?: string
  issue_date: string
  expiry_date?: string
  status: string
  certificate_file_url?: string
}

interface TrainingCourse {
  id: string
  name: string
  description?: string
  provider?: string
  category: string
  duration_hours?: number
  cost?: number
  currency: string
  location?: string
  is_online: boolean
  registration_url?: string
  is_mandatory: boolean
  team_id?: string | null
}

interface TrainingEvent {
  id: string
  title: string
  description?: string
  start_date: string
  end_date?: string
  start_time?: string
  end_time?: string
  location?: string
  is_online: boolean
  meeting_link?: string
  max_participants?: number
  cost_per_person?: number
  status: string
  team_id?: string | null
}

interface TrainingBudget {
  id: string
  team_member_id?: string
  team_member_name?: string
  team_id?: string
  team_name?: string
  year: number
  budget_amount: number
  used_amount: number
  currency: string
}

interface AIOptimizationResult {
  compliance_score: number
  urgent_actions: Array<{
    type: string
    title: string
    description: string
    affected_members: string[]
    priority: "high" | "medium" | "low"
  }>
  recommendations: Array<{
    category: string
    title: string
    description: string
    impact: string
  }>
  suggested_certifications: Array<{
    name: string
    description: string
    relevance: string
  }>
  suggested_courses: Array<{
    name: string
    provider: string
    estimated_cost: string
    duration: string
  }>
  budget_advice: string
  compliance_issues: string[]
}

export default function TrainingPage() {
  const { currentPractice: practice } = usePractice()
  const { currentUser: user } = useUser()
  const { teamMembers } = useTeam() // useTeam hook is now correctly imported and used
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState("overview")
  const [certifications, setCertifications] = useState<Certification[]>([])
  const [teamMemberCertifications, setTeamMemberCertifications] = useState<TeamMemberCertification[]>([])
  const [courses, setCourses] = useState<TrainingCourse[]>([])
  const [events, setEvents] = useState<TrainingEvent[]>([])
  const [budgets, setBudgets] = useState<TrainingBudget[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<string>("all")

  // Dialog states
  const [showAddCertification, setShowAddCertification] = useState(false)
  const [showAddTeamCertification, setShowAddTeamCertification] = useState(false)
  const [showAddCourse, setShowAddCourse] = useState(false)
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [showAddBudget, setShowAddBudget] = useState(false)

  const [showAIResults, setShowAIResults] = useState(false)
  const [aiOptimizing, setAiOptimizing] = useState(false)
  const [aiResults, setAiResults] = useState<AIOptimizationResult | null>(null)

  const [newCertTeamId, setNewCertTeamId] = useState<string>("practice-wide")
  const [newCourseTeamId, setNewCourseTeamId] = useState<string>("practice-wide")
  const [newEventTeamId, setNewEventTeamId] = useState<string>("practice-wide")

  const isAdmin =
    user?.role === "admin" ||
    user?.role === "praxis_admin" ||
    user?.role === "super_admin" ||
    user?.role === "superadmin"

  const fetchTeams = useCallback(async () => {
    if (!practice?.id) return
    try {
      const res = await fetch(`/api/practices/${practice.id}/teams`)
      if (!res.ok) throw new Error("Failed to fetch teams")
      const data = await res.json()
      setTeams(data.teams || [])
    } catch (error) {
      console.error("Error fetching teams:", error)
      toast({
        title: "Fehler",
        description: "Teams konnten nicht geladen werden.",
        variant: "destructive",
      })
    }
  }, [practice?.id, toast])

  const fetchData = useCallback(async () => {
    if (!practice?.id) return
    setLoading(true)

    try {
      const teamFilter = selectedTeamId !== "all" ? `team_id=${selectedTeamId}` : ""

      const [certsRes, teamCertsRes, coursesRes, eventsRes, budgetsRes] = await Promise.all([
        fetch(`/api/practices/${practice.id}/training/certifications${teamFilter ? `?${teamFilter}` : ""}`),
        fetch(`/api/practices/${practice.id}/training/team-member-certifications`),
        fetch(`/api/practices/${practice.id}/training/courses${teamFilter ? `?${teamFilter}` : ""}`),
        fetch(`/api/practices/${practice.id}/training/events${teamFilter ? `?${teamFilter}` : ""}`),
        fetch(`/api/practices/${practice.id}/training/budgets?year=${new Date().getFullYear()}`),
      ])

      if (!certsRes.ok) throw new Error(`Failed to fetch certifications: ${certsRes.status}`)
      if (!teamCertsRes.ok) throw new Error(`Failed to fetch team member certifications: ${teamCertsRes.status}`)
      if (!coursesRes.ok) throw new Error(`Failed to fetch courses: ${coursesRes.status}`)
      if (!eventsRes.ok) throw new Error(`Failed to fetch events: ${eventsRes.status}`)
      if (!budgetsRes.ok) throw new Error(`Failed to fetch budgets: ${budgetsRes.status}`)

      const [certsData, teamCertsData, coursesData, eventsData, budgetsData] = await Promise.all([
        certsRes.json(),
        teamCertsRes.json(),
        coursesRes.json(),
        eventsRes.json(),
        budgetsRes.json(),
      ])

      setCertifications(certsData.certifications || [])
      setTeamMemberCertifications(teamCertsData.team_member_certifications || [])
      setCourses(coursesData.courses || [])
      setEvents(eventsData.events || [])
      setBudgets(budgetsData.budgets || [])
    } catch (error) {
      console.error("Error fetching training data:", error)
      toast({
        title: "Fehler",
        description: "Trainingsdaten konnten nicht geladen werden.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [practice?.id, selectedTeamId, toast])

  useEffect(() => {
    fetchTeams()
  }, [fetchTeams])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAIOptimize = async () => {
    if (!practice?.id) return
    setAiOptimizing(true)
    try {
      const res = await fetch(`/api/practices/${practice.id}/training/ai-optimize`, {
        method: "POST",
      })
      if (!res.ok) throw new Error("AI optimization failed")
      const data = await res.json()
      if (data.optimization) {
        setAiResults(data.optimization)
        setShowAIResults(true)
      }
    } catch (error) {
      console.error("Error running AI optimization:", error)
      toast({
        title: "Fehler",
        description: "KI-Optimierung fehlgeschlagen.",
        variant: "destructive",
      })
    } finally {
      setAiOptimizing(false)
    }
  }

  const getTeamName = (teamId: string | null | undefined) => {
    if (!teamId) return "Praxisweit"
    const team = teams.find((t) => t.id === teamId)
    return team?.name || "Unbekannt"
  }

  const getTeamColor = (teamId: string | null | undefined) => {
    if (!teamId) return "#6B7280"
    const team = teams.find((t) => t.id === teamId)
    return team?.color || "#6B7280"
  }

  // Calculate statistics
  const stats = useMemo(() => {
    const totalCertifications = teamMemberCertifications.length
    const expiringSoon = teamMemberCertifications.filter((c) => c.status === "expiring_soon").length
    const expired = teamMemberCertifications.filter((c) => c.status === "expired").length
    const upcomingEvents = events.filter((e) => new Date(e.start_date) > new Date()).length
    const totalBudget = budgets.reduce((sum, b) => sum + b.budget_amount, 0)
    const usedBudget = budgets.reduce((sum, b) => sum + b.used_amount, 0)

    return {
      totalCertifications,
      expiringSoon,
      expired,
      upcomingEvents,
      totalBudget,
      usedBudget,
    }
  }, [teamMemberCertifications, events, budgets])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle2 className="h-3 w-3 mr-1" /> Gültig
          </Badge>
        )
      case "expiring_soon":
        return (
          <Badge className="bg-amber-100 text-amber-800">
            <Clock className="h-3 w-3 mr-1" /> Läuft bald ab
          </Badge>
        )
      case "expired":
        return (
          <Badge className="bg-red-100 text-red-800">
            <AlertCircle className="h-3 w-3 mr-1" /> Abgelaufen
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getCertificationStatusBadge = (certification: TeamMemberCertification) => {
    if (certification.status === "active") {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle2 className="h-3 w-3 mr-1" /> Gültig
        </Badge>
      )
    } else if (certification.status === "expiring_soon") {
      return (
        <Badge className="bg-amber-100 text-amber-800">
          <Clock className="h-3 w-3 mr-1" /> Läuft bald ab
        </Badge>
      )
    } else if (certification.status === "expired") {
      return (
        <Badge className="bg-red-100 text-red-800">
          <AlertCircle className="h-3 w-3 mr-1" /> Abgelaufen
        </Badge>
      )
    }
    return <Badge variant="outline">{certification.status}</Badge>
  }

  const getTeamCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0 }
    const practiceWideCounts: Record<string, number> = { certifications: 0, courses: 0, events: 0 }

    certifications.forEach((c) => {
      if (c.team_id) {
        counts[c.team_id] = (counts[c.team_id] || 0) + 1
      } else {
        practiceWideCounts.certifications++
      }
    })
    courses.forEach((c) => {
      if (c.team_id) {
        counts[c.team_id] = (counts[c.team_id] || 0) + 1
      } else {
        practiceWideCounts.courses++
      }
    })
    events.forEach((e) => {
      if (e.team_id) {
        counts[e.team_id] = (counts[e.team_id] || 0) + 1
      } else {
        practiceWideCounts.events++
      }
    })

    const total = certifications.length + courses.length + events.length
    counts.all = total

    // Add practice-wide counts to the total for each team if they are applicable
    teams.forEach((team) => {
      counts[team.id] += practiceWideCounts.certifications + practiceWideCounts.courses + practiceWideCounts.events
    })
    counts["practice-wide"] = practiceWideCounts.certifications + practiceWideCounts.courses + practiceWideCounts.events

    return counts
  }, [certifications, courses, events, teams])

  if (loading && certifications.length === 0) {
    return (
      <AppLayout header={null} footer={null} sidebar={null}>
        <main className="flex-1 p-6">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </main>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <GraduationCap className="h-8 w-8 text-primary" />
              Fortbildungsmanagement
            </h1>
            <p className="text-muted-foreground mt-1">Zertifikate, Schulungen und Budgets verwalten</p>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Button
                variant="outline"
                onClick={handleAIOptimize}
                disabled={aiOptimizing}
                className="bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100"
              >
                {aiOptimizing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                KI-Optimierung
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Teams filtern</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => setSelectedTeamId("all")}
                  className={cn("cursor-pointer", selectedTeamId === "all" && "bg-primary/10")}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Alle
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => setSelectedTeamId("practice-wide")}
                  className={cn("cursor-pointer", selectedTeamId === "practice-wide" && "bg-primary/10")}
                >
                  <Building className="h-4 w-4 mr-2" />
                  Praxisweit
                </DropdownMenuItem>
                {teams.map((team) => (
                  <DropdownMenuItem
                    key={team.id}
                    onSelect={() => setSelectedTeamId(team.id)}
                    className={cn("cursor-pointer", selectedTeamId === team.id && "bg-primary/10")}
                  >
                    <div className="h-3 w-3 rounded-full mr-2" style={{ backgroundColor: team.color || "#6B7280" }} />
                    {team.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Zertifikate"
            value={stats.totalCertifications}
            icon={<Award className="h-8 w-8" />}
            color={statCardColors.blue}
            description={
              stats.expiringSoon > 0
                ? `${stats.expiringSoon} laufen bald ab`
                : stats.expired > 0
                  ? `${stats.expired} sind abgelaufen`
                  : undefined
            }
            descriptionColor={
              stats.expiringSoon > 0 ? "text-amber-600" : stats.expired > 0 ? "text-red-600" : undefined
            }
          />
          <StatCard
            title="Kurse"
            value={courses.length}
            icon={<BookOpen className="h-8 w-8" />}
            color={statCardColors.green}
          />
          <StatCard
            title="Anstehende Termine"
            value={stats.upcomingEvents}
            icon={<Calendar className="h-8 w-8" />}
            color={statCardColors.purple}
            description="Geplante Veranstaltungen"
          />
          <StatCard
            title={`Budget ${new Date().getFullYear()}`}
            value={formatCurrencyDE(stats.usedBudget)}
            icon={<Euro className="h-8 w-8" />}
            color={statCardColors.amber}
            progress={stats.totalBudget > 0 ? (stats.usedBudget / stats.totalBudget) * 100 : 0}
            progressLabel={`${formatCurrencyDE(stats.totalBudget)} verwendet`}
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 h-auto gap-1">
            <TabsTrigger value="overview">Übersicht</TabsTrigger>
            <TabsTrigger value="certifications">Zertifikate</TabsTrigger>
            <TabsTrigger value="courses">Kurse</TabsTrigger>
            <TabsTrigger value="calendar">Kalender</TabsTrigger>
            <TabsTrigger value="budget">Budget</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Expiring Certifications */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    Ablaufende Zertifikate
                  </CardTitle>
                  <CardDescription>Zertifikate, die bald erneuert werden müssen</CardDescription>
                </CardHeader>
                <CardContent>
                  {teamMemberCertifications
                    .filter((c) => c.status === "expiring_soon" || c.status === "expired")
                    .slice(0, 5)
                    .map((cert) => (
                      <div key={cert.id} className="flex items-center justify-between py-3 border-b last:border-0">
                        <div>
                          <p className="font-medium">{cert.certification_name}</p>
                          <p className="text-sm text-muted-foreground">{cert.team_member_name}</p>
                        </div>
                        <div className="text-right">
                          {getCertificationStatusBadge(cert)}
                          {cert.expiry_date && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(parseISO(cert.expiry_date), "dd.MM.yyyy", { locale: de })}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  {teamMemberCertifications.filter((c) => c.status === "expiring_soon" || c.status === "expired")
                    .length === 0 && (
                    <p className="text-muted-foreground text-center py-8">Keine ablaufenden Zertifikate</p>
                  )}
                </CardContent>
              </Card>

              {/* Upcoming Events */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-purple-500" />
                    Anstehende Veranstaltungen
                  </CardTitle>
                  <CardDescription>Geplante Schulungen und Fortbildungen</CardDescription>
                </CardHeader>
                <CardContent>
                  {events
                    .filter((e) => new Date(e.start_date) > new Date())
                    .slice(0, 5)
                    .map((event) => (
                      <div key={event.id} className="flex items-center justify-between py-3 border-b last:border-0">
                        <div>
                          <p className="font-medium">{event.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {event.location || (event.is_online ? "Online" : "Vor Ort")}
                          </p>
                          {event.team_id && (
                            <Badge
                              variant="outline"
                              className="mt-1 text-xs"
                              style={{
                                borderColor: getTeamColor(event.team_id),
                                color: getTeamColor(event.team_id),
                              }}
                            >
                              {getTeamName(event.team_id)}
                            </Badge>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {format(parseISO(event.start_date), "dd.MM.yyyy", { locale: de })}
                          </p>
                          {event.start_time && <p className="text-sm text-muted-foreground">{event.start_time} Uhr</p>}
                        </div>
                      </div>
                    ))}
                  {events.filter((e) => new Date(e.start_date) > new Date()).length === 0 && (
                    <p className="text-muted-foreground text-center py-8">Keine anstehenden Veranstaltungen</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Team Certification Matrix */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  Team-Zertifizierungsmatrix
                </CardTitle>
                <CardDescription>Übersicht aller Zertifikate pro Teammitglied</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3">Mitarbeiter</th>
                        {certifications.slice(0, 6).map((cert) => (
                          <th key={cert.id} className="text-center py-2 px-3">
                            <div className="flex flex-col items-center">
                              <span className="truncate max-w-[100px]" title={cert.name}>
                                {cert.name}
                              </span>
                              {cert.team_id && (
                                <div
                                  className="h-2 w-2 rounded-full mt-1"
                                  style={{ backgroundColor: getTeamColor(cert.team_id) }}
                                  title={getTeamName(cert.team_id)}
                                />
                              )}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {teamMembers.slice(0, 10).map((member) => (
                        <tr key={member.id} className="border-b">
                          <td className="py-2 px-3 font-medium">
                            {member.first_name} {member.last_name}
                          </td>
                          {certifications.slice(0, 6).map((cert) => {
                            const memberCert = teamMemberCertifications.find(
                              (tc) => tc.team_member_id === member.id && tc.certification_id === cert.id,
                            )
                            return (
                              <td key={cert.id} className="text-center py-2 px-3">
                                {memberCert ? (
                                  <div className="flex justify-center">
                                    {memberCert.status === "active" ? (
                                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    ) : memberCert.status === "expiring_soon" ? (
                                      <Clock className="h-5 w-5 text-amber-500" />
                                    ) : (
                                      <AlertCircle className="h-5 w-5 text-red-500" />
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Certifications Tab */}
          <TabsContent value="certifications" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Zertifikate suchen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              {isAdmin && (
                <Button onClick={() => setShowAddCertification(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Zertifikatstyp hinzufügen
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {certifications
                .filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((cert) => (
                  <Card key={cert.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-10 w-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${cert.color}20` }}
                          >
                            <Award className="h-5 w-5" style={{ color: cert.color }} />
                          </div>
                          <div>
                            <h3 className="font-semibold">{cert.name}</h3>
                            <p className="text-sm text-muted-foreground">{cert.category}</p>
                          </div>
                        </div>
                        {cert.is_mandatory && (
                          <Badge variant="destructive" className="text-xs">
                            Pflicht
                          </Badge>
                        )}
                      </div>
                      {cert.description && (
                        <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{cert.description}</p>
                      )}
                      <div className="mt-4 flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {cert.validity_months ? `Gültig: ${cert.validity_months} Monate` : "Unbegrenzt gültig"}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-xs"
                          style={{
                            borderColor: getTeamColor(cert.team_id),
                            color: getTeamColor(cert.team_id),
                          }}
                        >
                          {getTeamName(cert.team_id)}
                        </Badge>
                      </div>
                      {isAdmin && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-4 bg-transparent"
                          onClick={() => {
                            // Logic to pre-fill the form with certification details for adding to a team member
                            toast({
                              title: "Feature coming soon",
                              description: "Assigning certifications to team members is planned.",
                            })
                            // setShowAddTeamCertification(true)
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Mitarbeiter zuweisen
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Kurse suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              {isAdmin && (
                <Button onClick={() => setShowAddCourse(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Kurs hinzufügen
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses
                .filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((course) => (
                  <Card key={course.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold">{course.name}</h3>
                        <div className="flex flex-col gap-1 items-end">
                          {course.is_online && (
                            <Badge variant="secondary" className="text-xs">
                              Online
                            </Badge>
                          )}
                          <Badge
                            variant="outline"
                            className="text-xs"
                            style={{
                              borderColor: getTeamColor(course.team_id),
                              color: getTeamColor(course.team_id),
                            }}
                          >
                            {getTeamName(course.team_id)}
                          </Badge>
                        </div>
                      </div>
                      {course.provider && (
                        <p className="text-sm text-muted-foreground mt-1">Anbieter: {course.provider}</p>
                      )}
                      {course.description && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{course.description}</p>
                      )}
                      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                        {course.duration_hours && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {course.duration_hours}h
                          </div>
                        )}
                        {course.cost && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Euro className="h-4 w-4" />
                            {formatCurrencyDE(course.cost)}
                          </div>
                        )}
                      </div>
                      {course.registration_url && (
                        <Button variant="outline" size="sm" className="w-full mt-4 bg-transparent" asChild>
                          <a href={course.registration_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Zur Anmeldung
                          </a>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Schulungskalender</h2>
              {isAdmin && (
                <Button onClick={() => setShowAddEvent(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Termin hinzufügen
                </Button>
              )}
            </div>

            <div className="space-y-4">
              {events.map((event) => (
                <Card key={event.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className="text-center min-w-[60px]">
                          <div className="text-2xl font-bold text-primary">
                            {format(parseISO(event.start_date), "dd", { locale: de })}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {format(parseISO(event.start_date), "MMM", { locale: de })}
                          </div>
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{event.title}</h3>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            {event.start_time && <span>{event.start_time} Uhr</span>}
                            <span>{event.location || (event.is_online ? "Online" : "Vor Ort")}</span>
                          </div>
                          {event.description && (
                            <p className="text-sm text-muted-foreground mt-2">{event.description}</p>
                          )}
                          <Badge
                            variant="outline"
                            className="mt-2 text-xs"
                            style={{
                              borderColor: getTeamColor(event.team_id),
                              color: getTeamColor(event.team_id),
                            }}
                          >
                            {getTeamName(event.team_id)}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        {event.cost_per_person && (
                          <p className="font-medium">{formatCurrencyDE(event.cost_per_person)} / Person</p>
                        )}
                        {event.max_participants && (
                          <p className="text-sm text-muted-foreground">Max. {event.max_participants} Teilnehmer</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {events.length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">Keine Termine</h3>
                    <p className="text-muted-foreground">Es sind noch keine Schulungstermine geplant.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Budget Tab */}
          <TabsContent value="budget" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Fortbildungsbudget {new Date().getFullYear()}</h2>
              {isAdmin && (
                <Button onClick={() => setShowAddBudget(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Budget hinzufügen
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {budgets.map((budget) => (
                <Card key={budget.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold">{budget.team_member_name || budget.team_name || "Praxis"}</h3>
                        <p className="text-sm text-muted-foreground">Budget {budget.year}</p>
                      </div>
                      <TrendingUp className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Verwendet</span>
                        <span className="font-medium">{formatCurrencyDE(budget.used_amount)}</span>
                      </div>
                      <Progress
                        value={budget.budget_amount > 0 ? (budget.used_amount / budget.budget_amount) * 100 : 0}
                      />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Gesamt</span>
                        <span>{formatCurrencyDE(budget.budget_amount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Verfügbar</span>
                        <span className="font-medium text-green-600">
                          {formatCurrencyDE(budget.budget_amount - budget.used_amount)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Add Certification Dialog */}
        <Dialog open={showAddCertification} onOpenChange={setShowAddCertification}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neuen Zertifikatstyp hinzufügen</DialogTitle>
              <DialogDescription>Definieren Sie einen neuen Zertifikatstyp für Ihre Praxis.</DialogDescription>
            </DialogHeader>
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                try {
                  const response = await fetch(`/api/practices/${practice?.id}/training/certifications`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      name: formData.get("name"),
                      description: formData.get("description"),
                      category: formData.get("category"),
                      issuing_authority: formData.get("issuing_authority"),
                      validity_months: formData.get("validity_months")
                        ? Number.parseInt(formData.get("validity_months") as string)
                        : null,
                      is_mandatory: formData.get("is_mandatory") === "on",
                      team_id: newCertTeamId === "practice-wide" ? null : newCertTeamId,
                      created_by: user?.id,
                    }),
                  })
                  if (!response.ok) throw new Error("Failed to create certification")
                  toast({ title: "Erfolg", description: "Zertifikatstyp erfolgreich hinzugefügt." })
                  setShowAddCertification(false)
                  setNewCertTeamId("practice-wide")
                  fetchData()
                } catch (error) {
                  console.error("Error creating certification:", error)
                  toast({
                    title: "Fehler",
                    description: "Zertifikatstyp konnte nicht hinzugefügt werden.",
                    variant: "destructive",
                  })
                }
              }}
            >
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input id="name" name="name" required />
                </div>
                <div>
                  <Label htmlFor="description">Beschreibung</Label>
                  <Textarea id="description" name="description" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Kategorie</Label>
                    <Select name="category" defaultValue="medical">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="medical">Medizinisch</SelectItem>
                        <SelectItem value="safety">Arbeitssicherheit</SelectItem>
                        <SelectItem value="hygiene">Hygiene</SelectItem>
                        <SelectItem value="software">Software</SelectItem>
                        <SelectItem value="other">Sonstige</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="validity_months">Gültigkeit (Monate)</Label>
                    <Input id="validity_months" name="validity_months" type="number" />
                  </div>
                </div>
                <div>
                  <Label>Team / Gruppe</Label>
                  <Select value={newCertTeamId} onValueChange={setNewCertTeamId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Team auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="practice-wide">Praxisweit (alle Teams)</SelectItem>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: team.color || "#6B7280" }}
                            />
                            {team.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">Praxisweit = Für alle Teams relevant</p>
                </div>
                <div>
                  <Label htmlFor="issuing_authority">Ausstellende Behörde</Label>
                  <Input id="issuing_authority" name="issuing_authority" />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="is_mandatory" name="is_mandatory" />
                  <Label htmlFor="is_mandatory">Pflicht-Zertifikat</Label>
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setShowAddCertification(false)}>
                  Abbrechen
                </Button>
                <Button type="submit">Hinzufügen</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add Course Dialog */}
        <Dialog open={showAddCourse} onOpenChange={setShowAddCourse}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neuen Kurs hinzufügen</DialogTitle>
              <DialogDescription>Fügen Sie einen neuen Schulungskurs hinzu.</DialogDescription>
            </DialogHeader>
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                try {
                  const response = await fetch(`/api/practices/${practice?.id}/training/courses`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      name: formData.get("name"),
                      description: formData.get("description"),
                      provider: formData.get("provider"),
                      category: formData.get("category"),
                      duration_hours: formData.get("duration_hours")
                        ? Number.parseFloat(formData.get("duration_hours") as string)
                        : null,
                      cost: formData.get("cost") ? Number.parseFloat(formData.get("cost") as string) : null,
                      is_online: formData.get("is_online") === "on",
                      registration_url: formData.get("registration_url"),
                      team_id: newCourseTeamId === "practice-wide" ? null : newCourseTeamId,
                      created_by: user?.id,
                    }),
                  })
                  if (!response.ok) throw new Error("Failed to create course")
                  toast({ title: "Erfolg", description: "Kurs erfolgreich hinzugefügt." })
                  setShowAddCourse(false)
                  setNewCourseTeamId("practice-wide")
                  fetchData()
                } catch (error) {
                  console.error("Error creating course:", error)
                  toast({
                    title: "Fehler",
                    description: "Kurs konnte nicht hinzugefügt werden.",
                    variant: "destructive",
                  })
                }
              }}
            >
              <div className="space-y-4">
                <div>
                  <Label htmlFor="course_name">Name *</Label>
                  <Input id="course_name" name="name" required />
                </div>
                <div>
                  <Label htmlFor="course_description">Beschreibung</Label>
                  <Textarea id="course_description" name="description" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="provider">Anbieter</Label>
                    <Input id="provider" name="provider" />
                  </div>
                  <div>
                    <Label htmlFor="category">Kategorie</Label>
                    <Select name="category" defaultValue="general">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">Allgemein</SelectItem>
                        <SelectItem value="medical">Medizinisch</SelectItem>
                        <SelectItem value="safety">Arbeitssicherheit</SelectItem>
                        <SelectItem value="software">Software</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Team / Gruppe</Label>
                  <Select value={newCourseTeamId} onValueChange={setNewCourseTeamId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Team auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="practice-wide">Praxisweit (alle Teams)</SelectItem>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: team.color || "#6B7280" }}
                            />
                            {team.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="duration_hours">Dauer (Stunden)</Label>
                    <Input id="duration_hours" name="duration_hours" type="number" step="0.5" />
                  </div>
                  <div>
                    <Label htmlFor="cost">Kosten (€)</Label>
                    <Input id="cost" name="cost" type="number" step="0.01" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="registration_url">Anmelde-Link</Label>
                  <Input id="registration_url" name="registration_url" type="url" />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="is_online" name="is_online" />
                  <Label htmlFor="is_online">Online-Kurs</Label>
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setShowAddCourse(false)}>
                  Abbrechen
                </Button>
                <Button type="submit">Hinzufügen</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add Event Dialog */}
        <Dialog open={showAddEvent} onOpenChange={setShowAddEvent}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neuen Termin hinzufügen</DialogTitle>
              <DialogDescription>Planen Sie einen neuen Schulungstermin.</DialogDescription>
            </DialogHeader>
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                try {
                  const response = await fetch(`/api/practices/${practice?.id}/training/events`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      title: formData.get("title"),
                      description: formData.get("description"),
                      start_date: formData.get("start_date"),
                      start_time: formData.get("start_time"),
                      end_time: formData.get("end_time"),
                      location: formData.get("location"),
                      is_online: formData.get("is_online") === "on",
                      meeting_link: formData.get("meeting_link"),
                      max_participants: formData.get("max_participants")
                        ? Number.parseInt(formData.get("max_participants") as string)
                        : null,
                      cost_per_person: formData.get("cost_per_person")
                        ? Number.parseFloat(formData.get("cost_per_person") as string)
                        : null,
                      team_id: newEventTeamId === "practice-wide" ? null : newEventTeamId,
                      created_by: user?.id,
                    }),
                  })
                  if (!response.ok) throw new Error("Failed to create event")
                  toast({ title: "Erfolg", description: "Termin erfolgreich hinzugefügt." })
                  setShowAddEvent(false)
                  setNewEventTeamId("practice-wide")
                  fetchData()
                } catch (error) {
                  console.error("Error creating event:", error)
                  toast({
                    title: "Fehler",
                    description: "Termin konnte nicht hinzugefügt werden.",
                    variant: "destructive",
                  })
                }
              }}
            >
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Titel *</Label>
                  <Input id="title" name="title" required />
                </div>
                <div>
                  <Label htmlFor="event_description">Beschreibung</Label>
                  <Textarea id="event_description" name="description" />
                </div>
                <div>
                  <Label>Team / Gruppe</Label>
                  <Select value={newEventTeamId} onValueChange={setNewEventTeamId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Team auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="practice-wide">Praxisweit (alle Teams)</SelectItem>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: team.color || "#6B7280" }}
                            />
                            {team.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="start_date">Datum *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            // ** FIX: formData is undeclared here. It should be accessed from the form element. **
                            // !formData.get("start_date") && "text-muted-foreground",
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {/* ** FIX: formData is undeclared here. ** */}
                          {/* {formData.get("start_date")
                            ? format(parseISO(formData.get("start_date") as string), "PPP", { locale: de })
                            : "Datum auswählen"} */}
                          Select Date
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          // ** FIX: formData is undeclared here. **
                          // selected={
                          //   formData.get("start_date") ? parseISO(formData.get("start_date") as string) : undefined
                          // }
                          selected={undefined} // Placeholder until formData is correctly handled
                          onSelect={(date) => {
                            const input = document.getElementById("start_date") as HTMLInputElement
                            if (input && date) {
                              input.value = format(date, "yyyy-MM-dd")
                            } else if (input) {
                              input.value = ""
                            }
                          }}
                          initialFocus
                          locale={de}
                        />
                      </PopoverContent>
                    </Popover>
                    <Input id="start_date" name="start_date" type="date" className="hidden" required />
                  </div>
                  <div>
                    <Label htmlFor="start_time">Beginn</Label>
                    <Input id="start_time" name="start_time" type="time" />
                  </div>
                  <div>
                    <Label htmlFor="end_time">Ende</Label>
                    <Input id="end_time" name="end_time" type="time" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="location">Ort</Label>
                  <Input id="location" name="location" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="max_participants">Max. Teilnehmer</Label>
                    <Input id="max_participants" name="max_participants" type="number" />
                  </div>
                  <div>
                    <Label htmlFor="cost_per_person">Kosten pro Person (€)</Label>
                    <Input id="cost_per_person" name="cost_per_person" type="number" step="0.01" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="event_is_online" name="is_online" />
                  <Label htmlFor="event_is_online">Online-Veranstaltung</Label>
                </div>
                <div>
                  <Label htmlFor="meeting_link">Meeting-Link</Label>
                  <Input id="meeting_link" name="meeting_link" type="url" />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setShowAddEvent(false)}>
                  Abbrechen
                </Button>
                <Button type="submit">Hinzufügen</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add Budget Dialog */}
        <Dialog open={showAddBudget} onOpenChange={setShowAddBudget}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Budget hinzufügen</DialogTitle>
              <DialogDescription>
                Legen Sie ein Fortbildungsbudget für ein Teammitglied oder Team fest.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                try {
                  const response = await fetch(`/api/practices/${practice?.id}/training/budgets`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      team_member_id:
                        formData.get("team_member_id") === "practice-wide" ? null : formData.get("team_member_id"),
                      team_id: formData.get("team_member_id") === "practice-wide" ? null : formData.get("team_id"), // Assuming team_id might be needed for team budgets
                      year: Number.parseInt(formData.get("year") as string),
                      budget_amount: Number.parseFloat(formData.get("budget_amount") as string),
                      currency: "EUR", // Assuming EUR as default
                      created_by: user?.id,
                    }),
                  })
                  if (!response.ok) throw new Error("Failed to create budget")
                  toast({ title: "Erfolg", description: "Budget erfolgreich hinzugefügt." })
                  setShowAddBudget(false)
                  fetchData()
                } catch (error) {
                  console.error("Error creating budget:", error)
                  toast({
                    title: "Fehler",
                    description: "Budget konnte nicht hinzugefügt werden.",
                    variant: "destructive",
                  })
                }
              }}
            >
              <div className="space-y-4">
                <div>
                  <Label htmlFor="team_member_id">Mitarbeiter / Team (optional)</Label>
                  <Select
                    name="team_member_id"
                    onValueChange={(value) => {
                      // Handle logic to differentiate between member and team budget if necessary
                      // For now, 'practice-wide' is used for both practice-wide and potentially team budgets
                      // A more robust solution might involve separate selects for team member and team.
                      const input = document.getElementById("team_member_id") as HTMLSelectElement
                      if (input) input.value = value
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Mitarbeiter auswählen oder leer lassen für Praxisbudget" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="practice-wide">Praxisweites Budget</SelectItem>
                      <SelectGroup>
                        <SelectLabel>Mitarbeiter</SelectLabel>
                        {teamMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.first_name} {member.last_name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel>Teams</SelectLabel>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <Input type="hidden" id="team_member_id" name="team_member_id" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="year">Jahr *</Label>
                    <Input id="year" name="year" type="number" defaultValue={new Date().getFullYear()} required />
                  </div>
                  <div>
                    <Label htmlFor="budget_amount">Budget (€) *</Label>
                    <Input id="budget_amount" name="budget_amount" type="number" step="0.01" required />
                  </div>
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setShowAddBudget(false)}>
                  Abbrechen
                </Button>
                <Button type="submit">Hinzufügen</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add Team Certification Dialog */}
        <Dialog open={showAddTeamCertification} onOpenChange={setShowAddTeamCertification}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Zertifikat zuweisen</DialogTitle>
              <DialogDescription>Weisen Sie einem Teammitglied ein Zertifikat zu.</DialogDescription>
            </DialogHeader>
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                try {
                  const response = await fetch(`/api/practices/${practice?.id}/training/team-member-certifications`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      team_member_id: formData.get("team_member_id"),
                      certification_id: formData.get("certification_id"),
                      issue_date: formData.get("issue_date"),
                      expiry_date: formData.get("expiry_date") || null,
                      certificate_number: formData.get("certificate_number"),
                      created_by: user?.id,
                    }),
                  })
                  if (!response.ok) throw new Error("Failed to assign certification")
                  toast({ title: "Erfolg", description: "Zertifikat erfolgreich zugewiesen." })
                  setShowAddTeamCertification(false)
                  fetchData()
                } catch (error) {
                  console.error("Error creating team certification:", error)
                  toast({
                    title: "Fehler",
                    description: "Zertifikat konnte nicht zugewiesen werden.",
                    variant: "destructive",
                  })
                }
              }}
            >
              <div className="space-y-4">
                <div>
                  <Label htmlFor="team_member_id">Mitarbeiter *</Label>
                  <Select name="team_member_id" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Mitarbeiter auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.first_name} {member.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="certification_id">Zertifikat *</Label>
                  <Select name="certification_id" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Zertifikat auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {certifications.map((cert) => (
                        <SelectItem key={cert.id} value={cert.id}>
                          {cert.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="issue_date">Ausstellungsdatum *</Label>
                    <Input id="issue_date" name="issue_date" type="date" required />
                  </div>
                  <div>
                    <Label htmlFor="expiry_date">Ablaufdatum</Label>
                    <Input id="expiry_date" name="expiry_date" type="date" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="certificate_number">Zertifikatsnummer</Label>
                  <Input id="certificate_number" name="certificate_number" />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setShowAddTeamCertification(false)}>
                  Abbrechen
                </Button>
                <Button type="submit">Zuweisen</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* AI Optimization Results Dialog */}
        <Dialog open={showAIResults} onOpenChange={setShowAIResults}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-violet-500" />
                KI-Optimierungsanalyse
              </DialogTitle>
              <DialogDescription>Empfehlungen zur Verbesserung Ihres Fortbildungsmanagements</DialogDescription>
            </DialogHeader>
            {aiResults && (
              <div className="space-y-6">
                {/* Compliance Score */}
                <div className="flex items-center justify-center">
                  <div className="relative h-32 w-32">
                    <svg className="h-32 w-32 transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        className="text-muted"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${(aiResults.compliance_score / 100) * 352} 352`}
                        className={
                          aiResults.compliance_score >= 80
                            ? "text-green-500"
                            : aiResults.compliance_score >= 60
                              ? "text-amber-500"
                              : "text-red-500"
                        }
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold">{aiResults.compliance_score}%</span>
                    </div>
                  </div>
                </div>
                <p className="text-center text-muted-foreground">Compliance Score</p>

                {/* Urgent Actions */}
                {aiResults.urgent_actions.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      Dringende Maßnahmen
                    </h3>
                    <div className="space-y-2">
                      {aiResults.urgent_actions.map((action, i) => (
                        <Card key={i} className="border-red-200 bg-red-50">
                          <CardContent className="p-4">
                            <h4 className="font-medium">{action.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
                            {action.affected_members.length > 0 && (
                              <p className="text-xs mt-2">Betrifft: {action.affected_members.join(", ")}</p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {aiResults.recommendations.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Empfehlungen</h3>
                    <div className="space-y-2">
                      {aiResults.recommendations.map((rec, i) => (
                        <Card key={i}>
                          <CardContent className="p-4">
                            <Badge variant="outline" className="mb-2">
                              {rec.category}
                            </Badge>
                            <h4 className="font-medium">{rec.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                            <p className="text-xs text-green-600 mt-2">Auswirkung: {rec.impact}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Certifications */}
                {aiResults.suggested_certifications.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Empfohlene Zertifikate</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {aiResults.suggested_certifications.map((cert, i) => (
                        <Card key={i}>
                          <CardContent className="p-4">
                            <h4 className="font-medium">{cert.name}</h4>
                            <p className="text-sm text-muted-foreground">{cert.description}</p>
                            <p className="text-xs text-blue-600 mt-1">{cert.relevance}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Courses */}
                {aiResults.suggested_courses.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Empfohlene Kurse</h3>
                    <div className="space-y-2">
                      {aiResults.suggested_courses.map((course, i) => (
                        <Card key={i}>
                          <CardContent className="p-4">
                            <h4 className="font-medium">{course.name}</h4>
                            <p className="text-sm text-muted-foreground">Anbieter: {course.provider}</p>
                            <p className="text-xs text-muted-foreground mt-1">Kosten: {course.estimated_cost}</p>
                            <p className="text-xs text-muted-foreground mt-1">Dauer: {course.duration}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Budget Advice */}
                {aiResults.budget_advice && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Euro className="h-4 w-4" />
                      Budget-Empfehlung
                    </h3>
                    <Card className="bg-amber-50 border-amber-200">
                      <CardContent className="p-4">
                        <p className="text-sm">{aiResults.budget_advice}</p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Compliance Issues */}
                {aiResults.compliance_issues.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Target className="h-4 w-4 text-red-500" />
                      Compliance-Probleme
                    </h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                      {aiResults.compliance_issues.map((issue, i) => (
                        <li key={i}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setShowAIResults(false)}>Schließen</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}
