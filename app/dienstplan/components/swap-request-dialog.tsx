"use client"

import { useState, useEffect, useMemo } from "react"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { getRoleLabel } from "@/lib/roles"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeftRight, Clock, Calendar, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Shift, ShiftType, TeamMember } from "../types"

interface SwapRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentShift: Shift | null
  allShifts: Shift[]
  shiftTypes: ShiftType[]
  teamMembers: TeamMember[]
  practiceId: string
  currentUserId?: string
  onSuccess: () => void
}

export default function SwapRequestDialog({
  open,
  onOpenChange,
  currentShift,
  allShifts: allShiftsProp,
  shiftTypes: shiftTypesProp,
  teamMembers: teamMembersProp,
  practiceId,
  currentUserId,
  onSuccess,
}: SwapRequestDialogProps) {
  // Add null safety guards
  const allShifts = allShiftsProp || []
  const shiftTypes = shiftTypesProp || []
  const teamMembers = teamMembersProp || []
  
  const [targetShiftId, setTargetShiftId] = useState("")
  const [reason, setReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setTargetShiftId("")
      setReason("")
      setIsSubmitting(false)
    }
  }, [open])

  // Get current shift details
  const currentShiftType = currentShift
    ? shiftTypes.find((st) => st.id === currentShift.shift_type_id)
    : null
  const currentTeamMember = currentShift
    ? teamMembers.find((tm) => tm.id === currentShift.team_member_id)
    : null

  // Get available shifts for swapping (same week, different person, not the current user's shifts)
  const availableShifts = useMemo(() => {
    if (!currentShift) return []

    return allShifts.filter((shift) => {
      // Exclude the current shift
      if (shift.id === currentShift.id) return false
      
      // Only show shifts from other team members
      if (shift.team_member_id === currentShift.team_member_id) return false
      
      // Only show scheduled or approved shifts
      if (shift.status !== "scheduled" && shift.status !== "approved") return false

      return true
    })
  }, [currentShift, allShifts])

  // Group shifts by team member for better organization
  const shiftsByMember = useMemo(() => {
    const grouped = new Map<string, Shift[]>()
    availableShifts.forEach((shift) => {
      const existing = grouped.get(shift.team_member_id) || []
      grouped.set(shift.team_member_id, [...existing, shift])
    })
    return grouped
  }, [availableShifts])

  // Get selected target shift details
  const targetShift = availableShifts.find((s) => s.id === targetShiftId)
  const targetShiftType = targetShift
    ? shiftTypes.find((st) => st.id === targetShift.shift_type_id)
    : null
  const targetTeamMember = targetShift
    ? teamMembers.find((tm) => tm.id === targetShift.team_member_id)
    : null

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase()
  }

  const handleSubmit = async () => {
    if (!currentShift || !targetShift || !reason.trim()) return

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/practices/${practiceId}/dienstplan/swap-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requester_id: currentShift.team_member_id,
          target_id: targetShift.team_member_id,
          requester_shift_id: currentShift.id,
          target_shift_id: targetShift.id,
          reason: reason.trim(),
        }),
        cache: "no-store",
      })

      if (res.ok) {
        onSuccess()
        onOpenChange(false)
      } else {
        throw new Error("Failed to create swap request")
      }
    } catch (error) {
      console.error("[v0] Error creating swap request:", error)
      setIsSubmitting(false)
    }
  }

  if (!currentShift) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5" />
            Schicht tauschen
          </DialogTitle>
          <DialogDescription>
            Erstellen Sie eine Tausch-Anfrage mit einem anderen Teammitglied. Nach Genehmigung werden die Schichten automatisch getauscht.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Shift */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Ihre Schicht</Label>
            <Card className="border-2 border-primary">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={currentTeamMember?.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback>
                        {getInitials(
                          currentTeamMember?.first_name || "",
                          currentTeamMember?.last_name || "",
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {currentTeamMember?.first_name} {currentTeamMember?.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">{getRoleLabel(currentTeamMember?.role)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 justify-end mb-1">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: currentShiftType?.color || "#e5e7eb" }}
                      />
                      <span className="font-medium">{currentShiftType?.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(currentShift.shift_date || currentShift.date || ""), "EEE, d. MMM yyyy", {
                        locale: de,
                      })}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {currentShift.start_time?.slice(0, 5)} - {currentShift.end_time?.slice(0, 5)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Swap Arrow */}
          <div className="flex justify-center">
            <ArrowLeftRight className="h-6 w-6 text-muted-foreground" />
          </div>

          {/* Target Shift Selection */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Tauschen mit</Label>
            <Select value={targetShiftId} onValueChange={setTargetShiftId}>
              <SelectTrigger>
                <SelectValue placeholder="Schicht auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {availableShifts.length === 0 ? (
                  <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                    Keine verfügbaren Schichten zum Tauschen
                  </div>
                ) : (
                  Array.from(shiftsByMember.entries()).map(([memberId, shifts]) => {
                    const member = teamMembers.find((tm) => tm.id === memberId)
                    if (!member) return null

                    return (
                      <div key={memberId}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted">
                          {member.first_name} {member.last_name}
                        </div>
                        {shifts.map((shift) => {
                          const st = shiftTypes.find((type) => type.id === shift.shift_type_id)
                          return (
                            <SelectItem key={shift.id} value={shift.id}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: st?.color || "#e5e7eb" }}
                                />
                                <span>
                                  {format(new Date(shift.shift_date || shift.date || ""), "EEE, d. MMM", {
                                    locale: de,
                                  })}
                                </span>
                                <span className="text-muted-foreground">•</span>
                                <span className="text-muted-foreground">
                                  {shift.start_time?.slice(0, 5)} - {shift.end_time?.slice(0, 5)}
                                </span>
                                <span className="text-muted-foreground">•</span>
                                <span>{st?.short_name}</span>
                              </div>
                            </SelectItem>
                          )
                        })}
                      </div>
                    )
                  })
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Show selected target shift */}
          {targetShift && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={targetTeamMember?.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback>
                        {getInitials(targetTeamMember?.first_name || "", targetTeamMember?.last_name || "")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {targetTeamMember?.first_name} {targetTeamMember?.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">{getRoleLabel(targetTeamMember?.role)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 justify-end mb-1">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: targetShiftType?.color || "#e5e7eb" }}
                      />
                      <span className="font-medium">{targetShiftType?.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(targetShift.shift_date || targetShift.date || ""), "EEE, d. MMM yyyy", {
                        locale: de,
                      })}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {targetShift.start_time?.slice(0, 5)} - {targetShift.end_time?.slice(0, 5)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reason */}
          <div>
            <Label htmlFor="reason" className="text-sm font-medium mb-2 block">
              Begründung <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Bitte geben Sie einen Grund für den Tausch an (z.B. privater Termin, Urlaub, etc.)"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">{reason.length}/500 Zeichen</p>
          </div>

          {/* Info Alert */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Die Tausch-Anfrage muss von einem Vorgesetzten genehmigt werden. Beide Schichten werden erst nach Genehmigung getauscht.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Abbrechen
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !targetShiftId || !reason.trim()}>
            {isSubmitting ? "Wird gesendet..." : "Anfrage senden"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
