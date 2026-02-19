"use client"

import React, { useState, useMemo } from "react"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { getRoleLabel } from "@/lib/roles"
import { Clock, Coffee, Moon, Sun, Plus, MoreHorizontal, Edit, Trash2, ArrowLeftRight, Search, Users, FileText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import ShiftDialog from "./shift-dialog"
import SwapRequestDialog from "./swap-request-dialog"
import ScheduleTemplateDialog from "./schedule-template-dialog"
import type { TeamMember, Shift, ShiftType, ScheduleTemplate } from "../types"

interface ScheduleTabProps {
  weekDays: Date[]
  teamMembers: TeamMember[]
  schedules: Shift[]
  shiftTypes: ShiftType[]
  practiceId: string
  onRefresh: () => Promise<void>
  setSchedules: React.Dispatch<React.SetStateAction<Shift[]>>
}

const getShiftIcon = (name: string) => {
  const lowerName = name.toLowerCase()
  if (lowerName.includes("früh") || lowerName.includes("morning")) return Sun
  if (lowerName.includes("spät") || lowerName.includes("evening")) return Moon
  if (lowerName.includes("pause") || lowerName.includes("break")) return Coffee
  return Clock
}

export default function ScheduleTab({
  weekDays: weekDaysProp,
  teamMembers: teamMembersProp,
  schedules: schedulesProp,
  shiftTypes: shiftTypesProp,
  practiceId,
  onRefresh,
  setSchedules,
}: ScheduleTabProps) {
  // Add null safety guards
  const weekDays = weekDaysProp || []
  const teamMembers = teamMembersProp || []
  const schedules = schedulesProp || []
  const shiftTypes = shiftTypesProp || []
  const { toast } = useToast()
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRole, setSelectedRole] = useState<string>("all")
  const [selectedGroup, setSelectedGroup] = useState<string>("all")
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingShift, setEditingShift] = useState<Shift | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  
  // Swap dialog state
  const [swapDialogOpen, setSwapDialogOpen] = useState(false)
  const [swappingShift, setSwappingShift] = useState<Shift | null>(null)
  
  // Template dialog state
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)

  // Apply template to current week
  const handleApplyTemplate = async (template: ScheduleTemplate) => {
    if (!template.shifts || template.shifts.length === 0) {
      toast({
        title: "Keine Schichten",
        description: "Diese Vorlage enthält keine Schichten.",
        variant: "destructive",
      })
      return
    }

    try {
      // Create shifts for each day in the current week based on the template
      const newShifts: any[] = []
      
      for (const templateShift of template.shifts) {
        // Check if weekDays array has the required day
        if (!weekDays || weekDays.length <= templateShift.day_of_week) {
          console.error("Invalid day_of_week:", templateShift.day_of_week, "weekDays length:", weekDays?.length)
          continue
        }
        const dayDate = weekDays[templateShift.day_of_week]
        if (!dayDate) continue

        const shiftType = shiftTypes.find((st) => st.id === templateShift.shift_type_id)
        if (!shiftType) continue

        // Find matching team members based on role filter
        const safeTeamMembers = Array.isArray(teamMembers) ? teamMembers : []
        const eligibleMembers = templateShift.role_filter
          ? safeTeamMembers.filter((m) => m.role === templateShift.role_filter)
          : safeTeamMembers

        // For now, create one shift per template entry (can be expanded later)
        if (eligibleMembers.length > 0) {
          newShifts.push({
            practice_id: practiceId,
            team_member_id: eligibleMembers[0].id, // Assign to first eligible member
            shift_type_id: templateShift.shift_type_id,
            shift_date: format(dayDate, "yyyy-MM-dd"),
            start_time: shiftType.start_time,
            end_time: shiftType.end_time,
            status: "scheduled",
          })
        }
      }

      // Save all shifts
      for (const shift of newShifts) {
        await handleSaveShift(shift)
      }

      toast({
        title: "Vorlage angewendet",
        description: `${newShifts.length} Schichten wurden erstellt.`,
      })
      
      await onRefresh()
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Vorlage konnte nicht angewendet werden.",
        variant: "destructive",
      })
    }
  }

  // Get unique groups (departments) from team members
  const availableGroups = useMemo(() => {
    const groups = new Set<string>()
    ;(teamMembers || []).forEach((member) => {
      if (member.department) groups.add(member.department)
    })
    return Array.from(groups).sort()
  }, [teamMembers])

  // Get unique roles from team members for the filter dropdown
> const availableRoles = useMemo(() => {
  const roles = new Set<string>()
  ;(teamMembers || []).forEach((member) => {
  if (member.role) roles.add(member.role)
    })
    return Array.from(roles).sort()
  }, [teamMembers])

  // Filter team members by search query and role
  const filteredTeamMembers = useMemo(() => {
    return (teamMembers || []).filter((member) => {
      const fullName = `${member.first_name} ${member.last_name}`.toLowerCase()
      const matchesSearch = searchQuery === "" || fullName.includes(searchQuery.toLowerCase())
      const matchesRole = selectedRole === "all" || member.role === selectedRole
      const matchesGroup = selectedGroup === "all" || member.department === selectedGroup
      return matchesSearch && matchesRole && matchesGroup
    })
  }, [teamMembers, searchQuery, selectedRole, selectedGroup])

  // Memoize shifts by date and member for efficient lookups
  const shiftsByDateAndMember = React.useMemo(() => {
    const map = new Map<string, Shift[]>()
    ;(schedules || []).forEach((shift) => {
      const shiftDate = shift.shift_date || shift.date
      const key = `${shiftDate}-${shift.team_member_id}`
      const existing = map.get(key) || []
      map.set(key, [...existing, shift])
    })
    return map
  }, [schedules])

  const getShiftsForCell = (date: Date, memberId: string) => {
    const dateStr = format(date, "yyyy-MM-dd")
    const key = `${dateStr}-${memberId}`
    return shiftsByDateAndMember.get(key) || []
  }

  const getShiftType = (shiftTypeId: string) => {
    return (shiftTypes || []).find((st) => st.id === shiftTypeId)
  }

  // Cell click handler - open dialog to add new shift
  const onCellClick = (date: Date, memberId: string) => {
    setSelectedDate(date)
    setSelectedMemberId(memberId)
    setEditingShift(null)
    setDialogOpen(true)
  }

  // Edit shift handler
  const onEditShift = (shift: Shift) => {
    setEditingShift(shift)
    setSelectedDate(null)
    setSelectedMemberId(null)
    setDialogOpen(true)
  }

  // Swap shift handler
  const onSwapShift = (shift: Shift) => {
    setSwappingShift(shift)
    setSwapDialogOpen(true)
  }

  // Swap success handler
  const handleSwapSuccess = () => {
    toast({ title: "Tausch-Anfrage gesendet", description: "Die Anfrage muss nun genehmigt werden." })
    onRefresh()
  }

  // Delete shift handler - instant update using functional state
  const onDeleteShift = async (shiftId: string) => {
    try {
      const res = await fetch(`/api/practices/${practiceId}/dienstplan/schedules/${shiftId}`, {
        method: "DELETE",
      })
      if (res.ok) {
        // Instant update - remove from state immediately
        setSchedules(prev => prev.filter(s => s.id !== shiftId))
        toast({ title: "Schicht gelöscht" })
      } else {
        throw new Error("Failed to delete")
      }
    } catch {
      toast({ title: "Fehler beim Löschen", variant: "destructive" })
    }
  }

  // Save shift handler - instant update using functional state
  const handleSaveShift = async (data: Partial<Shift>) => {
    const isEditing = !!editingShift
    const url = isEditing
      ? `/api/practices/${practiceId}/dienstplan/schedules/${editingShift.id}`
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
        
        // Instant update using functional state
        if (isEditing) {
          // Update existing shift
          setSchedules(prev => prev.map(s => s.id === editingShift.id ? { ...s, ...savedData.schedule || savedData } : s))
        } else {
          // Add new shift
          setSchedules(prev => [...prev, savedData.schedule || savedData])
        }
        
        // Close dialog immediately
        setDialogOpen(false)
        setEditingShift(null)
        
        // Show toast
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
  }

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
            {/* Search filter */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Mitarbeiter suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {/* Role/Group filter */}
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Alle Gruppen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Gruppen</SelectItem>
                {availableRoles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {getRoleLabel(role)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Filter info */}
          {(searchQuery || selectedRole !== "all") && (
            <p className="text-sm text-muted-foreground">
              {filteredTeamMembers.length} von {teamMembers?.length || 0} Mitarbeitern angezeigt
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
                <tr key={member.id} className="border-b hover:bg-muted/50">
                  <td className="p-3 sticky left-0 bg-background z-10">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback>
                          {member.first_name?.[0] ?? ""}
                          {member.last_name?.[0] ?? ""}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">
                          {member.first_name} {member.last_name}
                        </p>
                        {member.role && <p className="text-xs text-muted-foreground">{getRoleLabel(member.role)}</p>}
                      </div>
                    </div>
                  </td>
                  {weekDays.map((day) => {
                    const shifts = getShiftsForCell(day, member.id)
                    return (
                      <td
                        key={day.toISOString()}
                        className="p-1 border-l cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() => onCellClick(day, member.id)}
                      >
                        <div className="min-h-16 flex flex-col gap-1">
                          {shifts.length === 0 ? (
                            <div className="flex items-center justify-center h-16 text-muted-foreground/50">
                              <Plus className="h-4 w-4" />
                            </div>
                          ) : (
                            shifts.map((shift) => {
                              const shiftType = getShiftType(shift.shift_type_id)
                              const Icon = shiftType ? getShiftIcon(shiftType.name) : Clock
                              return (
                                <div
                                  key={shift.id}
                                  className="rounded-md p-1.5 text-xs"
                                  style={{ backgroundColor: shiftType?.color || "#e5e7eb" }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1">
                                      <Icon className="h-3 w-3" />
                                      <span className="font-medium">{shiftType?.short_name || "?"}</span>
                                    </div>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-4 w-4 p-0">
                                          <MoreHorizontal className="h-3 w-3" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => onSwapShift(shift)}>
                                          <ArrowLeftRight className="h-4 w-4 mr-2" />
                                          Tauschen
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => onEditShift(shift)}>
                                          <Edit className="h-4 w-4 mr-2" />
                                          Bearbeiten
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          className="text-destructive"
                                          onClick={() => onDeleteShift(shift.id)}
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Löschen
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                  <p className="text-[10px] opacity-75">
                                    {shift.start_time?.slice(0, 5)} - {shift.end_time?.slice(0, 5)}
                                  </p>
                                </div>
                              )
                            })
                          )}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>

      <ShiftDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        shift={editingShift}
        shiftTypes={shiftTypes || []}
        teamMembers={teamMembers || []}
        selectedDate={selectedDate}
        selectedMemberId={selectedMemberId || undefined}
        onSave={handleSaveShift}
      />

<SwapRequestDialog
  open={swapDialogOpen}
  onOpenChange={setSwapDialogOpen}
  currentShift={swappingShift}
  allShifts={schedules || []}
  shiftTypes={shiftTypes || []}
  teamMembers={teamMembers || []}
  practiceId={practiceId}
  onSuccess={handleSwapSuccess}
  />

  <ScheduleTemplateDialog
    open={templateDialogOpen}
    onOpenChange={setTemplateDialogOpen}
    practiceId={practiceId}
    shiftTypes={shiftTypes || []}
    availableRoles={availableRoles}
    onApplyTemplate={handleApplyTemplate}
  />
  </Card>
  )
}
