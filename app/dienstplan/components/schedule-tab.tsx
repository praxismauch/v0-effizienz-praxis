"use client"

import { useState } from "react"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { Clock, Coffee, Moon, Sun, Plus, MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import ShiftDialog from "./shift-dialog"
import type { TeamMember, Shift, ShiftType } from "../types"

interface ScheduleTabProps {
  weekDays: Date[]
  teamMembers: TeamMember[]
  schedules: Shift[]
  shiftTypes: ShiftType[]
  practiceId: string
  onRefresh: () => void
}

const getShiftIcon = (name: string) => {
  const lowerName = name.toLowerCase()
  if (lowerName.includes("früh") || lowerName.includes("morning")) return Sun
  if (lowerName.includes("spät") || lowerName.includes("evening")) return Moon
  if (lowerName.includes("pause") || lowerName.includes("break")) return Coffee
  return Clock
}

export default function ScheduleTab({
  weekDays,
  teamMembers,
  schedules,
  shiftTypes,
  practiceId,
  onRefresh,
}: ScheduleTabProps) {
  const { toast } = useToast()
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingShift, setEditingShift] = useState<Shift | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)

  // Use teamMembers directly (with fallback to empty array)
  const filteredTeamMembers = teamMembers || []
  
  // Debug: Log schedules when they change
  React.useEffect(() => {
    if (schedules && schedules.length > 0) {
      console.log("[v0] ScheduleTab received", schedules.length, "schedules:", schedules.map(s => ({
        id: s.id.substring(0, 8),
        date: s.shift_date || s.date,
        member: s.team_member_id.substring(0, 8)
      })))
    }
  }, [schedules])

  const getShiftsForCell = (date: Date, memberId: string) => {
    const dateStr = format(date, "yyyy-MM-dd")
    const filtered = (schedules || []).filter((s) => s.team_member_id === memberId && (s.shift_date === dateStr || s.date === dateStr))
    if (filtered.length > 0) {
      console.log("[v0] Found shifts for", dateStr, memberId, ":", filtered.length)
    }
    return filtered
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

  // Delete shift handler
  const onDeleteShift = async (shiftId: string) => {
    try {
      const res = await fetch(`/api/practices/${practiceId}/dienstplan/schedules/${shiftId}`, {
        method: "DELETE",
      })
      if (res.ok) {
        toast({ title: "Schicht gelöscht" })
        onRefresh()
      } else {
        throw new Error("Failed to delete")
      }
    } catch {
      toast({ title: "Fehler beim Löschen", variant: "destructive" })
    }
  }

  // Save shift handler
  const handleSaveShift = async (data: Partial<Shift>) => {
    const isEditing = !!editingShift
    const url = isEditing
      ? `/api/practices/${practiceId}/dienstplan/schedules/${editingShift.id}`
      : `/api/practices/${practiceId}/dienstplan/schedules`

    console.log("[v0] Saving shift to:", url, "Data:", data)
    
    const res = await fetch(url, {
      method: isEditing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, practice_id: parseInt(practiceId) }),
      cache: "no-store",
    })

    if (res.ok) {
      const savedData = await res.json()
      console.log("[v0] Shift saved successfully:", savedData)
      
      // Close dialog first
      setDialogOpen(false)
      setEditingShift(null)
      
      // Then refresh and show toast
      toast({ title: isEditing ? "Schicht aktualisiert" : "Schicht erstellt" })
      console.log("[v0] Triggering refresh...")
      await onRefresh()
    } else {
      const error = await res.text()
      console.error("[v0] Failed to save shift:", error)
      throw new Error("Failed to save shift")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wochenplan</CardTitle>
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
                          {member.first_name[0]}
                          {member.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">
                          {member.first_name} {member.last_name}
                        </p>
                        {member.role && <p className="text-xs text-muted-foreground">{member.role}</p>}
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
    </Card>
  )
}
