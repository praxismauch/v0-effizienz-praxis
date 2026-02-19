"use client"

import React from "react"
import { format } from "date-fns"
import { getRoleLabel } from "@/lib/roles"
import { Clock, Coffee, Moon, Sun, Plus, MoreHorizontal, Edit, Trash2, ArrowLeftRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import type { TeamMember, Shift, ShiftType } from "../types"

const getShiftIcon = (name: string) => {
  const lowerName = name.toLowerCase()
  if (lowerName.includes("früh") || lowerName.includes("morning")) return Sun
  if (lowerName.includes("spät") || lowerName.includes("evening")) return Moon
  if (lowerName.includes("pause") || lowerName.includes("break")) return Coffee
  return Clock
}

// ── Schedule Cell ──────────────────────────────────────────────────────────────

interface ScheduleCellProps {
  shifts: Shift[]
  getShiftType: (id: string) => ShiftType | undefined
  onCellClick: () => void
  onEditShift: (shift: Shift) => void
  onSwapShift: (shift: Shift) => void
  onDeleteShift: (shiftId: string) => void
}

const ScheduleCell = React.memo(function ScheduleCell({
  shifts,
  getShiftType,
  onCellClick,
  onEditShift,
  onSwapShift,
  onDeleteShift,
}: ScheduleCellProps) {
  return (
    <div className="min-h-16 flex flex-col gap-1">
      {shifts.length === 0 ? (
        <div className="flex items-center justify-center h-16 text-muted-foreground/50">
          <Plus className="h-4 w-4" />
        </div>
      ) : (
        shifts.map((shift) => {
          // Try lookup first, then fall back to embedded shift_type on the shift object
          const shiftType = getShiftType(shift.shift_type_id) || shift.shift_type
          const displayName = shiftType?.short_name || shiftType?.name || shift.shift_type_id?.slice(0, 4) || "?"
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
                  <span className="font-medium">{displayName}</span>
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
                    <DropdownMenuItem className="text-destructive" onClick={() => onDeleteShift(shift.id)}>
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
  )
})

// ── Schedule Row ───────────────────────────────────────────────────────────────

interface ScheduleRowProps {
  member: TeamMember
  weekDays: Date[]
  getShiftsForCell: (date: Date, memberId: string) => Shift[]
  getShiftType: (id: string) => ShiftType | undefined
  onCellClick: (date: Date, memberId: string) => void
  onEditShift: (shift: Shift) => void
  onSwapShift: (shift: Shift) => void
  onDeleteShift: (shiftId: string) => void
}

export const ScheduleRow = React.memo(function ScheduleRow({
  member,
  weekDays,
  getShiftsForCell,
  getShiftType,
  onCellClick,
  onEditShift,
  onSwapShift,
  onDeleteShift,
}: ScheduleRowProps) {
  return (
    <tr className="border-b hover:bg-muted/50">
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
            <ScheduleCell
              shifts={shifts}
              getShiftType={getShiftType}
              onCellClick={() => onCellClick(day, member.id)}
              onEditShift={onEditShift}
              onSwapShift={onSwapShift}
              onDeleteShift={onDeleteShift}
            />
          </td>
        )
      })}
    </tr>
  )
})
