"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Upload, Loader2, Camera, X } from "lucide-react"
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
  const [cameraActive, setCameraActive] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const { toast } = useToast()
  const { currentUser } = useUser()

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setCameraActive(false)
  }, [])

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
      })
      streamRef.current = stream
      setCameraActive(true)
      // Wait for the video element to be rendered
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      })
    } catch {
      toast({
        title: "Kamera-Fehler",
        description: "Kamera konnte nicht aktiviert werden. Bitte erlauben Sie den Zugriff.",
        variant: "destructive",
      })
    }
  }

  function capturePhoto() {
    if (!videoRef.current) return
    const video = videoRef.current
    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.drawImage(video, 0, 0)
    stopCamera()
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], "kamera-foto.png", { type: "image/png" })
        handleImageUpload(file)
      }
    }, "image/png")
  }

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
    <Dialog open={open} onOpenChange={(v) => { if (!v) stopCamera(); onOpenChange(v) }}>
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
          ) : cameraActive ? (
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full max-h-72 object-cover"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-black/50 text-white hover:bg-black/70"
                  onClick={stopCamera}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Button type="button" onClick={capturePhoto} className="w-full">
                <Camera className="h-4 w-4 mr-2" />
                Foto aufnehmen
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <p className="font-medium">Visitenkarte hochladen oder fotografieren</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Ziehen Sie ein Bild hierher, laden Sie es hoch, drücken Sie Strg+V oder nutzen Sie die Kamera
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
              <div className="flex gap-3 justify-center">
                <Button type="button" onClick={() => document.getElementById("image-upload")?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Bild hochladen
                </Button>
                <Button type="button" variant="outline" onClick={startCamera}>
                  <Camera className="h-4 w-4 mr-2" />
                  Kamera
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AIContactExtractorDialog
