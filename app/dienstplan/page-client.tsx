"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/contexts/auth-context"
import { usePractice } from "@/contexts/practice-context"
import AppLayout from "@/components/app-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles,
  Clock,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Settings,
  ArrowLeftRight,
  UserCheck,
  CalendarDays,
  BarChart3,
  Shield,
  Brain,
  Loader2,
  Pencil,
  Filter,
  X,
  Info,
  Sun,
  Moon,
  Sunset,
} from "lucide-react"
import { format, addDays, startOfWeek, endOfWeek, isSameDay, parseISO, addWeeks, subWeeks } from "date-fns"
import { de } from "date-fns/locale"

// Types
interface ShiftType {
  id: string
  name: string
  short_name: string
  start_time: string
  end_time: string
  break_minutes: number
  color: string
  description?: string
  min_staff: number
  max_staff?: number
  is_active: boolean
}

interface TeamMember {
  id: string
  first_name: string
  last_name: string
  email: string
  role: string
  avatar_url?: string
  employment_type?: string
  weekly_hours?: number
}

interface ShiftSchedule {
  id: string
  team_member_id: string
  shift_type_id: string
  shift_date: string
  start_time: string
  end_time: string
  break_minutes: number
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "swapped"
  notes?: string
  team_member?: TeamMember
  shift_type?: ShiftType
}

interface EmployeeAvailability {
  id: string
  team_member_id: string
  day_of_week?: number
  specific_date?: string
  availability_type: "available" | "preferred" | "unavailable" | "vacation" | "sick"
  start_time?: string
  end_time?: string
  notes?: string
  is_recurring: boolean
}

interface SwapRequest {
  id: string
  requester_id: string
  requester_shift_id: string
  target_id?: string
  target_shift_id?: string
  status: "pending" | "accepted" | "rejected" | "cancelled" | "completed"
  reason?: string
  ai_recommendation?: string
  requester?: TeamMember
  requester_shift?: ShiftSchedule
}

interface ComplianceViolation {
  id: string
  shift_id?: string
  team_member_id?: string
  violation_type: string
  severity: "info" | "warning" | "error"
  description: string
  resolved: boolean
}

const DAYS_OF_WEEK = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]
const DAYS_OF_WEEK_FULL = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"]

const DEFAULT_SHIFT_TYPES: Partial<ShiftType>[] = [
  { name: "Frühdienst", short_name: "FD", start_time: "06:00", end_time: "14:00", color: "#f59e0b", break_minutes: 30 },
  { name: "Spätdienst", short_name: "SD", start_time: "14:00", end_time: "22:00", color: "#8b5cf6", break_minutes: 30 },
  { name: "Tagdienst", short_name: "TD", start_time: "08:00", end_time: "17:00", color: "#3b82f6", break_minutes: 60 },
  {
    name: "Nachtdienst",
    short_name: "ND",
    start_time: "22:00",
    end_time: "06:00",
    color: "#1e293b",
    break_minutes: 45,
  },
]

const getShiftIcon = (name: string) => {
  if (name.toLowerCase().includes("früh") || name.toLowerCase().includes("morgen")) return Sun
  if (name.toLowerCase().includes("spät") || name.toLowerCase().includes("abend")) return Sunset
  if (name.toLowerCase().includes("nacht")) return Moon
  return Clock
}

export default function DienstplanPageClient() {
  const { user, loading: authLoading } = useAuth()
  const { currentPractice, loading: practiceLoading } = usePractice()
  const { toast } = useToast()

  // State
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [activeTab, setActiveTab] = useState("schedule")
  const [shiftTypes, setShiftTypes] = useState<ShiftType[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [schedules, setSchedules] = useState<ShiftSchedule[]>([])
  const [availability, setAvailability] = useState<EmployeeAvailability[]>([])
  const [swapRequests, setSwapRequests] = useState<SwapRequest[]>([])
  const [violations, setViolations] = useState<ComplianceViolation[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  // Dialogs
  const [showAddShiftDialog, setShowAddShiftDialog] = useState(false)
  const [showShiftTypeDialog, setShowShiftTypeDialog] = useState(false)
  const [showAIDialog, setShowAIDialog] = useState(false)
  const [showAvailabilityDialog, setShowAvailabilityDialog] = useState(false)
  const [selectedCell, setSelectedCell] = useState<{ date: Date; memberId: string } | null>(null)
  const [editingShift, setEditingShift] = useState<ShiftSchedule | null>(null)
  const [editingShiftType, setEditingShiftType] = useState<ShiftType | null>(null)

  // Form state
  const [newShift, setNewShift] = useState({
    shift_type_id: "",
    start_time: "",
    end_time: "",
    notes: "",
  })
  const [newShiftType, setNewShiftType] = useState<Partial<ShiftType>>({
    name: "",
    short_name: "",
    start_time: "08:00",
    end_time: "17:00",
    break_minutes: 30,
    color: "#3b82f6",
    min_staff: 1,
    is_active: true,
  })

  // Filters
  const [filterRole, setFilterRole] = useState<string>("all")
  const [filterShiftType, setFilterShiftType] = useState<string>("all")

  // Week navigation
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i))
  }, [currentWeek])

  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 })

  // Fetch data
  useEffect(() => {
    if (currentPractice?.id) {
      fetchData()
    }
  }, [currentPractice?.id, currentWeek])

  const fetchData = async () => {
    if (!currentPractice?.id) {
      toast({
        title: "Keine Praxis ausgewählt",
        description: "Bitte wählen Sie eine Praxis aus, um den Dienstplan zu laden.",
        variant: "destructive",
      })
      return
    }
    setLoading(true)

    try {
      const [shiftTypesRes, teamRes, schedulesRes, availabilityRes, swapRes, violationsRes] = await Promise.all([
        fetch(`/api/practices/${currentPractice.id}/dienstplan/shift-types`),
        fetch(`/api/practices/${currentPractice.id}/team-members`),
        fetch(
          `/api/practices/${currentPractice.id}/dienstplan/schedules?start=${format(currentWeek, "yyyy-MM-dd")}&end=${format(weekEnd, "yyyy-MM-dd")}`,
        ),
        fetch(`/api/practices/${currentPractice.id}/dienstplan/availability`),
        fetch(`/api/practices/${currentPractice.id}/dienstplan/swap-requests?status=pending`),
        fetch(`/api/practices/${currentPractice.id}/dienstplan/compliance?resolved=false`),
      ])

      if (shiftTypesRes.ok) {
        const data = await shiftTypesRes.json()
        setShiftTypes(data.shiftTypes || [])
      }

      if (teamRes.ok) {
        const data = await teamRes.json()
        setTeamMembers(data.teamMembers || [])
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
      setLoading(false)
    }
  }

  // Get shifts for a specific day and member
  const getShiftsForCell = (date: Date, memberId: string) => {
    return schedules.filter(
      (s) => s.team_member_id === memberId && isSameDay(parseISO(s.shift_date), date) && s.status !== "cancelled",
    )
  }

  // Get availability for a specific day and member
  const getAvailabilityForCell = (date: Date, memberId: string) => {
    const dayOfWeek = date.getDay() === 0 ? 6 : date.getDay() - 1 // Convert to Mon=0
    const dateStr = format(date, "yyyy-MM-dd")

    return availability.find(
      (a) =>
        a.team_member_id === memberId &&
        ((a.is_recurring && a.day_of_week === dayOfWeek) || a.specific_date === dateStr),
    )
  }

  // Calculate weekly hours for a member
  const getWeeklyHours = (memberId: string) => {
    const memberSchedules = schedules.filter(
      (s) =>
        s.team_member_id === memberId &&
        s.status !== "cancelled" &&
        weekDays.some((d) => isSameDay(parseISO(s.shift_date), d)),
    )

    return memberSchedules.reduce((total, s) => {
      const start = Number.parseFloat(s.start_time.split(":")[0]) + Number.parseFloat(s.start_time.split(":")[1]) / 60
      const end = Number.parseFloat(s.end_time.split(":")[0]) + Number.parseFloat(s.end_time.split(":")[1]) / 60
      const hours = end > start ? end - start : 24 - start + end // Handle overnight shifts
      return total + hours - (s.break_minutes || 0) / 60
    }, 0)
  }

  // Add new shift
  const handleAddShift = async () => {
    if (!selectedCell || !newShift.shift_type_id || !currentPractice?.id) {
      toast({
        title: "Fehlende Informationen",
        description: "Bitte wählen Sie einen Schichttyp aus.",
        variant: "destructive",
      })
      return
    }

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
        }),
      })

      if (response.ok) {
        toast({ title: "Schicht hinzugefügt", description: "Die Schicht wurde erfolgreich erstellt." })
        fetchData()
        setShowAddShiftDialog(false)
        setNewShift({ shift_type_id: "", start_time: "", end_time: "", notes: "" })
        setSelectedCell(null)
      } else {
        throw new Error("Failed to add shift")
      }
    } catch (error) {
      toast({ title: "Fehler", description: "Schicht konnte nicht erstellt werden.", variant: "destructive" })
    }
  }

  // Delete shift
  const handleDeleteShift = async (shiftId: string) => {
    if (!currentPractice?.id) {
      toast({
        title: "Keine Praxis ausgewählt",
        description: "Dienstplan kann nicht ohne Praxis-ID bearbeitet werden.",
        variant: "destructive",
      })
      return
    }

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

  // Add/update shift type
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

  // AI Generate Schedule
  const handleAIGenerate = async () => {
    if (!currentPractice?.id) {
      toast({
        title: "Keine Praxis ausgewählt",
        description: "KI-Generierung benötigt eine gültige Praxis-ID.",
        variant: "destructive",
      })
      return
    }

    setGenerating(true)
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/dienstplan/ai-generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          week_start: format(currentWeek, "yyyy-MM-dd"),
          team_members: teamMembers.map((m) => ({
            id: m.id,
            name: `${m.first_name} ${m.last_name}`,
            role: m.role,
            employment_type: m.employment_type,
            weekly_hours: m.weekly_hours,
          })),
          shift_types: shiftTypes,
          availability: availability,
          existing_schedules: schedules,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "KI-Vorschlag erstellt",
          description: `${data.suggestions?.length || 0} Schichten wurden vorgeschlagen.`,
        })
        fetchData()
        setShowAIDialog(false)
      }
    } catch (error) {
      toast({ title: "Fehler", description: "KI-Generierung fehlgeschlagen.", variant: "destructive" })
    } finally {
      setGenerating(false)
    }
  }

  // Initialize default shift types
  const handleInitializeShiftTypes = async () => {
    if (!currentPractice?.id) {
      toast({
        title: "Keine Praxis ausgewählt",
        description: "Standard-Schichttypen können nicht ohne Praxis-ID erstellt werden.",
        variant: "destructive",
      })
      return
    }

    for (const shiftType of DEFAULT_SHIFT_TYPES) {
      await fetch(`/api/practices/${currentPractice.id}/dienstplan/shift-types`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...shiftType, min_staff: 1, is_active: true }),
      })
    }

    toast({ title: "Schichttypen erstellt", description: "Standard-Schichttypen wurden hinzugefügt." })
    fetchData()
  }

  // Filter team members
  const filteredTeamMembers = useMemo(() => {
    return teamMembers.filter((m) => {
      if (filterRole !== "all" && m.role !== filterRole) return false
      return true
    })
  }, [teamMembers, filterRole])

  // Stats
  const stats = useMemo(() => {
    const totalShifts = schedules.filter((s) => s.status !== "cancelled").length
    const confirmedShifts = schedules.filter((s) => s.status === "confirmed").length
    const pendingSwaps = swapRequests.filter((r) => r.status === "pending").length
    const activeViolations = violations.filter((v) => !v.resolved).length

    return { totalShifts, confirmedShifts, pendingSwaps, activeViolations }
  }, [schedules, swapRequests, violations])

  if (authLoading || practiceLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dienstplan</h1>
            <p className="text-muted-foreground">
              KI-gestützte Dienstplanung für faire, rechtssichere und effiziente Schichtplanung
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setShowShiftTypeDialog(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Schichttypen
            </Button>
            <Button onClick={() => setShowAIDialog(true)} className="bg-gradient-to-r from-purple-600 to-blue-600">
              <Sparkles className="h-4 w-4 mr-2" />
              KI-Optimierung
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <CalendarDays className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalShifts}</p>
                  <p className="text-sm text-muted-foreground">Schichten diese Woche</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.confirmedShifts}</p>
                  <p className="text-sm text-muted-foreground">Bestätigt</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <ArrowLeftRight className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pendingSwaps}</p>
                  <p className="text-sm text-muted-foreground">Tausch-Anfragen</p>
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
                  <p className="text-2xl font-bold">{stats.activeViolations}</p>
                  <p className="text-sm text-muted-foreground">Compliance-Hinweise</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* CHANGE: Added grid w-full grid-cols-5 for full width tabs */}
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
                    <Button
                      variant="ghost"
                      onClick={() => setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }))}
                    >
                      Heute
                    </Button>
                    <span className="font-semibold ml-2">
                      {format(currentWeek, "d. MMMM", { locale: de })} -{" "}
                      {format(weekEnd, "d. MMMM yyyy", { locale: de })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Select value={filterRole} onValueChange={setFilterRole}>
                      <SelectTrigger className="w-[150px]">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Rolle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle Rollen</SelectItem>
                        <SelectItem value="MFA">MFA</SelectItem>
                        <SelectItem value="Arzt">Arzt</SelectItem>
                        <SelectItem value="Rezeption">Rezeption</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button variant="outline" size="icon" onClick={fetchData}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Schedule Grid */}
            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : shiftTypes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Keine Schichttypen definiert</h3>
                    <p className="text-muted-foreground mb-4">
                      Erstellen Sie zuerst Schichttypen, um den Dienstplan zu nutzen.
                    </p>
                    <div className="flex gap-2">
                      <Button onClick={handleInitializeShiftTypes}>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Standard-Schichten erstellen
                      </Button>
                      <Button variant="outline" onClick={() => setShowShiftTypeDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Manuell erstellen
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="p-3 text-left font-medium text-muted-foreground w-[200px] sticky left-0 bg-background z-10">
                            Mitarbeiter
                          </th>
                          {weekDays.map((day, i) => (
                            <th key={i} className="p-3 text-center font-medium min-w-[120px]">
                              <div className="text-sm text-muted-foreground">{DAYS_OF_WEEK[i]}</div>
                              <div className={`text-lg ${isSameDay(day, new Date()) ? "text-primary font-bold" : ""}`}>
                                {format(day, "d")}
                              </div>
                            </th>
                          ))}
                          <th className="p-3 text-center font-medium w-[80px]">Std/W</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTeamMembers.map((member) => (
                          <tr key={member.id} className="border-b hover:bg-muted/30">
                            <td className="p-3 sticky left-0 bg-background z-10">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={member.avatar_url || "/placeholder.svg"} />
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
                              const shifts = getShiftsForCell(day, member.id)
                              const avail = getAvailabilityForCell(day, member.id)

                              return (
                                <td
                                  key={dayIndex}
                                  className={`p-1 border-l cursor-pointer transition-colors hover:bg-muted/50 ${
                                    avail?.availability_type === "unavailable" ||
                                    avail?.availability_type === "vacation"
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
                )}
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

          {/* Availability Tab */}
          <TabsContent value="availability" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Verfügbarkeiten & Wunschdienste
                </CardTitle>
                <CardDescription>
                  Mitarbeitende können hier ihre Verfügbarkeiten und Wunschdienste angeben
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Verfügbarkeits-Verwaltung wird in Kürze verfügbar sein.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Swap Requests Tab */}
          <TabsContent value="swaps" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowLeftRight className="h-5 w-5" />
                  Dienst-Tausch-Anfragen
                </CardTitle>
                <CardDescription>KI-geprüfte Tausch-Anfragen zwischen Mitarbeitenden</CardDescription>
              </CardHeader>
              <CardContent>
                {swapRequests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ArrowLeftRight className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Keine offenen Tausch-Anfragen</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {swapRequests.map((request) => (
                      <Card key={request.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Anfrage von {request.requester?.first_name}</p>
                              <p className="text-sm text-muted-foreground">{request.reason}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                Ablehnen
                              </Button>
                              <Button size="sm">Genehmigen</Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Compliance & Arbeitszeitgesetz
                </CardTitle>
                <CardDescription>
                  Automatische Prüfung auf Arbeitszeitgesetze, Ruhezeiten und Vertragsgrenzen
                </CardDescription>
              </CardHeader>
              <CardContent>
                {violations.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p className="font-medium text-green-600">Keine Verstöße gefunden</p>
                    <p className="text-sm text-muted-foreground">Alle Schichten entsprechen den Vorgaben</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {violations.map((violation) => (
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
                          <div className="flex items-start gap-3">
                            <AlertTriangle
                              className={`h-5 w-5 ${
                                violation.severity === "error"
                                  ? "text-red-500"
                                  : violation.severity === "warning"
                                    ? "text-amber-500"
                                    : "text-blue-500"
                              }`}
                            />
                            <div className="flex-1">
                              <p className="font-medium">{violation.violation_type}</p>
                              <p className="text-sm text-muted-foreground">{violation.description}</p>
                            </div>
                            <Button size="sm" variant="outline">
                              Beheben
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Auswertung & Statistiken
                </CardTitle>
                <CardDescription>Analyse der Dienstverteilung und Arbeitszeiten</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Wochenend-Verteilung</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-4 text-muted-foreground">
                        <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Diagramme in Kürze verfügbar</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Arbeitsstunden pro Mitarbeiter</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {filteredTeamMembers.slice(0, 5).map((member) => {
                          const hours = getWeeklyHours(member.id)
                          const maxHours = member.weekly_hours || 40
                          const percentage = Math.min((hours / maxHours) * 100, 100)

                          return (
                            <div key={member.id} className="flex items-center gap-3">
                              <span className="text-sm w-24 truncate">
                                {member.first_name} {member.last_name[0]}.
                              </span>
                              <div className="flex-1 bg-muted rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${percentage > 100 ? "bg-red-500" : "bg-primary"}`}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium w-16 text-right">
                                {hours.toFixed(1)}/{maxHours}h
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
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
                    placeholder="Standard verwenden"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Endzeit (optional)</Label>
                  <Input
                    type="time"
                    value={newShift.end_time}
                    onChange={(e) => setNewShift({ ...newShift, end_time: e.target.value })}
                    placeholder="Standard verwenden"
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
              {/* Existing shift types */}
              <div className="space-y-2">
                <Label>Vorhandene Schichttypen</Label>
                <div className="grid gap-2">
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
                        <div className="flex items-center gap-2">
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
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Add/Edit form */}
              <div className="border-t pt-4">
                <Label className="mb-2 block">
                  {editingShiftType ? "Schichttyp bearbeiten" : "Neuen Schichttyp erstellen"}
                </Label>
                <div className="grid gap-4">
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
                          placeholder="#3b82f6"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Min. Besetzung</Label>
                      <Input
                        type="number"
                        value={newShiftType.min_staff}
                        onChange={(e) =>
                          setNewShiftType({ ...newShiftType, min_staff: Number.parseInt(e.target.value) })
                        }
                        min={1}
                      />
                    </div>
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

        {/* AI Optimization Dialog */}
        <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-500" />
                KI-Dienstplan-Optimierung
              </DialogTitle>
              <DialogDescription>
                Die KI erstellt einen optimierten Dienstplan unter Berücksichtigung aller Vorgaben
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Card className="border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/20">
                <CardContent className="p-4">
                  <h4 className="font-medium mb-2">Die KI berücksichtigt:</h4>
                  <ul className="text-sm space-y-1.5 text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Qualifikationen & Rollen der Mitarbeitenden
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Arbeitszeitmodelle (Vollzeit, Teilzeit, Minijob)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Gesetzliche Vorgaben & Ruhezeiten
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Individuelle Verfügbarkeiten & Wünsche
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Faire Verteilung von Wochenend- & Spätdiensten
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-amber-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-800 dark:text-amber-200">Hinweis</p>
                    <p className="text-amber-700 dark:text-amber-300">
                      Der KI-Vorschlag kann vor der Übernahme überprüft und angepasst werden.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAIDialog(false)}>
                Abbrechen
              </Button>
              <Button
                onClick={handleAIGenerate}
                disabled={generating}
                className="bg-gradient-to-r from-purple-600 to-blue-600"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generiere...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Plan generieren
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}
