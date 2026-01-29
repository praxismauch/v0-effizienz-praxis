"use client"

import { useState, useEffect, useMemo } from "react"
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, addDays } from "date-fns"
import { de } from "date-fns/locale"
import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, Calendar, Users, ArrowLeftRight, Clock, Settings, Sparkles } from "lucide-react"
import useSWR from "swr"

import ScheduleTab from "./components/schedule-tab"
import AvailabilityTab from "./components/availability-tab"
import SwapRequestsTab from "./components/swap-requests-tab"
import ShiftTypesTab from "./components/shift-types-tab"
import ShiftTypeDialog from "./components/shift-type-dialog"
import { useDienstplan } from "./hooks/use-dienstplan"
import type { TeamMember, ShiftType, Shift, Availability, SwapRequest, Violation, DienstplanStats } from "./types"

export default function DienstplanPageClient() {
  const { currentUser } = useUser()
  const { currentPractice, isLoading: practiceLoading } = usePractice()
  const { toast } = useToast()

  // Core state
  const [activeTab, setActiveTab] = useState("schedule")
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))

  // Dialog state for shift types
  const [shiftTypeDialogOpen, setShiftTypeDialogOpen] = useState(false)
  const [editingShiftType, setEditingShiftType] = useState<ShiftType | null>(null)

  // Calculate week dates
  const weekStart = format(currentWeek, "yyyy-MM-dd")
  const weekEnd = format(endOfWeek(currentWeek, { weekStartsOn: 1 }), "yyyy-MM-dd")

  // Use SWR hook for data fetching with automatic revalidation
  const { data, isLoading, error, refreshSchedules, refresh } = useDienstplan(
    currentPractice?.id?.toString(),
    weekStart,
    weekEnd
  )

  // Extract data
  const { schedules, shiftTypes, teamMembers, availabilities: availability } = data

  // Fetch swap requests with SWR
  const swapRequestsUrl = currentPractice
    ? `/api/practices/${currentPractice.id}/dienstplan/swap-requests?status=pending`
    : null

  const { data: swapData, mutate: mutateSwapRequests } = useSWR<{ swapRequests: SwapRequest[] }>(
    swapRequestsUrl,
    async (url) => {
      const res = await fetch(url, { cache: "no-store" })
      if (!res.ok) throw new Error("Failed to fetch swap requests")
      return res.json()
    },
    { revalidateOnFocus: false, dedupingInterval: 2000 }
  )

  const swapRequests = swapData?.swapRequests || []
  const [violations, setViolations] = useState<Violation[]>([])

  // Week days
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i))
  }, [currentWeek])

  // Stats
  const stats: DienstplanStats = useMemo(() => {
    const pendingSwaps = (swapRequests || []).filter((r) => r.status === "pending").length
    const activeViolations = (violations || []).filter((v) => !v.resolved).length
    const totalShifts = (schedules || []).length
    const coveredShifts = (schedules || []).filter((s) => s.status === "approved" || s.status === "scheduled").length

    return {
      pendingSwaps,
      activeViolations,
      totalShifts,
      coveredShifts,
      coverageRate: totalShifts > 0 ? Math.round((coveredShifts / totalShifts) * 100) : 0,
    }
  }, [swapRequests, violations, schedules])

  // fetchData is now handled automatically by SWR
  // Just provide a manual refresh function that calls the SWR mutate
  const fetchData = refresh

  // Week navigation
  const goToPreviousWeek = () => setCurrentWeek((prev) => subWeeks(prev, 1))
  const goToNextWeek = () => setCurrentWeek((prev) => addWeeks(prev, 1))
  const goToCurrentWeek = () => setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }))

  // Handlers with instant updates via SWR mutate
  const handleApproveSwap = async (id: string) => {
    try {
      const res = await fetch(`/api/practices/${currentPractice?.id}/dienstplan/swap-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      })
      if (res.ok) {
        toast({ title: "Tausch genehmigt" })
        // Use SWR mutate for instant update
        await Promise.all([mutateSwapRequests(), refreshSchedules()])
      }
    } catch {
      toast({ title: "Fehler", variant: "destructive" })
    }
  }

  const handleRejectSwap = async (id: string) => {
    try {
      const res = await fetch(`/api/practices/${currentPractice?.id}/dienstplan/swap-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      })
      if (res.ok) {
        toast({ title: "Tausch abgelehnt" })
        // Use SWR mutate for instant update
        await Promise.all([mutateSwapRequests(), refreshSchedules()])
      }
    } catch {
      toast({ title: "Fehler", variant: "destructive" })
    }
  }

  const handleDeleteShiftType = async (id: string) => {
    try {
      const res = await fetch(`/api/practices/${currentPractice?.id}/dienstplan/shift-types/${id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        toast({ title: "Schichttyp gelöscht" })
        fetchData()
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
      ? `/api/practices/${currentPractice?.id}/dienstplan/shift-types/${editingShiftType.id}`
      : `/api/practices/${currentPractice?.id}/dienstplan/shift-types`

    const res = await fetch(url, {
      method: isEditing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (res.ok) {
      toast({ title: isEditing ? "Schichttyp aktualisiert" : "Schichttyp erstellt" })
      fetchData()
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
            schedules={schedules}
            teamMembers={teamMembers}
            shiftTypes={shiftTypes}
            weekDays={weekDays}
            practiceId={currentPractice.id}
            onRefresh={refreshSchedules}
          />
        </TabsContent>

        <TabsContent value="availability">
          <AvailabilityTab
            availability={availability}
            teamMembers={teamMembers}
            practiceId={currentPractice.id}
            onRefresh={refresh}
          />
        </TabsContent>

        <TabsContent value="swaps">
          <SwapRequestsTab
            swapRequests={swapRequests}
            onApprove={handleApproveSwap}
            onReject={handleRejectSwap}
            isLoading={isLoading}
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
        onSave={handleSaveShiftType}
      />
    </div>
  )
}
