"use client"

import type React from "react"
import { useState, useCallback, useRef } from "react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { FileText, X, Loader2, Upload, ExternalLink, ImageIcon } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import type { DeviceFormData, InstructionDocument } from "./device-form-types"

interface DeviceInstructionsTabProps {
  formData: DeviceFormData
  setFormData: (fn: (prev: DeviceFormData) => DeviceFormData) => void
  practiceId: string | undefined
  editDeviceId?: string
  handbookFileName: string | null
  setHandbookFileName: (name: string | null) => void
  isUploadingHandbook: boolean
  setIsUploadingHandbook: (uploading: boolean) => void
  instructionDocuments: InstructionDocument[]
  setInstructionDocuments: React.Dispatch<React.SetStateAction<InstructionDocument[]>>
}

export function DeviceInstructionsTab({
  formData,
  setFormData,
  practiceId,
  editDeviceId,
  handbookFileName,
  setHandbookFileName,
  isUploadingHandbook,
  setIsUploadingHandbook,
  instructionDocuments,
  setInstructionDocuments,
}: DeviceInstructionsTabProps) {
  const [isDraggingHandbook, setIsDraggingHandbook] = useState(false)
  const [isDraggingDocs, setIsDraggingDocs] = useState(false)
  const [isUploadingDocs, setIsUploadingDocs] = useState(false)
  const handbookInputRef = useRef<HTMLInputElement>(null)

  const updateField = <K extends keyof DeviceFormData>(key: K, value: DeviceFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const uploadHandbook = async (file: File) => {
    if (!practiceId) return

    setIsUploadingHandbook(true)
    try {
      const uploadFormData = new FormData()
      uploadFormData.append("file", file)
      if (formData.handbook_url) {
        uploadFormData.append("oldHandbookUrl", formData.handbook_url)
      }

      const response = await fetch(`/api/practices/${practiceId}/devices/upload-handbook`, {
        method: "POST",
        body: uploadFormData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Upload fehlgeschlagen")
      }

      const data = await response.json()
      setFormData((prev) => ({ ...prev, handbook_url: data.url }))
      setHandbookFileName(file.name)
      toast({ title: "Handbuch hochgeladen", description: `${file.name} wurde erfolgreich hochgeladen` })
    } catch (error: any) {
      console.error("Error uploading handbook:", error)
      toast({
        title: "Fehler beim Hochladen",
        description: error.message || "Das Handbuch konnte nicht hochgeladen werden",
        variant: "destructive",
      })
    } finally {
      setIsUploadingHandbook(false)
    }
  }

  const removeHandbook = async () => {
    if (formData.handbook_url && practiceId) {
      try {
        await fetch(`/api/practices/${practiceId}/devices/upload-handbook`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: formData.handbook_url }),
        })
      } catch (error) {
        console.error("Error deleting handbook:", error)
      }
    }
    setFormData((prev) => ({ ...prev, handbook_url: "" }))
    setHandbookFileName(null)
    if (handbookInputRef.current) {
      handbookInputRef.current.value = ""
    }
  }

  const handleHandbookDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingHandbook(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      const validTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
      const extension = `.${file.name.split(".").pop()?.toLowerCase()}`
      if (validTypes.includes(file.type) || [".pdf", ".doc", ".docx"].includes(extension)) {
        uploadHandbook(file)
      } else {
        toast({ title: "Ungültiges Dateiformat", description: "Bitte laden Sie eine PDF-Datei oder Word-Datei hoch", variant: "destructive" })
      }
    }
  }, [formData.handbook_url, practiceId])

  const handleDocsUpload = async (files: FileList | File[]) => {
    if (!practiceId) return
    setIsUploadingDocs(true)
    const fileArray = Array.from(files)

    try {
      for (const file of fileArray) {
        const allowedTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/jpeg", "image/png", "image/gif"]
        if (!allowedTypes.includes(file.type)) {
          toast({ title: "Ungültiger Dateityp", description: `${file.name} ist kein unterstütztes Format`, variant: "destructive" })
          continue
        }
        if (file.size > 10 * 1024 * 1024) {
          toast({ title: "Datei zu groß", description: `${file.name} ist größer als 10MB`, variant: "destructive" })
          continue
        }

        const uploadData = new FormData()
        uploadData.append("file", file)
        uploadData.append("type", "general")
        uploadData.append("practiceId", practiceId)

        const response = await fetch("/api/upload/unified", { method: "POST", body: uploadData })
        if (response.ok) {
          const data = await response.json()
          setInstructionDocuments((prev) => [...prev, { id: crypto.randomUUID(), name: file.name, url: data.url, type: file.type, size: file.size }])
        } else {
          toast({ title: "Upload fehlgeschlagen", description: `Fehler beim Hochladen von ${file.name}`, variant: "destructive" })
        }
      }
      toast({ title: "Dokumente hochgeladen", description: `${fileArray.length} Datei(en) erfolgreich hochgeladen` })
    } catch (error) {
      console.error("Error uploading instruction documents:", error)
      toast({ title: "Upload fehlgeschlagen", description: "Fehler beim Hochladen der Dokumente", variant: "destructive" })
    } finally {
      setIsUploadingDocs(false)
    }
  }

  const removeInstructionDocument = (id: string) => {
    setInstructionDocuments((prev) => prev.filter((doc) => doc.id !== id))
  }

  return (
    <div className="space-y-4">
      {/* Handbook Upload */}
      <div className="space-y-2">
        <Label>Handbuch (PDF/Word)</Label>
        <input
          type="file"
          ref={handbookInputRef}
          onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadHandbook(file) }}
          accept=".pdf,.doc,.docx"
          className="hidden"
        />

        {formData.handbook_url || handbookFileName ? (
          <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{handbookFileName || "Handbuch"}</p>
              <p className="text-xs text-muted-foreground">
                {formData.handbook_url ? "Hochgeladen" : "Wird hochgeladen..."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {formData.handbook_url && (
                <Button type="button" variant="ghost" size="sm" onClick={() => window.open(formData.handbook_url, "_blank")}>
                  Öffnen
                </Button>
              )}
              <Button type="button" variant="ghost" size="icon" onClick={removeHandbook} disabled={isUploadingHandbook}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors duration-200",
              isDraggingHandbook ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
              isUploadingHandbook && "pointer-events-none opacity-50"
            )}
            onDragOver={(e) => { e.preventDefault(); setIsDraggingHandbook(true) }}
            onDragLeave={(e) => { e.preventDefault(); setIsDraggingHandbook(false) }}
            onDrop={handleHandbookDrop}
            onClick={() => handbookInputRef.current?.click()}
          >
            {isUploadingHandbook ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Wird hochgeladen...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted">
                  <FileText className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Handbuch hochladen</p>
                  <p className="text-xs text-muted-foreground">PDF oder Word-Datei hierher ziehen oder klicken</p>
                </div>
                <p className="text-xs text-muted-foreground">Max. 50 MB</p>
              </div>
            )}
          </div>
        )}
      </div>

      <Separator />

      {/* Document Upload */}
      <div>
        <Label className="mb-2 block">Dokumente hochladen</Label>
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer",
            isDraggingDocs ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
          )}
          onDragOver={(e) => { e.preventDefault(); setIsDraggingDocs(true) }}
          onDragLeave={() => setIsDraggingDocs(false)}
          onDrop={async (e) => { e.preventDefault(); setIsDraggingDocs(false); await handleDocsUpload(e.dataTransfer.files) }}
          onPaste={async (e) => { const files = Array.from(e.clipboardData.files); if (files.length > 0) { e.preventDefault(); await handleDocsUpload(files) } }}
          onClick={() => {
            const input = document.createElement("input")
            input.type = "file"
            input.multiple = true
            input.accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
            input.onchange = async (e) => { const files = (e.target as HTMLInputElement).files; if (files) await handleDocsUpload(files) }
            input.click()
          }}
          tabIndex={0}
        >
          {isUploadingDocs ? (
            <div className="flex items-center justify-center gap-2 py-2">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Wird hochgeladen...</span>
            </div>
          ) : (
            <div className="py-2">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Dateien hier ablegen, einfügen (Strg+V) oder klicken</p>
              <p className="text-xs text-muted-foreground mt-1">PDF, Word, Bilder (max. 10MB pro Datei)</p>
            </div>
          )}
        </div>

        {instructionDocuments.length > 0 && (
          <div className="mt-3 space-y-2">
            {instructionDocuments.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 min-w-0">
                  {doc.type === "application/pdf" ? (
                    <FileText className="h-4 w-4 text-red-500 flex-shrink-0" />
                  ) : doc.type.startsWith("image/") ? (
                    <ImageIcon className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  ) : (
                    <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  )}
                  <span className="text-sm truncate">{doc.name}</span>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    ({(doc.size / 1024).toFixed(0)} KB)
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button type="button" variant="ghost" size="sm" onClick={() => window.open(doc.url, "_blank")}>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeInstructionDocument(doc.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Separator />

      <div>
        <Label>Kurze Bedienungsanleitung (SOP)</Label>
        <Textarea
          value={formData.short_sop}
          onChange={(e) => updateField("short_sop", e.target.value)}
          placeholder="Wichtigste Schritte zur Bedienung"
          rows={4}
        />
      </div>
      <div>
        <Label>Reinigungsanleitung</Label>
        <Textarea
          value={formData.cleaning_instructions}
          onChange={(e) => updateField("cleaning_instructions", e.target.value)}
          placeholder="Anleitung zur Reinigung und Desinfektion"
          rows={3}
        />
      </div>
      <div>
        <Label>Wartungsanleitung</Label>
        <Textarea
          value={formData.maintenance_instructions}
          onChange={(e) => updateField("maintenance_instructions", e.target.value)}
          placeholder="Regelmäßige Wartungsarbeiten"
          rows={3}
        />
      </div>
    </div>
  )
}
