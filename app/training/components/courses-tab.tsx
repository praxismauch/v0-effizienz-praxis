"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, BookOpen, Clock, Users, LinkIcon, MapPin, Euro, Edit, Trash2 } from "lucide-react"
import { toast } from "sonner"
import type { TrainingCourse } from "../types"
import { COURSE_CATEGORIES } from "../types"

interface CoursesTabProps {
  courses: TrainingCourse[]
  practiceId: string
  onCoursesChange: React.Dispatch<React.SetStateAction<TrainingCourse[]>>
  onDelete: (id: string, name: string) => void
}

const EMPTY_FORM: Partial<TrainingCourse> = {
  name: "",
  description: "",
  category: "fachlich",
  provider: "",
  duration_hours: 0,
  cost: 0,
  currency: "EUR",
  is_online: false,
  is_mandatory: false,
  location: "",
  url: "",
  max_participants: 0,
}

export function CoursesTab({ courses, practiceId, onCoursesChange, onDelete }: CoursesTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<TrainingCourse | null>(null)
  const [formData, setFormData] = useState<Partial<TrainingCourse>>(EMPTY_FORM)
  const [isSaving, setIsSaving] = useState(false)

  const openCreate = () => {
    setEditingCourse(null)
    setFormData(EMPTY_FORM)
    setIsDialogOpen(true)
  }

  const openEdit = (course: TrainingCourse) => {
    setEditingCourse(course)
    setFormData({
      name: course.name || "",
      description: course.description || "",
      category: course.category || "fachlich",
      provider: course.provider || "",
      duration_hours: course.duration_hours || 0,
      cost: course.cost || 0,
      currency: course.currency || "EUR",
      is_online: course.is_online || false,
      is_mandatory: course.is_mandatory || false,
      location: course.location || "",
      url: course.url || "",
      max_participants: course.max_participants || 0,
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name?.trim()) {
      toast.error("Bitte geben Sie einen Kursnamen ein")
      return
    }

    setIsSaving(true)
    try {
      const isEdit = !!editingCourse
      const url = isEdit
        ? `/api/practices/${practiceId}/training/courses/${editingCourse!.id}`
        : `/api/practices/${practiceId}/training/courses`
      const method = isEdit ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        throw new Error("Fehler beim Speichern")
      }

      const data = await res.json()
      const savedCourse = data.course || data

      if (isEdit) {
        onCoursesChange(prev => prev.map(c => c.id === editingCourse!.id ? { ...c, ...savedCourse } : c))
        toast.success("Kurs aktualisiert")
      } else {
        onCoursesChange(prev => [...prev, savedCourse])
        toast.success("Kurs erstellt")
      }

      setIsDialogOpen(false)
      setEditingCourse(null)
      setFormData(EMPTY_FORM)
    } catch (error) {
      console.error("Error saving course:", error)
      toast.error("Fehler beim Speichern des Kurses")
    } finally {
      setIsSaving(false)
    }
  }

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Neuer Kurs
        </Button>
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Keine Kurse gefunden</p>
            <p className="text-sm text-muted-foreground mb-4">Erstellen Sie Ihren ersten Fortbildungskurs</p>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Kurs erstellen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <Card key={course.id} className="group relative hover:shadow-md transition-shadow">
              {/* Hover action buttons */}
              <div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="outline" size="icon" className="h-8 w-8 bg-background shadow-sm" onClick={() => openEdit(course)}>
                  <Edit className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 bg-background shadow-sm text-destructive hover:text-destructive"
                  onClick={() => onDelete(course.id, course.name)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-16">
                    <CardTitle className="text-lg">{course.name}</CardTitle>
                    <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                  </div>
                  <Badge variant={course.is_mandatory ? "destructive" : "secondary"}>
                    {course.is_mandatory ? "Pflicht" : "Optional"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{course.duration_hours || 0} Stunden</span>
                  </div>
                  {course.provider && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{course.provider}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    {course.is_online ? (
                      <>
                        <LinkIcon className="h-4 w-4" />
                        <span>Online</span>
                      </>
                    ) : (
                      <>
                        <MapPin className="h-4 w-4" />
                        <span>{course.location || "Vor Ort"}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Euro className="h-4 w-4" />
                    <span>
                      {(course.cost || 0).toLocaleString("de-DE")} {course.currency || "EUR"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Course Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCourse ? "Kurs bearbeiten" : "Neuen Kurs erstellen"}</DialogTitle>
            <DialogDescription>
              {editingCourse
                ? "Passen Sie die Kursdetails an."
                : "Erstellen Sie einen neuen Fortbildungskurs."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={formData.name || ""}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Kursname"
              />
            </div>

            <div>
              <Label>Beschreibung</Label>
              <Textarea
                value={formData.description || ""}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Kursbeschreibung"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Kategorie</Label>
                <Select
                  value={formData.category || "fachlich"}
                  onValueChange={(v) => updateField("category", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COURSE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Anbieter</Label>
                <Input
                  value={formData.provider || ""}
                  onChange={(e) => updateField("provider", e.target.value)}
                  placeholder="z.B. Akademie XY"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Dauer (Stunden)</Label>
                <Input
                  type="number"
                  value={formData.duration_hours || 0}
                  onChange={(e) => updateField("duration_hours", parseFloat(e.target.value) || 0)}
                  min={0}
                />
              </div>
              <div>
                <Label>Max. Teilnehmer</Label>
                <Input
                  type="number"
                  value={formData.max_participants || 0}
                  onChange={(e) => updateField("max_participants", parseInt(e.target.value) || 0)}
                  min={0}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Kosten</Label>
                <Input
                  type="number"
                  value={formData.cost || 0}
                  onChange={(e) => updateField("cost", parseFloat(e.target.value) || 0)}
                  min={0}
                />
              </div>
              <div>
                <Label>Standort</Label>
                <Input
                  value={formData.location || ""}
                  onChange={(e) => updateField("location", e.target.value)}
                  placeholder="z.B. Berlin"
                  disabled={formData.is_online}
                />
              </div>
            </div>

            <div>
              <Label>URL</Label>
              <Input
                value={formData.url || ""}
                onChange={(e) => updateField("url", e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Online-Kurs</Label>
              <Switch
                checked={formData.is_online || false}
                onCheckedChange={(v) => updateField("is_online", v)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Pflichtkurs</Label>
              <Switch
                checked={formData.is_mandatory || false}
                onCheckedChange={(v) => updateField("is_mandatory", v)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Speichern..." : editingCourse ? "Aktualisieren" : "Erstellen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
