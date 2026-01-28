"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings, Monitor, X, ImageIcon, Loader2 } from "lucide-react"
import { useUser } from "@/contexts/user-context"
import { useToast } from "@/hooks/use-toast"
import { SimpleRichTextEditor } from "./simple-rich-text-editor"
import { cn } from "@/lib/utils"

interface Room {
  id: string
  name: string
}

interface Arbeitsplatz {
  id: string
  name: string
  beschreibung: string | null
  raum_id: string | null
  is_active: boolean
  image_url?: string | null
}

interface EditArbeitsplatzDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  arbeitsplatz: Arbeitsplatz
  onSuccess: () => void
}

export function EditArbeitsplatzDialog({ open, onOpenChange, arbeitsplatz, onSuccess }: EditArbeitsplatzDialogProps) {
  const [name, setName] = useState(arbeitsplatz.name)
  const [beschreibung, setBeschreibung] = useState(arbeitsplatz.beschreibung || "")
  const [raumId, setRaumId] = useState(arbeitsplatz.raum_id || "")
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string>(arbeitsplatz.image_url || "")
  const [imagePreview, setImagePreview] = useState<string>("")
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { currentUser } = useUser()
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      setName(arbeitsplatz.name)
      setBeschreibung(arbeitsplatz.beschreibung || "")
      setRaumId(arbeitsplatz.raum_id || "")
      setImageUrl(arbeitsplatz.image_url || "")
      setImagePreview("")
      fetchRooms()
    }
  }, [open, arbeitsplatz])

  const fetchRooms = async () => {
    try {
      if (!currentUser?.practice_id) return

      const response = await fetch(`/api/practices/${currentUser.practice_id}/rooms`)
      if (!response.ok) throw new Error("Failed to fetch rooms")
      
      const data = await response.json()
      setRooms(data || [])
    } catch (error) {
      console.error("Error fetching rooms:", error)
    }
  }

  const handleImageUpload = async (file: File) => {
    if (!currentUser?.practice_id) return

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Ungültiger Dateityp",
        description: "Nur JPEG, PNG, WebP und GIF sind erlaubt.",
        variant: "destructive",
      })
      return
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast({
        title: "Datei zu groß",
        description: "Maximale Dateigröße ist 5MB.",
        variant: "destructive",
      })
      return
    }

    setIsUploadingImage(true)
    setImagePreview(URL.createObjectURL(file))

    try {
      const formData = new FormData()
      formData.append("file", file)
      if (imageUrl) {
        formData.append("oldImageUrl", imageUrl)
      }

      const response = await fetch(`/api/practices/${currentUser.practice_id}/arbeitsplaetze/upload-image`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Upload fehlgeschlagen")
      }

      const { url } = await response.json()
      setImageUrl(url)
      setImagePreview("")
      toast({ title: "Erfolg", description: "Bild wurde hochgeladen" })
    } catch (error: any) {
      console.error("Error uploading image:", error)
      setImagePreview("")
      toast({
        title: "Fehler",
        description: error.message || "Bild konnte nicht hochgeladen werden",
        variant: "destructive",
      })
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      handleImageUpload(file)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageUpload(file)
    }
  }

  const removeImage = () => {
    setImageUrl("")
    setImagePreview("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!currentUser?.practice_id) throw new Error("No practice ID")
      
      const cleanBeschreibung = beschreibung === "<p></p>" || beschreibung === "" ? null : beschreibung

      const response = await fetch(`/api/practices/${currentUser.practice_id}/arbeitsplaetze/${arbeitsplatz.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          beschreibung: cleanBeschreibung,
          raum_id: raumId && raumId !== "none" ? raumId : null,
          image_url: imageUrl || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update")
      }

      toast({ title: "Erfolg", description: "Arbeitsplatz wurde aktualisiert" })
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("Error updating Arbeitsplatz:", error)
      toast({
        title: "Fehler",
        description: "Fehler beim Aktualisieren des Arbeitsplatzes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Monitor className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Arbeitsplatz bearbeiten</DialogTitle>
              <DialogDescription>Aktualisieren Sie die Details dieses Arbeitsplatzes</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="raum">Raum</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open("/rooms", "_blank")}
                  className="h-auto py-1 px-2 text-xs"
                >
                  <Settings className="mr-1 h-3 w-3" />
                  Räume bearbeiten
                </Button>
              </div>
              <Select value={raumId} onValueChange={setRaumId}>
                <SelectTrigger>
                  <SelectValue placeholder="Raum auswählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Kein Raum</SelectItem>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Arbeitsplatz-Bild</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Laden Sie ein Foto des Arbeitsplatzes hoch (max. 5MB, JPEG/PNG/WebP/GIF)
            </p>

            {imagePreview || imageUrl ? (
              <div className="relative rounded-lg overflow-hidden border bg-muted/30">
                <img src={imagePreview || imageUrl} alt="Arbeitsplatz Vorschau" className="w-full h-48 object-cover" />
                {isUploadingImage && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                  </div>
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={removeImage}
                  disabled={isUploadingImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30",
                )}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 rounded-full bg-muted">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Bild hochladen</p>
                    <p className="text-xs text-muted-foreground">Drag & Drop oder klicken zum Auswählen</p>
                  </div>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="beschreibung">Beschreibung</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Beschreiben Sie detailliert, wofür dieser Arbeitsplatz verwendet wird, welche Aufgaben hier erledigt
              werden und welche Besonderheiten zu beachten sind.
            </p>
            <SimpleRichTextEditor
              content={beschreibung}
              onChange={setBeschreibung}
              placeholder="z.B. Hauptarbeitsplatz für die Patientenanmeldung. Hier werden Termine vergeben, Versicherungskarten eingelesen und Patienten empfangen..."
              minHeight="180px"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading || isUploadingImage}>
              {loading ? "Wird gespeichert..." : "Speichern"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default EditArbeitsplatzDialog
