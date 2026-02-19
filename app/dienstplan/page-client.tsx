"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { StatCard, statCardColors } from "@/components/ui/stat-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Users, Calendar, Clock, ArrowLeftRight, Settings, Palmtree, Stethoscope } from "lucide-react"
import { format, addDays } from "date-fns"
import { de } from "date-fns/locale"

import ScheduleTab from "./components/schedule-tab"
import AvailabilityTab from "./components/availability-tab"
import SwapRequestsTab from "./components/swap-requests-tab"
import ShiftTypesTab from "./components/shift-types-tab"
import ShiftTypeDialog from "./components/shift-type-dialog"
import HolidaysTab from "@/app/team/components/holidays-tab"
import SickLeavesTab from "@/app/team/components/sickleaves-tab"
import { useDienstplanData } from "./hooks/use-dienstplan-data"
import type { ShiftType } from "./types"

interface DienstplanPageClientProps {
  initialData: {
    teamMembers: any[]
    shiftTypes: any[]
    schedules: any[]
    availability: any[]
    swapRequests: any[]
    holidayRequests: any[]
    sickLeaves: any[]
  }
  initialWeek: Date
  teams: any[]
  practiceId: string
  userId: string
}

export default function DienstplanPageClient({
  initialData, initialWeek, teams, practiceId, userId,
}: DienstplanPageClientProps) {
  const [activeTab, setActiveTab] = useState("schedule")
  const [shiftTypeDialogOpen, setShiftTypeDialogOpen] = useState(false)
  const [editingShiftType, setEditingShiftType] = useState<ShiftType | null>(null)

  const {
    currentWeek, isLoading, weekDays, stats,
    teamMembers, shiftTypes, schedules, setSchedules, availability, swapRequests,
    holidayRequests, sickLeaves,
    fetchData, goToPreviousWeek, goToNextWeek, goToCurrentWeek,
    handleApproveSwap, handleRejectSwap, handleDeleteShiftType, handleSaveShiftType,
    handleHolidayRequestCreated, handleApproveHolidayRequest, handleRejectHolidayRequest,
    handleSickLeaveCreated,
  } = useDienstplanData({ initialData, initialWeek, practiceId })

  const handleAddShiftType = () => { setEditingShiftType(null); setShiftTypeDialogOpen(true) }
  const handleEditShiftType = (st: ShiftType) => { setEditingShiftType(st); setShiftTypeDialogOpen(true) }

  const onSaveShiftType = async (data: Partial<ShiftType>) => {
    await handleSaveShiftType(data, editingShiftType?.id)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!practiceId) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">{"Keine Praxis ausgewählt"}</p>
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
          <p className="text-muted-foreground">{"Schichten und Verfügbarkeiten verwalten"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={goToCurrentWeek}>Heute</Button>
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
        <StatCard label="Schichten" value={stats.totalShifts} icon={Calendar} {...statCardColors.info} description={`${stats.coverageRate}% besetzt`} />
        <StatCard label="Team" value={teamMembers.length} icon={Users} {...statCardColors.success} description="Mitarbeiter" />
        <StatCard label="Tausch-Anfragen" value={stats.pendingSwaps} icon={ArrowLeftRight} {...statCardColors.warning} description="offen" />
        <StatCard label="Schichttypen" value={shiftTypes.length} icon={Clock} {...statCardColors.purple} description="definiert" />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 h-auto gap-1">
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" /><span className="hidden sm:inline">Wochenplan</span>
          </TabsTrigger>
          <TabsTrigger value="availability" className="flex items-center gap-2">
            <Users className="h-4 w-4" /><span className="hidden sm:inline">{"Verfügbarkeit"}</span>
          </TabsTrigger>
          <TabsTrigger value="holidays" className="flex items-center gap-2">
            <Palmtree className="h-4 w-4" /><span className="hidden sm:inline">Urlaub</span>
          </TabsTrigger>
          <TabsTrigger value="sickleaves" className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4" /><span className="hidden sm:inline">Krankmeldungen</span>
          </TabsTrigger>
          <TabsTrigger value="swaps" className="flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4" /><span className="hidden sm:inline">Tausch</span>
            {stats.pendingSwaps > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">{stats.pendingSwaps}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" /><span className="hidden sm:inline">Schichten</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schedule">
          <ScheduleTab weekDays={weekDays} schedules={schedules} teamMembers={teamMembers} shiftTypes={shiftTypes} teams={teams} practiceId={practiceId} onRefresh={fetchData} setSchedules={setSchedules} />
        </TabsContent>
        <TabsContent value="availability">
          <AvailabilityTab availability={availability} teamMembers={teamMembers} currentWeek={currentWeek} practiceId={practiceId} onRefresh={fetchData} />
        </TabsContent>
        <TabsContent value="holidays">
          <HolidaysTab holidayRequests={holidayRequests} teamMembers={teamMembers} onRequestCreated={handleHolidayRequestCreated} onApproveRequest={handleApproveHolidayRequest} onRejectRequest={handleRejectHolidayRequest} />
        </TabsContent>
        <TabsContent value="sickleaves">
          <SickLeavesTab sickLeaves={sickLeaves} teamMembers={teamMembers} onSickLeaveCreated={handleSickLeaveCreated} />
        </TabsContent>
        <TabsContent value="swaps">
          <SwapRequestsTab swapRequests={swapRequests} teamMembers={teamMembers} schedules={schedules} practiceId={practiceId} onApprove={handleApproveSwap} onReject={handleRejectSwap} />
        </TabsContent>
        <TabsContent value="settings">
          <ShiftTypesTab shiftTypes={shiftTypes} practiceId={practiceId} onAdd={handleAddShiftType} onEdit={handleEditShiftType} onDelete={handleDeleteShiftType} />
        </TabsContent>
      </Tabs>

      <ShiftTypeDialog open={shiftTypeDialogOpen} onOpenChange={setShiftTypeDialogOpen} shiftType={editingShiftType} practiceId={practiceId} onSave={onSaveShiftType} />
    </div>
  )
}
