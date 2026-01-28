"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import type { CalendarEvent, FormData } from "../types"

const defaultFormData: FormData = {
  title: "",
  description: "",
  startDate: format(new Date(), "yyyy-MM-dd"),
  endDate: format(new Date(), "yyyy-MM-dd"),
  startTime: "09:00",
  endTime: "10:00",
  type: "meeting",
  priority: "medium",
  location: "",
  isAllDay: false,
  recurrence: "none",
  interviewType: "",
  interviewStatus: "scheduled",
  candidateEmail: "",
  meetingLink: "",
  trainingCourseId: "",
  trainingStatus: "",
  isOnline: false,
}

interface EventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  practiceId?: string
  event?: CalendarEvent | null
  initialDate?: Date | null
  onSaved?: () => void
}

export function EventDialog({
  open,
  onOpenChange,
  practiceId,
  event,
  initialDate,
  onSaved,
}: EventDialogProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState<FormData>(defaultFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEdit = !!event

  // Initialize form data when dialog opens
  useEffect(() => {
    if (open) {
      if (event) {
        // Editing existing event
        setFormData({
          title: event.title || "",
          description: event.description || "",
          startDate: event.startDate || format(new Date(), "yyyy-MM-dd"),
          endDate: event.endDate || event.startDate || format(new Date(), "yyyy-MM-dd"),
          startTime: event.startTime || "09:00",
          endTime: event.endTime || "10:00",
          type: event.type || "meeting",
          priority: event.priority || "medium",
          location: event.location || "",
          isAllDay: event.isAllDay || false,
          recurrence: event.recurrence || "none",
          interviewType: event.interviewType || "",
          interviewStatus: event.interviewStatus || "scheduled",
          candidateEmail: event.candidateEmail || "",
          meetingLink: event.meetingLink || "",
          trainingCourseId: event.trainingCourseId || "",
          trainingStatus: event.trainingStatus || "",
          isOnline: event.isOnline || false,
        })
      } else if (initialDate) {
        // Creating new event with initial date
        setFormData({
          ...defaultFormData,
          startDate: format(initialDate, "yyyy-MM-dd"),
          endDate: format(initialDate, "yyyy-MM-dd"),
        })
      } else {
        // Creating new event without initial date
        setFormData(defaultFormData)
      }
    }
  }, [open, event, initialDate])

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    if (!practiceId || !formData.title.trim()) return

    setIsSubmitting(true)
    try {
      const url = isEdit
        ? `/api/practices/${practiceId}/calendar-events/${event?.id}`
        : `/api/practices/${practiceId}/calendar-events`

      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!res.ok) throw new Error("Failed to save event")

      toast({ title: isEdit ? "Termin aktualisiert" : "Termin erstellt" })
      onOpenChange(false)
      onSaved?.()
    } catch (error) {
      toast({ title: "Fehler beim Speichern", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!practiceId || !event?.id) return

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/practices/${practiceId}/calendar-events/${event.id}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Failed to delete event")

      toast({ title: "Termin gelöscht" })
      onOpenChange(false)
      onSaved?.()
    } catch (error) {
      toast({ title: "Fehler beim Löschen", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const dialogTitle = isEdit ? "Termin bearbeiten" : "Neuer Termin"
  const dialogDescription = isEdit ? "Bearbeiten Sie die Details des Termins." : "Erstellen Sie einen neuen Termin."

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Titel *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="Titel des Termins"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Beschreibung hinzufügen..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Typ</Label>
                <Select value={formData.type} onValueChange={(v) => updateField("type", v as FormData["type"])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="interview">Vorstellungsgespräch</SelectItem>
                    <SelectItem value="task">Aufgabe</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="training">Fortbildung</SelectItem>
                    <SelectItem value="maintenance">Wartung</SelectItem>
                    <SelectItem value="holiday">Feiertag</SelectItem>
                    <SelectItem value="announcement">Ankündigung</SelectItem>
                    <SelectItem value="other">Sonstiges</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="priority">Priorität</Label>
                <Select value={formData.priority} onValueChange={(v) => updateField("priority", v as FormData["priority"])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Niedrig</SelectItem>
                    <SelectItem value="medium">Mittel</SelectItem>
                    <SelectItem value="high">Hoch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isAllDay"
                checked={formData.isAllDay}
                onCheckedChange={(checked) => updateField("isAllDay", checked as boolean)}
              />
              <Label htmlFor="isAllDay">Ganztägig</Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">Startdatum</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => updateField("startDate", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">Enddatum</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => updateField("endDate", e.target.value)}
                />
              </div>
            </div>

            {!formData.isAllDay && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startTime">Startzeit</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => updateField("startTime", e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endTime">Endzeit</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => updateField("endTime", e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="location">Ort</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => updateField("location", e.target.value)}
                placeholder="Ort hinzufügen..."
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="recurrence">Wiederholung</Label>
              <Select value={formData.recurrence} onValueChange={(v) => updateField("recurrence", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Keine</SelectItem>
                  <SelectItem value="daily">Täglich</SelectItem>
                  <SelectItem value="weekly">Wöchentlich</SelectItem>
                  <SelectItem value="monthly">Monatlich</SelectItem>
                  <SelectItem value="yearly">Jährlich</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Interview-specific fields */}
            {formData.type === "interview" && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="candidateEmail">Kandidaten-E-Mail</Label>
                  <Input
                    id="candidateEmail"
                    type="email"
                    value={formData.candidateEmail}
                    onChange={(e) => updateField("candidateEmail", e.target.value)}
                    placeholder="email@beispiel.de"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="interviewStatus">Status</Label>
                  <Select value={formData.interviewStatus} onValueChange={(v) => updateField("interviewStatus", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Geplant</SelectItem>
                      <SelectItem value="completed">Abgeschlossen</SelectItem>
                      <SelectItem value="cancelled">Abgesagt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Meeting/Interview online fields */}
            {(formData.type === "meeting" || formData.type === "interview") && (
              <>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isOnline"
                    checked={formData.isOnline}
                    onCheckedChange={(checked) => updateField("isOnline", checked as boolean)}
                  />
                  <Label htmlFor="isOnline">Online-Meeting</Label>
                </div>
                {formData.isOnline && (
                  <div className="grid gap-2">
                    <Label htmlFor="meetingLink">Meeting-Link</Label>
                    <Input
                      id="meetingLink"
                      value={formData.meetingLink}
                      onChange={(e) => updateField("meetingLink", e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>
        <DialogFooter className="gap-2">
          {isEdit && (
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              Löschen
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Abbrechen
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.title.trim() || isSubmitting}>
            {isSubmitting ? "Wird gespeichert..." : isEdit ? "Speichern" : "Erstellen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
