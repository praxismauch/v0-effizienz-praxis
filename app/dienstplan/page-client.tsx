"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useUser } from "@/contexts/user-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import {
  Calendar,
  Clock,
  Plus,
  ChevronLeft,
  ChevronRight,
  Settings,
  UserCheck,
  ArrowLeftRight,
  Shield,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  X,
  Pencil,
  Sparkles,
  Sun,
  Moon,
  Coffee,
  Loader2,
  Trash2,
  RefreshCw,
  TrendingUp,
  Target,
  CalendarDays,
  UserX,
  CalendarCheck,
  Wand2,
  ThumbsUp,
  ThumbsDown,
  FileText,
  PieChart,
  Activity,
} from "lucide-react"
import {
  format,
  startOfWeek,
  endOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  isSameDay,
  parseISO,
  differenceInMinutes,
} from "date-fns"
import { de } from "date-fns/locale"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"

interface ShiftType {
  id: string
  name: string
  short_name: string
  start_time: string
  end_time: string
  break_minutes: number
  color: string
  min_staff: number
  max_staff?: number
  is_active: boolean
}

interface Shift {
  id: string
  team_member_id: string
  shift_type_id: string
  shift_date: string
  start_time: string
  end_time: string
  break_minutes: number
  status: string
  notes?: string
}

interface TeamMember {
  id: string
  first_name: string
  last_name: string
  role: string
  image_url?: string
  weekly_hours?: number
}

interface Availability {
  id: string
  team_member_id: string
  day_of_week?: number
  specific_date?: string
  availability_type: "available" | "unavailable" | "preferred" | "vacation" | "sick"
  start_time?: string
  end_time?: string
  notes?: string
  is_recurring: boolean
  valid_from?: string
  valid_until?: string
}

interface SwapRequest {
  id: string
  requester_id: string
  target_id: string
  requester_shift_id: string
  target_shift_id: string
  reason: string
  status: "pending" | "approved" | "rejected"
  ai_recommendation?: string
  created_at: string
  reviewed_at?: string
  reviewed_by?: string
}

interface Violation {
  id: string
  team_member_id: string
  shift_id?: string
  violation_type: string
  severity: "info" | "warning" | "error"
  description: string
  resolved: boolean
  resolved_at?: string
  resolved_by?: string
}

const getShiftIcon = (name: string) => {
  const lowerName = name.toLowerCase()
  if (lowerName.includes("früh") || lowerName.includes("morning")) return Sun
  if (lowerName.includes("spät") || lowerName.includes("evening")) return Moon
  if (lowerName.includes("pause") || lowerName.includes("break")) return Coffee
  return Clock
}

const DAYS_OF_WEEK = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"]

export default function DienstplanPageClient() {
  const { currentPractice, currentUser } = useUser()
  const { toast } = useToast()

  // Core state
  const [activeTab, setActiveTab] = useState("schedule")
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [isLoading, setIsLoading] = useState(true)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)

  // Data state
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [shiftTypes, setShiftTypes] = useState<ShiftType[]>([])
  const [schedules, setSchedules] = useState<Shift[]>([])
  const [availability, setAvailability] = useState<Availability[]>([])
  const [swapRequests, setSwapRequests] = useState<SwapRequest[]>([])
  const [violations, setViolations] = useState<Violation[]>([])

  // Filter state
  const [selectedTeam, setSelectedTeam] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Dialog states
  const [showAddShiftDialog, setShowAddShiftDialog] = useState(false)
  const [showShiftTypeDialog, setShowShiftTypeDialog] = useState(false)
  const [showAvailabilityDialog, setShowAvailabilityDialog] = useState(false)
  const [showSwapRequestDialog, setShowSwapRequestDialog] = useState(false)
  const [showAIGenerateDialog, setShowAIGenerateDialog] = useState(false)

  // Editing states
  const [selectedCell, setSelectedCell] = useState<{ date: Date; memberId: string } | null>(null)
  const [editingShift, setEditingShift] = useState<Shift | null>(null)
  const [editingShiftType, setEditingShiftType] = useState<ShiftType | null>(null)
  const [editingAvailability, setEditingAvailability] = useState<Availability | null>(null)
  const [selectedMemberForAvailability, setSelectedMemberForAvailability] = useState<string>("")

  // Form states
  const [newShift, setNewShift] = useState({
    shift_type_id: "",
    start_time: "",
    end_time: "",
    notes: "",
  })

  const [newShiftType, setNewShiftType] = useState({
    name: "",
    short_name: "",
    start_time: "08:00",
    end_time: "17:00",
    break_minutes: 30,
    color: "#3b82f6",
    min_staff: 1,
    is_active: true,
  })

  const [newAvailability, setNewAvailability] = useState<Partial<Availability>>({
    availability_type: "available",
    is_recurring: true,
    day_of_week: 0,
  })

  const [newSwapRequest, setNewSwapRequest] = useState({
    target_id: "",
    requester_shift_id: "",
    target_shift_id: "",
    reason: "",
  })

  // AI state
  const [aiInsights, setAiInsights] = useState<string>("")
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([])

  // Stats
  const stats = useMemo(() => {
    const pendingSwaps = swapRequests.filter((r) => r.status === "pending").length
    const activeViolations = violations.filter((v) => !v.resolved).length
    const totalShifts = schedules.length
    const coveredShifts = schedules.filter((s) => s.status === "approved" || s.status === "scheduled").length

    return {
      pendingSwaps,
      activeViolations,
      totalShifts,
      coveredShifts,
      coverageRate: totalShifts > 0 ? Math.round((coveredShifts / totalShifts) * 100) : 0,
    }
  }, [swapRequests, violations, schedules])

  // Week days
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i))
  }, [currentWeek])

  // Filtered team members
  const filteredTeamMembers = useMemo(() => {
    return teamMembers.filter((member) => {
      const matchesSearch =
        !searchQuery ||
        member.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.last_name.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesSearch
    })
  }, [teamMembers, searchQuery])

  // Fetch all data
  const fetchData = useCallback(async () => {
    if (!currentPractice?.id) return

    setIsLoading(true)
    try {
      const weekStart = format(currentWeek, "yyyy-MM-dd")
      const weekEnd = format(endOfWeek(currentWeek, { weekStartsOn: 1 }), "yyyy-MM-dd")

      const [teamRes, shiftTypesRes, schedulesRes, availabilityRes, swapRes, violationsRes] = await Promise.all([
        fetch(`/api/practices/${currentPractice.id}/team-members`),
        fetch(`/api/practices/${currentPractice.id}/dienstplan/shift-types`),
        fetch(`/api/practices/${currentPractice.id}/dienstplan/schedules?start=${weekStart}&end=${weekEnd}`),
        fetch(`/api/practices/${currentPractice.id}/dienstplan/availability`),
        fetch(`/api/practices/${currentPractice.id}/dienstplan/swap-requests?status=pending`),
        fetch(`/api/practices/${currentPractice.id}/dienstplan/compliance`),
      ])

      if (teamRes.ok) {
        const data = await teamRes.json()
        setTeamMembers(data.teamMembers || data || [])
      }
      if (shiftTypesRes.ok) {
        const data = await shiftTypesRes.json()
        setShiftTypes(data.shiftTypes || [])
      }
      if (schedulesRes.ok) {
        const data = await schedulesRes.json()
        setSchedules(data.schedules || [])
      }
      if (availabilityRes.ok) {
        const data = await availabilityRes.json()
        setAvailability(data.availability || [])
      }
      if (swapRes.ok) {
        const data = await swapRes.json()
        setSwapRequests(data.swapRequests || [])
      }
      if (violationsRes.ok) {
        const data = await violationsRes.json()
        setViolations(data.violations || [])
      }
    } catch (error) {
      console.error("Error fetching dienstplan data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [currentPractice?.id, currentWeek])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Get shifts for a specific member and day
  const getShiftsForMemberAndDay = useCallback(
    (memberId: string, date: Date) => {
      const dateStr = format(date, "yyyy-MM-dd")
      return schedules.filter((s) => s.team_member_id === memberId && s.shift_date === dateStr)
    },
    [schedules],
  )

  // Get availability for a specific member and day
  const getAvailabilityForMemberAndDay = useCallback(
    (memberId: string, date: Date) => {
      const dayOfWeek = date.getDay() === 0 ? 6 : date.getDay() - 1
      const dateStr = format(date, "yyyy-MM-dd")

      return availability.find(
        (a) =>
          a.team_member_id === memberId &&
          ((a.is_recurring && a.day_of_week === dayOfWeek) || (!a.is_recurring && a.specific_date === dateStr)),
      )
    },
    [availability],
  )

  // Calculate weekly hours for a member
  const getWeeklyHours = useCallback(
    (memberId: string) => {
      const memberSchedules = schedules.filter((s) => s.team_member_id === memberId)
      let totalMinutes = 0

      memberSchedules.forEach((schedule) => {
        if (schedule.start_time && schedule.end_time) {
          const start = parseISO(`2000-01-01T${schedule.start_time}`)
          const end = parseISO(`2000-01-01T${schedule.end_time}`)
          const minutes = differenceInMinutes(end, start) - (schedule.break_minutes || 0)
          totalMinutes += minutes
        }
      })

      return totalMinutes / 60
    },
    [schedules],
  )

  // CRUD Operations
  const handleAddShift = async () => {
    if (!currentPractice?.id || !selectedCell || !newShift.shift_type_id) return

    try {
      const shiftType = shiftTypes.find((st) => st.id === newShift.shift_type_id)

      const response = await fetch(`/api/practices/${currentPractice.id}/dienstplan/schedules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team_member_id: selectedCell.memberId,
          shift_type_id: newShift.shift_type_id,
          shift_date: format(selectedCell.date, "yyyy-MM-dd"),
          start_time: newShift.start_time || shiftType?.start_time,
          end_time: newShift.end_time || shiftType?.end_time,
          break_minutes: shiftType?.break_minutes || 30,
          notes: newShift.notes,
          status: "scheduled",
        }),
      })

      if (response.ok) {
        toast({ title: "Schicht erstellt", description: "Die Schicht wurde erfolgreich hinzugefügt." })
        fetchData()
        setShowAddShiftDialog(false)
        setNewShift({ shift_type_id: "", start_time: "", end_time: "", notes: "" })
        setSelectedCell(null)
      }
    } catch (error) {
      toast({ title: "Fehler", description: "Schicht konnte nicht erstellt werden.", variant: "destructive" })
    }
  }

  const handleDeleteShift = async (shiftId: string) => {
    if (!currentPractice?.id) return

    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/dienstplan/schedules/${shiftId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({ title: "Schicht gelöscht", description: "Die Schicht wurde entfernt." })
        fetchData()
      }
    } catch (error) {
      toast({ title: "Fehler", description: "Schicht konnte nicht gelöscht werden.", variant: "destructive" })
    }
  }

  const handleSaveShiftType = async () => {
    if (!currentPractice?.id || !newShiftType.name) return

    try {
      const url = editingShiftType
        ? `/api/practices/${currentPractice.id}/dienstplan/shift-types/${editingShiftType.id}`
        : `/api/practices/${currentPractice.id}/dienstplan/shift-types`

      const response = await fetch(url, {
        method: editingShiftType ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newShiftType),
      })

      if (response.ok) {
        toast({
          title: editingShiftType ? "Schichttyp aktualisiert" : "Schichttyp erstellt",
          description: "Die Änderungen wurden gespeichert.",
        })
        fetchData()
        setShowShiftTypeDialog(false)
        setEditingShiftType(null)
        setNewShiftType({
          name: "",
          short_name: "",
          start_time: "08:00",
          end_time: "17:00",
          break_minutes: 30,
          color: "#3b82f6",
          min_staff: 1,
          is_active: true,
        })
      }
    } catch (error) {
      toast({ title: "Fehler", description: "Änderungen konnten nicht gespeichert werden.", variant: "destructive" })
    }
  }

  const handleSaveAvailability = async () => {
    if (!currentPractice?.id || !selectedMemberForAvailability) return

    try {
      const url = editingAvailability
        ? `/api/practices/${currentPractice.id}/dienstplan/availability/${editingAvailability.id}`
        : `/api/practices/${currentPractice.id}/dienstplan/availability`

      const response = await fetch(url, {
        method: editingAvailability ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newAvailability,
          team_member_id: selectedMemberForAvailability,
        }),
      })

      if (response.ok) {
        toast({
          title: editingAvailability ? "Verfügbarkeit aktualisiert" : "Verfügbarkeit erstellt",
          description: "Die Änderungen wurden gespeichert.",
        })
        fetchData()
        setShowAvailabilityDialog(false)
        setEditingAvailability(null)
        setNewAvailability({ availability_type: "available", is_recurring: true, day_of_week: 0 })
        setSelectedMemberForAvailability("")
      }
    } catch (error) {
      toast({ title: "Fehler", description: "Verfügbarkeit konnte nicht gespeichert werden.", variant: "destructive" })
    }
  }

  const handleDeleteAvailability = async (availabilityId: string) => {
    if (!currentPractice?.id) return

    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/dienstplan/availability/${availabilityId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({ title: "Verfügbarkeit gelöscht" })
        fetchData()
      }
    } catch (error) {
      toast({ title: "Fehler", variant: "destructive" })
    }
  }

  const handleCreateSwapRequest = async () => {
    if (!currentPractice?.id || !currentUser?.id) return

    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/dienstplan/swap-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requester_id: currentUser.id,
          ...newSwapRequest,
        }),
      })

      if (response.ok) {
        toast({ title: "Tausch-Anfrage erstellt", description: "Die Anfrage wurde gesendet." })
        fetchData()
        setShowSwapRequestDialog(false)
        setNewSwapRequest({ target_id: "", requester_shift_id: "", target_shift_id: "", reason: "" })
      }
    } catch (error) {
      toast({ title: "Fehler", variant: "destructive" })
    }
  }

  const handleSwapRequestAction = async (requestId: string, action: "approved" | "rejected") => {
    if (!currentPractice?.id) return

    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/dienstplan/swap-requests/${requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action }),
      })

      if (response.ok) {
        toast({
          title: action === "approved" ? "Tausch genehmigt" : "Tausch abgelehnt",
          description: action === "approved" ? "Die Schichten wurden getauscht." : "Die Anfrage wurde abgelehnt.",
        })
        fetchData()
      }
    } catch (error) {
      toast({ title: "Fehler", variant: "destructive" })
    }
  }

  const handleAIGenerateSchedule = async () => {
    if (!currentPractice?.id) return

    setIsGeneratingAI(true)
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/dienstplan/ai-generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          week_start: format(currentWeek, "yyyy-MM-dd"),
          team_members: teamMembers,
          shift_types: shiftTypes,
          availability,
          existing_schedules: schedules,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setAiSuggestions(data.suggestions || [])
        toast({
          title: "KI-Dienstplan erstellt",
          description: `${data.suggestions?.length || 0} Schichten wurden generiert.`,
        })
        fetchData()
        setShowAIGenerateDialog(false)
      }
    } catch (error) {
      toast({ title: "Fehler bei der KI-Generierung", variant: "destructive" })
    } finally {
      setIsGeneratingAI(false)
    }
  }

  const generateAIInsights = async () => {
    if (!currentPractice?.id) return

    setIsGeneratingAI(true)
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/dienstplan/ai-analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schedules,
          team_members: teamMembers,
          violations,
          availability,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setAiInsights(data.insights || "")
      }
    } catch (error) {
      console.error("Error generating AI insights:", error)
    } finally {
      setIsGeneratingAI(false)
    }
  }

  // Resolve violation
  const handleResolveViolation = async (violationId: string) => {
    if (!currentPractice?.id) return

    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/dienstplan/compliance/${violationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolved: true }),
      })

      if (response.ok) {
        toast({ title: "Verstoß behoben" })
        fetchData()
      }
    } catch (error) {
      toast({ title: "Fehler", variant: "destructive" })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dienstplan</h1>
          <p className="text-muted-foreground">Schichtplanung und Personalverwaltung mit KI-Unterstützung</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowShiftTypeDialog(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Schichttypen
          </Button>
          <Button
            onClick={() => setShowAIGenerateDialog(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-500"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            KI-Dienstplan
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Geplante Schichten</p>
                <p className="text-2xl font-bold">{stats.totalShifts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Abdeckungsrate</p>
                <p className="text-2xl font-bold">{stats.coverageRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <ArrowLeftRight className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Offene Tausch-Anfragen</p>
                <p className="text-2xl font-bold">{stats.pendingSwaps}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${stats.activeViolations > 0 ? "bg-red-100 dark:bg-red-900/30" : "bg-green-100 dark:bg-green-900/30"}`}
              >
                <Shield className={`h-5 w-5 ${stats.activeViolations > 0 ? "text-red-600" : "text-green-600"}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Compliance-Probleme</p>
                <p className="text-2xl font-bold">{stats.activeViolations}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="schedule" className="gap-2">
            <Calendar className="h-4 w-4" />
            Wochenplan
          </TabsTrigger>
          <TabsTrigger value="availability" className="gap-2">
            <UserCheck className="h-4 w-4" />
            Verfügbarkeiten
          </TabsTrigger>
          <TabsTrigger value="swaps" className="gap-2">
            <ArrowLeftRight className="h-4 w-4" />
            Tausch-Anfragen
            {stats.pendingSwaps > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 justify-center">
                {stats.pendingSwaps}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="compliance" className="gap-2">
            <Shield className="h-4 w-4" />
            Compliance
            {stats.activeViolations > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 justify-center">
                {stats.activeViolations}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Auswertung
          </TabsTrigger>
        </TabsList>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-4">
          {/* Week Navigation */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" onClick={() => setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
                    Heute
                  </Button>
                  <span className="font-medium ml-2">
                    {format(currentWeek, "d. MMMM", { locale: de })} -{" "}
                    {format(endOfWeek(currentWeek, { weekStartsOn: 1 }), "d. MMMM yyyy", { locale: de })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Mitarbeiter suchen..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-48"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule Grid */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-left font-medium min-w-[180px]">Mitarbeiter</th>
                      {weekDays.map((day, i) => (
                        <th
                          key={i}
                          className={`p-3 text-center font-medium min-w-[120px] ${
                            isSameDay(day, new Date()) ? "bg-primary/10" : ""
                          }`}
                        >
                          <div>{DAYS_OF_WEEK[i]}</div>
                          <div className="text-sm font-normal text-muted-foreground">
                            {format(day, "d. MMM", { locale: de })}
                          </div>
                        </th>
                      ))}
                      <th className="p-3 text-center font-medium min-w-[80px]">Stunden</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTeamMembers.map((member) => (
                      <tr key={member.id} className="border-b hover:bg-muted/30">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={member.image_url || "/placeholder.svg"} />
                              <AvatarFallback>
                                {member.first_name[0]}
                                {member.last_name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">
                                {member.first_name} {member.last_name}
                              </p>
                              <p className="text-xs text-muted-foreground">{member.role}</p>
                            </div>
                          </div>
                        </td>
                        {weekDays.map((day, dayIndex) => {
                          const shifts = getShiftsForMemberAndDay(member.id, day)
                          const avail = getAvailabilityForMemberAndDay(member.id, day)

                          return (
                            <td
                              key={dayIndex}
                              className={`p-1 border-l cursor-pointer transition-colors hover:bg-muted/50 ${
                                avail?.availability_type === "unavailable" || avail?.availability_type === "vacation"
                                  ? "bg-red-50 dark:bg-red-900/10"
                                  : avail?.availability_type === "preferred"
                                    ? "bg-green-50 dark:bg-green-900/10"
                                    : ""
                              }`}
                              onClick={() => {
                                setSelectedCell({ date: day, memberId: member.id })
                                setShowAddShiftDialog(true)
                              }}
                            >
                              <div className="min-h-[60px] space-y-1">
                                {shifts.map((shift) => {
                                  const shiftType = shiftTypes.find((st) => st.id === shift.shift_type_id)
                                  const ShiftIcon = shiftType ? getShiftIcon(shiftType.name) : Clock

                                  return (
                                    <TooltipProvider key={shift.id}>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div
                                            className="p-1.5 rounded text-xs font-medium text-white flex items-center gap-1 group relative"
                                            style={{ backgroundColor: shiftType?.color || "#3b82f6" }}
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              setEditingShift(shift)
                                            }}
                                          >
                                            <ShiftIcon className="h-3 w-3" />
                                            <span>{shiftType?.short_name || "?"}</span>
                                            <span className="text-[10px] opacity-80">
                                              {shift.start_time?.slice(0, 5)}
                                            </span>
                                            <button
                                              className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full items-center justify-center hidden group-hover:flex"
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                handleDeleteShift(shift.id)
                                              }}
                                            >
                                              <X className="h-2.5 w-2.5" />
                                            </button>
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p className="font-medium">{shiftType?.name}</p>
                                          <p className="text-xs">
                                            {shift.start_time?.slice(0, 5)} - {shift.end_time?.slice(0, 5)}
                                          </p>
                                          {shift.notes && <p className="text-xs mt-1">{shift.notes}</p>}
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )
                                })}
                                {shifts.length === 0 && (
                                  <div className="flex items-center justify-center h-full opacity-0 hover:opacity-100 transition-opacity">
                                    <Plus className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                            </td>
                          )
                        })}
                        <td className="p-3 text-center border-l">
                          <span
                            className={`font-medium ${
                              getWeeklyHours(member.id) > (member.weekly_hours || 40)
                                ? "text-red-600"
                                : "text-green-600"
                            }`}
                          >
                            {getWeeklyHours(member.id).toFixed(1)}h
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Shift Type Legend */}
          {shiftTypes.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-3">
                  <span className="text-sm text-muted-foreground">Legende:</span>
                  {shiftTypes
                    .filter((st) => st.is_active)
                    .map((st) => {
                      const ShiftIcon = getShiftIcon(st.name)
                      return (
                        <Badge
                          key={st.id}
                          variant="secondary"
                          className="text-white"
                          style={{ backgroundColor: st.color }}
                        >
                          <ShiftIcon className="h-3 w-3 mr-1" />
                          {st.short_name} - {st.name}
                        </Badge>
                      )
                    })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="availability" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5" />
                    Verfügbarkeiten & Wunschdienste
                  </CardTitle>
                  <CardDescription>
                    Mitarbeiter können hier ihre Verfügbarkeiten und Wunschdienste angeben
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={generateAIInsights} disabled={isGeneratingAI}>
                    {isGeneratingAI ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    KI-Analyse
                  </Button>
                  <Button onClick={() => setShowAvailabilityDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Verfügbarkeit hinzufügen
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Availability Grid by Team Member */}
              <div className="space-y-4">
                {filteredTeamMembers.map((member) => {
                  const memberAvailability = availability.filter((a) => a.team_member_id === member.id)

                  return (
                    <Card key={member.id} className="border">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={member.image_url || "/placeholder.svg"} />
                              <AvatarFallback>
                                {member.first_name[0]}
                                {member.last_name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {member.first_name} {member.last_name}
                              </p>
                              <p className="text-sm text-muted-foreground">{member.role}</p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedMemberForAvailability(member.id)
                              setShowAvailabilityDialog(true)
                            }}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Hinzufügen
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {memberAvailability.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            Keine Verfügbarkeiten eingetragen
                          </p>
                        ) : (
                          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                            {memberAvailability.map((avail) => (
                              <div
                                key={avail.id}
                                className={`p-3 rounded-lg border flex items-center justify-between ${
                                  avail.availability_type === "available" || avail.availability_type === "preferred"
                                    ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                                    : avail.availability_type === "vacation"
                                      ? "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"
                                      : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {avail.availability_type === "available" && (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  )}
                                  {avail.availability_type === "preferred" && (
                                    <ThumbsUp className="h-4 w-4 text-green-600" />
                                  )}
                                  {avail.availability_type === "unavailable" && (
                                    <UserX className="h-4 w-4 text-red-600" />
                                  )}
                                  {avail.availability_type === "vacation" && (
                                    <CalendarDays className="h-4 w-4 text-blue-600" />
                                  )}
                                  <div>
                                    <p className="text-sm font-medium">
                                      {avail.is_recurring
                                        ? DAYS_OF_WEEK[avail.day_of_week || 0]
                                        : format(parseISO(avail.specific_date!), "d. MMM yyyy", { locale: de })}
                                    </p>
                                    {avail.start_time && avail.end_time && (
                                      <p className="text-xs text-muted-foreground">
                                        {avail.start_time} - {avail.end_time}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => {
                                      setEditingAvailability(avail)
                                      setNewAvailability(avail)
                                      setSelectedMemberForAvailability(member.id)
                                      setShowAvailabilityDialog(true)
                                    }}
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-red-600"
                                    onClick={() => handleDeleteAvailability(avail.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="swaps" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowLeftRight className="h-5 w-5" />
                    Dienst-Tausch-Anfragen
                  </CardTitle>
                  <CardDescription>KI-geprüfte Tausch-Anfragen zwischen Mitarbeitenden</CardDescription>
                </div>
                <Button onClick={() => setShowSwapRequestDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tausch anfragen
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {swapRequests.length === 0 ? (
                <div className="text-center py-12">
                  <ArrowLeftRight className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="font-medium">Keine offenen Tausch-Anfragen</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Erstellen Sie eine neue Anfrage, um Schichten zu tauschen
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {swapRequests.map((request) => {
                    const requester = teamMembers.find((m) => m.id === request.requester_id)
                    const target = teamMembers.find((m) => m.id === request.target_id)

                    return (
                      <Card key={request.id} className="border-l-4 border-l-amber-500">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-4 mb-3">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={requester?.image_url || "/placeholder.svg"} />
                                    <AvatarFallback>
                                      {requester?.first_name[0]}
                                      {requester?.last_name[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium">
                                    {requester?.first_name} {requester?.last_name}
                                  </span>
                                </div>
                                <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={target?.image_url || "/placeholder.svg"} />
                                    <AvatarFallback>
                                      {target?.first_name[0]}
                                      {target?.last_name[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium">
                                    {target?.first_name} {target?.last_name}
                                  </span>
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{request.reason}</p>
                              {request.ai_recommendation && (
                                <div className="flex items-start gap-2 p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 mt-2">
                                  <Sparkles className="h-4 w-4 text-purple-600 mt-0.5" />
                                  <div>
                                    <p className="text-xs font-medium text-purple-700 dark:text-purple-300">
                                      KI-Empfehlung
                                    </p>
                                    <p className="text-sm text-purple-600 dark:text-purple-400">
                                      {request.ai_recommendation}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSwapRequestAction(request.id, "rejected")}
                              >
                                <ThumbsDown className="h-4 w-4 mr-1" />
                                Ablehnen
                              </Button>
                              <Button size="sm" onClick={() => handleSwapRequestAction(request.id, "approved")}>
                                <ThumbsUp className="h-4 w-4 mr-1" />
                                Genehmigen
                              </Button>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-3">
                            Erstellt am {format(parseISO(request.created_at), "d. MMM yyyy, HH:mm", { locale: de })}
                          </p>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Compliance & Arbeitszeitgesetz
                  </CardTitle>
                  <CardDescription>
                    Automatische Prüfung auf Arbeitszeitgesetze, Ruhezeiten und Vertragsgrenzen
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={fetchData}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Prüfung aktualisieren
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {violations.filter((v) => !v.resolved).length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
                  <p className="text-xl font-medium text-green-600">Alles in Ordnung!</p>
                  <p className="text-muted-foreground mt-1">Keine Compliance-Verstöße gefunden</p>
                  <div className="mt-6 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 max-w-md mx-auto">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                      <Sparkles className="h-4 w-4" />
                      <span className="text-sm font-medium">KI-Tipp</span>
                    </div>
                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                      Alle Schichten entsprechen den gesetzlichen Vorgaben. Die Ruhezeiten und Höchstarbeitszeiten
                      werden eingehalten.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {violations
                    .filter((v) => !v.resolved)
                    .map((violation) => {
                      const member = teamMembers.find((m) => m.id === violation.team_member_id)

                      return (
                        <Card
                          key={violation.id}
                          className={`border-l-4 ${
                            violation.severity === "error"
                              ? "border-l-red-500"
                              : violation.severity === "warning"
                                ? "border-l-amber-500"
                                : "border-l-blue-500"
                          }`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                              <div
                                className={`p-2 rounded-lg ${
                                  violation.severity === "error"
                                    ? "bg-red-100 dark:bg-red-900/30"
                                    : violation.severity === "warning"
                                      ? "bg-amber-100 dark:bg-amber-900/30"
                                      : "bg-blue-100 dark:bg-blue-900/30"
                                }`}
                              >
                                <AlertTriangle
                                  className={`h-5 w-5 ${
                                    violation.severity === "error"
                                      ? "text-red-600"
                                      : violation.severity === "warning"
                                        ? "text-amber-600"
                                        : "text-blue-600"
                                  }`}
                                />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium">{violation.violation_type}</p>
                                  <Badge
                                    variant={
                                      violation.severity === "error"
                                        ? "destructive"
                                        : violation.severity === "warning"
                                          ? "outline"
                                          : "secondary"
                                    }
                                  >
                                    {violation.severity === "error"
                                      ? "Kritisch"
                                      : violation.severity === "warning"
                                        ? "Warnung"
                                        : "Info"}
                                  </Badge>
                                </div>
                                {member && (
                                  <p className="text-sm text-muted-foreground mb-1">
                                    Betrifft: {member.first_name} {member.last_name}
                                  </p>
                                )}
                                <p className="text-sm">{violation.description}</p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleResolveViolation(violation.id)}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Als gelöst markieren
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Compliance Rules Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Geprüfte Regeln</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {[
                  { rule: "Max. 10 Stunden pro Tag", icon: Clock },
                  { rule: "Max. 48 Stunden pro Woche", icon: Calendar },
                  { rule: "Min. 11 Stunden Ruhezeit", icon: Moon },
                  { rule: "Max. 6 Tage ohne freien Tag", icon: CalendarCheck },
                  { rule: "Vertragliche Wochenstunden", icon: FileText },
                  { rule: "Pausenregelungen", icon: Coffee },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                    <item.icon className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm">{item.rule}</span>
                    <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium">Auswertung & Statistiken</h3>
              <p className="text-sm text-muted-foreground">Analyse der Dienstverteilung und Arbeitszeiten</p>
            </div>
            <Button variant="outline" onClick={generateAIInsights} disabled={isGeneratingAI}>
              {isGeneratingAI ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              KI-Insights generieren
            </Button>
          </div>

          {/* AI Insights Card */}
          {aiInsights && (
            <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                  <Sparkles className="h-5 w-5" />
                  KI-Analyse
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-purple-600 dark:text-purple-400">{aiInsights}</p>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {/* Working Hours per Employee */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Arbeitsstunden pro Mitarbeiter
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredTeamMembers.slice(0, 8).map((member) => {
                    const hours = getWeeklyHours(member.id)
                    const maxHours = member.weekly_hours || 40
                    const percentage = Math.min((hours / maxHours) * 100, 120)
                    const isOvertime = hours > maxHours

                    return (
                      <div key={member.id} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="truncate max-w-[150px]">
                            {member.first_name} {member.last_name[0]}.
                          </span>
                          <span className={`font-medium ${isOvertime ? "text-red-600" : "text-green-600"}`}>
                            {hours.toFixed(1)} / {maxHours}h
                          </span>
                        </div>
                        <Progress
                          value={percentage}
                          className={`h-2 ${isOvertime ? "[&>div]:bg-red-500" : "[&>div]:bg-green-500"}`}
                        />
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Shift Distribution */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChart className="h-4 w-4" />
                  Schichtverteilung
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {shiftTypes
                    .filter((st) => st.is_active)
                    .map((shiftType) => {
                      const count = schedules.filter((s) => s.shift_type_id === shiftType.id).length
                      const percentage = schedules.length > 0 ? (count / schedules.length) * 100 : 0

                      return (
                        <div key={shiftType.id} className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: shiftType.color }} />
                          <span className="text-sm flex-1">{shiftType.name}</span>
                          <span className="text-sm font-medium">{count}</span>
                          <span className="text-xs text-muted-foreground w-12 text-right">
                            {percentage.toFixed(0)}%
                          </span>
                        </div>
                      )
                    })}
                </div>
              </CardContent>
            </Card>

            {/* Weekend Distribution */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Wochenend-Verteilung
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredTeamMembers.slice(0, 6).map((member) => {
                    const weekendShifts = schedules.filter((s) => {
                      if (s.team_member_id !== member.id) return false
                      const date = parseISO(s.shift_date)
                      return date.getDay() === 0 || date.getDay() === 6
                    }).length

                    return (
                      <div key={member.id} className="flex items-center justify-between">
                        <span className="text-sm">
                          {member.first_name} {member.last_name[0]}.
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <div
                                key={i}
                                className={`w-3 h-3 rounded ${i < weekendShifts ? "bg-amber-500" : "bg-muted"}`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-medium w-8">{weekendShifts}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Coverage Summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Wochenübersicht
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold text-green-600">{schedules.length}</p>
                    <p className="text-xs text-muted-foreground">Geplante Schichten</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold text-blue-600">{filteredTeamMembers.length}</p>
                    <p className="text-xs text-muted-foreground">Mitarbeiter</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold text-amber-600">
                      {schedules
                        .reduce((acc, s) => {
                          if (s.start_time && s.end_time) {
                            const start = parseISO(`2000-01-01T${s.start_time}`)
                            const end = parseISO(`2000-01-01T${s.end_time}`)
                            return acc + differenceInMinutes(end, start) / 60
                          }
                          return acc
                        }, 0)
                        .toFixed(0)}
                      h
                    </p>
                    <p className="text-xs text-muted-foreground">Gesamt Arbeitsstunden</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold text-purple-600">{stats.coverageRate}%</p>
                    <p className="text-xs text-muted-foreground">Abdeckungsrate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Shift Dialog */}
      <Dialog open={showAddShiftDialog} onOpenChange={setShowAddShiftDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schicht hinzufügen</DialogTitle>
            <DialogDescription>
              {selectedCell && (
                <>
                  {format(selectedCell.date, "EEEE, d. MMMM yyyy", { locale: de })} -{" "}
                  {teamMembers.find((m) => m.id === selectedCell.memberId)?.first_name}{" "}
                  {teamMembers.find((m) => m.id === selectedCell.memberId)?.last_name}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Schichttyp</Label>
              <Select
                value={newShift.shift_type_id}
                onValueChange={(v) => setNewShift({ ...newShift, shift_type_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Schichttyp wählen" />
                </SelectTrigger>
                <SelectContent>
                  {shiftTypes
                    .filter((st) => st.is_active)
                    .map((st) => (
                      <SelectItem key={st.id} value={st.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded" style={{ backgroundColor: st.color }} />
                          {st.name} ({st.start_time?.slice(0, 5)} - {st.end_time?.slice(0, 5)})
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Startzeit (optional)</Label>
                <Input
                  type="time"
                  value={newShift.start_time}
                  onChange={(e) => setNewShift({ ...newShift, start_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Endzeit (optional)</Label>
                <Input
                  type="time"
                  value={newShift.end_time}
                  onChange={(e) => setNewShift({ ...newShift, end_time: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notizen</Label>
              <Textarea
                value={newShift.notes}
                onChange={(e) => setNewShift({ ...newShift, notes: e.target.value })}
                placeholder="Optionale Notizen zur Schicht..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddShiftDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleAddShift} disabled={!newShift.shift_type_id}>
              Hinzufügen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shift Type Dialog */}
      <Dialog open={showShiftTypeDialog} onOpenChange={setShowShiftTypeDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Schichttypen verwalten</DialogTitle>
            <DialogDescription>Definieren Sie die verschiedenen Schichtarten für Ihre Praxis</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Vorhandene Schichttypen</Label>
              <div className="grid gap-2 max-h-48 overflow-y-auto">
                {shiftTypes.map((st) => {
                  const ShiftIcon = getShiftIcon(st.name)
                  return (
                    <div
                      key={st.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                      style={{ borderColor: st.color + "40" }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded" style={{ backgroundColor: st.color + "20" }}>
                          <ShiftIcon className="h-4 w-4" style={{ color: st.color }} />
                        </div>
                        <div>
                          <p className="font-medium">
                            {st.name} ({st.short_name})
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {st.start_time?.slice(0, 5)} - {st.end_time?.slice(0, 5)}, {st.break_minutes} Min. Pause
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingShiftType(st)
                          setNewShiftType(st)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <Label>{editingShiftType ? "Schichttyp bearbeiten" : "Neuen Schichttyp erstellen"}</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={newShiftType.name}
                    onChange={(e) => setNewShiftType({ ...newShiftType, name: e.target.value })}
                    placeholder="z.B. Frühdienst"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Kurzform</Label>
                  <Input
                    value={newShiftType.short_name}
                    onChange={(e) => setNewShiftType({ ...newShiftType, short_name: e.target.value })}
                    placeholder="z.B. FD"
                    maxLength={5}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Startzeit</Label>
                  <Input
                    type="time"
                    value={newShiftType.start_time}
                    onChange={(e) => setNewShiftType({ ...newShiftType, start_time: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Endzeit</Label>
                  <Input
                    type="time"
                    value={newShiftType.end_time}
                    onChange={(e) => setNewShiftType({ ...newShiftType, end_time: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pause (Min.)</Label>
                  <Input
                    type="number"
                    value={newShiftType.break_minutes}
                    onChange={(e) =>
                      setNewShiftType({ ...newShiftType, break_minutes: Number.parseInt(e.target.value) })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Farbe</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={newShiftType.color}
                      onChange={(e) => setNewShiftType({ ...newShiftType, color: e.target.value })}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={newShiftType.color}
                      onChange={(e) => setNewShiftType({ ...newShiftType, color: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Min. Besetzung</Label>
                  <Input
                    type="number"
                    value={newShiftType.min_staff}
                    onChange={(e) => setNewShiftType({ ...newShiftType, min_staff: Number.parseInt(e.target.value) })}
                    min={1}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowShiftTypeDialog(false)
                setEditingShiftType(null)
                setNewShiftType({
                  name: "",
                  short_name: "",
                  start_time: "08:00",
                  end_time: "17:00",
                  break_minutes: 30,
                  color: "#3b82f6",
                  min_staff: 1,
                  is_active: true,
                })
              }}
            >
              Schließen
            </Button>
            <Button onClick={handleSaveShiftType} disabled={!newShiftType.name}>
              {editingShiftType ? "Aktualisieren" : "Erstellen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAvailabilityDialog} onOpenChange={setShowAvailabilityDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAvailability ? "Verfügbarkeit bearbeiten" : "Verfügbarkeit hinzufügen"}</DialogTitle>
            <DialogDescription>Geben Sie die Verfügbarkeit für einen Mitarbeiter an</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!selectedMemberForAvailability && (
              <div className="space-y-2">
                <Label>Mitarbeiter</Label>
                <Select value={selectedMemberForAvailability} onValueChange={setSelectedMemberForAvailability}>
                  <SelectTrigger>
                    <SelectValue placeholder="Mitarbeiter wählen" />
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
            )}

            <div className="space-y-2">
              <Label>Verfügbarkeitstyp</Label>
              <Select
                value={newAvailability.availability_type}
                onValueChange={(v) => setNewAvailability({ ...newAvailability, availability_type: v as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Verfügbar</SelectItem>
                  <SelectItem value="preferred">Wunschdienst</SelectItem>
                  <SelectItem value="unavailable">Nicht verfügbar</SelectItem>
                  <SelectItem value="vacation">Urlaub</SelectItem>
                  <SelectItem value="sick">Krank</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={newAvailability.is_recurring}
                onCheckedChange={(v) => setNewAvailability({ ...newAvailability, is_recurring: v })}
              />
              <Label>Wiederkehrend (wöchentlich)</Label>
            </div>

            {newAvailability.is_recurring ? (
              <div className="space-y-2">
                <Label>Wochentag</Label>
                <Select
                  value={String(newAvailability.day_of_week || 0)}
                  onValueChange={(v) => setNewAvailability({ ...newAvailability, day_of_week: Number.parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map((day, i) => (
                      <SelectItem key={i} value={String(i)}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Datum</Label>
                <Input
                  type="date"
                  value={newAvailability.specific_date || ""}
                  onChange={(e) => setNewAvailability({ ...newAvailability, specific_date: e.target.value })}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Von (optional)</Label>
                <Input
                  type="time"
                  value={newAvailability.start_time || ""}
                  onChange={(e) => setNewAvailability({ ...newAvailability, start_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Bis (optional)</Label>
                <Input
                  type="time"
                  value={newAvailability.end_time || ""}
                  onChange={(e) => setNewAvailability({ ...newAvailability, end_time: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notizen</Label>
              <Textarea
                value={newAvailability.notes || ""}
                onChange={(e) => setNewAvailability({ ...newAvailability, notes: e.target.value })}
                placeholder="Optionale Notizen..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAvailabilityDialog(false)
                setEditingAvailability(null)
                setNewAvailability({ availability_type: "available", is_recurring: true, day_of_week: 0 })
                setSelectedMemberForAvailability("")
              }}
            >
              Abbrechen
            </Button>
            <Button onClick={handleSaveAvailability} disabled={!selectedMemberForAvailability}>
              {editingAvailability ? "Aktualisieren" : "Hinzufügen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSwapRequestDialog} onOpenChange={setShowSwapRequestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dienst-Tausch anfragen</DialogTitle>
            <DialogDescription>
              Erstellen Sie eine Anfrage zum Tauschen von Schichten mit einem Kollegen
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Ihre Schicht zum Tauschen</Label>
              <Select
                value={newSwapRequest.requester_shift_id}
                onValueChange={(v) => setNewSwapRequest({ ...newSwapRequest, requester_shift_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Schicht wählen" />
                </SelectTrigger>
                <SelectContent>
                  {schedules
                    .filter((s) => s.team_member_id === currentUser?.id)
                    .map((shift) => {
                      const shiftType = shiftTypes.find((st) => st.id === shift.shift_type_id)
                      return (
                        <SelectItem key={shift.id} value={shift.id}>
                          {format(parseISO(shift.shift_date), "d. MMM", { locale: de })} - {shiftType?.name}
                        </SelectItem>
                      )
                    })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tauschen mit</Label>
              <Select
                value={newSwapRequest.target_id}
                onValueChange={(v) => setNewSwapRequest({ ...newSwapRequest, target_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kollege wählen" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers
                    .filter((m) => m.id !== currentUser?.id)
                    .map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.first_name} {member.last_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {newSwapRequest.target_id && (
              <div className="space-y-2">
                <Label>Gewünschte Schicht des Kollegen</Label>
                <Select
                  value={newSwapRequest.target_shift_id}
                  onValueChange={(v) => setNewSwapRequest({ ...newSwapRequest, target_shift_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Schicht wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {schedules
                      .filter((s) => s.team_member_id === newSwapRequest.target_id)
                      .map((shift) => {
                        const shiftType = shiftTypes.find((st) => st.id === shift.shift_type_id)
                        return (
                          <SelectItem key={shift.id} value={shift.id}>
                            {format(parseISO(shift.shift_date), "d. MMM", { locale: de })} - {shiftType?.name}
                          </SelectItem>
                        )
                      })}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Begründung</Label>
              <Textarea
                value={newSwapRequest.reason}
                onChange={(e) => setNewSwapRequest({ ...newSwapRequest, reason: e.target.value })}
                placeholder="Warum möchten Sie tauschen?"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSwapRequestDialog(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={handleCreateSwapRequest}
              disabled={!newSwapRequest.requester_shift_id || !newSwapRequest.target_id || !newSwapRequest.reason}
            >
              Anfrage senden
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAIGenerateDialog} onOpenChange={setShowAIGenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              KI-Dienstplan generieren
            </DialogTitle>
            <DialogDescription>
              Lassen Sie die KI einen optimierten Dienstplan für die Woche erstellen
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20">
              <h4 className="font-medium text-purple-700 dark:text-purple-300 mb-2">Die KI berücksichtigt:</h4>
              <ul className="text-sm text-purple-600 dark:text-purple-400 space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Arbeitszeitgesetz (max. 10h/Tag, 48h/Woche)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Mindestens 11 Stunden Ruhezeit
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Individuelle Verfügbarkeiten
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Faire Wochenend-Verteilung
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Vertragliche Arbeitszeiten
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-lg border">
              <p className="text-sm text-muted-foreground">
                <strong>Woche:</strong> {format(currentWeek, "d. MMMM", { locale: de })} -{" "}
                {format(endOfWeek(currentWeek, { weekStartsOn: 1 }), "d. MMMM yyyy", { locale: de })}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Team:</strong> {teamMembers.length} Mitarbeiter
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Schichttypen:</strong> {shiftTypes.filter((st) => st.is_active).length} aktiv
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAIGenerateDialog(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={handleAIGenerateSchedule}
              disabled={isGeneratingAI}
              className="bg-gradient-to-r from-purple-500 to-pink-500"
            >
              {isGeneratingAI ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generiere...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Dienstplan generieren
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
