"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Sparkles, Calendar, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/contexts/translation-context"

interface Change {
  category: string
  items: string[]
}

interface Changelog {
  id: string
  version: string
  release_date: string
  title: string
  description: string
  changes: Change[]
  change_type: "major" | "minor" | "patch"
  is_published: boolean
}

export function ChangelogManager() {
  const { t } = useTranslation()
  const [changelogs, setChangelogs] = useState<Changelog[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiCategorizedChanges, setAiCategorizedChanges] = useState<Change[] | null>(null)

  const [formData, setFormData] = useState({
    version: "",
    title: "",
    description: "",
    change_type: "minor" as "major" | "minor" | "patch",
    is_published: false,
    rawChanges: "",
  })

  const { toast } = useToast()

  useEffect(() => {
    fetchChangelogs()
  }, [])

  const fetchChangelogs = async () => {
    try {
      const response = await fetch("/api/changelogs?published=false")
      if (!response.ok) throw new Error("Failed to fetch")
      const data = await response.json()
      setChangelogs(data)
    } catch (error) {
      console.error("[v0] Error:", error)
      toast({
        title: t("common.error", "Fehler"),
        description: t("whats_new.load_failed", "Fehler beim Laden der Changelogs"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateWithAI = async () => {
    if (!formData.rawChanges.trim()) {
      toast({
        title: t("common.error", "Fehler"),
        description: t("whats_new.enter_changes_first", "Bitte geben Sie zuerst einige Änderungen ein"),
        variant: "destructive",
      })
      return
    }

    setAiLoading(true)
    try {
      const changeList = formData.rawChanges.split("\n").filter((line) => line.trim())

      const response = await fetch("/api/changelogs/generate-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentVersion: formData.version,
          changeList,
        }),
      })

      if (!response.ok) throw new Error("AI generation failed")

      const result = await response.json()

      // Auto-populate title, description, version, and change type from AI
      setFormData((prev) => ({
        ...prev,
        title: result.title || prev.title,
        description: result.description || prev.description,
        version: result.suggestedVersion || prev.version,
        change_type: result.change_type || prev.change_type,
      }))

      // Store AI-categorized changes for save
      if (result.changes && Array.isArray(result.changes)) {
        setAiCategorizedChanges(result.changes)
      }

      toast({
        title: t("common.success", "Erfolg"),
        description: t("whats_new.ai_generated_success", "KI hat Changelog-Inhalt erfolgreich generiert und kategorisiert"),
      })
    } catch (error) {
      console.error("[v0] AI Error:", error)
      toast({
        title: t("common.error", "Fehler"),
        description: t("whats_new.ai_generation_failed", "Fehler bei der KI-Generierung"),
        variant: "destructive",
      })
    } finally {
      setAiLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      // Use AI-categorized changes if available, otherwise smart-categorize locally
      const changes: Change[] = aiCategorizedChanges || formData.rawChanges
        .split("\n")
        .filter((line) => line.trim())
        .reduce((acc: Change[], line) => {
          const lower = line.toLowerCase()
          let category = "Sonstiges"
          if (lower.includes("neu") || lower.includes("hinzugefügt") || lower.includes("feature") || lower.includes("erstellt")) {
            category = "Neue Funktionen"
          } else if (lower.includes("verbessert") || lower.includes("optimiert") || lower.includes("aktualisiert") || lower.includes("überarbeitet")) {
            category = "Verbesserungen"
          } else if (lower.includes("behoben") || lower.includes("fix") || lower.includes("korrigiert") || lower.includes("fehler")) {
            category = "Fehlerbehebungen"
          } else if (lower.includes("sicherheit") || lower.includes("security") || lower.includes("auth")) {
            category = "Sicherheit"
          }
          const existing = acc.find((c) => c.category === category)
          if (existing) {
            existing.items.push(line.trim())
          } else {
            acc.push({ category, items: [line.trim()] })
          }
          return acc
        }, [])

      const payload = {
        version: formData.version,
        title: formData.title,
        description: formData.description,
        changes,
        change_type: formData.change_type,
        is_published: formData.is_published,
      }

      const url = editingId ? `/api/changelogs/${editingId}` : "/api/changelogs"
      const method = editingId ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error("Failed to save")

      toast({
        title: t("common.success", "Erfolg"),
        description: editingId
          ? t("whats_new.changelog_updated", "Changelog aktualisiert")
          : t("whats_new.changelog_created", "Changelog erstellt"),
      })

      setDialogOpen(false)
      resetForm()
      fetchChangelogs()
    } catch (error) {
      console.error("[v0] Save Error:", error)
      toast({
        title: t("common.error", "Fehler"),
        description: t("whats_new.save_failed", "Fehler beim Speichern des Changelogs"),
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t("whats_new.delete_confirm", "Sind Sie sicher, dass Sie dieses Changelog löschen möchten?"))) return

    try {
      const response = await fetch(`/api/changelogs/${id}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Failed to delete")

      toast({
        title: t("common.success", "Erfolg"),
        description: t("whats_new.changelog_deleted", "Changelog gelöscht"),
      })
      fetchChangelogs()
    } catch (error) {
      console.error("[v0] Delete Error:", error)
      toast({
        title: t("common.error", "Fehler"),
        description: t("whats_new.delete_failed", "Fehler beim Löschen des Changelogs"),
        variant: "destructive",
      })
    }
  }

  const handleTogglePublish = async (changelog: Changelog) => {
    try {
      const response = await fetch(`/api/changelogs/${changelog.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_published: !changelog.is_published }),
      })

      if (!response.ok) throw new Error("Failed to toggle publish")

      toast({
        title: t("common.success", "Erfolg"),
        description: changelog.is_published
          ? t("whats_new.unpublished", "Changelog nicht mehr veröffentlicht")
          : t("whats_new.published", "Changelog veröffentlicht"),
      })
      fetchChangelogs()
    } catch (error) {
      console.error("[v0] Toggle Error:", error)
      toast({
        title: t("common.error", "Fehler"),
        description: t("whats_new.toggle_failed", "Fehler beim Aktualisieren des Veröffentlichungsstatus"),
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      version: "",
      title: "",
      description: "",
      change_type: "minor",
      is_published: false,
      rawChanges: "",
    })
    setEditingId(null)
    setAiCategorizedChanges(null)
  }

  const openEditDialog = (changelog: Changelog) => {
    setEditingId(changelog.id)
    setFormData({
      version: changelog.version,
      title: changelog.title,
      description: changelog.description || "",
      change_type: changelog.change_type,
      is_published: changelog.is_published,
      rawChanges: changelog.changes.flatMap((c) => c.items).join("\n"),
    })
    setDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t("whats_new.release_notes_title", "Release Notes Verwaltung")}</h2>
          <p className="text-muted-foreground">
            {t("whats_new.release_notes_description", "Verwalten Sie Versionen und Changelogs")}
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm()
            setDialogOpen(true)
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          {t("whats_new.new_release", "Neuer Release")}
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-6 bg-muted rounded w-1/3 mb-4" />
              <div className="h-4 bg-muted rounded w-full" />
            </Card>
          ))}
        </div>
      ) : changelogs.length === 0 ? (
        <Card className="p-12 text-center">
          <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {t("whats_new.no_changelogs", "Noch keine Changelogs. Erstellen Sie Ihren ersten Release!")}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {changelogs.map((changelog) => (
            <Card key={changelog.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold">{changelog.title}</h3>
                    <Badge variant="outline">v{changelog.version}</Badge>
                    {changelog.is_published ? (
                      <Badge className="bg-green-100 text-green-800">
                        {t("whats_new.published", "Veröffentlicht")}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">{t("whats_new.draft", "Entwurf")}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(changelog.release_date).toLocaleDateString("de-DE")}
                  </p>
                  {changelog.description && <p className="text-muted-foreground mt-2">{changelog.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleTogglePublish(changelog)}>
                    {changelog.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(changelog)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(changelog.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId
                ? t("whats_new.edit_release", "Release bearbeiten")
                : t("whats_new.create_new_release", "Neuen Release erstellen")}
            </DialogTitle>
            <DialogDescription>
              {t(
                "whats_new.release_info_description",
                "Fügen Sie Release-Informationen hinzu und lassen Sie sich von der KI bei Beschreibungen helfen",
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="version">{t("whats_new.version", "Version")}</Label>
                <Input
                  id="version"
                  placeholder="1.0.0"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="change-type">{t("whats_new.change_type", "Änderungstyp")}</Label>
                <Select
                  value={formData.change_type}
                  onValueChange={(value: any) => setFormData({ ...formData, change_type: value })}
                >
                  <SelectTrigger id="change-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="major">{t("whats_new.change_type.major", "Major")}</SelectItem>
                    <SelectItem value="minor">{t("whats_new.change_type.minor", "Minor")}</SelectItem>
                    <SelectItem value="patch">{t("whats_new.change_type.patch", "Patch")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="raw-changes">{t("whats_new.changes_label", "Änderungen (eine pro Zeile)")}</Label>
              <Textarea
                id="raw-changes"
                rows={6}
                placeholder={t(
                  "whats_new.changes_placeholder",
                  "Änderungen eingeben, eine pro Zeile\nBeispiel:\nNeues Team-Dashboard hinzugefügt\nKalender-Synchronisierungsproblem behoben\nDokumentensuche verbessert",
                )}
                value={formData.rawChanges}
                onChange={(e) => setFormData({ ...formData, rawChanges: e.target.value })}
              />
            </div>

            <Button
              variant="outline"
              className="w-full bg-transparent border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/30"
              onClick={handleGenerateWithAI}
              disabled={aiLoading}
            >
              <Sparkles className="h-4 w-4 mr-2 text-primary" />
              <span className="text-primary font-medium">
                {aiLoading
                  ? t("whats_new.generating", "Generiere...")
                  : t("whats_new.generate_with_ai", "Mit KI kategorisieren & generieren")}
              </span>
            </Button>

            {aiCategorizedChanges && aiCategorizedChanges.length > 0 && (
              <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">KI-Kategorisierung</p>
                {aiCategorizedChanges.map((section, idx) => (
                  <div key={idx}>
                    <p className="text-sm font-semibold text-foreground">{section.category}</p>
                    <ul className="mt-1 space-y-0.5">
                      {section.items.map((item, itemIdx) => (
                        <li key={itemIdx} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-primary mt-0.5">-</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            <div>
              <Label htmlFor="title">{t("whats_new.title_label", "Titel")}</Label>
              <Input
                id="title"
                placeholder={t("whats_new.title_placeholder", "Release-Titel")}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="description">{t("whats_new.description_label", "Beschreibung")}</Label>
              <Textarea
                id="description"
                rows={3}
                placeholder={t("whats_new.description_placeholder", "Kurze Beschreibung dieses Releases")}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="published"
                checked={formData.is_published}
                onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="published">{t("whats_new.publish_immediately", "Sofort veröffentlichen")}</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t("common.cancel", "Abbrechen")}
            </Button>
            <Button onClick={handleSave}>{t("whats_new.save_release", "Release speichern")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ChangelogManager
