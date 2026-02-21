"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Calendar, LinkIcon, MapPin, Edit, Trash2 } from "lucide-react"
import { useUser } from "@/contexts/user-context"
import { toast } from "sonner"
import type { TrainingEvent, TrainingCourse } from "../types"
import { INITIAL_EVENT_FORM } from "../types"

interface EventsTabProps {
  events: TrainingEvent[]
  courses: TrainingCourse[]
  practiceId: string
  onEventsChange: React.Dispatch<React.SetStateAction<TrainingEvent[]>>
  onDelete: (id: string, name: string) => void
  createTrigger?: number
}

export function EventsTab({ events, courses, practiceId, onEventsChange, onDelete, createTrigger }: EventsTabProps) {
  const { currentUser } = useUser()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<TrainingEvent | null>(null)
  const [formData, setFormData] = useState(INITIAL_EVENT_FORM)
  const [isSaving, setIsSaving] = useState(false)
  const prevTriggerRef = useRef(createTrigger)

  useEffect(() => {
    if (createTrigger && createTrigger > 0 && createTrigger !== prevTriggerRef.current) {
      openCreate()
    }
    prevTriggerRef.current = createTrigger
  }, [createTrigger])

  const openCreate = () => {
    setEditingEvent(null)
    setFormData(INITIAL_EVENT_FORM)
    setIsDialogOpen(true)
  }

  const openEdit = (event: TrainingEvent) => {
    setEditingEvent(event)
    setFormData({
      title: event.title || "",
      description: event.description || "",
      training_course_id: event.training_course_id || "",
      start_date: event.start_date || "",
      end_date: event.end_date || "",
      start_time: event.start_time || "09:00",
      end_time: event.end_time || "17:00",
      location: event.location || "",
      meeting_link: event.meeting_link || "",
      is_online: event.is_online || false,
      max_participants: event.max_participants || 20,
      cost_per_person: event.cost_per_person || 0,
      currency: event.currency || "EUR",
      status: event.status || "geplant",
      notes: event.notes || "",
      team_id: event.team_id || "",
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error("Bitte geben Sie einen Titel ein.")
      return
    }

    setIsSaving(true)
    try {
      // Strip fields that don't exist in the DB and clean empty strings for UUID fields
      const { currency, training_course_id, team_id, ...apiData } = formData as any
      if (team_id && team_id.trim()) apiData.team_id = team_id
      if (editingEvent) {
        const res = await fetch(`/api/practices/${practiceId}/training/events/${editingEvent.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiData),
        })
        if (!res.ok) throw new Error("Update failed")
        const data = await res.json()
        onEventsChange((prev) => prev.map((e) => (e.id === editingEvent.id ? { ...e, ...data.event } : e)))
        toast.success("Event aktualisiert")
      } else {
        const res = await fetch(`/api/practices/${practiceId}/training/events`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...apiData, created_by: currentUser?.id }),
        })
        if (!res.ok) throw new Error("Create failed")
        const data = await res.json()
        onEventsChange((prev) => [...prev, data.event])
        toast.success("Event erstellt")
      }
      setIsDialogOpen(false)
    } catch {
      toast.error(editingEvent ? "Fehler beim Aktualisieren" : "Fehler beim Erstellen")
    } finally {
      setIsSaving(false)
    }
  }

  const updateField = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-4">
      {events.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Keine Events gefunden</p>
            <p className="text-sm text-muted-foreground mb-4">Planen Sie Ihre erste Schulungsveranstaltung</p>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Event erstellen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <Card key={event.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${event.is_online ? "bg-blue-100 dark:bg-blue-900/30" : "bg-green-100 dark:bg-green-900/30"}`}>
                    {event.is_online ? (
                      <LinkIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <MapPin className="h-6 w-6 text-green-600 dark:text-green-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{event.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {event.start_date && new Date(event.start_date).toLocaleDateString("de-DE")}
                      {event.start_time && ` um ${event.start_time}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {event.location || event.meeting_link || "Kein Ort angegeben"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge
                    variant={
                      event.status === "abgeschlossen"
                        ? "default"
                        : event.status === "abgesagt"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {event.status || "Geplant"}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(event)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive bg-transparent"
                      onClick={() => onDelete(event.id, event.title)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEvent ? "Event bearbeiten" : "Neues Event"}</DialogTitle>
            <DialogDescription>
              {editingEvent ? "Passen Sie die Veranstaltungsdetails an." : "Erstellen Sie eine neue Schulungsveranstaltung."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Titel *</Label>
              <Input value={formData.title} onChange={(e) => updateField("title", e.target.value)} placeholder="Name der Veranstaltung" />
            </div>
            <div className="space-y-2">
              <Label>Beschreibung</Label>
              <Textarea value={formData.description} onChange={(e) => updateField("description", e.target.value)} rows={3} />
            </div>
            {courses.length > 0 && (
              <div className="space-y-2">
                <Label>Zugehöriger Kurs</Label>
                <Select value={formData.training_course_id || "none"} onValueChange={(v) => updateField("training_course_id", v === "none" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Kein Kurs</SelectItem>
                    {courses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Startdatum</Label>
                <Input type="date" value={formData.start_date} onChange={(e) => updateField("start_date", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Enddatum</Label>
                <Input type="date" value={formData.end_date} onChange={(e) => updateField("end_date", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Startzeit</Label>
                <Input type="time" value={formData.start_time} onChange={(e) => updateField("start_time", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Endzeit</Label>
                <Input type="time" value={formData.end_time} onChange={(e) => updateField("end_time", e.target.value)} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Online-Veranstaltung</Label>
              <Switch checked={formData.is_online} onCheckedChange={(v) => updateField("is_online", v)} />
            </div>
            {formData.is_online ? (
              <div className="space-y-2">
                <Label>Meeting-Link</Label>
                <Input value={formData.meeting_link} onChange={(e) => updateField("meeting_link", e.target.value)} placeholder="https://..." />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Ort</Label>
                <Input value={formData.location} onChange={(e) => updateField("location", e.target.value)} placeholder="Adresse / Raum" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Max. Teilnehmer</Label>
                <Input type="number" min="1" value={formData.max_participants} onChange={(e) => updateField("max_participants", parseInt(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <Label>Kosten/Person (EUR)</Label>
                <Input type="number" min="0" step="10" value={formData.cost_per_person} onChange={(e) => updateField("cost_per_person", parseFloat(e.target.value) || 0)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => updateField("status", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="geplant">Geplant</SelectItem>
                  <SelectItem value="offen">Offen</SelectItem>
                  <SelectItem value="abgeschlossen">Abgeschlossen</SelectItem>
                  <SelectItem value="abgesagt">Abgesagt</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notizen</Label>
              <Textarea value={formData.notes} onChange={(e) => updateField("notes", e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Speichern..." : editingEvent ? "Speichern" : "Erstellen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
