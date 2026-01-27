"use client"

import { useState } from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
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
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type { Availability } from "../types"
import { DAYS_OF_WEEK } from "../types"

interface AvailabilityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  availability?: Availability | null
  memberId: string
  practiceId: string
  onSave: (data: Partial<Availability>) => Promise<void>
}

export default function AvailabilityDialog({
  open,
  onOpenChange,
  availability,
  memberId,
  practiceId,
  onSave,
}: AvailabilityDialogProps) {
  const isEditing = !!availability

  const [formData, setFormData] = useState({
    availability_type: availability?.availability_type || "available",
    is_recurring: availability?.is_recurring ?? false,
    day_of_week: availability?.day_of_week ?? 0,
    specific_date: availability?.specific_date ? new Date(availability.specific_date) : undefined,
    start_time: availability?.start_time || "08:00",
    end_time: availability?.end_time || "17:00",
    notes: availability?.notes || "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      await onSave({
        team_member_id: memberId,
        practice_id: parseInt(practiceId),
        availability_type: formData.availability_type as Availability["availability_type"],
        is_recurring: formData.is_recurring,
        day_of_week: formData.is_recurring ? formData.day_of_week : undefined,
        specific_date: !formData.is_recurring && formData.specific_date
          ? format(formData.specific_date, "yyyy-MM-dd")
          : undefined,
        start_time: formData.start_time,
        end_time: formData.end_time,
        notes: formData.notes || undefined,
      })
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving availability:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Verfügbarkeit bearbeiten" : "Verfügbarkeit hinzufügen"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="type">Typ</Label>
            <Select
              value={formData.availability_type}
              onValueChange={(value) => setFormData({ ...formData, availability_type: value })}
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Typ auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Verfügbar</SelectItem>
                <SelectItem value="unavailable">Nicht verfügbar</SelectItem>
                <SelectItem value="preferred">Bevorzugt</SelectItem>
                <SelectItem value="vacation">Urlaub</SelectItem>
                <SelectItem value="sick">Krank</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="recurring">Wiederkehrend</Label>
            <Switch
              id="recurring"
              checked={formData.is_recurring}
              onCheckedChange={(checked) => setFormData({ ...formData, is_recurring: checked })}
            />
          </div>

          {formData.is_recurring ? (
            <div className="grid gap-2">
              <Label htmlFor="day">Wochentag</Label>
              <Select
                value={formData.day_of_week.toString()}
                onValueChange={(value) => setFormData({ ...formData, day_of_week: parseInt(value) })}
              >
                <SelectTrigger id="day">
                  <SelectValue placeholder="Tag auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="grid gap-2">
              <Label>Datum</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !formData.specific_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.specific_date ? (
                      format(formData.specific_date, "PPP")
                    ) : (
                      <span>Datum auswählen</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.specific_date}
                    onSelect={(date) => setFormData({ ...formData, specific_date: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="start_time">Von</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end_time">Bis</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notizen</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Optionale Notizen..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Speichern..." : "Speichern"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
