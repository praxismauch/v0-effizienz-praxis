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

interface PracticeForm {
  id: string
  value: string
  label: string
  display_order: number
  is_active: boolean
}

function SortableRow({
  item,
  editingId,
  editingLabel,
  setEditingLabel,
  handleUpdate,
  cancelEdit,
  startEdit,
  handleDelete,
  tableExists,
}: {
  item: PracticeForm
  editingId: string | null
  editingLabel: string
  setEditingLabel: (label: string) => void
  handleUpdate: (id: string) => void
  cancelEdit: () => void
  startEdit: (item: PracticeForm) => void
  handleDelete: (id: string) => void
  tableExists: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })

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
        {editingId === item.id ? (
          <Input
            value={editingLabel}
            onChange={(e) => setEditingLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleUpdate(item.id)
              if (e.key === "Escape") cancelEdit()
            }}
            autoFocus
          />
        ) : (
          <span className="font-medium">{item.label}</span>
        )}
      </TableCell>
      <TableCell>
        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{item.value}</code>
      </TableCell>
      <TableCell>
        <Badge variant={item.is_active ? "default" : "secondary"}>{item.is_active ? "Aktiv" : "Inaktiv"}</Badge>
      </TableCell>
      <TableCell className="text-right">
        {editingId === item.id ? (
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => handleUpdate(item.id)}>
              <Check className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={cancelEdit}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => startEdit(item)} disabled={!tableExists}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => handleDelete(item.id)} disabled={!tableExists}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </TableCell>
    </TableRow>
  )
}

function PraxisartenManager() {
  const [items, setItems] = useState<PracticeForm[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [tableExists, setTableExists] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingLabel, setEditingLabel] = useState("")
  const [newLabel, setNewLabel] = useState("")
  const { toast } = useToast()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  useEffect(() => {
    loadItems()
  }, [])

  const loadItems = async () => {
    try {
      const response = await fetch("/api/practice-forms")
      if (response.ok) {
        const data = await response.json()
        setItems(data)
        const hasRealData = data.length > 0 && data[0]?.id && !data[0].id.match(/^\d+$/)
        setTableExists(hasRealData)
      } else {
        throw new Error("Failed to load")
      }
    } catch (error) {
      console.error("Error loading practice forms:", error)
      setTableExists(false)
      toast({ title: "Fehler", description: "Praxisarten konnten nicht geladen werden", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!newLabel.trim()) return
    if (!tableExists) {
      toast({
        title: "Tabelle nicht vorhanden",
        description: "Die Tabelle 'practice_forms' muss zuerst erstellt werden.",
        variant: "destructive",
      })
      return
    }

    try {
      const value = newLabel.trim().toLowerCase().replace(/[^a-z0-9äöüß]+/g, "-").replace(/-+$/, "")
      const response = await fetch("/api/practice-forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value, label: newLabel.trim() }),
      })

      if (response.status === 503) {
        setTableExists(false)
        throw new Error("Table does not exist")
      }
      if (response.status === 409) {
        toast({ title: "Fehler", description: "Diese Praxisart existiert bereits.", variant: "destructive" })
        return
      }
      if (!response.ok) throw new Error("Failed to create")

      toast({ title: "Erfolg", description: "Praxisart wurde hinzugefügt" })
      setNewLabel("")
      loadItems()
    } catch (error: any) {
      toast({ title: "Fehler", description: "Praxisart konnte nicht erstellt werden", variant: "destructive" })
    }
  }

  const handleUpdate = async (id: string) => {
    if (!editingLabel.trim()) return
    try {
      const response = await fetch(`/api/practice-forms/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: editingLabel.trim() }),
      })
      if (!response.ok) throw new Error("Failed to update")
      toast({ title: "Erfolg", description: "Praxisart wurde aktualisiert" })
      setEditingId(null)
      setEditingLabel("")
      loadItems()
    } catch (error) {
      toast({ title: "Fehler", description: "Praxisart konnte nicht aktualisiert werden", variant: "destructive" })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Möchten Sie diese Praxisart wirklich löschen?")) return
    try {
      const response = await fetch(`/api/practice-forms/${id}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Failed to delete")
      toast({ title: "Erfolg", description: "Praxisart wurde gelöscht" })
      loadItems()
    } catch (error) {
      toast({ title: "Fehler", description: "Praxisart konnte nicht gelöscht werden", variant: "destructive" })
    }
  }

  const startEdit = (item: PracticeForm) => {
    setEditingId(item.id)
    setEditingLabel(item.label)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingLabel("")
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex((i) => i.id === active.id)
    const newIndex = items.findIndex((i) => i.id === over.id)
    const newOrder = arrayMove(items, oldIndex, newIndex)
    setItems(newOrder)

    try {
      await Promise.all(
        newOrder.map((item, index) =>
          fetch(`/api/practice-forms/${item.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ display_order: index + 1 }),
          }),
        ),
      )
      toast({ title: "Erfolg", description: "Reihenfolge wurde aktualisiert" })
    } catch (error) {
      toast({ title: "Fehler", description: "Reihenfolge konnte nicht gespeichert werden", variant: "destructive" })
      loadItems()
    }
  }

  if (isLoading) {
    return <div>Laden...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Praxisarten verwalten</CardTitle>
        <CardDescription>
          Verwalten Sie die Liste der verfügbaren Praxisarten (z.B. Einzelpraxis, MVZ, BAG) für das gesamte System
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!tableExists && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Datenbanktabelle fehlt</AlertTitle>
            <AlertDescription>
              Die Tabelle &apos;practice_forms&apos; existiert noch nicht. Bitte erstellen Sie diese im Supabase
              Dashboard (SQL Editor). Bis dahin werden Standard-Praxisarten verwendet.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="new-form">Neue Praxisart</Label>
            <Input
              id="new-form"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="z.B. Gemeinschaftspraxis"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              disabled={!tableExists}
            />
          </div>
          <Button onClick={handleAdd} className="mt-auto" disabled={!newLabel.trim() || !tableExists}>
            <Plus className="h-4 w-4 mr-2" />
            Hinzufügen
          </Button>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Bezeichnung</TableHead>
                  <TableHead>Wert (intern)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <SortableRow
                    key={item.id}
                    item={item}
                    editingId={editingId}
                    editingLabel={editingLabel}
                    setEditingLabel={setEditingLabel}
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

export default PraxisartenManager
