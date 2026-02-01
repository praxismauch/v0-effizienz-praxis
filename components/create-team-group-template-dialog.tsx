"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"

interface CreateTeamGroupTemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  editingTemplate?: any
}

export function CreateTeamGroupTemplateDialog({ open, onOpenChange, onSuccess, editingTemplate }: CreateTeamGroupTemplateDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [specialtyGroups, setSpecialtyGroups] = useState<any[]>([])
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3b82f6",
    icon: "users",
    specialty_group_ids: [] as string[],
  })

  useEffect(() => {
    if (open) {
      fetchSpecialtyGroups()
      if (editingTemplate) {
        setFormData({
          name: editingTemplate.name || "",
          description: editingTemplate.description || "",
          color: editingTemplate.color || "#3b82f6",
          icon: editingTemplate.icon || "users",
          specialty_group_ids: editingTemplate.team_group_template_specialties?.map((s: any) => s.specialty_group_id) || [],
        })
      } else {
        setFormData({
          name: "",
          description: "",
          color: "#3b82f6",
          icon: "users",
          specialty_group_ids: [],
        })
      }
    }
  }, [open, editingTemplate])

  const fetchSpecialtyGroups = async () => {
    try {
      const response = await fetch("/api/specialty-groups")
      const data = await response.json()
      setSpecialtyGroups(data.groups || [])
    } catch (error) {
      console.error("Error fetching specialty groups:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const isEditing = !!editingTemplate
      const response = await fetch("/api/super-admin/templates/team-groups", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEditing ? { ...formData, id: editingTemplate.id } : formData),
      })

      if (!response.ok) throw new Error(isEditing ? "Failed to update template" : "Failed to create template")

      toast({
        title: "Erfolg",
        description: isEditing ? "Teamgruppen-Vorlage wurde aktualisiert" : "Teamgruppen-Vorlage wurde erstellt",
      })

      setFormData({
        name: "",
        description: "",
        color: "#3b82f6",
        icon: "users",
        specialty_group_ids: [],
      })

      onSuccess()
    } catch (error) {
      toast({
        title: "Fehler",
        description: editingTemplate ? "Teamgruppen-Vorlage konnte nicht aktualisiert werden" : "Teamgruppen-Vorlage konnte nicht erstellt werden",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleSpecialtyGroup = (groupId: string) => {
    setFormData((prev) => ({
      ...prev,
      specialty_group_ids: prev.specialty_group_ids.includes(groupId)
        ? prev.specialty_group_ids.filter((id) => id !== groupId)
        : [...prev.specialty_group_ids, groupId],
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingTemplate ? "Teamgruppen-Vorlage bearbeiten" : "Teamgruppen-Vorlage erstellen"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="z.B. Empfangsteam"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Beschreiben Sie die Teamgruppe"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="color">Farbe</Label>
              <Input
                id="color"
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="icon">Icon</Label>
              <Input
                id="icon"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="users"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Fachgruppen zuordnen</Label>
            <div className="border rounded-lg p-4 space-y-2 max-h-48 overflow-y-auto">
              {specialtyGroups.map((group) => (
                <div key={group.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={group.id}
                    checked={formData.specialty_group_ids.includes(group.id)}
                    onCheckedChange={() => toggleSpecialtyGroup(group.id)}
                  />
                  <Label htmlFor={group.id} className="cursor-pointer font-normal">
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
              {loading ? (editingTemplate ? "Speichern..." : "Erstelle...") : (editingTemplate ? "Speichern" : "Erstellen")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateTeamGroupTemplateDialog
