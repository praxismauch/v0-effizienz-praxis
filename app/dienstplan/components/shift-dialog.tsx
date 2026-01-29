"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Shift, ShiftType, TeamMember } from "../types"

interface ShiftDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shift?: Shift | null
  shiftTypes: ShiftType[]
  teamMembers: TeamMember[]
  selectedDate?: Date | null
  selectedMemberId?: string | null
  defaultDate?: string
  defaultTeamMemberId?: string
  onSave: (data: Partial<Shift>) => Promise<void>
}

export default function ShiftDialog({
  open,
  onOpenChange,
  shift,
  shiftTypes,
  teamMembers,
  selectedDate,
  selectedMemberId,
  defaultDate,
  defaultTeamMemberId,
  onSave,
}: ShiftDialogProps) {
  const isEditing = !!shift

  const [formData, setFormData] = useState({
    team_member_id: "",
    shift_type_id: "",
    shift_date: "",
    start_time: "08:00",
    end_time: "17:00",
    notes: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (shift) {
      setFormData({
        team_member_id: shift.team_member_id || "",
        shift_type_id: shift.shift_type_id || "",
        shift_date: shift.shift_date || shift.date || "",
        start_time: shift.start_time || "08:00",
        end_time: shift.end_time || "17:00",
        notes: shift.notes || "",
      })
    } else {
      const selectedShiftType = shiftTypes.find((st) => st.is_active)
      
      // Use defaultDate and defaultTeamMemberId if provided, otherwise use selectedDate and selectedMemberId
      const dateStr = defaultDate || (selectedDate ? format(selectedDate, "yyyy-MM-dd") : "")
      const memberId = defaultTeamMemberId || selectedMemberId || ""
      
      setFormData({
        team_member_id: memberId,
        shift_type_id: selectedShiftType?.id || "",
        shift_date: dateStr,
        start_time: selectedShiftType?.start_time || "08:00",
        end_time: selectedShiftType?.end_time || "17:00",
        notes: "",
      })
    }
  }, [shift, selectedDate, selectedMemberId, defaultDate, defaultTeamMemberId, shiftTypes, open])

  // Update times when shift type changes
  const handleShiftTypeChange = (shiftTypeId: string) => {
    const shiftType = shiftTypes.find((st) => st.id === shiftTypeId)
    setFormData({
      ...formData,
      shift_type_id: shiftTypeId,
      start_time: shiftType?.start_time || formData.start_time,
      end_time: shiftType?.end_time || formData.end_time,
    })
  }

  const handleSubmit = async () => {
    if (!formData.team_member_id || !formData.shift_type_id || !formData.shift_date) return

    setIsSubmitting(true)
    try {
      await onSave({
        team_member_id: formData.team_member_id,
        shift_type_id: formData.shift_type_id,
        shift_date: formData.shift_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        notes: formData.notes || undefined,
        status: "scheduled",
      })
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving shift:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const activeShiftTypes = shiftTypes.filter((st) => st.is_active)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Schicht bearbeiten" : "Neue Schicht"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="team_member">Mitarbeiter</Label>
            <Select
              value={formData.team_member_id}
              onValueChange={(value) => setFormData({ ...formData, team_member_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Mitarbeiter auswählen" />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.first_name} {member.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="shift_type">Schichttyp</Label>
            <Select
              value={formData.shift_type_id}
              onValueChange={handleShiftTypeChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Schichttyp auswählen" />
              </SelectTrigger>
              <SelectContent>
                {activeShiftTypes.map((shiftType) => (
                  <SelectItem key={shiftType.id} value={shiftType.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: shiftType.color }}
                      />
                      {shiftType.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="shift_date">Datum</Label>
            <Input
              id="shift_date"
              type="date"
              value={formData.shift_date}
              onChange={(e) => setFormData({ ...formData, shift_date: e.target.value })}
            />
            {formData.shift_date && (
              <p className="text-sm text-muted-foreground">
                {format(new Date(formData.shift_date), "EEEE, d. MMMM yyyy", { locale: de })}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="start_time">Beginn</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end_time">Ende</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notizen (optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Zusätzliche Informationen..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.team_member_id || !formData.shift_type_id || !formData.shift_date}
          >
            {isSubmitting ? "Speichern..." : "Speichern"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
