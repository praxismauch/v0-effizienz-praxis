"use client"

import { useRef, useCallback, useState, useEffect } from "react"
import { Button } from "./button"
import { X, FileText, Loader2, Upload, ExternalLink, ZoomIn, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { compressImageIfLarge } from "@/lib/image-compression"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export interface UploadedFile {
  url: string
  name: string
  type: string
  size: number
  uploaded_at: string
}

interface MultiFileUploadProps {
  files: UploadedFile[]
  onFilesChange: (files: UploadedFile[]) => void
  maxFiles?: number
  disabled?: boolean
  uploadEndpoint?: string
  folder?: string
  accept?: string
  label?: string
  hint?: string
}

const DEFAULT_ACCEPT = ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp"

export function MultiFileUpload({
  files,
  onFilesChange,
  maxFiles = 20,
  disabled = false,
  uploadEndpoint = "/api/upload",
  folder = "uploads",
  accept = DEFAULT_ACCEPT,
  label = "Dateien hochladen",
  hint = "PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (max. 10MB)",
}: MultiFileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [previewName, setPreviewName] = useState("")

  const isImageFile = (file: UploadedFile | File) => {
    const type = "type" in file ? file.type : ""
    const name = file.name?.toLowerCase() || ""
    return type.startsWith("image/") || [".jpg", ".jpeg", ".png", ".gif", ".webp"].some((ext) => name.endsWith(ext))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleUpload = useCallback(
    async (inputFiles: File[]) => {
      if (!inputFiles.length || files.length >= maxFiles) return

      // Limit to remaining capacity
      const filesToUpload = inputFiles.slice(0, maxFiles - files.length)
      setIsUploading(true)

      try {
        const formData = new FormData()

        for (const file of filesToUpload) {
          // Client-side image compression
          if (file.type.startsWith("image/")) {
            const compressed = await compressImageIfLarge(file)
            formData.append("files", compressed)
          } else {
            formData.append("files", file)
          }
        }
        formData.append("folder", folder)

        const res = await fetch(uploadEndpoint, { method: "POST", body: formData })
        if (!res.ok) throw new Error("Upload fehlgeschlagen")
        const data = await res.json()

        const newFiles: UploadedFile[] = data.files
          ? data.files.filter((f: any) => !f.error)
          : [{ url: data.url, name: data.fileName, type: "image/jpeg", size: data.fileSize, uploaded_at: new Date().toISOString() }]

        onFilesChange([...files, ...newFiles])
        toast.success(`${newFiles.length} Datei(en) hochgeladen`)
      } catch {
        toast.error("Fehler beim Hochladen der Datei(en)")
      } finally {
        setIsUploading(false)
      }
    },
    [files, maxFiles, uploadEndpoint, folder, onFilesChange],
  )

  // File input handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleUpload(Array.from(e.target.files))
    }
    e.target.value = ""
  }

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false) }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFiles = Array.from(e.dataTransfer.files)
    if (droppedFiles.length) handleUpload(droppedFiles)
  }

  // Ctrl+V / Cmd+V paste handler
  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      const pastedFiles: File[] = []
      for (const item of Array.from(items)) {
        if (item.kind === "file") {
          const file = item.getAsFile()
          if (file) {
            e.preventDefault()
            pastedFiles.push(file)
          }
        }
      }
      if (pastedFiles.length) handleUpload(pastedFiles)
    },
    [handleUpload],
  )

  // Attach global paste listener when dropzone is focused or hovered
  useEffect(() => {
    const dropZone = dropZoneRef.current
    if (!dropZone) return

    const onGlobalPaste = (e: ClipboardEvent) => {
      if (document.activeElement === dropZone || dropZone.contains(document.activeElement as Node)) {
        handlePaste(e)
      }
    }

    document.addEventListener("paste", onGlobalPaste)
    return () => document.removeEventListener("paste", onGlobalPaste)
  }, [handlePaste])

  const removeFile = async (url: string) => {
    try {
      await fetch("/api/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })
    } catch {
      // silent — file is removed from UI regardless
    }
    onFilesChange(files.filter((f) => f.url !== url))
  }

  // Separate images and documents for display
  const imageFiles = files.filter(isImageFile)
  const docFiles = files.filter((f) => !isImageFile(f))

  return (
    <div className="space-y-4">
      {/* Image grid */}
      {imageFiles.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {imageFiles.map((file) => (
            <div key={file.url} className="relative group">
              <img
                src={file.url}
                alt={file.name}
                className="w-full h-24 object-cover rounded-lg border border-border"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1.5">
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => { setPreviewImage(file.url); setPreviewName(file.name) }}
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => removeFile(file.url)}
                  disabled={disabled || isUploading}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-gradient-to-t from-black/70 to-transparent rounded-b-lg">
                <p className="text-[11px] text-white truncate">{file.name}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document list */}
      {docFiles.length > 0 && (
        <div className="space-y-2">
          {docFiles.map((file) => (
            <div
              key={file.url}
              className="flex items-center justify-between p-2.5 bg-muted rounded-lg group hover:bg-muted/80 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="h-9 w-9 rounded bg-background flex items-center justify-center flex-shrink-0 border border-border">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => window.open(file.url, "_blank")}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 hover:text-destructive"
                  onClick={() => removeFile(file.url)}
                  disabled={disabled || isUploading}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dropzone */}
      {files.length < maxFiles && (
        <div
          ref={dropZoneRef}
          tabIndex={0}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30",
            (disabled || isUploading) && "opacity-50 cursor-not-allowed",
          )}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (!disabled && !isUploading) fileInputRef.current?.click()
          }}
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
                  <Upload className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-sm">{label}</p>
                  <p className="text-xs text-muted-foreground">
                    Drag & Drop, klicken oder STRG+V / CMD+V zum Einfügen
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {files.length >= maxFiles && (
        <div className="rounded-lg border border-muted-foreground/25 bg-muted/30 p-3 text-center text-sm text-muted-foreground">
          Maximale Anzahl von Dateien erreicht ({files.length}/{maxFiles})
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Image Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="truncate pr-8">{previewName}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center overflow-hidden rounded-lg bg-muted/50">
            {previewImage && (
              <img src={previewImage} alt={previewName} className="max-w-full max-h-[70vh] object-contain" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
