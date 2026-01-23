"use client"

import { format } from "date-fns"
import { de } from "date-fns/locale"
import { Clock, Coffee, Moon, Sun, Plus, MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { TeamMember, Shift, ShiftType } from "../types"

interface ScheduleTabProps {
  weekDays: Date[]
  filteredTeamMembers: TeamMember[]
  schedules: Shift[]
  shiftTypes: ShiftType[]
  onCellClick: (date: Date, memberId: string) => void
  onEditShift: (shift: Shift) => void
  onDeleteShift: (shiftId: string) => void
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
  filteredTeamMembers,
  schedules,
  shiftTypes,
  onCellClick,
  onEditShift,
  onDeleteShift,
}: ScheduleTabProps) {
  const getShiftsForCell = (date: Date, memberId: string) => {
    const dateStr = format(date, "yyyy-MM-dd")
    return schedules.filter((s) => s.team_member_id === memberId && s.date === dateStr)
  }

  const getShiftType = (shiftTypeId: string) => {
    return shiftTypes.find((st) => st.id === shiftTypeId)
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
    </Card>
  )
}
