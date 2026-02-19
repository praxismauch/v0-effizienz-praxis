"use client"

import { TooltipContent } from "@/components/ui/tooltip"

import { useState, useEffect, useMemo } from "react"
import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"
import { useTeam } from "@/contexts/team-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TeamMemberSelectItem } from "@/components/team-member-select-item"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import {
  format,
  parseISO,
  eachDayOfInterval,
  isWeekend,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
} from "date-fns"
import { de } from "date-fns/locale"
import {
  CalendarIcon,
  Plus,
  Sparkles,
  Loader2,
  Check,
  X,
  Clock,
  Users,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Star,
  Ban,
  Palmtree,
  CalendarIcon as CalendarIconOutline,
  Info,
  Trash2,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { isActiveMember } from "@/lib/utils/team-member-filter"
import { isPracticeAdminRole, isSuperAdminRole } from "@/lib/auth-utils"

interface HolidayRequest {
  id: string
  practice_id: string
  team_member_id: string
  user_id: string
  start_date: string
  end_date: string
  days_count: number
  status: "wish" | "requested" | "approved" | "rejected" | "cancelled"
  priority: number
  reason?: string
  notes?: string
  approved_by?: string
  approved_at?: string
  rejection_reason?: string
  ai_suggested?: boolean
  ai_score?: number
  ai_reasoning?: string
  team_member?: {
    id: string
    first_name: string
    last_name: string
    user_id: string
    user?: {
      id: string
      name: string
      first_name: string
      last_name: string
      avatar?: string
    }
  }
}

interface BlockedPeriod {
  id: string
  name: string
  start_date: string
  end_date: string
  reason?: string
  max_absent_percentage: number
  is_recurring: boolean
}

interface BankHoliday {
  id: string
  name: string
  holiday_date: string
  is_recurring: boolean
}

interface MemberEntitlement {
  id: string
  name: string
  entitlement: number
  used: number
  wished: number
  remaining: number
}

// Define the Contract interface for the contracts variable
interface Contract {
  id: string
  team_member_id: string
  is_active: boolean
  working_days_fulltime: number
  holiday_days_fulltime: number
  hours_per_week: number
}

const statusConfig = {
  wish: { label: "Wunsch", color: "bg-blue-100 text-blue-800", icon: Star },
  requested: { label: "Beantragt", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  approved: { label: "Genehmigt", color: "bg-green-100 text-green-800", icon: Check },
  rejected: { label: "Abgelehnt", color: "bg-red-100 text-red-800", icon: X },
  cancelled: { label: "Storniert", color: "bg-gray-100 text-gray-800", icon: Ban },
}

export function HolidayPlanner() {
  const { currentUser } = useUser()
  const { currentPractice } = usePractice()
  const { teamMembers: contextTeamMembers, loading: teamLoading } = useTeam()
  const { toast } = useToast()

  const [requests, setRequests] = useState<HolidayRequest[]>([])
  const [blockedPeriods, setBlockedPeriods] = useState<BlockedPeriod[]>([])
  const [bankHolidays, setBankHolidays] = useState<BankHoliday[]>([])
  const [memberEntitlements, setMemberEntitlements] = useState<MemberEntitlement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<any>(null)

  // Define and initialize the contracts state
  const [contracts, setContracts] = useState<Contract[]>([])

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [activeTab, setActiveTab] = useState("calendar")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterMember, setFilterMember] = useState<string>("all")

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showBlockedDialog, setShowBlockedDialog] = useState(false)
  const [editingRequest, setEditingRequest] = useState<HolidayRequest | null>(null)

  const [newRequest, setNewRequest] = useState({
    teamMemberId: "",
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    priority: 3,
    reason: "",
    notes: "",
  })

  const [newBlockedPeriod, setNewBlockedPeriod] = useState({
    name: "",
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    reason: "",
    maxAbsentPercentage: 0,
    isRecurring: false,
  })

  const [localTeamMembers, setLocalTeamMembers] = useState<any[]>([])

  // Use context team members if available, otherwise use local
  const teamMembers = contextTeamMembers?.length > 0 ? contextTeamMembers : localTeamMembers

  useEffect(() => {
    console.log("[v0] teamMembers:", teamMembers)
    console.log("[v0] contextTeamMembers:", contextTeamMembers)
    console.log("[v0] localTeamMembers:", localTeamMembers)
    console.log("[v0] teamLoading:", teamLoading)
    console.log("[v0] filtered active members:", teamMembers?.filter(isActiveMember))
  }, [teamMembers, contextTeamMembers, localTeamMembers, teamLoading])

  const isAdmin = isPracticeAdminRole(currentUser?.role) || isSuperAdminRole(currentUser?.role)

  // Find current user's team member ID
  const currentTeamMember = teamMembers?.find((m) => m.user_id === currentUser?.id)

  // Load data
  useEffect(() => {
    if (currentPractice?.id) {
      loadData()
    }
  }, [currentPractice?.id, selectedYear])

  useEffect(() => {
    const fetchLocalTeamMembers = async () => {
      if (!currentPractice?.id) return
      if (contextTeamMembers && contextTeamMembers.length > 0) return

      try {
        const response = await fetch(`/api/practices/${currentPractice.id}/team-members`)
        if (response.ok) {
          const data = await response.json()
          const members = Array.isArray(data) ? data : data.teamMembers || data.members || []
          setLocalTeamMembers(members.filter((m: any) => m.id && m.id.trim() !== ""))
        }
      } catch (error) {
        console.error("[v0] Error fetching local team members:", error)
      }
    }

    fetchLocalTeamMembers()
  }, [currentPractice?.id, contextTeamMembers])

  const loadData = async () => {
    if (!currentPractice?.id) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/holiday-requests?year=${selectedYear}`)
      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests || [])
        setBlockedPeriods(data.blockedPeriods || [])
        setBankHolidays(data.bankHolidays || [])
      }

      // Fetch contracts data
      const contractsResponse = await fetch(`/api/practices/${currentPractice.id}/contracts`)
      if (contractsResponse.ok) {
        const contractsData = await contractsResponse.json()
        setContracts(contractsData.contracts || [])
      }

      // Calculate entitlements
      calculateEntitlements()
    } catch (error) {
      console.error("[v0] Failed to load holiday data:", error)
      toast({
        title: "Fehler",
        description: "Urlaubsdaten konnten nicht geladen werden",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const calculateEntitlements = () => {
    if (!teamMembers || !contracts) return

    const entitlements = teamMembers.filter(isActiveMember).map((member) => {
      const contract = contracts.find((c) => c.team_member_id === member.id && c.is_active)
      const fullTimeHours = 40
      const workingDaysFulltime = contract?.working_days_fulltime || 5
      const holidayDaysFulltime = contract?.holiday_days_fulltime || 30
      const hoursPerWeek = contract?.hours_per_week || fullTimeHours

      // Formula: =AUFRUNDEN(C1 / A1 * B1; 0)
      const workingDaysPartTime = (hoursPerWeek / fullTimeHours) * workingDaysFulltime
      const holidayEntitlement = Math.ceil((workingDaysPartTime / workingDaysFulltime) * holidayDaysFulltime)

      const usedDays = requests
        .filter((r) => r.team_member_id === member.id && ["approved", "requested"].includes(r.status))
        .reduce((sum, r) => sum + (r.days_count || 0), 0)

      const wishedDays = requests
        .filter((r) => r.team_member_id === member.id && r.status === "wish")
        .reduce((sum, r) => sum + (r.days_count || 0), 0)

      return {
        id: member.id,
        name: `${member.first_name} ${member.last_name}`,
        entitlement: holidayEntitlement,
        used: usedDays,
        wished: wishedDays,
        remaining: holidayEntitlement - usedDays,
      }
    })

    setMemberEntitlements(entitlements)
  }

  useEffect(() => {
    calculateEntitlements()
  }, [requests, teamMembers, contracts])

  // Create request
  const handleCreateRequest = async () => {
    if (!currentPractice?.id || !newRequest.teamMemberId || !newRequest.startDate || !newRequest.endDate) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie alle Pflichtfelder aus",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/holiday-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamMemberId: newRequest.teamMemberId,
          userId: currentUser?.id,
          startDate: format(newRequest.startDate, "yyyy-MM-dd"),
          endDate: format(newRequest.endDate, "yyyy-MM-dd"),
          priority: newRequest.priority,
          reason: newRequest.reason,
          notes: newRequest.notes,
        }),
      })

      if (response.ok) {
        toast({
          title: "Urlaubswunsch erstellt",
          description: "Ihr Urlaubswunsch wurde erfolgreich gespeichert",
        })
        setShowCreateDialog(false)
        setNewRequest({
          teamMemberId: currentTeamMember?.id || "",
          startDate: undefined,
          endDate: undefined,
          priority: 3,
          reason: "",
          notes: "",
        })
        loadData()
      }
    } catch (error) {
      console.error("[v0] Failed to create request:", error)
      toast({
        title: "Fehler",
        description: "Urlaubswunsch konnte nicht erstellt werden",
        variant: "destructive",
      })
    }
  }

  // Update request status
  const handleUpdateStatus = async (requestId: string, status: string, rejectionReason?: string) => {
    if (!currentPractice?.id) return

    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/holiday-requests/${requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          approvedBy: currentUser?.id,
          rejectionReason,
        }),
      })

      if (response.ok) {
        toast({
          title: status === "approved" ? "Genehmigt" : status === "rejected" ? "Abgelehnt" : "Status aktualisiert",
          description: "Der Urlaubsantrag wurde aktualisiert",
        })
        loadData()
      }
    } catch (error) {
      console.error("[v0] Failed to update status:", error)
    }
  }

  // Delete request
  const handleDeleteRequest = async (requestId: string) => {
    if (!currentPractice?.id) return

    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/holiday-requests/${requestId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Gelöscht",
          description: "Der Urlaubswunsch wurde gelöscht",
        })
        loadData()
      }
    } catch (error) {
      console.error("[v0] Failed to delete request:", error)
    }
  }

  // Create blocked period
  const handleCreateBlockedPeriod = async () => {
    if (!currentPractice?.id || !newBlockedPeriod.name || !newBlockedPeriod.startDate || !newBlockedPeriod.endDate) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie alle Pflichtfelder aus",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/holiday-blocked-periods`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newBlockedPeriod.name,
          startDate: format(newBlockedPeriod.startDate, "yyyy-MM-dd"),
          endDate: format(newBlockedPeriod.endDate, "yyyy-MM-dd"),
          reason: newBlockedPeriod.reason,
          maxAbsentPercentage: newBlockedPeriod.maxAbsentPercentage,
          isRecurring: newBlockedPeriod.isRecurring,
          createdBy: currentUser?.id,
        }),
      })

      if (response.ok) {
        toast({
          title: "Urlaubssperre erstellt",
          description: "Die Urlaubssperre wurde erfolgreich gespeichert",
        })
        setShowBlockedDialog(false)
        setNewBlockedPeriod({
          name: "",
          startDate: undefined,
          endDate: undefined,
          reason: "",
          maxAbsentPercentage: 0,
          isRecurring: false,
        })
        loadData()
      }
    } catch (error) {
      console.error("[v0] Failed to create blocked period:", error)
    }
  }

  // AI Optimization
  const handleOptimize = async () => {
    if (!currentPractice?.id) return

    setIsOptimizing(true)
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/holiday-requests/optimize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year: selectedYear }),
      })

      if (response.ok) {
        const data = await response.json()
        setAiAnalysis(data)
        loadData() // Reload to get updated AI scores
        toast({
          title: "KI-Analyse abgeschlossen",
          description: "Die Urlaubsplanung wurde analysiert",
        })
      }
    } catch (error) {
      console.error("[v0] Failed to optimize:", error)
      toast({
        title: "Fehler",
        description: "KI-Analyse konnte nicht durchgeführt werden",
        variant: "destructive",
      })
    } finally {
      setIsOptimizing(false)
    }
  }

  // Filter requests
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (filterStatus !== "all" && r.status !== filterStatus) return false
      if (filterMember !== "all" && r.team_member_id !== filterMember) return false
      return true
    })
  }, [requests, filterStatus, filterMember])

  // Get days with events for calendar
  const getDayInfo = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd")

    const dayRequests = requests.filter((r) => {
      const start = parseISO(r.start_date)
      const end = parseISO(r.end_date)
      return date >= start && date <= end
    })

    const isBlocked = blockedPeriods.some((b) => {
      const start = parseISO(b.start_date)
      const end = parseISO(b.end_date)
      return date >= start && date <= end
    })

    const isBankHoliday = bankHolidays.some((h) => h.holiday_date === dateStr)

    return { dayRequests, isBlocked, isBankHoliday }
  }

  // Render calendar day
  const renderCalendarDay = (date: Date) => {
    const { dayRequests, isBlocked, isBankHoliday } = getDayInfo(date)
    const isWeekendDay = isWeekend(date)

    return (
      <div
        className={cn(
          "relative h-24 border-r border-b p-1 overflow-hidden",
          isWeekendDay && "bg-gray-50",
          isBlocked && "bg-red-50",
          isBankHoliday && "bg-amber-50",
        )}
      >
        <div className="flex items-center justify-between mb-1">
          <span
            className={cn(
              "text-sm font-medium",
              isWeekendDay && "text-muted-foreground",
              isBankHoliday && "text-amber-600",
            )}
          >
            {format(date, "d")}
          </span>
          {isBlocked && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Ban className="h-3 w-3 text-red-500" />
                </TooltipTrigger>
                <TooltipContent>Urlaubssperre</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <div className="space-y-0.5">
          {dayRequests.slice(0, 3).map((r) => {
            const config = statusConfig[r.status]
            return (
              <div
                key={r.id}
                className={cn("text-xs truncate px-1 rounded", config.color)}
                title={`${r.team_member?.first_name} ${r.team_member?.last_name}`}
              >
                {r.team_member?.first_name?.charAt(0)}.{r.team_member?.last_name?.charAt(0)}.
              </div>
            )
          })}
          {dayRequests.length > 3 && <div className="text-xs text-muted-foreground">+{dayRequests.length - 3}</div>}
        </div>
      </div>
    )
  }

  // Generate month calendar
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Pad to start on Monday
  const startDayOfWeek = monthStart.getDay()
  const paddingDays = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Palmtree className="h-6 w-6 text-green-600" />
            Urlaubsplaner
          </h2>
          <p className="text-muted-foreground">Planen und verwalten Sie Urlaubswünsche Ihres Teams</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[selectedYear - 1, selectedYear, selectedYear + 1, selectedYear + 2].map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={handleOptimize} disabled={isOptimizing}>
            {isOptimizing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
            KI-Optimierung
          </Button>

          {isAdmin && (
            <Dialog open={showBlockedDialog} onOpenChange={setShowBlockedDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Ban className="h-4 w-4 mr-2" />
                  Urlaubssperre
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Urlaubssperre erstellen</DialogTitle>
                  <DialogDescription>
                    Definieren Sie Zeiträume, in denen kein oder nur begrenzter Urlaub möglich ist
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input
                      placeholder="z.B. Weihnachtszeit, Inventur"
                      value={newBlockedPeriod.name}
                      onChange={(e) => setNewBlockedPeriod({ ...newBlockedPeriod, name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Von *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start bg-transparent">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {newBlockedPeriod.startDate
                              ? format(newBlockedPeriod.startDate, "dd.MM.yyyy", { locale: de })
                              : "Datum wählen"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={newBlockedPeriod.startDate}
                            onSelect={(date) => setNewBlockedPeriod({ ...newBlockedPeriod, startDate: date })}
                            locale={de}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label>Bis *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start bg-transparent">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {newBlockedPeriod.endDate
                              ? format(newBlockedPeriod.endDate, "dd.MM.yyyy", { locale: de })
                              : "Datum wählen"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={newBlockedPeriod.endDate}
                            onSelect={(date) => setNewBlockedPeriod({ ...newBlockedPeriod, endDate: date })}
                            locale={de}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Grund</Label>
                    <Input
                      placeholder="Optionale Begründung"
                      value={newBlockedPeriod.reason}
                      onChange={(e) => setNewBlockedPeriod({ ...newBlockedPeriod, reason: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleCreateBlockedPeriod} className="w-full">
                    Urlaubssperre erstellen
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Urlaubswunsch
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Neuen Urlaubswunsch erstellen</DialogTitle>
                <DialogDescription>
                  Tragen Sie Ihren Urlaubswunsch ein. Die KI hilft bei der optimalen Planung.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Mitarbeiter *</Label>
                  <Select
                    value={newRequest.teamMemberId}
                    onValueChange={(v) => setNewRequest({ ...newRequest, teamMemberId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Mitarbeiter auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                  {teamMembers?.filter(isActiveMember).map((m) => (
                    <TeamMemberSelectItem
                      key={m.id}
                      value={m.id}
                      firstName={m.first_name}
                      lastName={m.last_name}
                      avatarUrl={m.avatar_url}
                      name={m.id === currentTeamMember?.id ? `${m.first_name} ${m.last_name} (Ich)` : undefined}
                    />
                  ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Von *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start bg-transparent">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {newRequest.startDate
                            ? format(newRequest.startDate, "dd.MM.yyyy", { locale: de })
                            : "Datum wählen"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={newRequest.startDate}
                          onSelect={(date) => setNewRequest({ ...newRequest, startDate: date })}
                          locale={de}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>Bis *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start bg-transparent">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {newRequest.endDate
                            ? format(newRequest.endDate, "dd.MM.yyyy", { locale: de })
                            : "Datum wählen"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={newRequest.endDate}
                          onSelect={(date) => setNewRequest({ ...newRequest, endDate: date })}
                          locale={de}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Priorität</Label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((p) => (
                      <Button
                        key={p}
                        type="button"
                        variant={newRequest.priority >= p ? "default" : "outline"}
                        size="sm"
                        onClick={() => setNewRequest({ ...newRequest, priority: p })}
                      >
                        <Star className={cn("h-4 w-4", newRequest.priority >= p ? "fill-current" : "")} />
                      </Button>
                    ))}
                    <span className="ml-2 text-sm text-muted-foreground">
                      {newRequest.priority === 1 && "Niedrig"}
                      {newRequest.priority === 2 && "Eher niedrig"}
                      {newRequest.priority === 3 && "Mittel"}
                      {newRequest.priority === 4 && "Hoch"}
                      {newRequest.priority === 5 && "Sehr wichtig"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Grund (optional)</Label>
                  <Input
                    placeholder="z.B. Familienurlaub, Hochzeit, etc."
                    value={newRequest.reason}
                    onChange={(e) => setNewRequest({ ...newRequest, reason: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notizen (optional)</Label>
                  <Textarea
                    placeholder="Zusätzliche Informationen..."
                    value={newRequest.notes}
                    onChange={(e) => setNewRequest({ ...newRequest, notes: e.target.value })}
                  />
                </div>

                <Button onClick={handleCreateRequest} className="w-full">
                  <Palmtree className="h-4 w-4 mr-2" />
                  Urlaubswunsch speichern
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-100">
                <Star className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{requests.filter((r) => r.status === "wish").length}</p>
                <p className="text-xs text-muted-foreground">Wünsche</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-yellow-100">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{requests.filter((r) => r.status === "requested").length}</p>
                <p className="text-xs text-muted-foreground">Beantragt</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-green-100">
                <Check className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{requests.filter((r) => r.status === "approved").length}</p>
                <p className="text-xs text-muted-foreground">Genehmigt</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-red-100">
                <Ban className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{blockedPeriods.length}</p>
                <p className="text-xs text-muted-foreground">Urlaubssperren</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Analysis Card */}
      {aiAnalysis && (
        <Card className="bg-gradient-to-br from-primary/5 via-purple-50/50 to-indigo-50/50 dark:from-primary/10 dark:via-purple-950/20 dark:to-indigo-950/20 border-primary/20 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              KI-Analyse
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Card className="bg-white/60 dark:bg-slate-900/60">
              <CardContent className="pt-4">
                <p className="text-sm leading-relaxed">{aiAnalysis.analysis}</p>
              </CardContent>
            </Card>

            {aiAnalysis.conflicts?.length > 0 && (
              <Card className="border-yellow-200 dark:border-yellow-900 bg-yellow-50/50 dark:bg-yellow-950/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
                    <AlertTriangle className="h-4 w-4" />
                    Konflikte
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {aiAnalysis.conflicts.map((c: string, i: number) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2 flex-shrink-0" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {aiAnalysis.tips?.length > 0 && (
              <Card className="border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-700 dark:text-blue-300">
                    <Info className="h-4 w-4" />
                    Tipps
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {aiAnalysis.tips.map((t: string, i: number) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calendar">
            <CalendarIconOutline className="h-4 w-4 mr-2" />
            Kalender
          </TabsTrigger>
          <TabsTrigger value="requests">
            <Palmtree className="h-4 w-4 mr-2" />
            Anträge
          </TabsTrigger>
          <TabsTrigger value="team">
            <Users className="h-4 w-4 mr-2" />
            Team-Übersicht
          </TabsTrigger>
        </TabsList>

        {/* Calendar View */}
        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{format(currentMonth, "MMMM yyyy", { locale: de })}</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-7 bg-muted">
                  {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((day) => (
                    <div key={day} className="p-2 text-center text-sm font-medium border-r last:border-r-0">
                      {day}
                    </div>
                  ))}
                </div>
                {/* Calendar Grid */}
                <div className="grid grid-cols-7">
                  {/* Padding for days before month start */}
                  {Array.from({ length: paddingDays }).map((_, i) => (
                    <div key={`pad-${i}`} className="h-24 border-r border-b bg-gray-50" />
                  ))}
                  {/* Actual days */}
                  {calendarDays.map((date) => (
                    <div key={date.toISOString()}>{renderCalendarDay(date)}</div>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-blue-100" />
                  <span>Wunsch</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-yellow-100" />
                  <span>Beantragt</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-green-100" />
                  <span>Genehmigt</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-red-50" />
                  <span>Urlaubssperre</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-amber-50" />
                  <span>Feiertag</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Requests List */}
        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle>Urlaubsanträge</CardTitle>
                <div className="flex items-center gap-2">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle Status</SelectItem>
                      <SelectItem value="wish">Wünsche</SelectItem>
                      <SelectItem value="requested">Beantragt</SelectItem>
                      <SelectItem value="approved">Genehmigt</SelectItem>
                      <SelectItem value="rejected">Abgelehnt</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterMember} onValueChange={setFilterMember}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Mitarbeiter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle Mitarbeiter</SelectItem>
                      {teamMembers?.filter(isActiveMember).map((m) => (
                        <TeamMemberSelectItem
                          key={m.id}
                          value={m.id}
                          firstName={m.first_name}
                          lastName={m.last_name}
                          avatarUrl={m.avatar_url}
                        />
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Palmtree className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Keine Urlaubsanträge gefunden</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredRequests.map((request) => {
                    const config = statusConfig[request.status]
                    const StatusIcon = config.icon
                    return (
                      <Card key={request.id} className="group">
                        <CardContent className="py-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={request.team_member?.user?.avatar || "/placeholder.svg"} />
                                <AvatarFallback>
                                  {request.team_member?.first_name?.charAt(0)}
                                  {request.team_member?.last_name?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">
                                  {request.team_member?.first_name} {request.team_member?.last_name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {format(parseISO(request.start_date), "dd.MM.yyyy", { locale: de })} -{" "}
                                  {format(parseISO(request.end_date), "dd.MM.yyyy", { locale: de })}
                                  <span className="ml-2">({request.days_count} Tage)</span>
                                </p>
                                {request.reason && (
                                  <p className="text-sm text-muted-foreground mt-1">{request.reason}</p>
                                )}
                                {request.ai_reasoning && (
                                  <p className="text-sm text-primary mt-1 flex items-center gap-1">
                                    <Sparkles className="h-3 w-3" />
                                    {request.ai_reasoning}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {/* Priority stars */}
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((p) => (
                                  <Star
                                    key={p}
                                    className={cn(
                                      "h-3 w-3",
                                      p <= request.priority ? "fill-yellow-400 text-yellow-400" : "text-gray-300",
                                    )}
                                  />
                                ))}
                              </div>
                              {request.ai_score && (
                                <Badge variant="outline" className="ml-2">
                                  <Sparkles className="h-3 w-3 mr-1" />
                                  {request.ai_score}%
                                </Badge>
                              )}
                              <Badge className={cn(config.color, "flex items-center gap-1")}>
                                <StatusIcon className="h-3 w-3" />
                                {config.label}
                              </Badge>
                              {/* Admin actions */}
                              {isAdmin && request.status === "wish" && (
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleUpdateStatus(request.id, "approved")}
                                    className="text-green-600 hover:text-green-700"
                                  >
                                    <ThumbsUp className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleUpdateStatus(request.id, "rejected")}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <ThumbsDown className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteRequest(request.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
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
        </TabsContent>

        {/* Team Overview */}
        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Urlaubsanspruch Team</CardTitle>
              <CardDescription>Übersicht über Urlaubstage aller Teammitglieder</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {memberEntitlements.map((member) => {
                  const usedPercentage = (member.used / member.entitlement) * 100
                  const wishedPercentage = (member.wished / member.entitlement) * 100
                  return (
                    <div key={member.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{member.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {member.used} von {member.entitlement} Tagen genutzt
                          {member.wished > 0 && ` (+${member.wished} gewünscht)`}
                        </span>
                      </div>
                      <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="absolute left-0 top-0 h-full bg-green-500 rounded-l-full"
                          style={{ width: `${Math.min(usedPercentage, 100)}%` }}
                        />
                        <div
                          className="absolute top-0 h-full bg-blue-300"
                          style={{
                            left: `${Math.min(usedPercentage, 100)}%`,
                            width: `${Math.min(wishedPercentage, 100 - usedPercentage)}%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{member.remaining} Tage verbleibend</span>
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded bg-green-500" /> Genutzt
                          </span>
                          <span className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded bg-blue-300" /> Gewünscht
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Blocked Periods */}
          {blockedPeriods.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ban className="h-5 w-5 text-red-500" />
                  Urlaubssperren
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {blockedPeriods.map((period) => (
                    <div key={period.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div>
                        <p className="font-medium">{period.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(parseISO(period.start_date), "dd.MM.yyyy", { locale: de })} -{" "}
                          {format(parseISO(period.end_date), "dd.MM.yyyy", { locale: de })}
                        </p>
                        {period.reason && <p className="text-sm text-muted-foreground">{period.reason}</p>}
                      </div>
                      {period.is_recurring && <Badge variant="outline">Jährlich</Badge>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default HolidayPlanner
