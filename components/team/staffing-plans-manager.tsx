"use client"

import type React from "react"

import type { StaffingPlan } from "@/types/staffing"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Pencil } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface StaffingPlansManagerProps {
  plans: StaffingPlan[]
  selectedPlanId: string | null
  onSelectPlan: (planId: string) => void
  onPlanCreated: () => void
  onPlanUpdated: () => void
  onPlanDeleted: () => void
  practiceId: string
  isAdmin: boolean
}

export function StaffingPlansManager({
  plans,
  selectedPlanId,
  onSelectPlan,
  onPlanCreated,
  onPlanUpdated,
  onPlanDeleted,
  practiceId,
  isAdmin,
}: StaffingPlansManagerProps) {
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<StaffingPlan | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [planToDelete, setPlanToDelete] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  const handleOpenDialog = (plan?: StaffingPlan) => {
    if (plan) {
      setEditingPlan(plan)
      setName(plan.name)
      setDescription(plan.description || "")
    } else {
      setEditingPlan(null)
      setName("")
      setDescription("")
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie einen Namen ein",
        variant: "destructive",
      })
      return
    }

    try {
      const url = editingPlan
        ? `/api/practices/${practiceId}/staffing-plans/${editingPlan.id}`
        : `/api/practices/${practiceId}/staffing-plans`

      const res = await fetch(url, {
        method: editingPlan ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          created_by: "current-user-id",
        }),
      })

      const result = await res.json()

      if (result.error) {
        throw new Error(result.error)
      }

      toast({
        title: "Erfolg",
        description: editingPlan ? "Plan aktualisiert" : "Plan erstellt",
      })

      setIsDialogOpen(false)
      if (editingPlan) {
        onPlanUpdated()
      } else {
        onPlanCreated()
      }

      // Auto-select newly created plan
      if (!editingPlan && result.id) {
        onSelectPlan(result.id)
      }
    } catch (error) {
      console.error("[v0] Error saving staffing plan:", error)
      toast({
        title: "Fehler",
        description: "Plan konnte nicht gespeichert werden",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    if (!planToDelete) return

    try {
      const res = await fetch(`/api/practices/${practiceId}/staffing-plans/${planToDelete}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Fehler beim Löschen")

      toast({
        title: "Erfolg",
        description: "Plan gelöscht",
      })

      // If deleting selected plan, clear selection first
      if (selectedPlanId === planToDelete) {
        onSelectPlan("")
      }

      onPlanDeleted()
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Plan konnte nicht gelöscht werden",
        variant: "destructive",
      })
    } finally {
      setIsDeleteDialogOpen(false)
      setPlanToDelete(null)
    }
  }

  const onEdit = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    console.log("[v0] Edit clicked")
    const plan = plans.find((p) => p.id === selectedPlanId)
    if (plan) {
      handleOpenDialog(plan)
    }
  }

  const onDelete = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    console.log("[v0] Delete clicked")
    setPlanToDelete(selectedPlanId)
    setIsDeleteDialogOpen(true)
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4 mt-4">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Label className="text-xs font-medium whitespace-nowrap">Bedarfsplan:</Label>
            <Select value={selectedPlanId || undefined} onValueChange={onSelectPlan}>
              <SelectTrigger className="w-56 text-sm h-9">
                <SelectValue placeholder="Plan auswählen" />
              </SelectTrigger>
              <SelectContent>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {isAdmin && selectedPlanId && (
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Pencil className="h-4 w-4 mr-1" />
                Bearbeiten
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onDelete}
                className="text-destructive hover:text-destructive bg-transparent"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Löschen
              </Button>
            </div>
          )}
          {selectedPlanId && plans.find((p) => p.id === selectedPlanId)?.description && (
            <Badge variant="outline" className="ml-1.5 text-xs">
              {plans.find((p) => p.id === selectedPlanId)?.description}
            </Badge>
          )}
        </div>
        {isAdmin && (
          <Button size="sm" onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-1" />
            Neuer Plan
          </Button>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPlan ? "Plan bearbeiten" : "Neuer Bedarfsplan"}</DialogTitle>
            <DialogDescription>Erstellen Sie einen Plan für verschiedene Zeiträume oder Szenarien</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="plan-name">Plan-Name *</Label>
              <Input
                id="plan-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="z.B. Winterplan, Hauptsaison, Notfallplan"
              />
            </div>
            <div>
              <Label htmlFor="plan-description">Beschreibung (optional)</Label>
              <Textarea
                id="plan-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Kurze Beschreibung des Plans"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSave}>{editingPlan ? "Aktualisieren" : "Erstellen"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Plan löschen</DialogTitle>
            <DialogDescription>Wollen Sie diesen Bedarfsplan wirklich löschen?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleDelete} className="text-destructive">
              Löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
