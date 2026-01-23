"use client"

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
import type { FormData } from "../types"

interface EventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  formData: FormData
  onFormDataChange: (data: FormData) => void
  onSubmit: () => void
  onDelete?: () => void
  isEdit?: boolean
}

export function EventDialog({
  open,
  onOpenChange,
  title,
  description,
  formData,
  onFormDataChange,
  onSubmit,
  onDelete,
  isEdit = false,
}: EventDialogProps) {
  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    onFormDataChange({ ...formData, [field]: value })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
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
          {isEdit && onDelete && (
            <Button variant="destructive" onClick={onDelete}>
              Löschen
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={onSubmit} disabled={!formData.title.trim()}>
            {isEdit ? "Speichern" : "Erstellen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
