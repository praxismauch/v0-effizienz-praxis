"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
import { toast } from "sonner"

interface CreateGoalTemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreateGoalTemplateDialog({ open, onOpenChange, onSuccess }: CreateGoalTemplateDialogProps) {
  const [loading, setLoading] = useState(false)
  const [specialtyGroups, setSpecialtyGroups] = useState<any[]>([])
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([])

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    goal_type: "operational",
    priority: "medium",
    target_value: "",
    unit: "",
    duration_days: "",
  })

  useEffect(() => {
    if (open) {
      fetchSpecialtyGroups()
    }
  }, [open])

  const fetchSpecialtyGroups = async () => {
    try {
      const response = await fetch("/api/specialty-groups")
      const data = await response.json()
      setSpecialtyGroups(data.specialtyGroups || [])
    } catch (error) {
      console.error("Error fetching specialty groups:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/super-admin/templates/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          target_value: formData.target_value ? Number.parseFloat(formData.target_value) : null,
          duration_days: formData.duration_days ? Number.parseInt(formData.duration_days) : null,
          specialty_group_ids: selectedSpecialties,
        }),
      })

      if (!response.ok) throw new Error("Failed to create goal template")

      toast.success("Ziel-Vorlage erfolgreich erstellt")
      onSuccess()
      setFormData({
        name: "",
        description: "",
        category: "",
        goal_type: "operational",
        priority: "medium",
        target_value: "",
        unit: "",
        duration_days: "",
      })
      setSelectedSpecialties([])
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ziel-Vorlage erstellen</DialogTitle>
          <DialogDescription>Erstellen Sie eine Vorlage für Ziele, die Praxen verwenden können</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Kategorie</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="z.B. Qualität, Finanzen"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal_type">Zieltyp</Label>
              <Select
                value={formData.goal_type}
                onValueChange={(value) => setFormData({ ...formData, goal_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="strategic">Strategisch</SelectItem>
                  <SelectItem value="operational">Operativ</SelectItem>
                  <SelectItem value="financial">Finanziell</SelectItem>
                  <SelectItem value="team">Team</SelectItem>
                  <SelectItem value="personal">Persönlich</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priorität</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
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

            <div className="space-y-2">
              <Label htmlFor="target_value">Zielwert</Label>
              <Input
                id="target_value"
                type="number"
                step="0.01"
                value={formData.target_value}
                onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Einheit</Label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="z.B. %, €, Tage"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration_days">Empfohlene Dauer (Tage)</Label>
            <Input
              id="duration_days"
              type="number"
              value={formData.duration_days}
              onChange={(e) => setFormData({ ...formData, duration_days: e.target.value })}
              placeholder="z.B. 90, 180, 365"
            />
          </div>

          <div className="space-y-2">
            <Label>Fachgruppen zuordnen</Label>
            <div className="border rounded-md p-4 space-y-2 max-h-48 overflow-y-auto">
              {specialtyGroups.map((group) => (
                <div key={group.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`specialty-${group.id}`}
                    checked={selectedSpecialties.includes(group.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedSpecialties([...selectedSpecialties, group.id])
                      } else {
                        setSelectedSpecialties(selectedSpecialties.filter((id) => id !== group.id))
                      }
                    }}
                  />
                  <Label htmlFor={`specialty-${group.id}`} className="font-normal">
                    {group.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Erstelle..." : "Erstellen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateGoalTemplateDialog
