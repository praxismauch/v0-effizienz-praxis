"use client"

import { useState } from "react"
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
import { Loader2 } from "lucide-react"
import type { StaffingPlan } from "../types"

interface CreateStaffingPlanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPlanCreated: (plan: StaffingPlan) => void
}

export default function CreateStaffingPlanDialog({
  open,
  onOpenChange,
  onPlanCreated,
}: CreateStaffingPlanDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  const resetForm = () => {
    setName("")
    setDescription("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) return

    setIsSubmitting(true)

    // Create new staffing plan object
    const newPlan: StaffingPlan = {
      id: crypto.randomUUID(),
      name: name.trim(),
      description: description.trim() || undefined,
    }

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))

    onPlanCreated(newPlan)
    resetForm()
    setIsSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Neuer Stellenplan</DialogTitle>
          <DialogDescription>
            Erstellen Sie einen neuen Stellenplan für die Personalplanung.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="z.B. Q1 2026, Sommerbetrieb"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Beschreibung des Stellenplans..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={isSubmitting || !name.trim()}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Stellenplan erstellen
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
