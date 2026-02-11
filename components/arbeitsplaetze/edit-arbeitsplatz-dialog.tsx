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
import { Settings, Monitor, Palette } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { useUser } from "@/contexts/user-context"
import { useToast } from "@/hooks/use-toast"
import { SimpleRichTextEditor } from "./simple-rich-text-editor"
import { MultiImageUpload } from "@/components/ui/multi-image-upload"

interface Room {
  id: string
  name: string
  color?: string | null
}

interface Arbeitsplatz {
  id: string
  name: string
  beschreibung: string | null
  raum_id: string | null
  is_active: boolean
  image_urls?: string[] | null
  color?: string | null
  use_room_color?: boolean | null
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
  const [raumId, setRaumId] = useState(arbeitsplatz.raum_id || "none")
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(false)
  const [imageUrls, setImageUrls] = useState<string[]>(() => {
    if (arbeitsplatz.image_urls) {
      if (typeof arbeitsplatz.image_urls === "string") {
        try {
          return JSON.parse(arbeitsplatz.image_urls)
        } catch {
          return [arbeitsplatz.image_urls]
        }
      }
      return Array.isArray(arbeitsplatz.image_urls) ? arbeitsplatz.image_urls : []
    }
    return []
  })
  const [selectedColor, setSelectedColor] = useState<string>(arbeitsplatz.color || "#22c55e")
  const [useRoomColor, setUseRoomColor] = useState<boolean>(arbeitsplatz.use_room_color !== false)
  const { currentUser } = useUser()
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      setName(arbeitsplatz.name)
      setBeschreibung(arbeitsplatz.beschreibung || "")
      setRaumId(arbeitsplatz.raum_id || "none")
      setSelectedColor(arbeitsplatz.color || "#22c55e")
      setUseRoomColor(arbeitsplatz.use_room_color !== false)
      if (arbeitsplatz.image_urls) {
        if (typeof arbeitsplatz.image_urls === "string") {
          try {
            setImageUrls(JSON.parse(arbeitsplatz.image_urls))
          } catch {
            setImageUrls([arbeitsplatz.image_urls])
          }
        } else {
          setImageUrls(Array.isArray(arbeitsplatz.image_urls) ? arbeitsplatz.image_urls : [])
        }
      } else {
        setImageUrls([])
      }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!currentUser?.practice_id) {
        throw new Error("No practice ID")
      }
      
      const cleanBeschreibung = beschreibung === "<p></p>" || beschreibung === "" ? null : beschreibung

      const payload = {
        name,
        beschreibung: cleanBeschreibung,
        raum_id: raumId && raumId !== "none" ? raumId : null,
        image_urls: imageUrls.length > 0 ? imageUrls : null,
        color: useRoomColor ? null : selectedColor,
        use_room_color: useRoomColor,
      }

      const response = await fetch(`/api/practices/${currentUser.practice_id}/arbeitsplaetze/${arbeitsplatz.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update")
      }

      await response.json()

      toast({ title: "Erfolg", description: "Arbeitsplatz wurde aktualisiert" })
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("[v0] Edit Arbeitsplatz - Exception:", error)
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Fehler beim Aktualisieren des Arbeitsplatzes",
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
          <div className="grid gap-4 sm:grid-cols-[1fr,auto]">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
                placeholder="z.B. Behandlungsplatz 1"
              />
            </div>

            <div className="space-y-2 sm:min-w-[200px]">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="raum">Raum</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open("/rooms", "_blank")}
                  className="h-auto py-0.5 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Settings className="mr-1 h-3 w-3" />
                  Räume bearbeiten
                </Button>
              </div>
              <Select value={raumId} onValueChange={setRaumId}>
                <SelectTrigger id="raum">
                  <SelectValue>
                    {raumId === "none" || !raumId 
                      ? "Kein Raum" 
                      : rooms.find(r => r.id === raumId)?.name || "Kein Raum"}
                  </SelectValue>
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

          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Farbe
            </Label>
            
            {raumId && raumId !== "none" && (
              <div className="flex items-center space-x-2 p-3 rounded-lg bg-muted/50 border">
                <Checkbox 
                  id="useRoomColor" 
                  checked={useRoomColor}
                  onCheckedChange={(checked) => setUseRoomColor(checked === true)}
                />
                <label
                  htmlFor="useRoomColor"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Raumfarbe verwenden
                  {(() => {
                    const selectedRoom = rooms.find(r => r.id === raumId)
                    if (selectedRoom?.color) {
                      return (
                        <span className="ml-2 inline-flex items-center gap-1.5 text-muted-foreground">
                          <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: selectedRoom.color }} />
                        </span>
                      )
                    }
                    return null
                  })()}
                </label>
              </div>
            )}

            {(!useRoomColor || !raumId || raumId === "none") && (
              <>
                <p className="text-xs text-muted-foreground">
                  {raumId && raumId !== "none" 
                    ? "Manuelle Farbauswahl (überschreibt die Raumfarbe)" 
                    : "Wählen Sie eine Farbe für diesen Arbeitsplatz"}
                </p>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded-lg border border-border p-1"
                  />
                  <span className="text-sm text-muted-foreground font-mono">{selectedColor}</span>
                </div>
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label>Arbeitsplatz-Bilder</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Laden Sie Fotos des Arbeitsplatzes hoch (max. 5MB pro Bild, JPEG/PNG/WebP/GIF)
            </p>
            <MultiImageUpload
              images={imageUrls}
              onImagesChange={setImageUrls}
              maxImages={10}
              disabled={loading}
              uploadEndpoint={`/api/practices/${currentUser?.practice_id}/arbeitsplaetze/upload-image`}
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
            <Button type="submit" disabled={loading}>
              {loading ? "Wird gespeichert..." : "Speichern"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default EditArbeitsplatzDialog
