"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Upload, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/contexts/user-context"

interface AIContactExtractorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AIContactExtractorDialog({ open, onOpenChange, onSuccess }: AIContactExtractorDialogProps) {
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const { toast } = useToast()
  const { currentUser } = useUser()

  async function handleImageUpload(file: File) {
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Fehler",
        description: "Bitte laden Sie ein Bild hoch",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    try {
      if (!currentUser?.practice_id) throw new Error("Keine Praxis zugeordnet")

      // Upload image via Blob API
      const formData = new FormData()
      formData.append("file", file)
      
      const uploadResponse = await fetch(`/api/practices/${currentUser.practice_id}/upload`, {
        method: "POST",
        body: formData,
      })
      
      if (!uploadResponse.ok) throw new Error("Bild-Upload fehlgeschlagen")
      
      const { url: publicUrl } = await uploadResponse.json()

      const response = await fetch("/api/contacts/ai-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: publicUrl,
          practice_id: currentUser.practice_id,
          created_by: currentUser.id,
        }),
      })

      if (!response.ok) throw new Error("AI extraction failed")

      const result = await response.json()

      toast({
        title: "Erfolg",
        description: `Kontakt wurde erfolgreich mit ${Math.round(result.confidence * 100)}% Genauigkeit extrahiert`,
      })
      onSuccess()
      onOpenChange(false)
      setPreview(null)
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const items = e.clipboardData.items
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        const file = items[i].getAsFile()
        if (file) handleImageUpload(file)
        break
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>KI-Kontaktextraktion</DialogTitle>
        </DialogHeader>
        <div
          className="border-2 border-dashed rounded-lg p-8 text-center"
          onPaste={handlePaste}
          onDrop={(e) => {
            e.preventDefault()
            const file = e.dataTransfer.files[0]
            if (file) handleImageUpload(file)
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          {loading ? (
            <div className="space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground">KI extrahiert Kontaktdaten...</p>
            </div>
          ) : preview ? (
            <div className="space-y-4">
              <img src={preview || "/placeholder.svg"} alt="Preview" className="max-h-64 mx-auto rounded" />
              <p className="text-sm text-muted-foreground">Bild wird verarbeitet...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <p className="font-medium">Visitenkarte hochladen oder einfügen</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Ziehen Sie ein Bild hierher, laden Sie es hoch oder drücken Sie Strg+V
                </p>
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="image-upload"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleImageUpload(file)
                }}
              />
              <Button type="button" onClick={() => document.getElementById("image-upload")?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Bild hochladen
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AIContactExtractorDialog
