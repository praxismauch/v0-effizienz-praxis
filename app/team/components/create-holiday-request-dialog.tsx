"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { usePractice } from "@/contexts/practice-context"
import { toast } from "sonner"
import { TeamMemberSelectItem } from "@/components/team-member-select-item"
import type { TeamMember, HolidayRequest } from "../types"

interface CreateHolidayRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  teamMembers: TeamMember[]
  onRequestCreated: (request: HolidayRequest) => void
}

export default function CreateHolidayRequestDialog({
  open,
  onOpenChange,
  teamMembers,
  onRequestCreated,
}: CreateHolidayRequestDialogProps) {
  const { currentPractice } = usePractice()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    team_member_id: "",
    start_date: "",
    end_date: "",
    reason: "",
    notes: "",
  })

  const calculateDays = () => {
    if (!formData.start_date || !formData.end_date) return 0
    const start = new Date(formData.start_date)
    const end = new Date(formData.end_date)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return diffDays
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPractice?.id) return

    if (!formData.team_member_id || !formData.start_date || !formData.end_date) {
      toast.error("Bitte füllen Sie alle Pflichtfelder aus")
      return
    }

    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      toast.error("Das Enddatum muss nach dem Startdatum liegen")
      return
    }

    setLoading(true)
    try {
      const res = await fetch(
        `/api/practices/${currentPractice.id}/holiday-requests`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            days_count: calculateDays(),
            status: "pending",
          }),
        }
      )

      if (res.ok) {
        const data = await res.json()
        onRequestCreated(data.request || data)
        toast.success("Urlaubsantrag erfolgreich erstellt")
        setFormData({
          team_member_id: "",
          start_date: "",
          end_date: "",
          reason: "",
          notes: "",
        })
        onOpenChange(false)
      } else {
        const errorData = await res.json().catch(() => ({ error: `Serverfehler (${res.status})` }))
        toast.error(errorData.error || errorData.message || "Fehler beim Erstellen des Antrags")
      }
    } catch (error) {
      console.error("Error creating holiday request:", error)
      toast.error("Fehler beim Erstellen des Urlaubsantrags")
    } finally {
      setLoading(false)
    }
  }

  const activeMembers = Array.isArray(teamMembers) ? teamMembers.filter((m) => m.status === "active" || !m.status) : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Neuer Urlaubsantrag</DialogTitle>
          <DialogDescription>
            Erstellen Sie einen neuen Urlaubsantrag für einen Mitarbeiter
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="team_member_id">Mitarbeiter *</Label>
            <Select
              value={formData.team_member_id}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, team_member_id: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Mitarbeiter auswählen" />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-[300px]">
                {activeMembers.map((member) => {
                  const memberId = member.user_id || member.id || member.team_member_id
                  if (!memberId) return null
                  return (
                    <TeamMemberSelectItem
                      key={memberId}
                      value={memberId}
                      firstName={member.first_name}
                      lastName={member.last_name}
                      avatarUrl={member.avatar_url}
                    />
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Von *</Label>
              <Input
                id="start_date"
                type="date"
                required
                value={formData.start_date}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, start_date: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">Bis *</Label>
              <Input
                id="end_date"
                type="date"
                required
                value={formData.end_date}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, end_date: e.target.value }))
                }
              />
            </div>
          </div>

          {formData.start_date && formData.end_date && (
            <div className="text-sm text-muted-foreground bg-muted p-2 rounded-md">
              Anzahl Tage: <span className="font-medium">{calculateDays()}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">Grund (optional)</Label>
            <Input
              id="reason"
              placeholder="z.B. Familienurlaub"
              value={formData.reason}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, reason: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notizen (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Zusätzliche Informationen..."
              rows={2}
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Wird erstellt..." : "Antrag erstellen"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
