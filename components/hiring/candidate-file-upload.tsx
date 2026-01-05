"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Upload, X, FileText, Download } from "lucide-react"

interface Document {
  url: string
  filename: string
  size: number
  type: string
  uploadedAt: string
}

interface CandidateFileUploadProps {
  candidateId: string
  documents: Document[]
  onDocumentsChange: (documents: Document[]) => void
}

function CandidateFileUpload({ candidateId, documents, onDocumentsChange }: CandidateFileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      const files = Array.from(e.dataTransfer.files)
      await uploadFiles(files)
    },
    [candidateId],
  )

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const files = Array.from(e.target.files)
        await uploadFiles(files)
      }
    },
    [candidateId],
  )

  const uploadFiles = async (files: File[]) => {
    setUploading(true)

    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch(`/api/hiring/candidates/${candidateId}/documents`, {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`)
        }

        return response.json()
      })

      const newDocuments = await Promise.all(uploadPromises)
      onDocumentsChange([...documents, ...newDocuments])
    } catch (error) {
      console.error("[v0] Error uploading files:", error)
      alert("Fehler beim Hochladen der Dateien")
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (url: string) => {
    if (!confirm("Möchten Sie diese Datei wirklich löschen?")) {
      return
    }

    try {
      const response = await fetch(`/api/hiring/candidates/${candidateId}/documents`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        throw new Error("Failed to delete file")
      }

      onDocumentsChange(documents.filter((doc) => doc.url !== url))
    } catch (error) {
      console.error("[v0] Error deleting file:", error)
      alert("Fehler beim Löschen der Datei")
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground mb-2">Dateien hierher ziehen oder klicken zum Auswählen</p>
        <input
          type="file"
          multiple
          onChange={handleFileInput}
          className="hidden"
          id="file-upload"
          disabled={uploading}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById("file-upload")?.click()}
          disabled={uploading}
        >
          {uploading ? "Hochladen..." : "Dateien auswählen"}
        </Button>
      </div>

      {documents.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Hochgeladene Dateien ({documents.length})</h4>
          <div className="space-y-2">
            {documents.map((doc, index) => (
              <Card key={index} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(doc.size)} • {new Date(doc.uploadedAt).toLocaleDateString("de-DE")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="ghost" size="sm" onClick={() => window.open(doc.url, "_blank")}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => handleDelete(doc.url)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default CandidateFileUpload
