"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Upload, X, FileText, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface DocumentCategory {
  key: string
  label: string
  files: Array<{
    name: string
    url: string
    size: number
  }>
}

interface CandidateDocumentsUploadProps {
  documents?: {
    lebenslauf?: any[]
    bewerbung?: any[]
    zeugnisse?: any[]
    sonstiges?: any[]
  }
  onDocumentsChange: (documents: any) => void
}

export function CandidateDocumentsUpload({ documents = {}, onDocumentsChange }: CandidateDocumentsUploadProps) {
  const { toast } = useToast()
  const [uploading, setUploading] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState<Record<string, boolean>>({})

  const categories: DocumentCategory[] = [
    { key: "lebenslauf", label: "Lebenslauf", files: documents.lebenslauf || [] },
    { key: "bewerbung", label: "Bewerbung", files: documents.bewerbung || [] },
    { key: "zeugnisse", label: "Zeugnisse", files: documents.zeugnisse || [] },
    { key: "sonstiges", label: "Sonstiges", files: documents.sonstiges || [] },
  ]

  const handleFileUpload = async (category: string, files: FileList | null) => {
    if (!files || files.length === 0) return

    setUploading(category)

    try {
      const uploadedFiles = []

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
          })
        }
      }

      // Update documents state
      const updatedDocuments = {
        ...documents,
        [category]: [...(documents[category as keyof typeof documents] || []), ...uploadedFiles],
      }

      onDocumentsChange(updatedDocuments)

      toast({
        title: "Erfolg",
        description: `${uploadedFiles.length} Datei(en) hochgeladen`,
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Fehler beim Hochladen der Dateien",
      })
    } finally {
      setUploading(null)
    }
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
    <div className="space-y-6">
      {categories.map((category) => (
        <div key={category.key} className="space-y-2">
          <Label>{category.label}</Label>

          <div
            className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
              dragActive[category.key] ? "border-primary bg-primary/10" : "border-muted-foreground/25"
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
              onChange={(e) => handleFileUpload(category.key, e.target.files)}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />

            <label htmlFor={`upload-${category.key}`} className="cursor-pointer">
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Klicken Sie hier oder ziehen Sie Dateien hierher</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, DOC, DOCX, JPG, PNG (max. 10MB pro Datei)</p>
              </div>
            </label>

            {uploading === category.key && (
              <div className="mt-2 text-center">
                <p className="text-sm text-muted-foreground">Hochladen...</p>
              </div>
            )}

            {category.files.length > 0 && (
              <div className="mt-4 space-y-2">
                {category.files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm truncate">{file.name}</span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(file.url, "_blank")}
                        title="Vorschau"
                      >
                        <Eye className="h-4 w-4" />
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
  )
}

export default CandidateDocumentsUpload
