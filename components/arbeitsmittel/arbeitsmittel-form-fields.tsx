"use client"

import type React from "react"
import { useRef, useCallback, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { NettoBruttoCalculator } from "@/components/ui/netto-brutto-calculator"
import { useToast } from "@/hooks/use-toast"
import { Upload, X, ImageIcon, Loader2 } from "lucide-react"
import Image from "next/image"
import { type ArbeitsmittelFormData, EQUIPMENT_TYPES, CONDITIONS, STATUSES } from "./shared"

interface ArbeitsmittelFormFieldsProps {
  formData: ArbeitsmittelFormData
  onChange: (data: ArbeitsmittelFormData) => void
  teamMembers: { id: string; first_name?: string; last_name?: string; name?: string }[]
  imageUrl: string | null
  onImageChange: (url: string | null) => void
  uploadEndpoint: string
}

export function ArbeitsmittelFormFields({
  formData,
  onChange,
  teamMembers,
  imageUrl,
  onImageChange,
  uploadEndpoint,
}: ArbeitsmittelFormFieldsProps) {
  const [imageUploading, setImageUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const uploadImage = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast({ title: "Fehler", description: "Nur Bilddateien sind erlaubt", variant: "destructive" })
        return
      }
      if (file.size > 50 * 1024 * 1024) {
        toast({ title: "Fehler", description: "Bild darf maximal 50MB gross sein", variant: "destructive" })
        return
      }

      setImageUploading(true)
      try {
        const uploadFormData = new FormData()
        uploadFormData.append("file", file)
        const response = await fetch(uploadEndpoint, { method: "POST", body: uploadFormData })
        if (!response.ok) throw new Error("Upload failed")
        const data = await response.json()
        onImageChange(data.url)
      } catch {
        toast({ title: "Fehler", description: "Bild-Upload fehlgeschlagen", variant: "destructive" })
      } finally {
        setImageUploading(false)
      }
    },
    [uploadEndpoint, onImageChange, toast],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) uploadImage(file)
    },
    [uploadImage],
  )

  const set = (field: keyof ArbeitsmittelFormData, value: string) => {
    onChange({ ...formData, [field]: value })
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Typ *</Label>
          <Select value={formData.type} onValueChange={(v) => set("type", v)} required>
            <SelectTrigger>
              <SelectValue placeholder="Typ auswaehlen" />
            </SelectTrigger>
            <SelectContent>
              {EQUIPMENT_TYPES.map((type) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input id="name" value={formData.name} onChange={(e) => set("name", e.target.value)} required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Beschreibung</Label>
        <Textarea id="description" value={formData.description} onChange={(e) => set("description", e.target.value)} rows={2} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="serial_number">Seriennummer</Label>
          <Input id="serial_number" value={formData.serial_number} onChange={(e) => set("serial_number", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="condition">Zustand</Label>
          <Select value={formData.condition} onValueChange={(v) => set("condition", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CONDITIONS.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="purchase_date">Kaufdatum</Label>
          <Input id="purchase_date" type="date" value={formData.purchase_date} onChange={(e) => set("purchase_date", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="purchase_price">Kaufpreis</Label>
          <NettoBruttoCalculator
            value={formData.purchase_price ? parseFloat(formData.purchase_price) : 0}
            onChange={(val) => set("purchase_price", val.toString())}
            taxRate={19}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(v) => set("status", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="assigned_to">Zugewiesen an</Label>
          <Select value={formData.assigned_to} onValueChange={(v) => set("assigned_to", v)}>
            <SelectTrigger><SelectValue placeholder="Person auswaehlen" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Niemand</SelectItem>
              {teamMembers.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.first_name && m.last_name ? `${m.first_name} ${m.last_name}` : m.name || m.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notizen</Label>
        <Textarea id="notes" value={formData.notes} onChange={(e) => set("notes", e.target.value)} rows={2} />
      </div>

      {/* Image upload */}
      <div className="space-y-2">
        <Label>Bild</Label>
        {imageUrl ? (
          <div className="relative w-32 h-32 rounded-lg border overflow-hidden group">
            <Image src={imageUrl} alt="Arbeitsmittel" fill className="object-cover" />
            <button
              type="button"
              onClick={() => onImageChange(null)}
              className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div
            onDragEnter={() => setIsDragging(true)}
            onDragLeave={() => setIsDragging(false)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
            }`}
          >
            {imageUploading ? (
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            ) : (
              <>
                <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  <Upload className="h-4 w-4 inline mr-1" />
                  Bild hochladen oder hierher ziehen
                </p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) uploadImage(file)
              }}
            />
          </div>
        )}
      </div>
    </>
  )
}
