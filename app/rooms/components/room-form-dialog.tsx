"use client"

import { Button } from "@/components/ui/button"
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
import { Loader2, ImageIcon } from "lucide-react"
import { MultiImageUpload } from "@/components/ui/multi-image-upload"

interface RoomFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  formName: string
  onFormNameChange: (value: string) => void
  formBeschreibung: string
  onFormBeschreibungChange: (value: string) => void
  formColor: string
  onFormColorChange: (value: string) => void
  formImages: string[]
  onFormImagesChange: (images: string[]) => void
  uploadEndpoint: string
  isSaving: boolean
  onSave: () => void
  saveLabel: string
}

export function RoomFormDialog({
  open,
  onOpenChange,
  title,
  description,
  formName,
  onFormNameChange,
  formBeschreibung,
  onFormBeschreibungChange,
  formColor,
  onFormColorChange,
  formImages,
  onFormImagesChange,
  uploadEndpoint,
  isSaving,
  onSave,
  saveLabel,
}: RoomFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="room-name">Name *</Label>
            <Input
              id="room-name"
              placeholder="z.B. Behandlungsraum 1"
              value={formName}
              onChange={(e) => onFormNameChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="room-beschreibung">Beschreibung</Label>
            <Textarea
              id="room-beschreibung"
              placeholder="Optionale Beschreibung des Raums..."
              value={formBeschreibung}
              onChange={(e) => onFormBeschreibungChange(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Farbe</Label>
            <p className="text-xs text-muted-foreground mb-2">Wählen Sie eine Farbe für diesen Raum</p>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formColor}
                onChange={(e) => onFormColorChange(e.target.value)}
                className="h-10 w-14 cursor-pointer rounded-lg border border-border p-1"
              />
              <span className="text-sm text-muted-foreground font-mono">{formColor}</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Bilder
            </Label>
            <p className="text-xs text-muted-foreground mb-2">Laden Sie Bilder des Raums hoch (max. 10 Bilder)</p>
            <MultiImageUpload
              images={formImages}
              onImagesChange={onFormImagesChange}
              maxImages={10}
              uploadEndpoint={uploadEndpoint}
              disabled={isSaving}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={onSave} disabled={isSaving || !formName.trim()}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {saveLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
