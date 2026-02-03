"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Camera, Upload, Link, X, RotateCcw, ZoomIn, Move, ClipboardPaste, Keyboard } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
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

interface ProfileImageEditorProps {
  currentAvatar?: string
  userName: string
  onAvatarChange: (avatarUrl: string) => void
  trigger?: React.ReactNode
}

export const ProfileImageEditor = ({ currentAvatar, userName, onAvatarChange, trigger }: ProfileImageEditorProps) => {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("upload")
  const [urlInput, setUrlInput] = useState(currentAvatar || "")
  const [previewUrl, setPreviewUrl] = useState(currentAvatar || "")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [cropSettings, setCropSettings] = useState({
    zoom: 3,
    rotation: 0,
    panX: 0,
    panY: 0,
  })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [dragActiveUpload, setDragActiveUpload] = useState(false)
  const [isPasting, setIsPasting] = useState(false)
  const [isCompressing, setIsCompressing] = useState(false)
  const [showPasteHint, setShowPasteHint] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const handlePaste = async (e: ClipboardEvent) => {
      if (activeTab === "url" && document.activeElement?.tagName === "INPUT") {
        return
      }

      const items = e.clipboardData?.items
      if (!items) return

      for (const item of items) {
        if (item.type.startsWith("image/")) {
          e.preventDefault()
          e.stopPropagation()
          const file = item.getAsFile()
          if (file) {
            setShowPasteHint(false)
            await processImageFile(file)
            toast.success("Bild aus Zwischenablage eingefügt!")
          }
          return
        }
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Control" || e.key === "Meta") {
        setShowPasteHint(true)
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        // Let the native paste event handle it, but ensure we're listening
        console.log("[v0] Ctrl+V detected in dialog")
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Control" || e.key === "Meta") {
        setShowPasteHint(false)
      }
    }

    document.addEventListener("paste", handlePaste, true)
    document.addEventListener("keydown", handleKeyDown, true)
    document.addEventListener("keyup", handleKeyUp, true)

    return () => {
      document.removeEventListener("paste", handlePaste, true)
      document.removeEventListener("keydown", handleKeyDown, true)
      document.removeEventListener("keyup", handleKeyUp, true)
    }
  }, [open, activeTab])

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
      setSelectedFile(processedFile)

      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setPreviewUrl(result)
        setActiveTab("crop")
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

  const handlePasteFromClipboard = async () => {
    try {
      setIsPasting(true)
      const clipboardItems = await navigator.clipboard.read()

      for (const item of clipboardItems) {
        const imageTypes = item.types.filter((type) => type.startsWith("image/"))

        if (imageTypes.length > 0) {
          const blob = await item.getType(imageTypes[0])
          const file = new File([blob], "clipboard-image.png", { type: imageTypes[0] })
          await processImageFile(file)
          setIsPasting(false)
          return
        }
      }

      toast.error("Kein Bild in der Zwischenablage gefunden")
      setIsPasting(false)
    } catch (error) {
      toast.error(
        "Konnte nicht auf die Zwischenablage zugreifen. Bitte erlauben Sie den Zugriff oder verwenden Sie Strg+V.",
      )
      setIsPasting(false)
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      await processImageFile(file)
    }
  }

  const handleDragEnterUpload = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActiveUpload(true)
  }

  const handleDragLeaveUpload = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActiveUpload(false)
  }

  const handleDragOverUpload = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDropUpload = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActiveUpload(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      await processImageFile(files[0])
    }
  }

  const handleUrlChange = (url: string) => {
    setUrlInput(url)
    setPreviewUrl(url)
    setSelectedFile(null)
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

  const handleSave = () => {
    if (selectedFile) {
      onAvatarChange(previewUrl)
    } else if (urlInput) {
      onAvatarChange(urlInput)
    }
    setOpen(false)
    resetEditor()
  }

  const handleRemove = () => {
    onAvatarChange("")
    setOpen(false)
    resetEditor()
  }

  const resetEditor = () => {
    setUrlInput("")
    setPreviewUrl("")
    setSelectedFile(null)
    setCropSettings({ zoom: 3, rotation: 0, panX: 0, panY: 0 })
    setActiveTab("upload")
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const defaultTrigger = (
    <Button variant="outline" size="icon" onClick={() => setOpen(true)}>
      <Camera className="h-4 w-4" />
    </Button>
  )

  return (
    <>
      {trigger ? <div onClick={() => setOpen(true)}>{trigger}</div> : defaultTrigger}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md" ref={dialogRef}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Profilbild bearbeiten
            </DialogTitle>
            <DialogDescription>Laden Sie ein neues Bild hoch oder geben Sie eine URL ein</DialogDescription>
          </DialogHeader>

          {showPasteHint && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="bg-primary/20 rounded-full p-2">
                <Keyboard className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-primary">Strg + V drücken</p>
                <p className="text-xs text-muted-foreground">um ein Bild aus der Zwischenablage einzufügen</p>
              </div>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload" className="gap-1">
                <Upload className="h-3 w-3" />
                Hochladen
              </TabsTrigger>
              <TabsTrigger value="url" className="gap-1">
                <Link className="h-3 w-3" />
                URL
              </TabsTrigger>
              <TabsTrigger value="crop" disabled={!selectedFile && !previewUrl}>
                <ZoomIn className="h-3 w-3" />
                Vorschau
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              <div className="space-y-4">
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${
                    dragActiveUpload
                      ? "border-primary bg-primary/10 scale-[1.02]"
                      : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
                  }`}
                  onDragEnter={handleDragEnterUpload}
                  onDragLeave={handleDragLeaveUpload}
                  onDragOver={handleDragOverUpload}
                  onDrop={handleDropUpload}
                >
                  <div className="space-y-3">
                    <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                        <Button variant="outline" onClick={triggerFileInput} disabled={isCompressing}>
                          {isCompressing ? "Wird verarbeitet..." : "Datei auswählen"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handlePasteFromClipboard}
                          disabled={isPasting || isCompressing}
                          className="gap-1 bg-transparent"
                        >
                          <ClipboardPaste className="h-4 w-4" />
                          {isPasting ? "Wird eingefügt..." : "Einfügen"}
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">oder Bild hierher ziehen</p>
                    </div>

                    <div className="flex items-center justify-center gap-2 pt-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted rounded px-2 py-1">
                        <Keyboard className="h-3 w-3" />
                        <span>Tipp:</span>
                        <kbd className="px-1.5 py-0.5 bg-background rounded text-[10px] font-mono border shadow-sm">
                          Strg
                        </kbd>
                        <span>+</span>
                        <kbd className="px-1.5 py-0.5 bg-background rounded text-[10px] font-mono border shadow-sm">
                          V
                        </kbd>
                        <span>zum direkten Einfügen</span>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, GIF bis 10MB (wird automatisch komprimiert)
                    </p>
                  </div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
              </div>
            </TabsContent>

            <TabsContent value="url" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="avatar-url">Bild-URL</Label>
                <Input
                  id="avatar-url"
                  placeholder="https://beispiel.de/avatar.jpg"
                  value={urlInput}
                  onChange={(e) => handleUrlChange(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Geben Sie einen direkten Link zu einer Bilddatei ein</p>
              </div>
            </TabsContent>

            <TabsContent value="crop" className="space-y-4">
              {previewUrl && (
                <div className="space-y-4">
                  <div className="flex flex-col items-center gap-2">
                    <div
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
                        src={previewUrl || "/placeholder.svg"}
                        alt="Preview"
                        className="w-full h-full object-cover pointer-events-none"
                        style={{
                          transform: `scale(${cropSettings.zoom}) rotate(${cropSettings.rotation}deg) translate(${cropSettings.panX / cropSettings.zoom}px, ${cropSettings.panY / cropSettings.zoom}px)`,
                          transformOrigin: "center",
                        }}
                        draggable={false}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Move className="h-3 w-3" />
                      Ziehen zum Positionieren
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-sm flex items-center gap-2">
                        <ZoomIn className="h-3 w-3" />
                        Zoom: {cropSettings.zoom.toFixed(1)}x
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

                    <div className="space-y-2">
                      <Label className="text-sm flex items-center gap-2">
                        <RotateCcw className="h-3 w-3" />
                        Drehung: {cropSettings.rotation}°
                      </Label>
                      <Slider
                        value={[cropSettings.rotation]}
                        onValueChange={([value]) => setCropSettings((prev) => ({ ...prev, rotation: value }))}
                        min={0}
                        max={360}
                        step={15}
                        className="w-full"
                      />
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCropSettings({ zoom: 3, rotation: 0, panX: 0, panY: 0 })}
                      className="w-full"
                    >
                      Zurücksetzen
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Abbrechen
            </Button>
            {currentAvatar && (
              <Button variant="destructive" onClick={handleRemove}>
                <X className="h-4 w-4 mr-1" />
                Entfernen
              </Button>
            )}
            <Button onClick={handleSave} disabled={!previewUrl}>
              Bild speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ProfileImageEditor
