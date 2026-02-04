"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
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
import { usePractice } from "@/contexts/practice-context"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Upload, X, ImageIcon, Loader2 } from "lucide-react"
import Image from "next/image"

interface CreateArbeitsmittelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
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

export function CreateArbeitsmittelDialog({
  open,
  onOpenChange,
  onSuccess,
  teamMembers,
}: CreateArbeitsmittelDialogProps) {
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
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageUploading, setImageUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const { currentPractice } = usePractice()
  const { user } = useAuth()
  const { toast } = useToast()

  // Handle image upload
  const uploadImage = useCallback(async (file: File) => {
    if (!currentPractice?.id) return
    if (!file.type.startsWith("image/")) {
      toast({ title: "Fehler", description: "Nur Bilddateien sind erlaubt", variant: "destructive" })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Fehler", description: "Bild darf maximal 5MB groß sein", variant: "destructive" })
      return
    }

    setImageUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch(`/api/practices/${currentPractice.id}/arbeitsmittel/upload-image`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Upload fehlgeschlagen")

      const data = await response.json()
      setImageUrl(data.url)
      toast({ title: "Erfolgreich", description: "Bild wurde hochgeladen" })
    } catch (error) {
      toast({ title: "Fehler", description: "Bild konnte nicht hochgeladen werden", variant: "destructive" })
    } finally {
      setImageUploading(false)
    }
  }, [currentPractice?.id, toast])

  // Handle paste (CTRL+V)
  useEffect(() => {
    if (!open) return

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile()
          if (file) uploadImage(file)
          break
        }
      }
    }

    document.addEventListener("paste", handlePaste)
    return () => document.removeEventListener("paste", handlePaste)
  }, [open, uploadImage])

  // Handle drag and drop
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
    const files = e.dataTransfer.files
    if (files.length > 0) {
      uploadImage(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      uploadImage(files[0])
    }
  }

  const removeImage = () => {
    setImageUrl(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      if (!currentPractice?.id) {
        toast({
          title: "Fehler",
          description: "Keine Praxis zugeordnet. Bitte laden Sie die Seite neu.",
          variant: "destructive",
        })
        return
      }

      const response = await fetch(`/api/practices/${currentPractice.id}/arbeitsmittel`, {
        method: "POST",
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
          created_by: user?.id || null,
          assigned_to: formData.assigned_to || null,
          assigned_date: formData.assigned_to ? new Date().toISOString().split("T")[0] : null,
          image_url: imageUrl,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create")
      }

      toast({
        title: "Erfolgreich",
        description: "Arbeitsmittel wurde erstellt.",
      })
      onSuccess()
      onOpenChange(false)
      setFormData({
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
    } catch (error: any) {
      console.error("Error creating arbeitsmittel:", error)
      toast({
        title: "Fehler",
        description: error?.message || "Fehler beim Erstellen des Arbeitsmittels",
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
          <DialogTitle>Arbeitsmittel hinzufügen</DialogTitle>
          <DialogDescription>
            Fügen Sie ein neues Arbeitsmittel wie Schlüssel, Dienstkleidung oder Geräte hinzu
          </DialogDescription>
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
                <SelectContent position="popper" className="max-h-[300px]">
                  <SelectItem value="__none__">Nicht zugewiesen</SelectItem>
                  {teamMembers && teamMembers.length > 0 ? (
                    teamMembers.map((member) => {
                      const memberId = member.user_id || member.id || member.team_member_id
                      if (!memberId) return null
                      const firstName = member.firstName || member.first_name || ""
                      const lastName = member.lastName || member.last_name || ""
                      const displayName = member.name || `${firstName} ${lastName}`.trim() || member.email || "Unbekannt"
                      return (
                        <SelectItem key={memberId} value={memberId}>
                          {displayName}
                        </SelectItem>
                      )
                    })
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

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Bild</Label>
            <div
              ref={dropZoneRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
                ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}
                ${imageUrl ? "border-solid border-muted" : ""}
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {imageUploading ? (
                <div className="flex flex-col items-center gap-2 py-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Bild wird hochgeladen...</p>
                </div>
              ) : imageUrl ? (
                <div className="relative">
                  <Image
                    src={imageUrl || "/placeholder.svg"}
                    alt="Vorschau"
                    width={200}
                    height={150}
                    className="mx-auto rounded-md object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeImage()
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-4">
                  <div className="rounded-full bg-muted p-3">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Bild hochladen</p>
                    <p className="text-xs text-muted-foreground">
                      Drag & Drop, Klicken oder STRG+V zum Einfügen
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading || !currentPractice?.id}>
              {loading ? "Wird erstellt..." : "Erstellen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateArbeitsmittelDialog
