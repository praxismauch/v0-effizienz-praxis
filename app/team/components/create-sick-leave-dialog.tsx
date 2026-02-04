"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2 } from "lucide-react"
import type { SickLeave, TeamMember } from "../types"

interface CreateSickLeaveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  teamMembers: TeamMember[]
  onSickLeaveCreated: (sickLeave: SickLeave) => void
}

export default function CreateSickLeaveDialog({
  open,
  onOpenChange,
  teamMembers,
  onSickLeaveCreated,
}: CreateSickLeaveDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [teamMemberId, setTeamMemberId] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [reason, setReason] = useState("")
  const [notes, setNotes] = useState("")

  const resetForm = () => {
    setTeamMemberId("")
    setStartDate("")
    setEndDate("")
    setReason("")
    setNotes("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!teamMemberId || !startDate) return

    setIsSubmitting(true)

    // Create new sick leave object
    const newSickLeave: SickLeave = {
      id: crypto.randomUUID(),
      team_member_id: teamMemberId,
      start_date: startDate,
      end_date: endDate || undefined,
      reason: reason.trim() || undefined,
      notes: notes.trim() || undefined,
    }

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))

    onSickLeaveCreated(newSickLeave)
    resetForm()
    setIsSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Krankmeldung erfassen</DialogTitle>
          <DialogDescription>
            Erfassen Sie eine neue Krankmeldung für einen Mitarbeiter.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="member">Mitarbeiter *</Label>
              <Select value={teamMemberId} onValueChange={setTeamMemberId}>
                <SelectTrigger>
                  <SelectValue placeholder="Mitarbeiter wählen" />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-[300px]">
                  {teamMembers.map((member) => {
                    const memberId = member.user_id || member.id || member.team_member_id
                    if (!memberId) return null
                    return (
                      <SelectItem key={memberId} value={memberId}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={member.avatar_url || "/placeholder.svg"} />
                            <AvatarFallback className="text-xs">
                              {member.first_name?.[0]}
                              {member.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          {member.first_name} {member.last_name}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">Beginn *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">Ende (optional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reason">Grund (optional)</Label>
              <Input
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="z.B. Erkältung, Grippe"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notizen</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Weitere Informationen..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={isSubmitting || !teamMemberId || !startDate}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Krankmeldung erfassen
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
