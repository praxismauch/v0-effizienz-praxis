"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Upload, X, FileText, Eye, ImageIcon, Loader2, Check, ZoomIn } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface DocumentFile {
  name: string
  url: string
  size: number
  type?: string
}

interface DocumentCategory {
  key: string
  label: string
  files: DocumentFile[]
  acceptedTypes: string
  isImageCategory?: boolean
}

interface CandidateDocumentsUploadProps {
  documents?: {
    lebenslauf?: DocumentFile[]
    bewerbung?: DocumentFile[]
    zeugnisse?: DocumentFile[]
    sonstiges?: DocumentFile[]
    bilder?: DocumentFile[]
  }
  onDocumentsChange: (documents: any) => void
}

export function CandidateDocumentsUpload({ documents = {}, onDocumentsChange }: CandidateDocumentsUploadProps) {
  const { toast } = useToast()
  const [uploading, setUploading] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [dragActive, setDragActive] = useState<Record<string, boolean>>({})
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [previewImageName, setPreviewImageName] = useState<string>("")

  const categories: DocumentCategory[] = [
    { key: "lebenslauf", label: "Lebenslauf", files: documents.lebenslauf || [], acceptedTypes: ".pdf,.doc,.docx,.jpg,.jpeg,.png" },
    { key: "bewerbung", label: "Bewerbung", files: documents.bewerbung || [], acceptedTypes: ".pdf,.doc,.docx,.jpg,.jpeg,.png" },
    { key: "zeugnisse", label: "Zeugnisse", files: documents.zeugnisse || [], acceptedTypes: ".pdf,.doc,.docx,.jpg,.jpeg,.png" },
    { key: "bilder", label: "Bilder & Medien", files: documents.bilder || [], acceptedTypes: "image/jpeg,image/png,image/gif,image/jpg", isImageCategory: true },
    { key: "sonstiges", label: "Sonstiges", files: documents.sonstiges || [], acceptedTypes: ".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif" },
  ]

  const isImageFile = (file: DocumentFile): boolean => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    const fileName = file.name.toLowerCase()
    return imageExtensions.some(ext => fileName.endsWith(ext)) || (file.type?.startsWith('image/') ?? false)
  }

  const handleFileUpload = async (category: string, files: FileList | null, isImageCategory: boolean = false) => {
    if (!files || files.length === 0) return

    // Validate image files for image category
    if (isImageCategory) {
      const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg']
      const invalidFiles = Array.from(files).filter(f => !validImageTypes.includes(f.type))
      if (invalidFiles.length > 0) {
        toast({
          variant: "destructive",
          title: "Ungültige Dateien",
          description: "Nur JPEG, PNG und GIF Bilder sind erlaubt.",
        })
        return
      }
    }

    setUploading(category)
    setUploadProgress(0)

    try {
      const uploadedFiles: DocumentFile[] = []
      const totalFiles = files.length

      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        if (file.size > 10 * 1024 * 1024) {
          toast({
            variant: "destructive",
            title: "Fehler",
            description: `${file.name} ist zu groß (max. 10MB)`,
          })
          continue
        }

        // Upload to Blob storage
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/hiring/candidates/upload-document", {
          method: "POST",
          body: formData,
        })

        if (response.ok) {
          const { url } = await response.json()
          uploadedFiles.push({
            name: file.name,
            url,
            size: file.size,
            type: file.type,
          })
        }

        // Update progress
        setUploadProgress(Math.round(((i + 1) / totalFiles) * 100))
      }

      // Update documents state
      const updatedDocuments = {
        ...documents,
        [category]: [...(documents[category as keyof typeof documents] || []), ...uploadedFiles],
      }

      onDocumentsChange(updatedDocuments)

      const fileType = isImageCategory ? "Bild(er)" : "Datei(en)"
      toast({
        title: "Erfolg",
        description: `${uploadedFiles.length} ${fileType} hochgeladen`,
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Fehler beim Hochladen der Dateien",
      })
    } finally {
      setUploading(null)
      setUploadProgress(0)
    }
  }

  const openImagePreview = (url: string, name: string) => {
    setPreviewImage(url)
    setPreviewImageName(name)
  }

  const handleRemoveFile = (category: string, fileIndex: number) => {
    const updatedDocuments = {
      ...documents,
      [category]: (documents[category as keyof typeof documents] || []).filter((_, index) => index !== fileIndex),
    }
    onDocumentsChange(updatedDocuments)
  }

  const handleDragEnter = (e: React.DragEvent, category: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive((prev) => ({ ...prev, [category]: true }))
  }

  const handleDragLeave = (e: React.DragEvent, category: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive((prev) => ({ ...prev, [category]: false }))
  }

  const handleDragOver = (e: React.DragEvent, category: string) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e: React.DragEvent, category: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive((prev) => ({ ...prev, [category]: false }))

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      await handleFileUpload(category, files)
    }
  }

  return (
    <>
      <div className="space-y-6">
        {categories.map((category) => (
          <div key={category.key} className="space-y-2">
            <Label className="flex items-center gap-2">
              {category.isImageCategory ? (
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
              ) : (
                <FileText className="h-4 w-4 text-muted-foreground" />
              )}
              {category.label}
              {category.files.length > 0 && (
                <span className="text-xs px-1.5 py-0.5 bg-muted rounded-full">
                  {category.files.length}
                </span>
              )}
            </Label>

            <div
              className={`border-2 border-dashed rounded-lg p-4 transition-all duration-200 ${
                dragActive[category.key] 
                  ? "border-primary bg-primary/10 scale-[1.01]" 
                  : "border-muted-foreground/25 hover:border-muted-foreground/40"
              }`}
              onDragEnter={(e) => handleDragEnter(e, category.key)}
              onDragLeave={(e) => handleDragLeave(e, category.key)}
              onDragOver={(e) => handleDragOver(e, category.key)}
              onDrop={(e) => handleDrop(e, category.key)}
            >
              <input
                type="file"
                multiple
                id={`upload-${category.key}`}
                className="hidden"
                onChange={(e) => {
                  handleFileUpload(category.key, e.target.files, category.isImageCategory)
                  e.target.value = "" // Reset input for re-selection
                }}
                accept={category.acceptedTypes}
              />

              <label htmlFor={`upload-${category.key}`} className="cursor-pointer">
                <div className="flex flex-col items-center justify-center py-4 text-center">
                  {category.isImageCategory ? (
                    <div className="p-3 rounded-full bg-muted mb-2">
                      <ImageIcon className={`h-6 w-6 ${dragActive[category.key] ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                  ) : (
                    <Upload className={`h-8 w-8 mb-2 ${dragActive[category.key] ? "text-primary" : "text-muted-foreground"}`} />
                  )}
                  <p className="text-sm text-muted-foreground font-medium">
                    {category.isImageCategory 
                      ? "Bilder hierher ziehen oder klicken" 
                      : "Dateien hierher ziehen oder klicken"
                    }
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {category.isImageCategory 
                      ? "JPEG, PNG oder GIF (max. 10MB pro Bild)" 
                      : "PDF, DOC, DOCX, JPG, PNG (max. 10MB pro Datei)"
                    }
                  </p>
                </div>
              </label>

              {uploading === category.key && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Wird hochgeladen...</p>
                  </div>
                  <Progress value={uploadProgress} className="h-1.5" />
                  <p className="text-xs text-center text-muted-foreground">{uploadProgress}% abgeschlossen</p>
                </div>
              )}

              {/* Image Grid Display */}
              {category.isImageCategory && category.files.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {category.files.map((file, index) => (
                    <div
                      key={index}
                      className="relative group rounded-lg overflow-hidden border border-border bg-muted/50 aspect-square"
                    >
                      <img
                        src={file.url}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Overlay with actions */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openImagePreview(file.url, file.name)}
                          title="Vergrößern"
                        >
                          <ZoomIn className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleRemoveFile(category.key, index)}
                          title="Entfernen"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {/* File info overlay */}
                      <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 bg-gradient-to-t from-black/70 to-transparent">
                        <p className="text-xs text-white truncate" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-[10px] text-white/70">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Document List Display */}
              {!category.isImageCategory && category.files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {category.files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2.5 bg-muted rounded-lg group hover:bg-muted/80 transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {isImageFile(file) ? (
                          <div className="h-10 w-10 rounded overflow-hidden flex-shrink-0 border border-border">
                            <img src={file.url} alt={file.name} className="h-full w-full object-cover" />
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded bg-background flex items-center justify-center flex-shrink-0 border border-border">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (isImageFile(file)) {
                              openImagePreview(file.url, file.name)
                            } else {
                              window.open(file.url, "_blank")
                            }
                          }}
                          title="Vorschau"
                        >
                          {isImageFile(file) ? <ZoomIn className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFile(category.key, index)}
                          title="Entfernen"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Image Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="truncate pr-8">{previewImageName}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center overflow-hidden rounded-lg bg-muted/50">
            {previewImage && (
              <img
                src={previewImage}
                alt={previewImageName}
                className="max-w-full max-h-[70vh] object-contain"
              />
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => window.open(previewImage!, "_blank")}
            >
              <Eye className="h-4 w-4 mr-2" />
              In neuem Tab öffnen
            </Button>
            <Button
              variant="secondary"
              onClick={() => setPreviewImage(null)}
            >
              Schließen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default CandidateDocumentsUpload
