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
import { NettoBruttoCalculator } from "@/components/ui/netto-brutto-calculator"
import { useToast } from "@/hooks/use-toast"

interface EditArbeitsmittelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  item: any
  teamMembers: any[]
}

const EQUIPMENT_TYPES = ["Schlüssel", "Dienstkleidung", "Dienst Handy", "Dienst Laptop", "Sonstiges"]

const CONDITIONS = ["Neu", "Gut", "Gebraucht", "Defekt"]
const STATUSES = [
  { value: "available", label: "Verfügbar" },
  { value: "assigned", label: "Zugewiesen" },
  { value: "maintenance", label: "Wartung" },
  { value: "retired", label: "Ausgemustert" },
]

export function EditArbeitsmittelDialog({
  open,
  onOpenChange,
  onSuccess,
  item,
  teamMembers,
}: EditArbeitsmittelDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    description: "",
    serial_number: "",
    purchase_date: "",
    purchase_price: "",
    condition: "Neu",
    assigned_to: "",
    status: "available",
    notes: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || "",
        type: item.type || "",
        description: item.description || "",
        serial_number: item.serial_number || "",
        purchase_date: item.purchase_date || "",
        purchase_price: item.purchase_price?.toString() || "",
        condition: item.condition || "Neu",
        assigned_to: item.assigned_to || "",
        status: item.status || "available",
        notes: item.notes || "",
      })
    }
  }, [item])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      if (!item.practice_id) throw new Error("No practice ID")

      const response = await fetch(`/api/practices/${item.practice_id}/arbeitsmittel/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          type: formData.type,
          description: formData.description || null,
          serial_number: formData.serial_number || null,
          purchase_date: formData.purchase_date || null,
          purchase_price: formData.purchase_price ? Number.parseFloat(formData.purchase_price) : null,
          condition: formData.condition,
          status: formData.status,
          notes: formData.notes || null,
          assigned_to: formData.assigned_to || null,
          assigned_date:
            formData.assigned_to && !item.assigned_to ? new Date().toISOString().split("T")[0] : item.assigned_date,
          return_date:
            !formData.assigned_to && item.assigned_to ? new Date().toISOString().split("T")[0] : item.return_date,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update")
      }

      toast({
        title: "Erfolgreich",
        description: "Arbeitsmittel wurde aktualisiert.",
      })
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error("Error updating arbeitsmittel:", error)
      toast({
        title: "Fehler",
        description: error?.message || "Fehler beim Aktualisieren des Arbeitsmittels",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Arbeitsmittel bearbeiten</DialogTitle>
          <DialogDescription>Aktualisieren Sie die Details des Arbeitsmittels</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Typ *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Typ auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {EQUIPMENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="serial_number">Seriennummer</Label>
              <Input
                id="serial_number"
                value={formData.serial_number}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="condition">Zustand</Label>
              <Select
                value={formData.condition}
                onValueChange={(value) => setFormData({ ...formData, condition: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONDITIONS.map((condition) => (
                    <SelectItem key={condition} value={condition}>
                      {condition}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchase_date">Kaufdatum</Label>
              <Input
                id="purchase_date"
                type="date"
                value={formData.purchase_date}
                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchase_price">Kaufpreis (€)</Label>
              <div className="flex items-center gap-1">
                <Input
                  id="purchase_price"
                  type="number"
                  step="0.01"
                  value={formData.purchase_price}
                  onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                />
                <NettoBruttoCalculator
                  onApply={(brutto) => setFormData({ ...formData, purchase_price: brutto.toString() })}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assigned_to">Zugewiesen an</Label>
              <Select
                value={formData.assigned_to || "__none__"}
                onValueChange={(value) => setFormData({ ...formData, assigned_to: value === "__none__" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Nicht zugewiesen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Nicht zugewiesen</SelectItem>
                  {teamMembers && teamMembers.length > 0 ? (
                    teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.first_name} {member.last_name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="__no_members__" disabled>
                      Keine Teammitglieder vorhanden
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notizen</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Wird gespeichert..." : "Speichern"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default EditArbeitsmittelDialog
