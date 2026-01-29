"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import type { ShiftType } from "../types"

interface ShiftTypeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shiftType?: ShiftType | null
  practiceId: string
  onSave: (data: Partial<ShiftType>) => Promise<void>
}

const PRESET_COLORS = [
  "#22c55e", // green
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
]

export default function ShiftTypeDialog({
  open,
  onOpenChange,
  shiftType,
  practiceId,
  onSave,
}: ShiftTypeDialogProps) {
  const isEditing = !!shiftType

  const [formData, setFormData] = useState({
    name: "",
    short_name: "",
    start_time: "08:00",
    end_time: "17:00",
    break_minutes: 30,
    color: "#3b82f6",
    min_staff: 1,
    is_active: true,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (shiftType) {
      setFormData({
        name: shiftType.name || "",
        short_name: shiftType.short_name || "",
        start_time: shiftType.start_time || "08:00",
        end_time: shiftType.end_time || "17:00",
        break_minutes: shiftType.break_minutes || 30,
        color: shiftType.color || "#3b82f6",
        min_staff: shiftType.min_staff || 1,
        is_active: shiftType.is_active ?? true,
      })
    } else {
      setFormData({
        name: "",
        short_name: "",
        start_time: "08:00",
        end_time: "17:00",
        break_minutes: 30,
        color: "#3b82f6",
        min_staff: 1,
        is_active: true,
      })
    }
  }, [shiftType, open])

  const handleSubmit = async () => {
    if (!formData.name || !formData.short_name) return

    setIsSubmitting(true)
    try {
      await onSave({
        practice_id: parseInt(practiceId),
        name: formData.name,
        short_name: formData.short_name,
        start_time: formData.start_time,
        end_time: formData.end_time,
        break_minutes: formData.break_minutes,
        color: formData.color,
        min_staff: formData.min_staff,
        is_active: formData.is_active,
      })
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving shift type:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Schichttyp bearbeiten" : "Neuer Schichttyp"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Ändern Sie die Eigenschaften des Schichttyps." 
              : "Erstellen Sie einen neuen Schichttyp für die Dienstplanung."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="z.B. Frühschicht"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="short_name">Kurzname</Label>
            <Input
              id="short_name"
              value={formData.short_name}
              onChange={(e) => setFormData({ ...formData, short_name: e.target.value })}
              placeholder="z.B. FS"
              maxLength={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="start_time">Beginn</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end_time">Ende</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="break_minutes">Pause (Min.)</Label>
              <Input
                id="break_minutes"
                type="number"
                min={0}
                value={formData.break_minutes}
                onChange={(e) => setFormData({ ...formData, break_minutes: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="min_staff">Min. Personal</Label>
              <Input
                id="min_staff"
                type="number"
                min={1}
                value={formData.min_staff}
                onChange={(e) => setFormData({ ...formData, min_staff: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Farbe</Label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 transition-transform ${
                    formData.color === color ? "border-foreground scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData({ ...formData, color })}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">Aktiv</Label>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !formData.name || !formData.short_name}>
            {isSubmitting ? "Speichern..." : "Speichern"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
