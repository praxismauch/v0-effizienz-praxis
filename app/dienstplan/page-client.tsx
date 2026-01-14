"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Settings,
  UserCheck,
  ArrowLeftRight,
  Shield,
  BarChart3,
  CheckCircle,
  Sparkles,
  Sun,
  Moon,
  Coffee,
  Loader2,
} from "lucide-react"
import { format, startOfWeek, endOfWeek, addDays, addWeeks, subWeeks, parseISO, differenceInMinutes } from "date-fns"
import { de } from "date-fns/locale"
import { fetchWithTimeout } from "@/lib/fetch-with-timeout"

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
  const { currentUser } = useUser()
  const { currentPractice, isLoading: practiceLoading } = usePractice()
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
    console.log("[v0] DienstPlan fetchData check - currentPractice:", currentPractice)
    if (!currentPractice) {
      console.log("[v0] DienstPlan fetchData skipped - no practice")
      setIsLoading(false)
      return
    }

    console.log("[v0] DienstPlan fetchData started - practiceId:", currentPractice.id)
    setIsLoading(true)
    try {
      const weekStart = format(currentWeek, "yyyy-MM-dd")
      const weekEnd = format(endOfWeek(currentWeek, { weekStartsOn: 1 }), "yyyy-MM-dd")

      console.log("[v0] Fetching data for week:", weekStart, "to", weekEnd)

      const startTime = Date.now()

      const results = await Promise.allSettled([
        fetchWithTimeout(`/api/practices/${currentPractice.id}/team-members`, {}, 8000)
          .then((res) => {
            console.log("[v0] team-members response:", res.status, res.ok)
            return res
          })
          .catch((err) => {
            console.error("[v0] team-members ERROR:", err)
            return null
          }),
        fetchWithTimeout(`/api/practices/${currentPractice.id}/dienstplan/shift-types`, {}, 8000)
          .then((res) => {
            console.log("[v0] shift-types response:", res.status, res.ok)
            return res
          })
          .catch((err) => {
            console.error("[v0] shift-types ERROR:", err)
            return null
          }),
        fetchWithTimeout(
          `/api/practices/${currentPractice.id}/dienstplan/schedules?start=${weekStart}&end=${weekEnd}`,
          {},
          8000,
        )
          .then((res) => {
            console.log("[v0] schedules response:", res.status, res.ok)
            return res
          })
          .catch((err) => {
            console.error("[v0] schedules ERROR:", err)
            return null
          }),
        fetchWithTimeout(`/api/practices/${currentPractice.id}/dienstplan/availability`, {}, 8000)
          .then((res) => {
            console.log("[v0] availability response:", res.status, res.ok)
            return res
          })
          .catch((err) => {
            console.error("[v0] availability ERROR:", err)
            return null
          }),
        fetchWithTimeout(`/api/practices/${currentPractice.id}/dienstplan/swap-requests?status=pending`, {}, 8000)
          .then((res) => {
            console.log("[v0] swap-requests response:", res.status, res.ok)
            return res
          })
          .catch((err) => {
            console.error("[v0] swap-requests ERROR:", err)
            return null
          }),
        fetchWithTimeout(`/api/practices/${currentPractice.id}/dienstplan/compliance`, {}, 8000)
          .then((res) => {
            console.log("[v0] compliance response:", res.status, res.ok)
            return res
          })
          .catch((err) => {
            console.error("[v0] compliance ERROR:", err)
            return null
          }),
      ])

      const fetchTime = Date.now() - startTime
      console.log("[v0] All API calls completed in:", fetchTime, "ms")

      const [teamRes, shiftTypesRes, schedulesRes, availabilityRes, swapRes, violationsRes] = results.map((result) =>
        result.status === "fulfilled" ? result.value : null,
      )

      const failedApis: string[] = []

      if (teamRes && teamRes.ok) {
        const data = await teamRes.json()
        console.log("[v0] team-members data:", data)
        setTeamMembers(data.teamMembers || data || [])
      } else {
        console.error("[v0] team-members failed")
        failedApis.push("Teammitglieder")
        setTeamMembers([])
      }

      if (shiftTypesRes && shiftTypesRes.ok) {
        const data = await shiftTypesRes.json()
        console.log("[v0] shift-types data:", data)
        setShiftTypes(data.shiftTypes || [])
      } else {
        console.error("[v0] shift-types failed")
        failedApis.push("Schichttypen")
        setShiftTypes([])
      }

      if (schedulesRes && schedulesRes.ok) {
        const data = await schedulesRes.json()
        console.log("[v0] schedules data:", data)
        setSchedules(data.schedules || [])
      } else {
        console.error("[v0] schedules failed")
        failedApis.push("Dienstpläne")
        setSchedules([])
      }

      if (availabilityRes && availabilityRes.ok) {
        const data = await availabilityRes.json()
        console.log("[v0] availability data:", data)
        setAvailability(data.availability || [])
      } else {
        console.error("[v0] availability failed")
        failedApis.push("Verfügbarkeiten")
        setAvailability([])
      }

      if (swapRes && swapRes.ok) {
        const data = await swapRes.json()
        console.log("[v0] swap-requests data:", data)
        setSwapRequests(data.swapRequests || [])
      } else {
        console.error("[v0] swap-requests failed")
        failedApis.push("Tausch-Anfragen")
        setSwapRequests([])
      }

      if (violationsRes && violationsRes.ok) {
        const data = await violationsRes.json()
        console.log("[v0] compliance data:", data)
        setViolations(data.violations || [])
      } else {
        console.error("[v0] compliance failed")
        failedApis.push("Compliance")
        setViolations([])
      }

      if (failedApis.length > 0 && failedApis.length < 6) {
        toast({
          title: "Teilweise Ladefehler",
          description: `Einige Daten konnten nicht geladen werden: ${failedApis.join(", ")}`,
          variant: "destructive",
        })
      } else if (failedApis.length === 6) {
        toast({
          title: "Ladefehler",
          description: "Alle Daten konnten nicht geladen werden. Bitte Verbindung prüfen.",
          variant: "destructive",
        })
      }

      console.log("[v0] DienstPlan fetchData completed successfully")
    } catch (error) {
      console.error("[v0] DienstPlan fetchData ERROR:", error)
      toast({
        title: "Ladefehler",
        description: "Ein unerwarteter Fehler ist aufgetreten. Bitte Browser-Konsole prüfen.",
        variant: "destructive",
      })
    } finally {
      console.log("[v0] Setting isLoading to false")
      setIsLoading(false)
    }
  }, [currentPractice, currentWeek, toast])

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
              <div>{/* Schedule Grid Content */}</div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Availability Tab */}
        <TabsContent value="availability" className="space-y-4">
          {/* Availability Content */}
        </TabsContent>

        {/* Swap Requests Tab */}
        <TabsContent value="swaps" className="space-y-4">
          {/* Swap Requests Content */}
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-4">
          {/* Compliance Content */}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          {/* Analytics Content */}
        </TabsContent>
      </Tabs>
    </div>
  )
}
