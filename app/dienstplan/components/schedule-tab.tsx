"use client"

import React, { useState, useMemo, useCallback } from "react"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { Search, Users, FileText, Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { ScheduleRow } from "./schedule-row"
import ShiftDialog from "./shift-dialog"
import SwapRequestDialog from "./swap-request-dialog"
import ScheduleTemplateDialog from "./schedule-template-dialog"
import type { TeamMember, Shift, ShiftType, ScheduleTemplate, Team } from "../types"

interface ScheduleTabProps {
  weekDays: Date[]
  teamMembers: TeamMember[]
  schedules: Shift[]
  shiftTypes: ShiftType[]
  teams?: Team[]
  practiceId: string
  onRefresh: () => Promise<void>
  setSchedules: React.Dispatch<React.SetStateAction<Shift[]>>
}

export default function ScheduleTab({
  weekDays: weekDaysProp,
  teamMembers: teamMembersProp,
  schedules: schedulesProp,
  shiftTypes: shiftTypesProp,
  teams: teamsProp,
  practiceId,
  onRefresh,
  setSchedules,
}: ScheduleTabProps) {
  const weekDays = weekDaysProp || []
  const teamMembers = teamMembersProp || []
  const schedules = schedulesProp || []
  const shiftTypes = shiftTypesProp || []
  const teams = teamsProp || []
  const { toast } = useToast()

  // Filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGroup, setSelectedGroup] = useState<string>("all")

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingShift, setEditingShift] = useState<Shift | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [swapDialogOpen, setSwapDialogOpen] = useState(false)
  const [swappingShift, setSwappingShift] = useState<Shift | null>(null)
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)

  // Derived data
  const availableRoles = useMemo(() => {
    const roles = new Set<string>()
    teamMembers.forEach((m) => { if (m.role) roles.add(m.role) })
    return Array.from(roles).sort()
  }, [teamMembers])

  const filteredTeamMembers = useMemo(() => {
    return teamMembers.filter((member) => {
      const fullName = `${member.first_name} ${member.last_name}`.toLowerCase()
      const matchesSearch = searchQuery === "" || fullName.includes(searchQuery.toLowerCase())
      const memberTeamIds = member.team_ids || member.teamIds || []
      const matchesGroup = selectedGroup === "all" || memberTeamIds.includes(selectedGroup)
      return matchesSearch && matchesGroup
    })
  }, [teamMembers, searchQuery, selectedGroup])

  const shiftsByDateAndMember = useMemo(() => {
    const map = new Map<string, Shift[]>()
    schedules.forEach((shift) => {
      const shiftDate = shift.shift_date || shift.date
      const key = `${shiftDate}-${shift.team_member_id}`
      const existing = map.get(key) || []
      map.set(key, [...existing, shift])
    })
    return map
  }, [schedules])

  const getShiftsForCell = useCallback((date: Date, memberId: string) => {
    const dateStr = format(date, "yyyy-MM-dd")
    return shiftsByDateAndMember.get(`${dateStr}-${memberId}`) || []
  }, [shiftsByDateAndMember])

  const getShiftType = useCallback((shiftTypeId: string) => {
    return shiftTypes.find((st) => st.id === shiftTypeId)
  }, [shiftTypes])

  // Handlers
  const onCellClick = useCallback((date: Date, memberId: string) => {
    setSelectedDate(date)
    setSelectedMemberId(memberId)
    setEditingShift(null)
    setDialogOpen(true)
  }, [])

  const onEditShift = useCallback((shift: Shift) => {
    setEditingShift(shift)
    setSelectedDate(null)
    setSelectedMemberId(null)
    setDialogOpen(true)
  }, [])

  const onSwapShift = useCallback((shift: Shift) => {
    setSwappingShift(shift)
    setSwapDialogOpen(true)
  }, [])

  const onDeleteShift = useCallback(async (shiftId: string) => {
    try {
      const res = await fetch(`/api/practices/${practiceId}/dienstplan/schedules/${shiftId}`, { method: "DELETE" })
      if (res.ok) {
        setSchedules((prev) => prev.filter((s) => s.id !== shiftId))
        toast({ title: "Schicht gelöscht" })
      } else {
        throw new Error("Failed to delete")
      }
    } catch {
      toast({ title: "Fehler beim Löschen", variant: "destructive" })
    }
  }, [practiceId, setSchedules, toast])

  const handleSaveShift = useCallback(async (data: Partial<Shift>) => {
    const isEditing = !!editingShift
    const url = isEditing
      ? `/api/practices/${practiceId}/dienstplan/schedules/${editingShift!.id}`
      : `/api/practices/${practiceId}/dienstplan/schedules`

    try {
      const res = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, practice_id: practiceId }),
        cache: "no-store",
      })
      if (res.ok) {
        const savedData = await res.json()
        if (isEditing) {
          setSchedules((prev) => prev.map((s) => (s.id === editingShift!.id ? { ...s, ...savedData.schedule || savedData } : s)))
        } else {
          setSchedules((prev) => [...prev, savedData.schedule || savedData])
        }
        setDialogOpen(false)
        setEditingShift(null)
        toast({ title: isEditing ? "Schicht aktualisiert" : "Schicht erstellt" })
      } else {
        const error = await res.text()
        toast({ title: "Fehler beim Speichern", description: error, variant: "destructive" })
        throw new Error("Failed to save shift")
      }
    } catch (error) {
      toast({ title: "Fehler beim Speichern", variant: "destructive" })
      throw error
    }
  }, [editingShift, practiceId, setSchedules, toast])

  const handleApplyTemplate = useCallback(async (template: ScheduleTemplate) => {
    if (!template.shifts || template.shifts.length === 0) {
      toast({ title: "Keine Schichten", description: "Diese Vorlage enthält keine Schichten.", variant: "destructive" })
      return
    }
    try {
      const newShifts: any[] = []
      for (const templateShift of template.shifts) {
        if (!weekDays || weekDays.length <= templateShift.day_of_week) continue
        const dayDate = weekDays[templateShift.day_of_week]
        if (!dayDate) continue
        const shiftType = shiftTypes.find((st) => st.id === templateShift.shift_type_id)
        if (!shiftType) continue
        const eligible = templateShift.role_filter
          ? teamMembers.filter((m) => m.role === templateShift.role_filter)
          : teamMembers
        if (eligible.length > 0) {
          newShifts.push({
            practice_id: practiceId,
            team_member_id: eligible[0].id,
            shift_type_id: templateShift.shift_type_id,
            shift_date: format(dayDate, "yyyy-MM-dd"),
            start_time: shiftType.start_time,
            end_time: shiftType.end_time,
            status: "scheduled",
          })
        }
      }
      for (const shift of newShifts) {
        await handleSaveShift(shift)
      }
      toast({ title: "Vorlage angewendet", description: `${newShifts.length} Schichten wurden erstellt.` })
      await onRefresh()
    } catch {
      toast({ title: "Fehler", description: "Vorlage konnte nicht angewendet werden.", variant: "destructive" })
    }
  }, [weekDays, shiftTypes, teamMembers, practiceId, handleSaveShift, onRefresh, toast])

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <CardTitle>Wochenplan</CardTitle>
            <Button size="sm" onClick={() => setTemplateDialogOpen(true)}>
              <FileText className="h-4 w-4 mr-2" />
              Vorlagen
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Mitarbeiter suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {teams.length > 0 && (
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Alle Teams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Teams</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          {(searchQuery || selectedGroup !== "all") && (
            <p className="text-sm text-muted-foreground">
              {filteredTeamMembers.length} von {teamMembers.length} Mitarbeitern angezeigt
            </p>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="p-3 text-left font-medium text-muted-foreground w-48 sticky left-0 bg-background z-10">
                  Mitarbeiter
                </th>
                {weekDays.map((day) => (
                  <th key={day.toISOString()} className="p-3 text-center font-medium text-muted-foreground min-w-32">
                    <div className="flex flex-col items-center">
                      <span className="text-xs">{format(day, "EEE", { locale: de })}</span>
                      <span className="text-sm">{format(day, "d. MMM", { locale: de })}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredTeamMembers.map((member) => (
                <ScheduleRow
                  key={member.id}
                  member={member}
                  weekDays={weekDays}
                  getShiftsForCell={getShiftsForCell}
                  getShiftType={getShiftType}
                  onCellClick={onCellClick}
                  onEditShift={onEditShift}
                  onSwapShift={onSwapShift}
                  onDeleteShift={onDeleteShift}
                />
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>

      <ShiftDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        shift={editingShift}
        shiftTypes={shiftTypes}
        teamMembers={teamMembers}
        selectedDate={selectedDate}
        selectedMemberId={selectedMemberId || undefined}
        onSave={handleSaveShift}
      />
      <SwapRequestDialog
        open={swapDialogOpen}
        onOpenChange={setSwapDialogOpen}
        currentShift={swappingShift}
        allShifts={schedules}
        shiftTypes={shiftTypes}
        teamMembers={teamMembers}
        practiceId={practiceId}
        onSuccess={() => { toast({ title: "Tausch-Anfrage gesendet" }); onRefresh() }}
      />
      <ScheduleTemplateDialog
        open={templateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
        practiceId={practiceId}
        shiftTypes={shiftTypes}
        availableRoles={availableRoles}
        onApplyTemplate={handleApplyTemplate}
        currentSchedules={schedules}
        weekDays={weekDays}
      />
    </Card>
  )
}
