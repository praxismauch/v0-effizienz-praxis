"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import type { TicketItem } from "../types"

interface EditTicketDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ticket: TicketItem | null
  onSave: (updatedTicket: Partial<TicketItem>) => void
}

export function EditTicketDialog({
  open,
  onOpenChange,
  ticket,
  onSave,
}: EditTicketDialogProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "open" as TicketItem["status"],
    priority: "medium" as TicketItem["priority"],
    type: "other" as TicketItem["type"],
    category: "",
    assigned_to: "",
    steps_to_reproduce: "",
    expected_behavior: "",
    actual_behavior: "",
  })

  useEffect(() => {
    if (ticket) {
      setFormData({
        title: ticket.title || "",
        description: ticket.description || "",
        status: ticket.status || "open",
        priority: ticket.priority || "medium",
        type: ticket.type || "other",
        category: ticket.category || "",
        assigned_to: ticket.assigned_to || "",
        steps_to_reproduce: ticket.steps_to_reproduce || "",
        expected_behavior: ticket.expected_behavior || "",
        actual_behavior: ticket.actual_behavior || "",
      })
    }
  }, [ticket])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await onSave(formData)
    } finally {
      setIsSaving(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ticket bearbeiten</DialogTitle>
          <DialogDescription>
            Bearbeiten Sie die Details des Tickets.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Titel *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={4}
              required
            />
          </div>

          {/* Row: Status, Priority, Type */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Offen</SelectItem>
                  <SelectItem value="in_progress">In Bearbeitung</SelectItem>
                  <SelectItem value="resolved">Gelöst</SelectItem>
                  <SelectItem value="closed">Geschlossen</SelectItem>
                  <SelectItem value="wont_fix">Wird nicht behoben</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priorität</Label>
              <Select value={formData.priority} onValueChange={(value) => handleChange("priority", value)}>
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Niedrig</SelectItem>
                  <SelectItem value="medium">Mittel</SelectItem>
                  <SelectItem value="high">Hoch</SelectItem>
                  <SelectItem value="urgent">Dringend</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Typ</Label>
              <Select value={formData.type} onValueChange={(value) => handleChange("type", value)}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bug">Bug</SelectItem>
                  <SelectItem value="feature_request">Feature Request</SelectItem>
                  <SelectItem value="question">Frage</SelectItem>
                  <SelectItem value="other">Sonstiges</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Kategorie</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => handleChange("category", e.target.value)}
              placeholder="Optional"
            />
          </div>

          {/* Bug-specific fields */}
          {formData.type === "bug" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="steps_to_reproduce">Schritte zur Reproduktion</Label>
                <Textarea
                  id="steps_to_reproduce"
                  value={formData.steps_to_reproduce}
                  onChange={(e) => handleChange("steps_to_reproduce", e.target.value)}
                  rows={3}
                  placeholder="1. Schritt eins\n2. Schritt zwei"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expected_behavior">Erwartetes Verhalten</Label>
                <Textarea
                  id="expected_behavior"
                  value={formData.expected_behavior}
                  onChange={(e) => handleChange("expected_behavior", e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="actual_behavior">Tatsächliches Verhalten</Label>
                <Textarea
                  id="actual_behavior"
                  value={formData.actual_behavior}
                  onChange={(e) => handleChange("actual_behavior", e.target.value)}
                  rows={2}
                />
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Speichern
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
