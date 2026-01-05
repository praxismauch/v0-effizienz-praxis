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

interface CreateResponsibilityTemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreateResponsibilityTemplateDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateResponsibilityTemplateDialogProps) {
  const [loading, setLoading] = useState(false)
  const [specialtyGroups, setSpecialtyGroups] = useState<any[]>([])
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([])

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    group_name: "",
    category: "",
    estimated_time_amount: "",
    estimated_time_period: "daily",
    suggested_hours_per_week: "",
    cannot_complete_during_consultation: false,
    calculate_time_automatically: false,
    optimization_suggestions: "",
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
      const response = await fetch("/api/super-admin/templates/responsibilities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          estimated_time_amount: formData.estimated_time_amount
            ? Number.parseFloat(formData.estimated_time_amount)
            : null,
          suggested_hours_per_week: formData.suggested_hours_per_week
            ? Number.parseFloat(formData.suggested_hours_per_week)
            : null,
          specialty_group_ids: selectedSpecialties,
        }),
      })

      if (!response.ok) throw new Error("Failed to create responsibility template")

      toast.success("Zuständigkeits-Vorlage erfolgreich erstellt")
      onSuccess()
      setFormData({
        name: "",
        description: "",
        group_name: "",
        category: "",
        estimated_time_amount: "",
        estimated_time_period: "daily",
        suggested_hours_per_week: "",
        cannot_complete_during_consultation: false,
        calculate_time_automatically: false,
        optimization_suggestions: "",
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
          <DialogTitle>Zuständigkeits-Vorlage erstellen</DialogTitle>
          <DialogDescription>
            Erstellen Sie eine Vorlage für Zuständigkeiten, die Praxen verwenden können
          </DialogDescription>
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
              <Label htmlFor="group_name">Gruppe</Label>
              <Input
                id="group_name"
                value={formData.group_name}
                onChange={(e) => setFormData({ ...formData, group_name: e.target.value })}
                placeholder="z.B. Verwaltung, Qualitätsmanagement"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Kategorie</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="z.B. administration, quality"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estimated_time_amount">Zeitaufwand</Label>
              <Input
                id="estimated_time_amount"
                type="number"
                step="0.5"
                value={formData.estimated_time_amount}
                onChange={(e) => setFormData({ ...formData, estimated_time_amount: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated_time_period">Periode</Label>
              <Select
                value={formData.estimated_time_period}
                onValueChange={(value) => setFormData({ ...formData, estimated_time_period: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Täglich</SelectItem>
                  <SelectItem value="weekly">Wöchentlich</SelectItem>
                  <SelectItem value="monthly">Monatlich</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="suggested_hours_per_week">Std./Woche</Label>
              <Input
                id="suggested_hours_per_week"
                type="number"
                step="0.5"
                value={formData.suggested_hours_per_week}
                onChange={(e) => setFormData({ ...formData, suggested_hours_per_week: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="optimization_suggestions">Optimierungsvorschläge</Label>
            <Textarea
              id="optimization_suggestions"
              value={formData.optimization_suggestions}
              onChange={(e) => setFormData({ ...formData, optimization_suggestions: e.target.value })}
              rows={2}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="cannot_complete_during_consultation"
                checked={formData.cannot_complete_during_consultation}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, cannot_complete_during_consultation: checked as boolean })
                }
              />
              <Label htmlFor="cannot_complete_during_consultation" className="font-normal">
                Kann nicht während der Sprechstunde erledigt werden
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="calculate_time_automatically"
                checked={formData.calculate_time_automatically}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, calculate_time_automatically: checked as boolean })
                }
              />
              <Label htmlFor="calculate_time_automatically" className="font-normal">
                Zeit automatisch berechnen
              </Label>
            </div>
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

export default CreateResponsibilityTemplateDialog
