"use client"

import type React from "react"
import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, FileText, X } from "lucide-react"
import { useTranslation } from "@/contexts/translation-context"
import type { DocumentFolder, UploadFormData } from "./types"

interface DocumentUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: UploadFormData
  onFormDataChange: (data: UploadFormData) => void
  folders: DocumentFolder[]
  folderPath: DocumentFolder[]
  isUploading: boolean
  isAiEnabled: boolean
  onUpload: () => void
}

export function DocumentUploadDialog({
  open,
  onOpenChange,
  formData,
  onFormDataChange,
  folders,
  folderPath,
  isUploading,
  isAiEnabled,
  onUpload,
}: DocumentUploadDialogProps) {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = React.useState(false)

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    onFormDataChange({ ...formData, files })
  }

  const handleRemoveFile = (index: number) => {
    const newFiles = formData.files.filter((_, i) => i !== index)
    onFormDataChange({ ...formData, files: newFiles })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("documents.upload", "Dokument hochladen")}</DialogTitle>
          <DialogDescription>
            {t("documents.uploadDescription", "Laden Sie ein neues Dokument in Ihre Praxis hoch")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="document-name">
              {t("documents.name", "Name")} ({t("common.optional", "optional")})
            </Label>
            <Input
              id="document-name"
              placeholder={t("documents.namePlaceholder", "Dokumentname")}
              value={formData.name}
              onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="document-folder">
              {t("documents.folder", "Ordner")} ({t("common.optional", "optional")})
            </Label>
            <Select
              value={formData.folder_id || "root"}
              onValueChange={(value) => onFormDataChange({ ...formData, folder_id: value === "root" ? null : value })}
            >
              <SelectTrigger id="document-folder">
                <SelectValue>
                  {formData.folder_id
                    ? folders.find((f) => f.id === formData.folder_id)?.name ||
                      folderPath.find((f) => f.id === formData.folder_id)?.name ||
                      t("documents.mainFolder", "Hauptordner")
                    : t("documents.mainFolder", "Hauptordner")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">{t("documents.mainFolder", "Hauptordner")}</SelectItem>
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="document-description">{t("documents.description", "Beschreibung")}</Label>
            <Textarea
              id="document-description"
              placeholder={t("documents.descriptionPlaceholder", "Dokumentbeschreibung")}
              value={formData.description}
              onChange={(e) => onFormDataChange({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="analyze-with-ai"
              checked={formData.analyzeWithAI}
              onChange={(e) => onFormDataChange({ ...formData, analyzeWithAI: e.target.checked })}
              className="h-4 w-4"
              disabled={!isAiEnabled}
            />
            <Label
              htmlFor="analyze-with-ai"
              className={`cursor-pointer ${!isAiEnabled ? "text-muted-foreground opacity-70" : ""}`}
            >
              {t("documents.analyzeWithAI", "Mit KI analysieren")}
            </Label>
          </div>

          <div>
            <Label>{t("documents.files", "Dateien")}</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDragging ? "border-primary bg-primary/10" : "border-muted-foreground/25"
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <input
                type="file"
                multiple
                onChange={(e) => {
                  const files = e.target.files ? Array.from(e.target.files) : []
                  onFormDataChange({ ...formData, files })
                }}
                className="hidden"
                id="document-files"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                ref={fileInputRef}
              />
              <label htmlFor="document-files" className="cursor-pointer">
                <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm font-medium mb-1">
                  {t("documents.clickOrDrag", "Klicken Sie hier oder ziehen Sie Dateien hierher")}
                </p>
                <p className="text-xs text-muted-foreground">PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (max. 50MB pro Datei)</p>
              </label>
              {formData.files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {formData.files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded text-left">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileText className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm truncate">{file.name}</span>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleRemoveFile(index)}
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel", "Abbrechen")}
          </Button>
          <Button onClick={onUpload} disabled={isUploading || formData.files.length === 0}>
            {isUploading ? t("documents.uploading", "Wird hochgeladen...") : t("documents.upload", "Hochladen")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
