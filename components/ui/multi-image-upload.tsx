"use client"

import { useRef, useCallback, useState, useEffect } from "react"
import { Button } from "./button"
import { Input } from "./input"
import { X, ImageIcon, Loader2, Upload } from "lucide-react"
import { cn } from "@/lib/utils"

interface MultiImageUploadProps {
  images: string[]
  onImagesChange: (images: string[]) => void
  maxImages?: number
  disabled?: boolean
  uploadEndpoint: string
}

export function MultiImageUpload({
  images,
  onImagesChange,
  maxImages = 10,
  disabled = false,
  uploadEndpoint,
}: MultiImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileUpload = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        return
      }

      if (images.length >= maxImages) {
        return
      }

      setIsUploading(true)

      try {
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch(uploadEndpoint, {
          method: "POST",
          body: formData,
        })

        if (response.ok) {
          const data = await response.json()
          onImagesChange([...images, data.url])
        }
      } catch (error) {
        console.error("Error uploading image:", error)
      } finally {
        setIsUploading(false)
      }
    },
    [images, maxImages, uploadEndpoint, onImagesChange],
  )

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      Array.from(files).forEach((file) => handleFileUpload(file))
    }
  }

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
    if (files) {
      Array.from(files).forEach((file) => {
        if (file.type.startsWith("image/")) {
          handleFileUpload(file)
        }
      })
    }
  }

  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          e.preventDefault()
          const file = item.getAsFile()
          if (file) {
            handleFileUpload(file)
          }
        }
      }
    },
    [handleFileUpload],
  )

  useEffect(() => {
    const dropZone = dropZoneRef.current
    if (!dropZone) return

    const handleGlobalPaste = (e: ClipboardEvent) => {
      if (
        document.activeElement === dropZone ||
        dropZone.contains(document.activeElement as Node)
      ) {
        handlePaste(e)
      }
    }

    document.addEventListener("paste", handleGlobalPaste)
    return () => document.removeEventListener("paste", handleGlobalPaste)
  }, [handlePaste])

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <img
                src={image}
                alt={`Bild ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg border border-border"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                onClick={() => removeImage(index)}
                disabled={disabled || isUploading}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {images.length < maxImages && (
        <div
          ref={dropZoneRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30",
            disabled || isUploading ? "opacity-50 cursor-not-allowed" : "",
          )}
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center gap-2">
            {isUploading ? (
              <>
                <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
                <p className="text-sm text-muted-foreground">Wird hochgeladen...</p>
              </>
            ) : (
              <>
                <div className="p-2 rounded-full bg-muted">
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-sm">Bild hochladen</p>
                  <p className="text-xs text-muted-foreground">
                    Drag & Drop, klicken oder STRG+V (Windows) / CMD+V (Mac) zum Einfügen
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {images.length >= maxImages && (
        <div className="rounded-lg border border-muted-foreground/25 bg-muted/30 p-3 text-center text-sm text-muted-foreground">
          Maximale Anzahl von Bildern erreicht ({images.length}/{maxImages})
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />
    </div>
  )
}
