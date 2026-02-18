"use client"

import { useState, useEffect, useCallback } from "react"
import { usePractice } from "@/contexts/practice-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Save, Shield, Bell, History, FolderOpen, Plus, X, GripVertical } from "lucide-react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface KnowledgeSettingsData {
  require_review_before_publish: boolean
  auto_versioning: boolean
  default_category: string
  allowed_categories: string[]
  disabled_categories: string[]
  max_versions_to_keep: number
  require_change_summary: boolean
  notify_on_publish: boolean
  notify_on_update: boolean
}

const DEFAULT_SETTINGS: KnowledgeSettingsData = {
  require_review_before_publish: false,
  auto_versioning: true,
  default_category: "general",
  allowed_categories: ["general", "protocol", "guideline", "template", "faq", "training"],
  disabled_categories: [],
  max_versions_to_keep: 10,
  require_change_summary: true,
  notify_on_publish: false,
  notify_on_update: false,
}

const CATEGORY_LABELS: Record<string, string> = {
  general: "Allgemein",
  protocol: "Protokoll",
  guideline: "Richtlinie",
  template: "Vorlage",
  faq: "FAQ",
  training: "Schulung",
  hygiene: "Hygiene",
  safety: "Sicherheit",
  quality: "Qualität",
  hr: "Personal",
  it: "IT",
  finance: "Finanzen",
  legal: "Recht",
  marketing: "Marketing",
}

// Sortable category item component
function SortableCategoryItem({
  id,
  index,
  isActive,
  onToggleActive,
  onRemove,
  totalItems,
}: {
  id: string
  index: number
  isActive: boolean
  onToggleActive: (cat: string) => void
  onRemove: (cat: string) => void
  totalItems: number
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-lg border bg-card p-3 ${isDragging ? "opacity-50 shadow-lg" : ""} ${!isActive ? "opacity-50" : ""}`}
    >
      <button
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
        aria-label="Kategorie verschieben"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
        {index + 1}
      </span>

      <span className={`flex-1 text-sm font-medium ${!isActive ? "line-through text-muted-foreground" : ""}`}>
        {CATEGORY_LABELS[id] || id}
      </span>

      <span className="text-xs text-muted-foreground">{id}</span>

      <Switch
        checked={isActive}
        onCheckedChange={() => onToggleActive(id)}
        aria-label={`Kategorie ${CATEGORY_LABELS[id] || id} ${isActive ? "deaktivieren" : "aktivieren"}`}
      />

      <button
        onClick={() => onRemove(id)}
        disabled={totalItems <= 1}
        className="rounded-full p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"
        aria-label={`Kategorie ${CATEGORY_LABELS[id] || id} entfernen`}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

export function KnowledgeSettings() {
  const { currentPractice } = usePractice()
  const { toast } = useToast()
  const [settings, setSettings] = useState<KnowledgeSettingsData>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newCategory, setNewCategory] = useState("")

  const practiceId = currentPractice?.id

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const loadSettings = useCallback(async () => {
    if (!practiceId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/practices/${practiceId}/knowledge/settings`)
      if (res.ok) {
        const data = await res.json()
        setSettings({
          require_review_before_publish: data.require_review_before_publish ?? false,
          auto_versioning: data.auto_versioning ?? true,
          default_category: data.default_category || "general",
          allowed_categories: data.allowed_categories || DEFAULT_SETTINGS.allowed_categories,
          disabled_categories: data.disabled_categories || [],
          max_versions_to_keep: data.max_versions_to_keep ?? 10,
          require_change_summary: data.require_change_summary ?? true,
          notify_on_publish: data.notify_on_publish ?? false,
          notify_on_update: data.notify_on_update ?? false,
        })
      }
    } catch (error) {
      console.error("Error loading knowledge settings:", error)
    } finally {
      setLoading(false)
    }
  }, [practiceId])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const handleSave = async () => {
    if (!practiceId) return
    setSaving(true)
    try {
      const res = await fetch(`/api/practices/${practiceId}/knowledge/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      if (res.ok) {
        toast({ title: "Gespeichert", description: "Wissensdatenbank-Einstellungen wurden aktualisiert." })
      } else {
        throw new Error("Save failed")
      }
    } catch {
      toast({ title: "Fehler", description: "Einstellungen konnten nicht gespeichert werden.", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const toggleCategory = (cat: string) => {
    setSettings((prev) => {
      const isCurrentlyDisabled = prev.disabled_categories.includes(cat)
      const newDisabled = isCurrentlyDisabled
        ? prev.disabled_categories.filter((c) => c !== cat)
        : [...prev.disabled_categories, cat]
      return { ...prev, disabled_categories: newDisabled }
    })
  }

  const addCategory = () => {
    const key = newCategory.trim().toLowerCase().replace(/\s+/g, "_")
    if (!key || settings.allowed_categories.includes(key)) return
    setSettings((prev) => ({ ...prev, allowed_categories: [...prev.allowed_categories, key] }))
    setNewCategory("")
  }

  const removeCategory = (cat: string) => {
    if (settings.allowed_categories.length <= 1) return
    setSettings((prev) => ({
      ...prev,
      allowed_categories: prev.allowed_categories.filter((c) => c !== cat),
      default_category:
        prev.default_category === cat
          ? prev.allowed_categories.filter((c) => c !== cat)[0] || "general"
          : prev.default_category,
    }))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setSettings((prev) => {
      const oldIndex = prev.allowed_categories.indexOf(active.id as string)
      const newIndex = prev.allowed_categories.indexOf(over.id as string)
      return {
        ...prev,
        allowed_categories: arrayMove(prev.allowed_categories, oldIndex, newIndex),
      }
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Review & Publishing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5" />
            Review & Veröffentlichung
          </CardTitle>
          <CardDescription>Steuern Sie, wie Artikel veröffentlicht und geprüft werden.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Review vor Veröffentlichung</Label>
              <p className="text-xs text-muted-foreground">Artikel müssen vor der Veröffentlichung geprüft werden.</p>
            </div>
            <Switch
              checked={settings.require_review_before_publish}
              onCheckedChange={(v) => setSettings((p) => ({ ...p, require_review_before_publish: v }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Versioning */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5" />
            Versionierung
          </CardTitle>
          <CardDescription>Konfigurieren Sie die automatische Versionsverwaltung für Artikel.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Automatische Versionierung</Label>
              <p className="text-xs text-muted-foreground">Bei jeder Bearbeitung wird automatisch eine neue Version erstellt.</p>
            </div>
            <Switch
              checked={settings.auto_versioning}
              onCheckedChange={(v) => setSettings((p) => ({ ...p, auto_versioning: v }))}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Änderungsbeschreibung erforderlich</Label>
              <p className="text-xs text-muted-foreground">Bei jeder Änderung muss eine Beschreibung angegeben werden.</p>
            </div>
            <Switch
              checked={settings.require_change_summary}
              onCheckedChange={(v) => setSettings((p) => ({ ...p, require_change_summary: v }))}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Maximale Versionen pro Artikel</Label>
            <p className="text-xs text-muted-foreground">Ältere Versionen werden automatisch entfernt.</p>
            <Select
              value={String(settings.max_versions_to_keep)}
              onValueChange={(v) => setSettings((p) => ({ ...p, max_versions_to_keep: parseInt(v) }))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 Versionen</SelectItem>
                <SelectItem value="10">10 Versionen</SelectItem>
                <SelectItem value="20">20 Versionen</SelectItem>
                <SelectItem value="50">50 Versionen</SelectItem>
                <SelectItem value="100">Unbegrenzt (100)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Categories with drag-and-drop sorting */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FolderOpen className="h-5 w-5" />
            Kategorien & Reihenfolge
          </CardTitle>
          <CardDescription>
            Verwalten Sie die verfügbaren Kategorien für Wissensartikel. Sortieren Sie die Reihenfolge per Drag & Drop und aktivieren/deaktivieren Sie einzelne Kategorien.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Standardkategorie</Label>
            <Select
              value={settings.default_category}
              onValueChange={(v) => setSettings((p) => ({ ...p, default_category: v }))}
            >
              <SelectTrigger className="w-[250px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {settings.allowed_categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {CATEGORY_LABELS[cat] || cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Kategorien-Reihenfolge</Label>
            <p className="text-xs text-muted-foreground">
              Ziehen Sie die Kategorien per Drag & Drop in die gewünschte Anzeigereihenfolge. Aktivieren oder deaktivieren Sie einzelne Kategorien mit dem Schalter. Nur aktive Kategorien werden für die automatische Generierung der Wissensseite verwendet.
            </p>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={settings.allowed_categories} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {settings.allowed_categories.map((cat, index) => (
                    <SortableCategoryItem
                      key={cat}
                      id={cat}
                      index={index}
                      isActive={!settings.disabled_categories.includes(cat)}
                      onToggleActive={toggleCategory}
                      onRemove={removeCategory}
                      totalItems={settings.allowed_categories.length}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            <div className="flex gap-2 pt-2">
              <Input
                placeholder="Neue Kategorie hinzufügen..."
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCategory()}
                className="max-w-[250px]"
              />
              <Button variant="outline" size="sm" onClick={addCategory} disabled={!newCategory.trim()}>
                <Plus className="h-4 w-4 mr-1" />
                Hinzufügen
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5" />
            Benachrichtigungen
          </CardTitle>
          <CardDescription>Konfigurieren Sie Benachrichtigungen für Wissensartikel.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Bei Veröffentlichung benachrichtigen</Label>
              <p className="text-xs text-muted-foreground">Team-Mitglieder werden über neue Artikel informiert.</p>
            </div>
            <Switch
              checked={settings.notify_on_publish}
              onCheckedChange={(v) => setSettings((p) => ({ ...p, notify_on_publish: v }))}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Bei Aktualisierung benachrichtigen</Label>
              <p className="text-xs text-muted-foreground">Team-Mitglieder werden über Änderungen an bestehenden Artikeln informiert.</p>
            </div>
            <Switch
              checked={settings.notify_on_update}
              onCheckedChange={(v) => setSettings((p) => ({ ...p, notify_on_update: v }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Einstellungen speichern
        </Button>
      </div>
    </div>
  )
}
