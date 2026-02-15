"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Plus, Edit, Trash2, Calendar, Eye, EyeOff, GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import { ColorPicker } from "@/components/color-picker"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

// Event types from calendar/types.ts - this is the source of truth
const DEFAULT_EVENT_TYPES = [
  {
    id: "meeting",
    name: "Meeting",
    label: "Meeting",
    color: "#3b82f6",
    bgColor: "bg-blue-500",
    labelBgColor: "bg-blue-100",
    labelTextColor: "text-blue-700",
    description: "Teammeetings und Besprechungen",
    isSystem: true,
    isActive: true,
  },
  {
    id: "interview",
    name: "Vorstellungsgespräch",
    label: "Vorstellungsgespräch",
    color: "#10b981",
    bgColor: "bg-emerald-500",
    labelBgColor: "bg-emerald-100",
    labelTextColor: "text-emerald-700",
    description: "Bewerbungsgespräche mit Kandidaten",
    isSystem: true,
    isActive: true,
  },
  {
    id: "task",
    name: "Aufgabe",
    label: "Aufgabe",
    color: "#f97316",
    bgColor: "bg-orange-500",
    labelBgColor: "bg-orange-100",
    labelTextColor: "text-orange-700",
    description: "Einzelne Aufgaben und To-Dos",
    isSystem: true,
    isActive: true,
  },
  {
    id: "event",
    name: "Event",
    label: "Event",
    color: "#8b5cf6",
    bgColor: "bg-purple-500",
    labelBgColor: "bg-purple-100",
    labelTextColor: "text-purple-700",
    description: "Allgemeine Veranstaltungen",
    isSystem: true,
    isActive: true,
  },
  {
    id: "training",
    name: "Fortbildung",
    label: "Fortbildung",
    color: "#eab308",
    bgColor: "bg-yellow-500",
    labelBgColor: "bg-yellow-100",
    labelTextColor: "text-yellow-700",
    description: "Schulungen und Weiterbildungen",
    isSystem: true,
    isActive: true,
  },
  {
    id: "maintenance",
    name: "Wartung",
    label: "Wartung",
    color: "#ef4444",
    bgColor: "bg-red-500",
    labelBgColor: "bg-red-100",
    labelTextColor: "text-red-700",
    description: "Gerätewartungen und technische Arbeiten",
    isSystem: true,
    isActive: true,
  },
  {
    id: "holiday",
    name: "Feiertag",
    label: "Feiertag",
    color: "#6366f1",
    bgColor: "bg-indigo-500",
    labelBgColor: "bg-indigo-100",
    labelTextColor: "text-indigo-700",
    description: "Feiertage und Betriebsferien",
    isSystem: true,
    isActive: true,
  },
  {
    id: "announcement",
    name: "Ankündigung",
    label: "Ankündigung",
    color: "#ec4899",
    bgColor: "bg-pink-500",
    labelBgColor: "bg-pink-100",
    labelTextColor: "text-pink-700",
    description: "Wichtige Mitteilungen und Ankündigungen",
    isSystem: true,
    isActive: true,
  },
  {
    id: "other",
    name: "Sonstiges",
    label: "Sonstiges",
    color: "#6b7280",
    bgColor: "bg-gray-500",
    labelBgColor: "bg-gray-100",
    labelTextColor: "text-gray-700",
    description: "Andere Terminarten",
    isSystem: true,
    isActive: true,
  },
]

const COLOR_OPTIONS = [
  { value: "#3b82f6", label: "Blau", className: "bg-blue-500" },
  { value: "#10b981", label: "Grün", className: "bg-emerald-500" },
  { value: "#f97316", label: "Orange", className: "bg-orange-500" },
  { value: "#8b5cf6", label: "Lila", className: "bg-violet-500" },
  { value: "#ec4899", label: "Pink", className: "bg-pink-500" },
  { value: "#ef4444", label: "Rot", className: "bg-red-500" },
  { value: "#eab308", label: "Gelb", className: "bg-yellow-500" },
  { value: "#6366f1", label: "Indigo", className: "bg-indigo-500" },
  { value: "#06b6d4", label: "Cyan", className: "bg-cyan-500" },
  { value: "#6b7280", label: "Grau", className: "bg-gray-500" },
]

interface EventType {
  id: string
  name: string
  label: string
  color: string
  bgColor: string
  labelBgColor: string
  labelTextColor: string
  description: string
  isSystem: boolean
  isActive: boolean
}

function SortableEventRow({
  eventType,
  onToggle,
  onEdit,
  onDelete,
}: {
  eventType: EventType
  onToggle: (id: string) => void
  onEdit: (et: EventType) => void
  onDelete: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: eventType.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <TableRow ref={setNodeRef} style={style} className={cn(!eventType.isActive && "opacity-50")}>
      <TableCell>
        <button
          className="cursor-grab active:cursor-grabbing touch-none p-1 text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
          <span className="sr-only">Reihenfolge aendern</span>
        </button>
      </TableCell>
      <TableCell>
        <div className="w-6 h-6 rounded" style={{ backgroundColor: eventType.color }} />
      </TableCell>
      <TableCell className="font-medium">{eventType.name}</TableCell>
      <TableCell>
        <Badge
          style={{
            backgroundColor: eventType.color + "20",
            color: eventType.color,
          }}
        >
          {eventType.label}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">{eventType.description}</TableCell>
      <TableCell>
        <Badge variant={eventType.isActive ? "default" : "secondary"}>
          {eventType.isActive ? "Aktiv" : "Inaktiv"}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant="outline">
          {eventType.isSystem ? "System" : "Benutzerdefiniert"}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => onToggle(eventType.id)} title={eventType.isActive ? "Deaktivieren" : "Aktivieren"}>
            {eventType.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onEdit(eventType)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(eventType.id)} disabled={eventType.isSystem} className={cn(eventType.isSystem && "opacity-30 cursor-not-allowed")}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

export default function EventTypesManager() {
  const [eventTypes, setEventTypes] = useState<EventType[]>(DEFAULT_EVENT_TYPES)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingType, setEditingType] = useState<EventType | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    label: "",
    color: "#3b82f6",
    description: "",
  })
  const { toast } = useToast()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      setEventTypes((prev) => {
        const oldIndex = prev.findIndex((t) => t.id === active.id)
        const newIndex = prev.findIndex((t) => t.id === over.id)
        if (oldIndex === -1 || newIndex === -1) return prev
        return arrayMove(prev, oldIndex, newIndex)
      })
    },
    [],
  )

  const resetForm = () => {
    setFormData({
      name: "",
      label: "",
      color: "#3b82f6",
      description: "",
    })
    setEditingType(null)
  }

  const openEditDialog = (eventType: EventType) => {
    setEditingType(eventType)
    setFormData({
      name: eventType.name,
      label: eventType.label,
      color: eventType.color,
      description: eventType.description,
    })
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    if (!formData.name.trim() || !formData.label.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie Name und Label aus",
        variant: "destructive",
      })
      return
    }

    const colorOption = COLOR_OPTIONS.find((c) => c.value === formData.color)
    const colorClass = colorOption?.className || "bg-blue-500"
    const labelBgColor = colorClass.replace("bg-", "bg-").replace("-500", "-100")
    const labelTextColor = colorClass.replace("bg-", "text-").replace("-500", "-700")

    if (editingType) {
      // Update existing
      setEventTypes((prev) =>
        prev.map((t) =>
          t.id === editingType.id
            ? {
                ...t,
                name: formData.name,
                label: formData.label,
                color: formData.color,
                bgColor: colorClass,
                labelBgColor,
                labelTextColor,
                description: formData.description,
              }
            : t
        )
      )
      toast({
        title: "Erfolg",
        description: "Event-Typ wurde aktualisiert",
      })
    } else {
      // Create new
      const newId = formData.name.toLowerCase().replace(/\s+/g, "-")
      const newType: EventType = {
        id: newId,
        name: formData.name,
        label: formData.label,
        color: formData.color,
        bgColor: colorClass,
        labelBgColor,
        labelTextColor,
        description: formData.description,
        isSystem: false,
        isActive: true,
      }
      setEventTypes((prev) => [...prev, newType])
      toast({
        title: "Erfolg",
        description: "Neuer Event-Typ wurde erstellt",
      })
    }

    setIsDialogOpen(false)
    resetForm()
  }

  const handleToggleActive = (id: string) => {
    setEventTypes((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isActive: !t.isActive } : t))
    )
  }

  const handleDelete = (id: string) => {
    const eventType = eventTypes.find((t) => t.id === id)
    if (eventType?.isSystem) {
      toast({
        title: "Hinweis",
        description: "System-Event-Typen können nicht gelöscht werden. Sie können sie aber deaktivieren.",
        variant: "destructive",
      })
      return
    }

    if (!confirm("Möchten Sie diesen Event-Typ wirklich löschen?")) return

    setEventTypes((prev) => prev.filter((t) => t.id !== id))
    toast({
      title: "Erfolg",
      description: "Event-Typ wurde gelöscht",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Event-Typen Verwaltung</h2>
          <p className="text-muted-foreground">
            Verwalten Sie die verfügbaren Event-Typen für den Kalender
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Neuer Event-Typ
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingType ? "Event-Typ bearbeiten" : "Neuer Event-Typ"}
              </DialogTitle>
              <DialogDescription>
                {editingType
                  ? "Bearbeiten Sie die Eigenschaften des Event-Typs"
                  : "Erstellen Sie einen neuen Event-Typ für den Kalender"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="z.B. Patiententermin"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="label">Anzeige-Label *</Label>
                <Input
                  id="label"
                  value={formData.label}
                  onChange={(e) => setFormData((prev) => ({ ...prev, label: e.target.value }))}
                  placeholder="z.B. Termin"
                />
              </div>

              <ColorPicker
                value={formData.color}
                onChange={(color) => setFormData((prev) => ({ ...prev, color }))}
                label="Farbe"
              />

              <div className="space-y-2">
                <Label htmlFor="description">Beschreibung</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Kurze Beschreibung des Event-Typs"
                />
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <Label>Vorschau</Label>
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: formData.color }}
                  />
                  <span className="font-medium">{formData.label || "Label"}</span>
                  <Badge
                    className={cn(
                      "ml-auto",
                      COLOR_OPTIONS.find((c) => c.value === formData.color)?.className
                        .replace("-500", "-100") || "bg-blue-100",
                      COLOR_OPTIONS.find((c) => c.value === formData.color)?.className
                        .replace("bg-", "text-")
                        .replace("-500", "-700") || "text-blue-700"
                    )}
                    style={{
                      backgroundColor: formData.color + "20",
                      color: formData.color,
                    }}
                  >
                    {formData.label || "Label"}
                  </Badge>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleSave}>
                {editingType ? "Speichern" : "Erstellen"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Verfügbare Event-Typen
          </CardTitle>
          <CardDescription>
            Diese Event-Typen stehen beim Erstellen von Kalendereinträgen zur Verfügung
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead className="w-12">Farbe</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Beschreibung</TableHead>
                  <TableHead className="w-24">Status</TableHead>
                  <TableHead className="w-24">Typ</TableHead>
                  <TableHead className="w-32 text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <SortableContext items={eventTypes.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                  {eventTypes.map((eventType) => (
                    <SortableEventRow
                      key={eventType.id}
                      eventType={eventType}
                      onToggle={handleToggleActive}
                      onEdit={openEditDialog}
                      onDelete={handleDelete}
                    />
                  ))}
                </SortableContext>
              </TableBody>
            </Table>
          </DndContext>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Calendar className="h-8 w-8 text-blue-500 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900">Hinweis zu Event-Typen</h3>
              <p className="text-sm text-blue-700 mt-1">
                System-Event-Typen (wie Meeting, Aufgabe, etc.) können nicht gelöscht, aber deaktiviert werden.
                Deaktivierte Event-Typen werden beim Erstellen neuer Kalendereinträge nicht mehr angezeigt.
                Benutzerdefinierte Event-Typen können vollständig bearbeitet und gelöscht werden.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
