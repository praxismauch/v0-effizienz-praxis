"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Plus, FileText, Trash2, Download, Eye, Calendar, Upload, File, FileImage, FileSpreadsheet } from "lucide-react"
import { format } from "date-fns"
import { de } from "date-fns/locale"

interface TeamMemberDocument {
  id: string
  name: string
  type: string
  category: string
  file_url: string | null
  file_size: number | null
  uploaded_at: string
  expiry_date: string | null
  notes: string | null
}

const DOCUMENT_CATEGORIES = [
  { value: "contract", label: "Arbeitsvertrag" },
  { value: "certificate", label: "Zertifikat / Zeugnis" },
  { value: "training", label: "Fortbildungsnachweis" },
  { value: "qualification", label: "Qualifikationsnachweis" },
  { value: "health", label: "Gesundheitsnachweis" },
  { value: "id", label: "Ausweisdokument" },
  { value: "other", label: "Sonstiges" },
]

interface TeamMemberDocumentsTabProps {
  teamMemberId: string
  practiceId: string
  isAdmin?: boolean
  currentUserId?: string
  memberUserId?: string // The user_id of the team member being viewed
}

export function TeamMemberDocumentsTab({ 
  teamMemberId, 
  practiceId, 
  isAdmin = false,
  currentUserId,
  memberUserId 
}: TeamMemberDocumentsTabProps) {
  // User can edit if they are admin OR viewing their own profile
  const canEdit = isAdmin || (currentUserId && memberUserId && currentUserId === memberUserId)
  const [documents, setDocuments] = useState<TeamMemberDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingDocument, setEditingDocument] = useState<TeamMemberDocument | null>(null)
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    category: "other",
    expiry_date: "",
    notes: "",
    file: null as File | null,
  })

  const loadDocuments = async () => {
    try {
      const res = await fetch(`/api/practices/${practiceId}/team-members/${teamMemberId}/documents`)
      if (res.ok) {
        const data = await res.json()
        setDocuments(data.documents || [])
      }
    } catch (error) {
      console.error("Error loading documents:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDocuments()
  }, [teamMemberId, practiceId])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({ 
        ...prev, 
        file,
        name: prev.name || file.name.replace(/\.[^/.]+$/, "")
      }))
    }
  }

  const handleSave = async () => {
    if (!formData.name) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie einen Namen für das Dokument ein.",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    try {
      let fileUrl = editingDocument?.file_url || null
      let fileSize = editingDocument?.file_size || null
      let fileType = editingDocument?.type || "unknown"

      // Upload file if provided
      if (formData.file) {
        const uploadFormData = new FormData()
        uploadFormData.append("file", formData.file)
        uploadFormData.append("type", "general")

        const uploadRes = await fetch("/api/upload/unified", {
          method: "POST",
          body: uploadFormData,
        })

        if (!uploadRes.ok) {
          throw new Error("Datei-Upload fehlgeschlagen")
        }

        const uploadData = await uploadRes.json()
        fileUrl = uploadData.url
        fileSize = formData.file.size
        fileType = formData.file.type
      }

      const payload = {
        name: formData.name,
        category: formData.category,
        type: fileType,
        file_url: fileUrl,
        file_size: fileSize,
        expiry_date: formData.expiry_date || null,
        notes: formData.notes || null,
      }

      const url = editingDocument
        ? `/api/practices/${practiceId}/team-members/${teamMemberId}/documents/${editingDocument.id}`
        : `/api/practices/${practiceId}/team-members/${teamMemberId}/documents`

      const res = await fetch(url, {
        method: editingDocument ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        toast({
          title: "Erfolg",
          description: editingDocument ? "Dokument wurde aktualisiert." : "Dokument wurde hinzugefügt.",
        })
        loadDocuments()
        setShowAddDialog(false)
        setEditingDocument(null)
        resetForm()
      } else {
        throw new Error("Speichern fehlgeschlagen")
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Dokument konnte nicht gespeichert werden.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (documentId: string) => {
    try {
      const res = await fetch(
        `/api/practices/${practiceId}/team-members/${teamMemberId}/documents/${documentId}`,
        { method: "DELETE" }
      )

      if (res.ok) {
        toast({
          title: "Erfolg",
          description: "Dokument wurde gelöscht.",
        })
        loadDocuments()
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Dokument konnte nicht gelöscht werden.",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      category: "other",
      expiry_date: "",
      notes: "",
      file: null,
    })
  }

  const getFileIcon = (type: string) => {
    if (type.includes("image")) return FileImage
    if (type.includes("spreadsheet") || type.includes("excel")) return FileSpreadsheet
    return File
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "-"
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getCategoryLabel = (value: string) => {
    return DOCUMENT_CATEGORIES.find(c => c.value === value)?.label || value
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="animate-pulse">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">Lade Dokumente...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Dokumente
            </CardTitle>
            <CardDescription>
              {documents.length} Dokument{documents.length !== 1 ? "e" : ""} vorhanden
            </CardDescription>
          </div>
          {canEdit && (
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Dokument hinzufügen
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
      <div className="grid gap-4 md:grid-cols-2">
        {documents.map((doc) => {
          const FileIcon = getFileIcon(doc.type)
          const isExpired = doc.expiry_date && new Date(doc.expiry_date) < new Date()
          const isExpiringSoon = doc.expiry_date && !isExpired && 
            new Date(doc.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

          return (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <FileIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{doc.name}</CardTitle>
                      <Badge variant="outline" className="mt-1">{getCategoryLabel(doc.category)}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {doc.file_url && (
                      <Button variant="ghost" size="icon" asChild>
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {canEdit && (
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => {
                          setEditingDocument(doc)
                          setFormData({
                            name: doc.name,
                            category: doc.category,
                            expiry_date: doc.expiry_date || "",
                            notes: doc.notes || "",
                            file: null,
                          })
                          setShowAddDialog(true)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    {canEdit && (
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDelete(doc.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Hochgeladen: {format(new Date(doc.uploaded_at), "dd.MM.yyyy", { locale: de })}</span>
                </div>
                {doc.expiry_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span className={isExpired ? "text-destructive" : isExpiringSoon ? "text-amber-600" : ""}>
                      Gültig bis: {format(new Date(doc.expiry_date), "dd.MM.yyyy", { locale: de })}
                    </span>
                    {isExpired && <Badge variant="destructive">Abgelaufen</Badge>}
                    {isExpiringSoon && <Badge variant="outline" className="text-amber-600 border-amber-600">Bald ablaufend</Badge>}
                  </div>
                )}
                {doc.file_size && (
                  <div className="text-muted-foreground">
                    Dateigröße: {formatFileSize(doc.file_size)}
                  </div>
                )}
                {doc.notes && (
                  <p className="text-muted-foreground mt-2">{doc.notes}</p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {documents.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Noch keine Dokumente vorhanden</p>
          {canEdit && (
            <Button variant="link" onClick={() => setShowAddDialog(true)}>
              Erstes Dokument hinzufügen
            </Button>
          )}
        </div>
      )}
      </CardContent>
    </Card>

      <Dialog open={showAddDialog} onOpenChange={(open) => {
        setShowAddDialog(open)
        if (!open) {
          setEditingDocument(null)
          resetForm()
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingDocument ? "Dokument bearbeiten" : "Neues Dokument hinzufügen"}</DialogTitle>
            <DialogDescription>
              Laden Sie ein Dokument hoch und fügen Sie Metadaten hinzu
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Dokumentname *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="z.B. Arbeitsvertrag 2024"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Datei hochladen</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="file" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {formData.file ? formData.file.name : "Klicken zum Hochladen oder Datei hierher ziehen"}
                  </p>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Kategorie</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiry_date">Gültig bis (optional)</Label>
              <Input
                id="expiry_date"
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notizen (optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Zusätzliche Informationen zum Dokument..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSave} disabled={uploading}>
              {uploading ? "Wird gespeichert..." : editingDocument ? "Aktualisieren" : "Hinzufügen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
