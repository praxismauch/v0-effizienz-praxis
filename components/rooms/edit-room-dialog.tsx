"use client"

import type React from "react"

import { useState } from "react"
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
import { Loader2 } from "lucide-react"
import { MultiImageUpload } from "@/components/ui/multi-image-upload"

interface EditRoomDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  room: {
    id: string
    name: string
    beschreibung: string | null
    images?: string | null
    color?: string | null
  }
  onSuccess: (room: any) => void
}

export function EditRoomDialog({ open, onOpenChange, room, onSuccess }: EditRoomDialogProps) {
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<string[]>(() => {
    if (room.images) {
      try {
        return JSON.parse(room.images)
      } catch {
        return []
      }
    }
    return []
  })
  const [selectedColor, setSelectedColor] = useState<string>(room.color || "#3b82f6")
  const [formData, setFormData] = useState({
    name: room.name,
    beschreibung: room.beschreibung || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`/api/rooms/${room.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          images: images.length > 0 ? JSON.stringify(images) : null,
          color: selectedColor,
        }),
      })

      if (res.ok) {
        const updatedRoom = await res.json()
        onSuccess(updatedRoom)
      }
    } catch (error) {
      console.error("Error updating room:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Raum bearbeiten</DialogTitle>
          <DialogDescription>Ändern Sie die Details des Raums</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Name *</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-beschreibung">Beschreibung</Label>
            <Textarea
              id="edit-beschreibung"
              value={formData.beschreibung}
              onChange={(e) => setFormData({ ...formData, beschreibung: e.target.value })}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-room-color">Farbe</Label>
            <p className="text-xs text-muted-foreground mb-2">Wählen Sie eine Farbe für diesen Raum</p>
            <div className="flex items-center gap-3">
              <input
                type="color"
                id="edit-room-color"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="h-10 w-14 cursor-pointer rounded-lg border border-border p-1"
              />
              <span className="text-sm text-muted-foreground font-mono">{selectedColor}</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Bilder</Label>
            <MultiImageUpload
              images={images}
              onImagesChange={setImages}
              maxImages={10}
              disabled={loading}
              uploadEndpoint="/api/upload"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Speichern
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default EditRoomDialog
