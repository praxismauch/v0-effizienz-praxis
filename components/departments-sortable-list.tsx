"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, GripVertical } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Department {
  id: string
  name: string
  description?: string
  color: string
  icon?: string
  display_order: number
  is_active: boolean
}

interface DepartmentsSortableListProps {
  practiceId: string
  departments: Department[]
  onUpdate: () => void
}

function DepartmentsSortableList({ practiceId, departments, onUpdate }: DepartmentsSortableListProps) {
  const [editingDept, setEditingDept] = useState<Department | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3b82f6",
  })

  const handleEdit = (dept: Department) => {
    setEditingDept(dept)
    setFormData({
      name: dept.name,
      description: dept.description || "",
      color: dept.color,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Möchten Sie diese Abteilung wirklich löschen?")) return

    try {
      const response = await fetch(`/api/practices/${practiceId}/departments/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete department")

      toast({
        title: "Abteilung gelöscht",
        description: "Die Abteilung wurde erfolgreich gelöscht.",
      })
      onUpdate()
    } catch (error) {
      console.error("[v0] Error deleting department:", error)
      toast({
        title: "Fehler",
        description: "Die Abteilung konnte nicht gelöscht werden.",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async () => {
    try {
      const url = editingDept
        ? `/api/practices/${practiceId}/departments/${editingDept.id}`
        : `/api/practices/${practiceId}/departments`

      const response = await fetch(url, {
        method: editingDept ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error("Failed to save department")

      toast({
        title: editingDept ? "Abteilung aktualisiert" : "Abteilung erstellt",
        description: `Die Abteilung wurde erfolgreich ${editingDept ? "aktualisiert" : "erstellt"}.`,
      })
      setIsDialogOpen(false)
      setEditingDept(null)
      setFormData({ name: "", description: "", color: "#3b82f6" })
      onUpdate()
    } catch (error) {
      console.error("[v0] Error saving department:", error)
      toast({
        title: "Fehler",
        description: "Die Abteilung konnte nicht gespeichert werden.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-3">
      <button
        data-department-create
        className="hidden"
        onClick={() => {
          setEditingDept(null)
          setFormData({ name: "", description: "", color: "#3b82f6" })
          setIsDialogOpen(true)
        }}
      />

      {departments.map((dept) => (
        <Card key={dept.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
              <div className="w-6 h-6 rounded-full border-2" style={{ backgroundColor: dept.color }} />
              <div className="flex-1">
                <div className="font-medium">{dept.name}</div>
                {dept.description && <div className="text-sm text-muted-foreground">{dept.description}</div>}
              </div>
              <Badge variant={dept.is_active ? "default" : "secondary"}>{dept.is_active ? "Aktiv" : "Inaktiv"}</Badge>
              <Button size="sm" variant="ghost" onClick={() => handleEdit(dept)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => handleDelete(dept.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDept ? "Abteilung bearbeiten" : "Neue Abteilung"}</DialogTitle>
            <DialogDescription>Definieren Sie eine Abteilung für das Organigramm.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="z.B. Vertrieb & Marketing"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Kurze Beschreibung der Abteilung"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Farbe</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="#3b82f6"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.name.trim()}>
              {editingDept ? "Aktualisieren" : "Erstellen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default DepartmentsSortableList
