"use client"

import { useState, useEffect, useCallback } from "react"
import { usePractice } from "@/contexts/practice-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Save, Settings2, Shield, Bell, History, FolderOpen, Plus, X } from "lucide-react"

interface KnowledgeSettings {
  require_review_before_publish: boolean
  auto_versioning: boolean
  default_category: string
  allowed_categories: string[]
  max_versions_to_keep: number
  require_change_summary: boolean
  notify_on_publish: boolean
  notify_on_update: boolean
}

const DEFAULT_SETTINGS: KnowledgeSettings = {
  require_review_before_publish: false,
  auto_versioning: true,
  default_category: "general",
  allowed_categories: ["general", "protocol", "guideline", "template", "faq", "training"],
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
  quality: "Qualitaet",
  hr: "Personal",
  it: "IT",
  finance: "Finanzen",
  legal: "Recht",
  marketing: "Marketing",
}

export function KnowledgeSettings() {
  const { currentPractice } = usePractice()
  const { toast } = useToast()
  const [settings, setSettings] = useState<KnowledgeSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newCategory, setNewCategory] = useState("")

  const practiceId = currentPractice?.id

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
      default_category: prev.default_category === cat ? prev.allowed_categories.filter((c) => c !== cat)[0] || "general" : prev.default_category,
    }))
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
            Review & Veroeffentlichung
          </CardTitle>
          <CardDescription>Steuern Sie, wie Artikel veroeffentlicht und geprueft werden.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Review vor Veroeffentlichung</Label>
              <p className="text-xs text-muted-foreground">Artikel muessen vor der Veroeffentlichung geprueft werden.</p>
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
          <CardDescription>Konfigurieren Sie die automatische Versionsverwaltung fuer Artikel.</CardDescription>
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
              <Label className="text-sm font-medium">Aenderungsbeschreibung erforderlich</Label>
              <p className="text-xs text-muted-foreground">Bei jeder Aenderung muss eine Beschreibung angegeben werden.</p>
            </div>
            <Switch
              checked={settings.require_change_summary}
              onCheckedChange={(v) => setSettings((p) => ({ ...p, require_change_summary: v }))}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Maximale Versionen pro Artikel</Label>
            <p className="text-xs text-muted-foreground">Aeltere Versionen werden automatisch entfernt.</p>
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

      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FolderOpen className="h-5 w-5" />
            Kategorien
          </CardTitle>
          <CardDescription>Verwalten Sie die verfuegbaren Kategorien fuer Wissensartikel.</CardDescription>
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
            <Label className="text-sm font-medium">Erlaubte Kategorien</Label>
            <div className="flex flex-wrap gap-2">
              {settings.allowed_categories.map((cat) => (
                <Badge key={cat} variant="secondary" className="gap-1 pr-1">
                  {CATEGORY_LABELS[cat] || cat}
                  <button
                    onClick={() => removeCategory(cat)}
                    className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                    aria-label={`Kategorie ${cat} entfernen`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Neue Kategorie..."
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCategory()}
                className="max-w-[250px]"
              />
              <Button variant="outline" size="sm" onClick={addCategory} disabled={!newCategory.trim()}>
                <Plus className="h-4 w-4 mr-1" />
                Hinzufuegen
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
          <CardDescription>Konfigurieren Sie Benachrichtigungen fuer Wissensartikel.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Bei Veroeffentlichung benachrichtigen</Label>
              <p className="text-xs text-muted-foreground">Team-Mitglieder werden ueber neue Artikel informiert.</p>
            </div>
            <Switch
              checked={settings.notify_on_publish}
              onCheckedChange={(v) => setSettings((p) => ({ ...p, notify_on_publish: v }))}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Bei Aktualisierung benachrichtigen</Label>
              <p className="text-xs text-muted-foreground">Team-Mitglieder werden ueber Aenderungen an bestehenden Artikeln informiert.</p>
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
