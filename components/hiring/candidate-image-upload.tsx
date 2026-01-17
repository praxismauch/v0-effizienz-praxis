"use client"

import React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Upload, X, User, ZoomIn, Move, Clipboard } from "lucide-react"
import { useTranslation } from "@/contexts/translation-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const TARGET_FILE_SIZE = 2 * 1024 * 1024 // 2MB target after compression

// Compress image if needed
const compressImage = (file: File, maxWidth = 1200, quality = 0.8): Promise<File> => {
  return new Promise((resolve, reject) => {
    // If file is already small enough, return as-is
    if (file.size <= TARGET_FILE_SIZE) {
      resolve(file)
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        let width = img.width
        let height = img.height

        // Scale down if needed
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Could not get canvas context"))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Could not compress image"))
              return
            }
            const compressedFile = new File([blob], file.name, { type: "image/jpeg" })
            resolve(compressedFile)
          },
          "image/jpeg",
          quality,
        )
      }
      img.onerror = () => reject(new Error("Could not load image"))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error("Could not read file"))
    reader.readAsDataURL(file)
  })
}

interface CandidateImageUploadProps {
  imageUrl: string | null
  onImageChange: (url: string | null) => void
  candidateName?: string
}

export function CandidateImageUpload({ imageUrl, onImageChange, candidateName }: CandidateImageUploadProps) {
  const { t } = useTranslation()
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(imageUrl)
  const [imageError, setImageError] = useState(false)
  const [showEditor, setShowEditor] = useState(false)
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null)
  const [cropSettings, setCropSettings] = useState({
    zoom: 1,
    panX: 0,
    panY: 0,
  })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isCompressing, setIsCompressing] = useState(false)
  const imageRef = useRef<HTMLDivElement>(null)
  const pasteInputRef = useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    setImageError(false)
    setPreviewUrl(imageUrl)
  }, [imageUrl])

  const processImageFile = async (file: File): Promise<void> => {
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Dateigröße muss unter 10MB sein")
      return
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Bitte wählen Sie eine Bilddatei")
      return
    }

    setIsCompressing(true)
    try {
      const processedFile = await compressImage(file)

      const reader = new FileReader()
      reader.onloadend = () => {
        setTempImageUrl(reader.result as string)
        setShowEditor(true)
        setCropSettings({ zoom: 1, panX: 0, panY: 0 })
      }
      reader.readAsDataURL(processedFile)

      if (processedFile.size < file.size) {
        toast.success(
          `Bild komprimiert: ${(file.size / 1024 / 1024).toFixed(1)}MB → ${(processedFile.size / 1024 / 1024).toFixed(1)}MB`,
        )
      }
    } catch (error) {
      toast.error("Fehler beim Verarbeiten des Bildes")
    } finally {
      setIsCompressing(false)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await processImageFile(file)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - cropSettings.panX, y: e.clientY - cropSettings.panY })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    e.preventDefault()
    setCropSettings((prev) => ({
      ...prev,
      panX: e.clientX - dragStart.x,
      panY: e.clientY - dragStart.y,
    }))
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setIsDragging(true)
    setDragStart({ x: touch.clientX - cropSettings.panX, y: touch.clientY - cropSettings.panY })
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    e.preventDefault()
    const touch = e.touches[0]
    setCropSettings((prev) => ({
      ...prev,
      panX: touch.clientX - dragStart.x,
      panY: touch.clientY - dragStart.y,
    }))
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  const handleSaveCroppedImage = async () => {
    if (!tempImageUrl) return

    setUploading(true)
    setShowEditor(false)

    try {
      const response = await fetch(tempImageUrl)
      const blob = await response.blob()

      const file = new File([blob], "candidate-image.jpg", { type: "image/jpeg" })

      const formData = new FormData()
      formData.append("file", file)
      if (imageUrl) {
        formData.append("oldImageUrl", imageUrl)
      }
      formData.append("zoom", cropSettings.zoom.toString())
      formData.append("panX", cropSettings.panX.toString())
      formData.append("panY", cropSettings.panY.toString())

      const uploadResponse = await fetch("/api/hiring/candidates/upload-image", {
        method: "POST",
        body: formData,
      })

      if (uploadResponse.ok) {
        const contentType = uploadResponse.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          const data = await uploadResponse.json()
          setPreviewUrl(data.url)
          onImageChange(data.url)
        } else {
          toast.error("Upload fehlgeschlagen: Ungültige Serverantwort")
        }
      } else {
        const contentType = uploadResponse.headers.get("content-type")
        let errorMessage = "Upload fehlgeschlagen"

        if (contentType && contentType.includes("application/json")) {
          const error = await uploadResponse.json()
          errorMessage = error.error || errorMessage
        } else {
          errorMessage = `Upload fehlgeschlagen: ${uploadResponse.status} ${uploadResponse.statusText}`
        }

        toast.error(errorMessage)
      }
    } catch (error) {
      toast.error("Upload fehlgeschlagen")
    } finally {
      setUploading(false)
      setTempImageUrl(null)
    }
  }

  const handleEditImage = () => {
    if (previewUrl) {
      setTempImageUrl(previewUrl)
      setShowEditor(true)
      setCropSettings({ zoom: 1, panX: 0, panY: 0 })
    }
  }

  const handleRemove = async () => {
    if (!imageUrl) return

    try {
      const response = await fetch("/api/hiring/candidates/upload-image", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: imageUrl }),
      })

      if (response.ok) {
        setPreviewUrl(null)
        onImageChange(null)
      }
    } catch (error) {
      toast.error("Fehler beim Löschen des Bildes")
    }
  }

  const getInitials = () => {
    if (!candidateName) return "?"
    const names = candidateName.split(" ")
    return (
      names
        .filter((n) => n.length > 0)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "?"
    )
  }

  const handleImageError = () => {
    setImageError(true)
    setPreviewUrl(null)
  }

  const handlePasteFromClipboard = () => {
    console.log("[v0] handlePasteFromClipboard called")
    if (pasteInputRef.current) {
      console.log("[v0] pasteInputRef.current exists, focusing...")
      pasteInputRef.current.style.pointerEvents = "auto"
      pasteInputRef.current.style.opacity = "0.01"
      pasteInputRef.current.style.position = "fixed"
      pasteInputRef.current.style.left = "-9999px"
      pasteInputRef.current.focus()
      console.log("[v0] Focus set, document.activeElement:", document.activeElement === pasteInputRef.current)
      toast.info("Drücken Sie Strg+V (oder Cmd+V) um ein Bild einzufügen")
    } else {
      console.log("[v0] pasteInputRef.current is null")
    }
  }

  const handlePaste = async (e: React.ClipboardEvent) => {
    console.log("[v0] handlePaste triggered", e)
    const items = e.clipboardData?.items
    console.log("[v0] Clipboard items:", items?.length)
    if (!items) {
      console.log("[v0] No items in clipboard")
      return
    }

    for (let i = 0; i < items.length; i++) {
      console.log("[v0] Item", i, "type:", items[i].type)
      if (items[i].type.startsWith("image/")) {
        const blob = items[i].getAsFile()
        console.log("[v0] Got image blob:", blob)
        if (blob) {
          await processImageFile(blob)
          return
        }
      }
    }
    toast.error("Kein Bild in der Zwischenablage gefunden")
  }

  return (
    <>
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          {!imageError && previewUrl && (
            <AvatarImage
              src={previewUrl || "/placeholder.svg"}
              alt={candidateName || "Candidate"}
              onError={handleImageError}
            />
          )}
          <AvatarFallback className="text-lg">
            {candidateName ? getInitials() : <User className="h-8 w-8" />}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading || isCompressing}
              onClick={() => document.getElementById("candidate-image-input")?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading
                ? t("common.uploading", "Uploading...")
                : isCompressing
                  ? "Wird komprimiert..."
                  : t("hiring.uploadImage", "Bild hochladen")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading || isCompressing}
              onClick={handlePasteFromClipboard}
              title={t("hiring.pasteFromClipboard", "Bild aus Zwischenablage einfügen")}
            >
              <Clipboard className="h-4 w-4 mr-2" />
              {t("hiring.paste", "Einfügen")}
            </Button>
            {previewUrl && !imageError && (
              <>
                <Button type="button" variant="outline" size="sm" onClick={handleEditImage}>
                  <ZoomIn className="h-4 w-4 mr-2" />
                  {t("common.adjust", "Anpassen")}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={handleRemove}>
                  <X className="h-4 w-4 mr-2" />
                  {t("common.remove", "Entfernen")}
                </Button>
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {t("hiring.imageUploadHint", "JPG, PNG oder GIF (max. 10MB, wird automatisch komprimiert)")}
          </p>
        </div>

        <input id="candidate-image-input" type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
        <input
          ref={pasteInputRef}
          type="text"
          className="sr-only"
          onPaste={handlePaste}
          aria-label="Paste image from clipboard"
          tabIndex={-1}
        />
      </div>

      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("hiring.editImage", "Bild anpassen")}</DialogTitle>
            <DialogDescription>
              {t("hiring.adjustImage", "Passen Sie die Position und Größe des Bildes im Kreis an")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {tempImageUrl && (
              <>
                <div className="flex flex-col items-center gap-2">
                  <div
                    ref={imageRef}
                    className="relative w-48 h-48 rounded-full overflow-hidden bg-muted cursor-move touch-none select-none"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  >
                    <img
                      src={tempImageUrl || "/placeholder.svg"}
                      alt="Preview"
                      className="w-full h-full object-cover pointer-events-none"
                      style={{
                        transform: `scale(${cropSettings.zoom}) translate(${cropSettings.panX / cropSettings.zoom}px, ${cropSettings.panY / cropSettings.zoom}px)`,
                        transformOrigin: "center",
                      }}
                      draggable={false}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Move className="h-3 w-3" />
                    {t("hiring.dragToMove", "Ziehen Sie, um das Bild zu verschieben")}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-sm flex items-center gap-2">
                      <ZoomIn className="h-3 w-3" />
                      {t("hiring.zoom", "Zoom")}: {cropSettings.zoom.toFixed(1)}x
                    </Label>
                    <Slider
                      value={[cropSettings.zoom]}
                      onValueChange={([value]) => setCropSettings((prev) => ({ ...prev, zoom: value }))}
                      min={0.5}
                      max={3}
                      step={0.1}
                      className="w-full"
                    />
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCropSettings({ zoom: 1, panX: 0, panY: 0 })}
                    className="w-full"
                  >
                    {t("common.reset", "Zurücksetzen")}
                  </Button>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditor(false)}>
              {t("common.cancel", "Abbrechen")}
            </Button>
            <Button onClick={handleSaveCroppedImage} disabled={!tempImageUrl}>
              {t("common.save", "Speichern")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default CandidateImageUpload
