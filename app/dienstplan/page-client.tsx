"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Users, Calendar, Clock, AlertTriangle, ArrowLeftRight, Settings } from "lucide-react"
import { AppLayout } from "@/components/app-layout"
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, addDays } from "date-fns"
import { de } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"

import ScheduleTab from "./components/schedule-tab"
import AvailabilityTab from "./components/availability-tab"
import SwapRequestsTab from "./components/swap-requests-tab"
import ShiftTypesTab from "./components/shift-types-tab"
import ShiftTypeDialog from "./components/shift-type-dialog"
import type { TeamMember, ShiftType, Shift, Availability, SwapRequest, Violation, DienstplanStats } from "./types"

interface DienstplanPageClientProps {
  initialData: {
    teamMembers: any[]
    shiftTypes: any[]
    schedules: any[]
    availability: any[]
    swapRequests: any[]
  }
  initialWeek: Date
  teams: any[]
  practiceId: string
  userId: string
}

export default function DienstplanPageClient({
  initialData,
  initialWeek,
  teams,
  practiceId,
  userId,
}: DienstplanPageClientProps) {
  const router = useRouter()
  const { currentUser } = useUser()
  const { currentPractice, isLoading: practiceLoading } = usePractice()
  const { toast } = useToast()

  // Core state - initialize with server data
  const [activeTab, setActiveTab] = useState("schedule")
  const [currentWeek, setCurrentWeek] = useState(initialWeek)
  const [isLoading, setIsLoading] = useState(false) // No initial loading needed

  // Data state - initialize with server-fetched data
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(initialData.teamMembers)
  const [shiftTypes, setShiftTypes] = useState<ShiftType[]>(initialData.shiftTypes)
  const [schedules, setSchedules] = useState<Shift[]>(initialData.schedules)
  const [availability, setAvailability] = useState<Availability[]>(initialData.availability)
  const [swapRequests, setSwapRequests] = useState<SwapRequest[]>(initialData.swapRequests)
  const [violations, setViolations] = useState<Violation[]>([])

  // Dialog state for shift types
  const [shiftTypeDialogOpen, setShiftTypeDialogOpen] = useState(false)
  const [editingShiftType, setEditingShiftType] = useState<ShiftType | null>(null)

  // Week days
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i))
  }, [currentWeek])

  // Stats
  const stats: DienstplanStats = useMemo(() => {
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

  // Fetch all data - returns a promise that resolves when data is loaded
  const fetchData = useCallback(async () => {
    const weekStart = format(currentWeek, "yyyy-MM-dd")
    const weekEnd = format(endOfWeek(currentWeek, { weekStartsOn: 1 }), "yyyy-MM-dd")

    try {
      const [teamRes, shiftTypesRes, schedulesRes, availabilityRes, swapRes] = await Promise.all([
        fetch(`/api/practices/${practiceId}/team-members`, { cache: "no-store" }),
        fetch(`/api/practices/${practiceId}/dienstplan/shift-types`, { cache: "no-store" }),
        fetch(`/api/practices/${practiceId}/dienstplan/schedules?start=${weekStart}&end=${weekEnd}`, { cache: "no-store" }),
        fetch(`/api/practices/${practiceId}/dienstplan/availability`, { cache: "no-store" }),
        fetch(`/api/practices/${practiceId}/dienstplan/swap-requests?status=pending`, { cache: "no-store" }),
      ])

      // Use functional updates to ensure state changes are detected
      if (teamRes.ok) {
        const data = await teamRes.json()
        setTeamMembers(() => data.teamMembers || [])
      }
      if (shiftTypesRes.ok) {
        const data = await shiftTypesRes.json()
        setShiftTypes(() => data.shiftTypes || [])
      }
      if (schedulesRes.ok) {
        const data = await schedulesRes.json()
        setSchedules(() => data.schedules || [])
      }
      if (availabilityRes.ok) {
        const data = await availabilityRes.json()
        setAvailability(() => data.availability || [])
      }
      if (swapRes.ok) {
        const data = await swapRes.json()
        setSwapRequests(() => data.swapRequests || [])
      }
    } catch (error) {
      console.error("Error fetching dienstplan data:", error)
      toast({ title: "Fehler", description: "Daten konnten nicht geladen werden", variant: "destructive" })
    }
  }, [practiceId, currentWeek, toast])

  // Only refetch when week changes (initial data comes from server)
  useEffect(() => {
    // Skip initial render since we have server data
    if (currentWeek.getTime() !== initialWeek.getTime()) {
      setIsLoading(true)
      fetchData().finally(() => setIsLoading(false))
    }
  }, [currentWeek, fetchData, initialWeek])

  // Week navigation with URL updates
  const goToPreviousWeek = () => {
    const newWeek = subWeeks(currentWeek, 1)
    setCurrentWeek(newWeek)
    router.push(`/dienstplan?week=${format(newWeek, "yyyy-MM-dd")}`)
  }
  
  const goToNextWeek = () => {
    const newWeek = addWeeks(currentWeek, 1)
    setCurrentWeek(newWeek)
    router.push(`/dienstplan?week=${format(newWeek, "yyyy-MM-dd")}`)
  }
  
  const goToCurrentWeek = () => {
    const newWeek = startOfWeek(new Date(), { weekStartsOn: 1 })
    setCurrentWeek(newWeek)
    router.push(`/dienstplan?week=${format(newWeek, "yyyy-MM-dd")}`)
  }

  // Handlers - using functional state updates for instant UI updates
  const handleApproveSwap = async (id: string) => {
    try {
      const res = await fetch(`/api/practices/${practiceId}/dienstplan/swap-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      })
      if (res.ok) {
        // Instant update using functional state
        setSwapRequests(prev => prev.filter(r => r.id !== id))
        toast({ title: "Tausch genehmigt" })
        // Refresh schedules to reflect the swap
        await fetchData()
      }
    } catch {
      toast({ title: "Fehler", variant: "destructive" })
    }
  }

  const handleRejectSwap = async (id: string) => {
    try {
      const res = await fetch(`/api/practices/${practiceId}/dienstplan/swap-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      })
      if (res.ok) {
        // Instant update using functional state
        setSwapRequests(prev => prev.filter(r => r.id !== id))
        toast({ title: "Tausch abgelehnt" })
      }
    } catch {
      toast({ title: "Fehler", variant: "destructive" })
    }
  }

  const handleDeleteShiftType = async (id: string) => {
    try {
      const res = await fetch(`/api/practices/${practiceId}/dienstplan/shift-types/${id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        // Instant update using functional state
        setShiftTypes(prev => prev.filter(st => st.id !== id))
        toast({ title: "Schichttyp gelöscht" })
      }
    } catch {
      toast({ title: "Fehler", variant: "destructive" })
    }
  }

  // Shift type add/edit handlers
  const handleAddShiftType = () => {
    setEditingShiftType(null)
    setShiftTypeDialogOpen(true)
  }

  const handleEditShiftType = (shiftType: ShiftType) => {
    setEditingShiftType(shiftType)
    setShiftTypeDialogOpen(true)
  }

  const handleSaveShiftType = async (data: Partial<ShiftType>) => {
    const isEditing = !!editingShiftType
    const url = isEditing
      ? `/api/practices/${practiceId}/dienstplan/shift-types/${editingShiftType.id}`
      : `/api/practices/${practiceId}/dienstplan/shift-types`

    const res = await fetch(url, {
      method: isEditing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (res.ok) {
      const savedData = await res.json()
      if (isEditing) {
        // Instant update for edit
        setShiftTypes(prev => prev.map(st => st.id === editingShiftType.id ? { ...st, ...savedData } : st))
      } else {
        // Instant update for create
        setShiftTypes(prev => [...prev, savedData])
      }
      toast({ title: isEditing ? "Schichttyp aktualisiert" : "Schichttyp erstellt" })
    } else {
      throw new Error("Failed to save shift type")
    }
  }

  if (practiceLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!currentPractice) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Keine Praxis ausgewählt</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dienstplan</h1>
          <p className="text-muted-foreground">Schichten und Verfügbarkeiten verwalten</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={goToCurrentWeek}>
            Heute
          </Button>
          <span className="px-3 py-2 text-sm font-medium">
            {format(currentWeek, "d. MMM", { locale: de })} -{" "}
            {format(addDays(currentWeek, 6), "d. MMM yyyy", { locale: de })}
          </span>
          <Button variant="outline" size="icon" onClick={goToNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Schichten</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalShifts}</div>
            <p className="text-xs text-muted-foreground">{stats.coverageRate}% besetzt</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamMembers.length}</div>
            <p className="text-xs text-muted-foreground">Mitarbeiter</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tausch-Anfragen</CardTitle>
            <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingSwaps}</div>
            <p className="text-xs text-muted-foreground">offen</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Schichttypen</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{shiftTypes.length}</div>
            <p className="text-xs text-muted-foreground">definiert</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto gap-1">
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Wochenplan</span>
          </TabsTrigger>
          <TabsTrigger value="availability" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Verfügbarkeit</span>
          </TabsTrigger>
          <TabsTrigger value="swaps" className="flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4" />
            <span className="hidden sm:inline">Tausch</span>
            {stats.pendingSwaps > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                {stats.pendingSwaps}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Einstellungen</span>
          </TabsTrigger>
        </TabsList>

          <TabsContent value="schedule">
            <ScheduleTab
              weekDays={weekDays}
              schedules={schedules}
              teamMembers={teamMembers}
              shiftTypes={shiftTypes}
              practiceId={practiceId}
              onRefresh={fetchData}
              setSchedules={setSchedules}
            />
          </TabsContent>

          <TabsContent value="availability">
            <AvailabilityTab
              availability={availability}
              teamMembers={teamMembers}
              currentWeek={currentWeek}
              practiceId={practiceId}
              onRefresh={fetchData}
            />
          </TabsContent>

        <TabsContent value="availability">
          <AvailabilityTab
            availability={availability}
            teamMembers={teamMembers}
            practiceId={currentPractice.id}
            onRefresh={fetchData}
          />
        </TabsContent>

          <TabsContent value="swaps">
            <SwapRequestsTab
              swapRequests={swapRequests}
              teamMembers={teamMembers}
              schedules={schedules}
              practiceId={practiceId}
              onApprove={handleApproveSwap}
              onReject={handleRejectSwap}
            />
          </TabsContent>

          <TabsContent value="settings">
            <ShiftTypesTab
              shiftTypes={shiftTypes}
              practiceId={practiceId}
              onAdd={handleAddShiftType}
              onEdit={handleEditShiftType}
              onDelete={handleDeleteShiftType}
            />
          </TabsContent>

        <TabsContent value="settings">
          <ShiftTypesTab
            shiftTypes={shiftTypes}
            onAdd={handleAddShiftType}
            onEdit={handleEditShiftType}
            onDelete={handleDeleteShiftType}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>

      {/* Shift Type Dialog */}
      <ShiftTypeDialog
        open={shiftTypeDialogOpen}
        onOpenChange={setShiftTypeDialogOpen}
        shiftType={editingShiftType}
        practiceId={practiceId}
        onSave={handleSaveShiftType}
      />
    </div>
  )
}
