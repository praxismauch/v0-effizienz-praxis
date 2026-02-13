"use client"

import type React from "react"
import { useState, useCallback, useEffect, useRef } from "react"
import { Loader2, Upload, Clipboard, X } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface DeviceDetailsTabProps {
  images: string[]
  setImages: React.Dispatch<React.SetStateAction<string[]>>
  practiceId: string | undefined
}

export function DeviceDetailsTab({ images, setImages, practiceId }: DeviceDetailsTabProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const imageDropZoneRef = useRef<HTMLDivElement>(null)

  const handleImageUpload = useCallback(
    async (file: File) => {
      if (!practiceId) {
        toast({ title: "Fehler", description: "Keine Praxis ausgewählt", variant: "destructive" })
        return
      }
      if (!file.type.startsWith("image/")) {
        toast({ title: "Fehler", description: "Bitte wählen Sie eine Bilddatei aus.", variant: "destructive" })
        return
      }
      if (file.size > 50 * 1024 * 1024) {
        toast({ title: "Fehler", description: "Das Bild darf maximal 50MB groß sein.", variant: "destructive" })
        return
      }

      setImageUploading(true)
      try {
        const { compressImageIfLarge } = await import("@/lib/image-compression")
        const compressedFile = await compressImageIfLarge(file)
        const uploadFormData = new FormData()
        uploadFormData.append("file", compressedFile)

        const response = await fetch(`/api/practices/${practiceId}/devices/upload-image`, {
          method: "POST",
          body: uploadFormData,
        })

        if (response.ok) {
          const data = await response.json()
          setImages((prev) => [...prev, data.url])
          toast({ title: "Erfolg", description: "Bild wurde hochgeladen" })
        } else {
          const error = await response.json()
          toast({ title: "Fehler", description: error.error || "Upload fehlgeschlagen", variant: "destructive" })
        }
      } catch {
        toast({ title: "Fehler", description: "Upload fehlgeschlagen", variant: "destructive" })
      } finally {
        setImageUploading(false)
      }
    },
    [practiceId, setImages],
  )

  const handleRemoveImage = async (index: number) => {
    const imageUrl = images[index]
    try {
      if (imageUrl.includes("blob.vercel-storage.com")) {
        await fetch(`/api/practices/${practiceId}/devices/upload-image`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: imageUrl }),
        })
      }
    } catch (error) {
      console.error("Error deleting image:", error)
    }
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent | ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          e.preventDefault()
          const file = item.getAsFile()
          if (file) await handleImageUpload(file)
        }
      }
    },
    [handleImageUpload],
  )

  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      if (
        document.activeElement === imageDropZoneRef.current ||
        imageDropZoneRef.current?.contains(document.activeElement as Node)
      ) {
        handlePaste(e)
      }
    }
    document.addEventListener("paste", handleGlobalPaste)
    return () => document.removeEventListener("paste", handleGlobalPaste)
  }, [handlePaste])

  return (
    <div className="space-y-2">
      <div
        ref={imageDropZoneRef}
        tabIndex={0}
        onDrop={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setIsDragOver(false)
          const files = e.dataTransfer.files
          if (files) Array.from(files).forEach((file) => { if (file.type.startsWith("image/")) handleImageUpload(file) })
        }}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(true) }}
        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(false) }}
        onPaste={handlePaste}
        onClick={() => imageInputRef.current?.click()}
        className={`
          mt-1.5 border-2 border-dashed rounded-lg p-4 cursor-pointer transition-all
          focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
          ${isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"}
        `}
      >
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => { const files = e.target.files; if (files) Array.from(files).forEach((file) => handleImageUpload(file)) }}
          className="hidden"
        />

        {imageUploading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Bild wird hochgeladen...</span>
          </div>
        ) : images.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="flex items-center gap-2 mb-2">
              <Clipboard className="h-5 w-5 text-muted-foreground" />
              <Upload className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">Bilder hier einfügen oder ablegen</p>
            <p className="text-xs text-muted-foreground mt-1">
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Strg</kbd>
              {" + "}
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">V</kbd>
              {" zum Einfügen oder Drag & Drop"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">PNG, JPG, GIF bis 5MB - Mehrere Bilder möglich</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-2">
              {images.map((url, index) => (
                <div key={index} className="relative group aspect-square">
                  <img
                    src={url || "/placeholder.svg"}
                    alt={`Gerätebild ${index + 1}`}
                    className="w-full h-full object-cover rounded-md border"
                  />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleRemoveImage(index) }}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <div className="aspect-square border-2 border-dashed border-muted-foreground/25 rounded-md flex flex-col items-center justify-center text-muted-foreground hover:border-primary/50 hover:bg-muted/50 transition-colors">
                <Upload className="h-4 w-4 mb-1" />
                <span className="text-xs">Mehr</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Klicken oder <kbd className="px-1 py-0.5 bg-muted rounded text-xs font-mono">Strg+V</kbd> für weitere Bilder
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
