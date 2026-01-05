"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, GripVertical, Check, X, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
import { fetchWithRetry, safeJsonParse } from "@/lib/fetch-with-retry"

interface PracticeType {
  id: string
  name: string
  display_order: number
  is_active: boolean
}

function SortableRow({
  type,
  editingId,
  editingName,
  setEditingName,
  handleUpdate,
  cancelEdit,
  startEdit,
  handleDelete,
  tableExists,
}: {
  type: PracticeType
  editingId: string | null
  editingName: string
  setEditingName: (name: string) => void
  handleUpdate: (id: string) => void
  cancelEdit: () => void
  startEdit: (type: PracticeType) => void
  handleDelete: (id: string) => void
  tableExists: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: type.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell>
        <button
          className="cursor-grab active:cursor-grabbing touch-none"
          {...attributes}
          {...listeners}
          disabled={!tableExists}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      </TableCell>
      <TableCell>
        {editingId === type.id ? (
          <Input
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleUpdate(type.id)
              if (e.key === "Escape") cancelEdit()
            }}
            autoFocus
          />
        ) : (
          <span className="font-medium">{type.name}</span>
        )}
      </TableCell>
      <TableCell>
        <Badge variant={type.is_active ? "default" : "secondary"}>{type.is_active ? "Aktiv" : "Inaktiv"}</Badge>
      </TableCell>
      <TableCell className="text-right">
        {editingId === type.id ? (
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => handleUpdate(type.id)}>
              <Check className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={cancelEdit}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => startEdit(type)} disabled={!tableExists}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => handleDelete(type.id)} disabled={!tableExists}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </TableCell>
    </TableRow>
  )
}

function PracticeTypesManager() {
  const [practiceTypes, setPracticeTypes] = useState<PracticeType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [tableExists, setTableExists] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const [newTypeName, setNewTypeName] = useState("")
  const { toast } = useToast()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  useEffect(() => {
    loadPracticeTypes()
  }, [])

  const loadPracticeTypes = async () => {
    try {
      const response = await fetchWithRetry("/api/practice-types")
      if (response.ok) {
        const data = await safeJsonParse<PracticeType[]>(response, [])
        setPracticeTypes(data)
        const hasRealData = data.length > 0 && data[0]?.id && !data[0].id.match(/^\d+$/)
        setTableExists(hasRealData)
      } else {
        throw new Error("Failed to load practice types")
      }
    } catch (error) {
      console.error("[v0] Error loading practice types:", error)
      setTableExists(false)
      toast({
        title: "Fehler",
        description: "Facharzt Gruppen konnten nicht geladen werden",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!newTypeName.trim()) return

    if (!tableExists) {
      toast({
        title: "Tabelle nicht vorhanden",
        description: "Bitte führen Sie zuerst das SQL-Migrationsskript aus",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/practice-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTypeName.trim() }),
      })

      if (response.status === 503) {
        setTableExists(false)
        throw new Error("Table does not exist")
      }

      if (!response.ok) throw new Error("Failed to create practice type")

      toast({
        title: "Erfolg",
        description: "Facharzt Gruppe wurde hinzugefügt",
      })

      setNewTypeName("")
      loadPracticeTypes()
    } catch (error) {
      console.error("[v0] Error creating practice type:", error)
      toast({
        title: "Fehler",
        description: "Facharzt Gruppe konnte nicht erstellt werden",
        variant: "destructive",
      })
    }
  }

  const handleUpdate = async (id: string) => {
    if (!editingName.trim()) return

    try {
      const response = await fetch(`/api/practice-types/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingName.trim() }),
      })

      if (!response.ok) throw new Error("Failed to update practice type")

      toast({
        title: "Erfolg",
        description: "Facharzt Gruppe wurde aktualisiert",
      })

      setEditingId(null)
      setEditingName("")
      loadPracticeTypes()
    } catch (error) {
      console.error("[v0] Error updating practice type:", error)
      toast({
        title: "Fehler",
        description: "Facharzt Gruppe konnte nicht aktualisiert werden",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Möchten Sie diese Facharzt Gruppe wirklich löschen?")) return

    try {
      const response = await fetch(`/api/practice-types/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete practice type")

      toast({
        title: "Erfolg",
        description: "Facharzt Gruppe wurde gelöscht",
      })

      loadPracticeTypes()
    } catch (error) {
      console.error("[v0] Error deleting practice type:", error)
      toast({
        title: "Fehler",
        description: "Facharzt Gruppe konnte nicht gelöscht werden",
        variant: "destructive",
      })
    }
  }

  const startEdit = (type: PracticeType) => {
    setEditingId(type.id)
    setEditingName(type.name)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingName("")
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const oldIndex = practiceTypes.findIndex((type) => type.id === active.id)
    const newIndex = practiceTypes.findIndex((type) => type.id === over.id)

    const newOrder = arrayMove(practiceTypes, oldIndex, newIndex)
    setPracticeTypes(newOrder)

    try {
      const updates = newOrder.map((type, index) => ({
        id: type.id,
        display_order: index + 1,
      }))

      await Promise.all(
        updates.map((update) =>
          fetch(`/api/practice-types/${update.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ display_order: update.display_order }),
          }),
        ),
      )

      toast({
        title: "Erfolg",
        description: "Reihenfolge wurde aktualisiert",
      })
    } catch (error) {
      console.error("[v0] Error updating order:", error)
      toast({
        title: "Fehler",
        description: "Reihenfolge konnte nicht gespeichert werden",
        variant: "destructive",
      })
      loadPracticeTypes()
    }
  }

  if (isLoading) {
    return <div>Laden...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Facharzt Gruppen verwalten</CardTitle>
        <CardDescription>
          Verwalten Sie die Liste der verfügbaren Facharzt Gruppen/Fachrichtungen für das System
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!tableExists && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Datenbanktabelle fehlt</AlertTitle>
            <AlertDescription>
              Die Tabelle 'practice_types' existiert noch nicht. Bitte führen Sie das SQL-Migrationsskript
              'scripts/create-practice-types-table-v1.sql' aus, um die Tabelle zu erstellen. Bis dahin werden
              Standard-Facharzt Gruppen verwendet.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="new-type">Neue Facharzt Gruppe</Label>
            <Input
              id="new-type"
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              placeholder="z.B. Neurologie"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              disabled={!tableExists}
            />
          </div>
          <Button onClick={handleAdd} className="mt-auto" disabled={!newTypeName.trim() || !tableExists}>
            <Plus className="h-4 w-4 mr-2" />
            Hinzufügen
          </Button>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={practiceTypes.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {practiceTypes.map((type) => (
                  <SortableRow
                    key={type.id}
                    type={type}
                    editingId={editingId}
                    editingName={editingName}
                    setEditingName={setEditingName}
                    handleUpdate={handleUpdate}
                    cancelEdit={cancelEdit}
                    startEdit={startEdit}
                    handleDelete={handleDelete}
                    tableExists={tableExists}
                  />
                ))}
              </TableBody>
            </Table>
          </SortableContext>
        </DndContext>
      </CardContent>
    </Card>
  )
}

export default PracticeTypesManager
