"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  FolderOpen,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  FolderPlus,
  Info,
} from "lucide-react"

interface FolderTemplate {
  id: string
  name: string
  description: string
  color: string
  isSystem: boolean
  isActive: boolean
  subfolders: string[]
}

const INITIAL_FOLDERS: FolderTemplate[] = [
  { id: "1", name: "BWA", description: "Standard-Ordner für BWA", color: "#3b82f6", isSystem: false, isActive: true, subfolders: [] },
  { id: "2", name: "Abrechnungen", description: "Standard-Ordner für Abrechnungen", color: "#10b981", isSystem: false, isActive: true, subfolders: [] },
  { id: "3", name: "Zulassungen", description: "Standard-Ordner für Zulassungen", color: "#f59e0b", isSystem: false, isActive: true, subfolders: [] },
  { id: "4", name: "Auswertungen", description: "Standard-Ordner für Auswertungen", color: "#8b5cf6", isSystem: false, isActive: true, subfolders: [] },
  { id: "5", name: "Verträge", description: "Standard-Ordner für Verträge", color: "#ec4899", isSystem: false, isActive: true, subfolders: [] },
  { id: "6", name: "Sonstiges", description: "Standard-Ordner für Sonstiges", color: "#6b7280", isSystem: false, isActive: true, subfolders: [] },
  { id: "7", name: "Protokolle", description: "Standard-Ordner für Protokolle", color: "#14b8a6", isSystem: false, isActive: true, subfolders: [] },
  { id: "8", name: "Email Dokumente", description: "Dokumente per E-Mail empfangen", color: "#0ea5e9", isSystem: true, isActive: true, subfolders: [] },
  { id: "9", name: "Handbücher", description: "Praxis-Handbücher und QM-Dokumente", color: "#f97316", isSystem: false, isActive: true, subfolders: [] },
]

const COLOR_OPTIONS = [
  "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899",
  "#6b7280", "#14b8a6", "#0ea5e9", "#f97316", "#ef4444",
  "#84cc16", "#06b6d4",
]

export default function FolderTemplatesManager() {
  const [folders, setFolders] = useState<FolderTemplate[]>(INITIAL_FOLDERS)
  const [editingFolder, setEditingFolder] = useState<FolderTemplate | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({ name: "", description: "", color: "#3b82f6", subfolders: "" })

  const activeFolders = folders.filter((f) => f.isActive)

  const handleToggle = (id: string) => {
    setFolders((prev) =>
      prev.map((f) => (f.id === id && !f.isSystem ? { ...f, isActive: !f.isActive } : f))
    )
  }

  const handleEdit = (folder: FolderTemplate) => {
    setEditingFolder(folder)
    setFormData({
      name: folder.name,
      description: folder.description,
      color: folder.color,
      subfolders: folder.subfolders.join(", "),
    })
    setIsDialogOpen(true)
  }

  const handleAdd = () => {
    setEditingFolder(null)
    setFormData({ name: "", description: "", color: "#3b82f6", subfolders: "" })
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    const subfoldersList = formData.subfolders
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)

    if (editingFolder) {
      setFolders((prev) =>
        prev.map((f) =>
          f.id === editingFolder.id
            ? { ...f, name: formData.name, description: formData.description, color: formData.color, subfolders: subfoldersList }
            : f
        )
      )
    } else {
      const newFolder: FolderTemplate = {
        id: Date.now().toString(),
        name: formData.name,
        description: formData.description,
        color: formData.color,
        isSystem: false,
        isActive: true,
        subfolders: subfoldersList,
      }
      setFolders((prev) => [...prev, newFolder])
    }
    setIsDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    setFolders((prev) => prev.filter((f) => f.id !== id))
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FolderPlus className="h-5 w-5" />
                Ordner-Vorlagen
              </CardTitle>
              <CardDescription className="mt-1.5">
                Definieren Sie die Standard-Ordnerstruktur, die bei jeder neuen Praxis automatisch angelegt wird.
              </CardDescription>
            </div>
            <Button onClick={handleAdd} className="gap-2">
              <Plus className="h-4 w-4" />
              Neuer Ordner
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-muted/30 p-3 mb-6 flex items-start gap-3">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">
              Aktive Ordner werden automatisch erstellt, wenn eine neue Praxis angelegt wird.
              System-Ordner sind immer aktiv und können nicht deaktiviert werden.
              Aktuell <strong>{activeFolders.length}</strong> von {folders.length} Ordnern aktiv.
            </p>
          </div>

          <div className="space-y-2">
            {folders.map((folder) => (
              <div
                key={folder.id}
                className={`flex items-center gap-4 rounded-lg border p-4 transition-colors ${
                  folder.isActive ? "bg-background" : "bg-muted/40 opacity-60"
                }`}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 cursor-grab" />

                <div
                  className="h-8 w-8 rounded-md shrink-0 flex items-center justify-center"
                  style={{ backgroundColor: `${folder.color}20` }}
                >
                  <FolderOpen className="h-4 w-4" style={{ color: folder.color }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{folder.name}</span>
                    {folder.isSystem && (
                      <Badge variant="secondary" className="text-xs">System</Badge>
                    )}
                    {folder.subfolders.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {folder.subfolders.length} Unterordner
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{folder.description}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Switch
                    checked={folder.isActive}
                    onCheckedChange={() => handleToggle(folder.id)}
                    disabled={folder.isSystem}
                    aria-label={`${folder.name} aktivieren`}
                  />
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(folder)}>
                    <Pencil className="h-3.5 w-3.5" />
                    <span className="sr-only">Bearbeiten</span>
                  </Button>
                  {!folder.isSystem && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(folder.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span className="sr-only">Löschen</span>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFolder ? "Ordner bearbeiten" : "Neuen Ordner hinzufügen"}</DialogTitle>
            <DialogDescription>
              {editingFolder
                ? "Bearbeiten Sie die Ordner-Vorlage."
                : "Fügen Sie einen neuen Standard-Ordner hinzu, der bei jeder neuen Praxis erstellt wird."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="folder-name">Name *</Label>
              <Input
                id="folder-name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="z.B. Personalakten"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="folder-desc">Beschreibung</Label>
              <Input
                id="folder-desc"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Kurze Beschreibung des Ordners"
              />
            </div>

            <div className="space-y-2">
              <Label>Farbe</Label>
              <div className="flex gap-2 flex-wrap">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`h-8 w-8 rounded-md border-2 transition-all ${
                      formData.color === color ? "border-foreground scale-110" : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData((prev) => ({ ...prev, color }))}
                    aria-label={`Farbe ${color}`}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="folder-subfolders">Unterordner (kommagetrennt)</Label>
              <Input
                id="folder-subfolders"
                value={formData.subfolders}
                onChange={(e) => setFormData((prev) => ({ ...prev, subfolders: e.target.value }))}
                placeholder="z.B. 2024, 2025, Archiv"
              />
              <p className="text-xs text-muted-foreground">
                Werden automatisch als Unterordner angelegt.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSave} disabled={!formData.name.trim()}>
              {editingFolder ? "Speichern" : "Hinzufügen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
