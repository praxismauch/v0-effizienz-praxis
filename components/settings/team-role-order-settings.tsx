"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { usePractice } from "@/contexts/practice-context"
import { GripVertical, RotateCcw, Save, Plus, X, Users } from "lucide-react"
import { Input } from "@/components/ui/input"
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

interface SortableRoleItemProps {
  id: string
  role: string
  index: number
  onRemove: (role: string) => void
  isDefault: boolean
}

function SortableRoleItem({ id, role, index, onRemove, isDefault }: SortableRoleItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 bg-card border rounded-lg ${isDragging ? "opacity-50 shadow-lg" : ""}`}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      <Badge variant="secondary" className="text-sm font-medium">
        {index + 1}
      </Badge>
      <span className="flex-1 font-medium">{role}</span>
      {!isDefault && (
        <Button variant="ghost" size="icon" onClick={() => onRemove(role)} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

export function TeamRoleOrderSettings() {
  const { currentPractice } = usePractice()
  const [roleOrder, setRoleOrder] = useState<string[]>([])
  const [defaultOrder, setDefaultOrder] = useState<string[]>([])
  const [isCustom, setIsCustom] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newRole, setNewRole] = useState("")

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  useEffect(() => {
    if (currentPractice?.id) {
      fetchRoleOrder()
    }
  }, [currentPractice?.id])

  const fetchRoleOrder = async () => {
    if (!currentPractice?.id) return

    try {
      setLoading(true)
      const res = await fetch(`/api/practices/${currentPractice.id}/settings/team-role-order`)
      if (res.ok) {
        const data = await res.json()
        setRoleOrder(data.roleOrder || [])
        setDefaultOrder(data.defaultOrder || [])
        setIsCustom(data.isCustom || false)
      }
    } catch (error) {
      console.error("Error fetching role order:", error)
      toast.error("Fehler beim Laden der Rollen-Reihenfolge")
    } finally {
      setLoading(false)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setRoleOrder((items) => {
        const oldIndex = items.indexOf(active.id as string)
        const newIndex = items.indexOf(over.id as string)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const handleSave = async () => {
    if (!currentPractice?.id) return

    try {
      setSaving(true)
      const res = await fetch(`/api/practices/${currentPractice.id}/settings/team-role-order`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleOrder }),
      })

      if (res.ok) {
        toast.success("Rollen-Reihenfolge erfolgreich gespeichert")
        setIsCustom(true)
      } else {
        const error = await res.json()
        toast.error(error.error || "Fehler beim Speichern")
      }
    } catch (error) {
      toast.error("Fehler beim Speichern der Rollen-Reihenfolge")
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    if (!currentPractice?.id) return

    try {
      setSaving(true)
      const res = await fetch(`/api/practices/${currentPractice.id}/settings/team-role-order`, {
        method: "DELETE",
      })

      if (res.ok) {
        const data = await res.json()
        setRoleOrder(data.roleOrder || defaultOrder)
        setIsCustom(false)
        toast.success("Rollen-Reihenfolge auf Standard zurückgesetzt")
      } else {
        toast.error("Fehler beim Zurücksetzen")
      }
    } catch (error) {
      toast.error("Fehler beim Zurücksetzen der Rollen-Reihenfolge")
    } finally {
      setSaving(false)
    }
  }

  const handleAddRole = () => {
    if (!newRole.trim()) return
    if (roleOrder.includes(newRole.trim())) {
      toast.error("Diese Rolle existiert bereits")
      return
    }
    setRoleOrder([...roleOrder, newRole.trim()])
    setNewRole("")
  }

  const handleRemoveRole = (role: string) => {
    // Don't allow removing default roles
    if (defaultOrder.includes(role)) {
      toast.error("Standard-Rollen können nicht entfernt werden")
      return
    }
    setRoleOrder(roleOrder.filter((r) => r !== role))
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team-Reihenfolge
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-12 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team-Reihenfolge
            </CardTitle>
            <CardDescription>Legen Sie die Standard-Sortierung für Team-Mitglieder nach Rolle fest</CardDescription>
          </div>
          {isCustom && (
            <Badge variant="secondary" className="text-xs">
              Angepasst
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Ziehen Sie die Rollen in die gewünschte Reihenfolge. Die erste Rolle erscheint oben in der Team-Liste.
        </p>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={roleOrder} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {roleOrder.map((role, index) => (
                <SortableRoleItem
                  key={role}
                  id={role}
                  role={role}
                  index={index}
                  onRemove={handleRemoveRole}
                  isDefault={defaultOrder.includes(role)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <div className="flex gap-2">
          <Input
            placeholder="Neue Rolle hinzufügen..."
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddRole()}
          />
          <Button variant="outline" onClick={handleAddRole} disabled={!newRole.trim()}>
            <Plus className="h-4 w-4 mr-2" />
            Hinzufügen
          </Button>
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Speichern..." : "Speichern"}
          </Button>
          <Button variant="outline" onClick={handleReset} disabled={saving}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Standard wiederherstellen
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
