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
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { MultiImageUpload } from "@/components/ui/multi-image-upload"

interface CreateRoomDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  practiceId: string
  onSuccess: (room: any) => void
}

export function CreateRoomDialog({ open, onOpenChange, practiceId, onSuccess }: CreateRoomDialogProps) {
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [formData, setFormData] = useState({
    name: "",
    beschreibung: "",
  })
  const { user, loading: authLoading } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast.error("Fehler", { description: "Sie müssen angemeldet sein" })
      return
    }

    if (!practiceId) {
      toast.error("Fehler", { description: "Keine Praxis ausgewählt" })
      return
    }

    if (!formData.name.trim()) {
      toast.error("Fehler", { description: "Bitte geben Sie einen Namen ein" })
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          practice_id: practiceId,
          images: images.length > 0 ? JSON.stringify(images) : null,
        }),
      })

      if (!res.ok) {
        let errorMessage = "Raum konnte nicht erstellt werden"
        try {
          const errorData = await res.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          // Response might not be JSON
        }
        toast.error("Fehler", { description: errorMessage })
        return
      }

      const newRoom = await res.json()
      toast.success("Erfolg", { description: "Raum wurde erstellt" })
      onSuccess(newRoom)
      setFormData({ name: "", beschreibung: "" })
      onOpenChange(false)
    } catch (error) {
      console.error("Error creating room:", error)
      toast.error("Fehler", { description: "Ein unerwarteter Fehler ist aufgetreten" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neuer Raum</DialogTitle>
          <DialogDescription>Fügen Sie einen neuen Raum zu Ihrer Praxis hinzu</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="z.B. Behandlungsraum 1"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="beschreibung">Beschreibung</Label>
            <Textarea
              id="beschreibung"
              value={formData.beschreibung}
              onChange={(e) => setFormData({ ...formData, beschreibung: e.target.value })}
              placeholder="Optionale Beschreibung des Raums"
              rows={3}
            />
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
            <Button type="submit" disabled={loading || authLoading || !user || !formData.name.trim()}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Raum erstellen
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateRoomDialog
