"use client"

import type React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Upload, Loader2, Camera, X, SwitchCamera } from "lucide-react"
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
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment")
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { toast } = useToast()
  const { currentUser } = useUser()

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setCameraActive(false)
  }, [])

  useEffect(() => {
    if (!open) {
      stopCamera()
      setPreview(null)
    }
  }, [open, stopCamera])

  const cameraInputRef = useRef<HTMLInputElement>(null)

  // Detect mobile device for native camera fallback
  const isMobile = typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

  const startCamera = useCallback(async () => {
    // On mobile, always prefer native capture (more reliable, works in iframes)
    if (isMobile) {
      cameraInputRef.current?.click()
      return
    }

    // On desktop, try getUserMedia for live viewfinder
    if (!navigator.mediaDevices?.getUserMedia) {
      toast({
        title: "Kamera nicht verfügbar",
        description: "Ihr Browser unterstützt keinen Kamerazugriff. Bitte laden Sie ein Bild hoch.",
        variant: "destructive",
      })
      return
    }
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
      })
      streamRef.current = stream
      setCameraActive(true)
      requestAnimationFrame(() => {
        if (videoRef.current) videoRef.current.srcObject = stream
      })
    } catch {
      toast({
        title: "Kamera nicht verfügbar",
        description: "Kamerazugriff wurde verweigert oder ist in dieser Umgebung nicht möglich. Bitte laden Sie ein Bild hoch.",
        variant: "destructive",
      })
    }
  }, [facingMode, isMobile, toast])

  const switchCamera = useCallback(async () => {
    const newMode = facingMode === "environment" ? "user" : "environment"
    setFacingMode(newMode)
    if (!cameraActive) return
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
      })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch {
      toast({ title: "Kamera-Fehler", description: "Kamera konnte nicht gewechselt werden.", variant: "destructive" })
    }
  }, [facingMode, cameraActive, toast])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleImageUpload = useCallback(async function handleImageUploadFn(file: File) {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Fehler", description: "Bitte laden Sie ein Bild hoch", variant: "destructive" })
      return
    }
    setLoading(true)
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)
    try {
      if (!currentUser?.practice_id) throw new Error("Keine Praxis zugeordnet")
      const { compressImageIfLarge } = await import("@/lib/image-compression")
      const compressedFile = await compressImageIfLarge(file)
      const formData = new FormData()
      formData.append("file", compressedFile)
      const uploadResponse = await fetch(`/api/practices/${currentUser.practice_id}/upload`, { method: "POST", body: formData })
      if (!uploadResponse.ok) throw new Error("Bild-Upload fehlgeschlagen")
      const { url: publicUrl } = await uploadResponse.json()
      const response = await fetch("/api/contacts/ai-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: publicUrl, practice_id: currentUser.practice_id, created_by: currentUser.id }),
      })
      if (!response.ok) throw new Error("AI extraction failed")
      const result = await response.json()
      toast({ title: "Erfolg", description: `Kontakt wurde erfolgreich mit ${Math.round(result.confidence * 100)}% Genauigkeit extrahiert` })
      onSuccess()
      onOpenChange(false)
      setPreview(null)
    } catch (error: unknown) {
      toast({ title: "Fehler", description: error instanceof Error ? error.message : "Unbekannter Fehler", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [currentUser, toast, onSuccess, onOpenChange])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.drawImage(video, 0, 0)
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `camera-capture-${Date.now()}.png`, { type: "image/png" })
        stopCamera()
        handleImageUpload(file)
      }
    }, "image/png")
  }, [stopCamera, handleImageUpload])

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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>KI-Kontaktextraktion</DialogTitle>
        </DialogHeader>

        <canvas ref={canvasRef} className="hidden" />

        {cameraActive ? (
          <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden bg-black aspect-[4/3]">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-4 border-2 border-white/40 rounded-lg pointer-events-none" />
              <p className="absolute bottom-2 left-0 right-0 text-center text-white/70 text-xs">
                Visitenkarte im Rahmen positionieren
              </p>
            </div>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" size="sm" onClick={switchCamera}>
                <SwitchCamera className="h-4 w-4 mr-2" />
                Wechseln
              </Button>
              <Button onClick={capturePhoto} className="min-w-[160px]">
                <Camera className="h-4 w-4 mr-2" />
                Foto aufnehmen
              </Button>
              <Button variant="outline" size="sm" onClick={stopCamera}>
                <X className="h-4 w-4 mr-2" />
                Abbrechen
              </Button>
            </div>
          </div>
        ) : (
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
                  <p className="font-medium">Visitenkarte hochladen oder einfugen</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Ziehen Sie ein Bild hierher, laden Sie es hoch oder drucken Sie Strg+V
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
                {/* Native camera capture fallback for mobile or when getUserMedia is blocked */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
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
                    Foto aufnehmen
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default AIContactExtractorDialog
