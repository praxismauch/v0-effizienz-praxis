"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

const CATEGORIES = [
  { value: "medical", label: "Medizinisch", icon: "🏥" },
  { value: "office", label: "Büro", icon: "📎" },
  { value: "hygiene", label: "Hygiene", icon: "🧴" },
  { value: "equipment", label: "Geräte", icon: "⚙️" },
  { value: "lab", label: "Labor", icon: "🔬" },
  { value: "general", label: "Allgemein", icon: "📦" },
]

interface CreateItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  practiceId: string
  onSuccess: () => void
}

export function CreateItemDialog({ open, onOpenChange, practiceId, onSuccess }: CreateItemDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    barcode: "",
    category: "general",
    current_stock: 0,
    min_stock: 5,
    max_stock: 50,
    unit: "Stück",
    price: 0,
  })

  const resetForm = () => {
    setFormData({
      name: "",
      barcode: "",
      category: "general",
      current_stock: 0,
      min_stock: 5,
      max_stock: 50,
      unit: "Stück",
      price: 0,
    })
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Bitte geben Sie einen Artikelnamen ein")
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/practices/${practiceId}/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Fehler beim Erstellen")
      }

      toast.success("Artikel erstellt")
      resetForm()
      onOpenChange(false)
      onSuccess()
    } catch (error: any) {
      toast.error(error.message || "Fehler beim Erstellen")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => {
      if (!o) resetForm()
      onOpenChange(o)
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Neuer Artikel</DialogTitle>
          <DialogDescription>Fügen Sie einen neuen Artikel zum Bestand hinzu</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Artikelname"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Kategorie</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Einheit</Label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="Stück"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="current_stock">Aktueller Bestand</Label>
              <Input
                id="current_stock"
                type="number"
                min={0}
                value={formData.current_stock}
                onChange={(e) => setFormData({ ...formData, current_stock: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Stückpreis (€)</Label>
              <Input
                id="price"
                type="number"
                min={0}
                step={0.01}
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min_stock">Mindestbestand</Label>
              <Input
                id="min_stock"
                type="number"
                min={0}
                value={formData.min_stock}
                onChange={(e) => setFormData({ ...formData, min_stock: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reorder">Nachbestellpunkt</Label>
              <Input
                id="reorder"
                type="number"
                min={0}
                value={Math.round((formData.min_stock + formData.max_stock) / 2)}
                disabled
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_stock">Optimal</Label>
              <Input
                id="max_stock"
                type="number"
                min={0}
                value={formData.max_stock}
                onChange={(e) => setFormData({ ...formData, max_stock: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Erstellen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
