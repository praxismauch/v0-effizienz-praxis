"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { FileText, Upload, Trash2, Download, CheckCircle2, Clock, AlertCircle } from "lucide-react"
import { useState, useEffect } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface AITrainingFile {
  id: string
  file_name: string
  file_url: string
  file_size: number
  file_type: string
  description: string | null
  category: string
  is_active: boolean
  processing_status: string
  created_at: string
  updated_at: string
}

export function AITrainingFilesManager() {
  const { toast } = useToast()
  const [files, setFiles] = useState<AITrainingFile[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("general")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [fileToDelete, setFileToDelete] = useState<string | null>(null)

  useEffect(() => {
    loadFiles()
  }, [])

  const loadFiles = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/super-admin/ai-training-files")
      if (!response.ok) throw new Error("Fehler beim Laden der Dateien")

      const data = await response.json()
      setFiles(data.files || [])
    } catch (error) {
      console.error("[v0] Error loading AI training files:", error)
      toast({
        title: "Fehler",
        description: "Dateien konnten nicht geladen werden",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === "application/pdf") {
      setSelectedFile(file)
    } else {
      toast({
        title: "Ungültiges Format",
        description: "Bitte wählen Sie eine PDF-Datei aus",
        variant: "destructive",
      })
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "Keine Datei ausgewählt",
        description: "Bitte wählen Sie eine PDF-Datei aus",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("description", description)
      formData.append("category", category)

      const response = await fetch("/api/super-admin/ai-training-files", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Upload fehlgeschlagen")
      }

      toast({
        title: "Erfolgreich hochgeladen",
        description: `${selectedFile.name} wurde hochgeladen`,
      })

      // Reset form
      setSelectedFile(null)
      setDescription("")
      setCategory("general")

      // Reload files
      loadFiles()
    } catch (error) {
      console.error("[v0] Error uploading file:", error)
      toast({
        title: "Upload fehlgeschlagen",
        description: error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!fileToDelete) return

    try {
      const response = await fetch(`/api/super-admin/ai-training-files/${fileToDelete}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Löschen fehlgeschlagen")
      }

      toast({
        title: "Erfolgreich gelöscht",
        description: "Die Datei wurde gelöscht",
      })

      loadFiles()
    } catch (error) {
      console.error("[v0] Error deleting file:", error)
      toast({
        title: "Fehler",
        description: "Datei konnte nicht gelöscht werden",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setFileToDelete(null)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "processing":
        return <Clock className="h-4 w-4 text-blue-500" />
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>PDF-Datei hochladen</CardTitle>
          <CardDescription>
            Laden Sie PDF-Dateien hoch, die das KI-System für Kontext und Wissen verwenden kann
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">PDF-Datei</Label>
            <Input id="file" type="file" accept=".pdf" onChange={handleFileSelect} disabled={uploading} />
            {selectedFile && (
              <p className="text-sm text-muted-foreground">
                Ausgewählt: {selectedFile.name} ({formatFileSize(selectedFile.size)})
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Kategorie</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">Allgemein</SelectItem>
                <SelectItem value="medical">Medizinisch</SelectItem>
                <SelectItem value="practice-management">Praxisverwaltung</SelectItem>
                <SelectItem value="legal">Rechtlich</SelectItem>
                <SelectItem value="training">Schulung</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beschreiben Sie den Inhalt dieser Datei..."
              disabled={uploading}
              rows={3}
            />
          </div>

          <Button onClick={handleUpload} disabled={!selectedFile || uploading}>
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? "Wird hochgeladen..." : "Hochladen"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hochgeladene Dateien ({files.length})</CardTitle>
          <CardDescription>Verwalten Sie die PDF-Dateien, die für das KI-Training verwendet werden</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground">Laden...</p>
          ) : files.length === 0 ? (
            <p className="text-center text-muted-foreground">Noch keine Dateien hochgeladen</p>
          ) : (
            <div className="space-y-3">
              {files.map((file) => (
                <div key={file.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3 flex-1">
                    <FileText className="h-8 w-8 text-red-500" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{file.file_name}</p>
                        {getStatusIcon(file.processing_status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(file.file_size)} • {file.category}
                      </p>
                      {file.description && <p className="text-sm text-muted-foreground mt-1">{file.description}</p>}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(file.created_at).toLocaleDateString("de-DE", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    {!file.is_active && <Badge variant="secondary">Inaktiv</Badge>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" asChild>
                      <a href={file.file_url} download target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setFileToDelete(file.id)
                        setDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Datei löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Die Datei wird dauerhaft gelöscht und steht dem
              KI-System nicht mehr zur Verfügung.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Löschen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default AITrainingFilesManager
