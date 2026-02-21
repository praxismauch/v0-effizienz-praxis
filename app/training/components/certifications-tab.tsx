"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Award, Edit, Trash2, Upload, FileText, X, Loader2, ExternalLink } from "lucide-react"
import { useUser } from "@/contexts/user-context"
import { toast } from "sonner"
import type { Certification } from "../types"
import { INITIAL_CERTIFICATION_FORM, COURSE_CATEGORIES } from "../types"

interface CertificationsTabProps {
  certifications: Certification[]
  practiceId: string
  onCertificationsChange: React.Dispatch<React.SetStateAction<Certification[]>>
  onDelete: (id: string, name: string) => void
  createTrigger?: number
}

export function CertificationsTab({ certifications, practiceId, onCertificationsChange, onDelete, createTrigger }: CertificationsTabProps) {
  const { currentUser } = useUser()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCert, setEditingCert] = useState<Certification | null>(null)
  const [formData, setFormData] = useState(INITIAL_CERTIFICATION_FORM)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ url: string; name: string; type: string; size: number; uploaded_at: string }>>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const ACCEPTED_FILE_TYPES = ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp"

  const uploadFilesToBlob = async (files: File[]) => {
    setIsUploading(true)
    try {
      const formDataUpload = new FormData()
      for (const file of files) {
        formDataUpload.append("files", file)
      }
      formDataUpload.append("folder", "certifications")

      const res = await fetch("/api/upload", { method: "POST", body: formDataUpload })
      if (!res.ok) throw new Error("Upload fehlgeschlagen")
      const data = await res.json()

      const newFiles = data.files
        ? data.files.filter((f: any) => !f.error)
        : [{ url: data.url, name: data.fileName, type: "image/jpeg", size: data.fileSize, uploaded_at: new Date().toISOString() }]

      setUploadedFiles((prev) => [...prev, ...newFiles])
      toast.success(`${newFiles.length} Datei(en) hochgeladen`)
    } catch {
      toast.error("Fehler beim Hochladen der Datei(en)")
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      uploadFilesToBlob(Array.from(e.target.files))
      e.target.value = ""
    }
  }

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true) }
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false) }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length) uploadFilesToBlob(files)
  }

  const removeFile = async (url: string) => {
    try {
      await fetch("/api/upload", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) })
      setUploadedFiles((prev) => prev.filter((f) => f.url !== url))
    } catch {
      toast.error("Fehler beim Entfernen der Datei")
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }
  const prevTriggerRef = useRef(createTrigger)

  useEffect(() => {
    if (createTrigger && createTrigger > 0 && createTrigger !== prevTriggerRef.current) {
      openCreate()
    }
    prevTriggerRef.current = createTrigger
  }, [createTrigger])

  const openCreate = () => {
    setEditingCert(null)
    setFormData(INITIAL_CERTIFICATION_FORM)
    setUploadedFiles([])
    setIsDialogOpen(true)
  }

  const openEdit = (cert: Certification) => {
    setEditingCert(cert)
    setFormData({
      name: cert.name || "",
      description: cert.description || "",
      issuing_authority: cert.issuing_authority || "",
      category: cert.category || "pflicht",
      validity_months: cert.validity_months || 12,
      is_mandatory: cert.is_mandatory || false,
      reminder_days_before: cert.renewal_reminder_days || cert.reminder_days_before || 30,
      icon: cert.icon || "award",
      color: cert.color || "blue",
    })
    setUploadedFiles((cert as any).default_files || [])
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Bitte geben Sie einen Namen ein.")
      return
    }

    setIsSaving(true)
    const payload = { ...formData, default_files: uploadedFiles }
    try {
      if (editingCert) {
        const res = await fetch(`/api/practices/${practiceId}/training/certifications/${editingCert.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error("Update failed")
        const data = await res.json()
        onCertificationsChange((prev) => prev.map((c) => (c.id === editingCert.id ? { ...c, ...data.certification } : c)))
        toast.success("Zertifizierung aktualisiert")
      } else {
        const res = await fetch(`/api/practices/${practiceId}/training/certifications`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, created_by: currentUser?.id }),
        })
        if (!res.ok) throw new Error("Create failed")
        const data = await res.json()
        onCertificationsChange((prev) => [...prev, data.certification])
        toast.success("Zertifizierung erstellt")
      }
      setIsDialogOpen(false)
    } catch {
      toast.error(editingCert ? "Fehler beim Aktualisieren" : "Fehler beim Erstellen")
    } finally {
      setIsSaving(false)
    }
  }

  const updateField = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
  <div className="space-y-4">
  {certifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Award className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Keine Zertifizierungen gefunden</p>
            <p className="text-sm text-muted-foreground mb-4">Definieren Sie erforderliche Zertifizierungen</p>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Zertifizierung erstellen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {certifications.map((cert) => (
            <Card key={cert.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <Award className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{cert.name}</CardTitle>
                      <CardDescription>{cert.issuing_authority}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={cert.is_mandatory ? "destructive" : "secondary"}>
                    {cert.is_mandatory ? "Pflicht" : "Optional"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {cert.description && <p className="text-sm text-muted-foreground mb-4">{cert.description}</p>}
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Gültigkeit:</span>
                    <span>{cert.validity_months || 12} Monate</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Erinnerung:</span>
                    <span>{cert.renewal_reminder_days || cert.reminder_days_before || 30} Tage vorher</span>
                  </div>
                </div>
                {((cert as any).default_files?.length > 0) && (
                  <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
                    <FileText className="h-3.5 w-3.5" />
                    <span>{(cert as any).default_files.length} Datei(en) angehängt</span>
                  </div>
                )}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                  <Button variant="outline" size="sm" onClick={() => openEdit(cert)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Bearbeiten
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive bg-transparent"
                    onClick={() => onDelete(cert.id, cert.name)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCert ? "Zertifizierung bearbeiten" : "Neue Zertifizierung"}</DialogTitle>
            <DialogDescription>
              {editingCert ? "Passen Sie die Zertifizierungsdetails an." : "Definieren Sie eine neue Zertifizierung für Ihr Team."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={formData.name} onChange={(e) => updateField("name", e.target.value)} placeholder="z.B. Erste-Hilfe-Kurs" />
            </div>
            <div className="space-y-2">
              <Label>Beschreibung</Label>
              <Textarea value={formData.description} onChange={(e) => updateField("description", e.target.value)} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Ausstellende Stelle</Label>
              <Input value={formData.issuing_authority} onChange={(e) => updateField("issuing_authority", e.target.value)} placeholder="z.B. Deutsches Rotes Kreuz" />
            </div>
            <div className="space-y-2">
              <Label>Kategorie</Label>
              <Select value={formData.category} onValueChange={(v) => updateField("category", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pflicht">Pflicht</SelectItem>
                  {COURSE_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Gültigkeit (Monate)</Label>
                <Input type="number" min="1" value={formData.validity_months} onChange={(e) => updateField("validity_months", parseInt(e.target.value) || 12)} />
              </div>
              <div className="space-y-2">
                <Label>Erinnerung (Tage vorher)</Label>
                <Input type="number" min="1" value={formData.reminder_days_before} onChange={(e) => updateField("reminder_days_before", parseInt(e.target.value) || 30)} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Pflichtzertifizierung</Label>
              <Switch checked={formData.is_mandatory} onCheckedChange={(v) => updateField("is_mandatory", v)} />
            </div>

            {/* File Upload Section - matching existing upload UI pattern */}
            <div className="space-y-3 pt-2 border-t">
              <Label>Dokumente & Nachweise</Label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  isDragging ? "border-primary bg-primary/10" : "border-muted-foreground/25"
                } ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={ACCEPTED_FILE_TYPES}
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isUploading}
                />
                <label
                  className="cursor-pointer"
                  onClick={(e) => { e.preventDefault(); fileInputRef.current?.click() }}
                >
                  {isUploading ? (
                    <Loader2 className="h-10 w-10 mx-auto mb-3 text-muted-foreground animate-spin" />
                  ) : (
                    <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                  )}
                  <p className="text-sm font-medium mb-1">
                    {isUploading ? "Wird hochgeladen..." : "Klicken Sie hier oder ziehen Sie Dateien hierher"}
                  </p>
                  <p className="text-xs text-muted-foreground">PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (max. 10MB pro Datei)</p>
                </label>
                {uploadedFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {uploadedFiles.map((file) => (
                      <div key={file.url} className="flex items-center justify-between p-2 bg-muted rounded text-left">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="h-4 w-4 flex-shrink-0" />
                          <span className="text-sm truncate">{file.name}</span>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            ({formatFileSize(file.size)})
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => { e.stopPropagation(); window.open(file.url, "_blank") }}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:text-destructive"
                            onClick={(e) => { e.stopPropagation(); removeFile(file.url) }}
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
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Speichern..." : editingCert ? "Speichern" : "Erstellen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
