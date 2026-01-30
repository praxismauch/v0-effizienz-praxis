"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import {
  Save,
  Settings,
  LayoutDashboard,
  GripVertical,
  CheckSquare,
  Calendar,
  Users,
  Star,
  FileText,
  Target,
  Workflow,
  Briefcase,
  TrendingUp,
  BarChart3,
  Clock,
  Activity,
  Rss,
  Lightbulb,
  Zap,
  Columns,
  Rows,
} from "lucide-react"
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
import dynamic from "next/dynamic"

const GlobalParameterManagement = dynamic(() => import("@/components/global-parameter-management"), {
  loading: () => <div className="flex items-center justify-center h-96">Lädt Parameter-Management...</div>,
  ssr: false,
})

interface CockpitCardSetting {
  id?: string
  widget_id: string
  label: string
  description: string
  icon: string
  column_span: number
  row_span: number
  min_height: string
  is_enabled_by_default: boolean
  display_order: number
  card_style: {
    variant: string
    showBorder: boolean
    showShadow: boolean
  }
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  "check-square": CheckSquare,
  calendar: Calendar,
  users: Users,
  star: Star,
  "file-text": FileText,
  target: Target,
  workflow: Workflow,
  briefcase: Briefcase,
  "trending-up": TrendingUp,
  "bar-chart-3": BarChart3,
  clock: Clock,
  activity: Activity,
  rss: Rss,
  lightbulb: Lightbulb,
  zap: Zap,
}

interface SortableCockpitCardProps {
  setting: CockpitCardSetting
  onUpdate: (widgetId: string, updates: Partial<CockpitCardSetting>) => void
}

function SortableCockpitCard({ setting, onUpdate }: SortableCockpitCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: setting.widget_id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  }

  const Icon = ICON_MAP[setting.icon] || CheckSquare

  return (
    <Card ref={setNodeRef} style={style} className={`p-4 ${isDragging ? "shadow-lg ring-2 ring-primary" : ""}`}>
      <div className="flex items-start gap-3">
        <div
          {...attributes}
          {...listeners}
          className="mt-1 p-1.5 rounded hover:bg-muted cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>

        <div className="flex-1 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-medium">{setting.label}</h4>
              <p className="text-sm text-muted-foreground">{setting.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={setting.is_enabled_by_default ? "default" : "secondary"}>
                {setting.is_enabled_by_default ? "Aktiv" : "Inaktiv"}
              </Badge>
              <Switch
                checked={setting.is_enabled_by_default}
                onCheckedChange={(checked) => onUpdate(setting.widget_id, { is_enabled_by_default: checked })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1">
                <Columns className="h-3 w-3" />
                Spalten (1-4)
              </Label>
              <Select
                value={String(setting.column_span)}
                onValueChange={(value) => onUpdate(setting.widget_id, { column_span: Number.parseInt(value) })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Spalte</SelectItem>
                  <SelectItem value="2">2 Spalten</SelectItem>
                  <SelectItem value="3">3 Spalten</SelectItem>
                  <SelectItem value="4">4 Spalten (Volle Breite)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1">
                <Rows className="h-3 w-3" />
                Zeilen (1-2)
              </Label>
              <Select
                value={String(setting.row_span)}
                onValueChange={(value) => onUpdate(setting.widget_id, { row_span: Number.parseInt(value) })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Zeile</SelectItem>
                  <SelectItem value="2">2 Zeilen</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Min. Höhe</Label>
              <Input
                className="h-8"
                placeholder="auto"
                value={setting.min_height || ""}
                onChange={(e) => onUpdate(setting.widget_id, { min_height: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Stil</Label>
              <Select
                value={setting.card_style?.variant || "default"}
                onValueChange={(value) =>
                  onUpdate(setting.widget_id, {
                    card_style: { ...setting.card_style, variant: value },
                  })
                }
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Standard</SelectItem>
                  <SelectItem value="ghost">Dezent</SelectItem>
                  <SelectItem value="outline">Umrandet</SelectItem>
                  <SelectItem value="filled">Gefüllt</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Preview of column span */}
          <div className="pt-2">
            <Label className="text-xs text-muted-foreground mb-1 block">Vorschau der Breite:</Label>
            <div className="grid grid-cols-4 gap-1 h-4">
              {[1, 2, 3, 4].map((col) => (
                <div key={col} className={`rounded ${col <= setting.column_span ? "bg-primary" : "bg-muted"}`} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default function SuperAdminSettings() {
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("system")
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    allowNewRegistrations: true,
    enableEmailNotifications: true,
    enableBackups: true,
    autoBackupInterval: 24,
  })
  const [cockpitSettings, setCockpitSettings] = useState<CockpitCardSetting[]>([])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  useEffect(() => {
    fetchCockpitSettings()
  }, [])

  const fetchCockpitSettings = async () => {
    try {
      const response = await fetch("/api/super-admin/cockpit-settings")
      if (response.ok) {
        const data = await response.json()
        setCockpitSettings(data.settings || [])
      }
    } catch (error) {
      console.error("Error fetching cockpit settings:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setCockpitSettings((items) => {
        const oldIndex = items.findIndex((item) => item.widget_id === active.id)
        const newIndex = items.findIndex((item) => item.widget_id === over.id)
        const newItems = arrayMove(items, oldIndex, newIndex)
        // Update display_order for each item
        return newItems.map((item, index) => ({ ...item, display_order: index + 1 }))
      })
    }
  }

  const handleUpdateCockpitCard = (widgetId: string, updates: Partial<CockpitCardSetting>) => {
    setCockpitSettings((prev) =>
      prev.map((setting) => (setting.widget_id === widgetId ? { ...setting, ...updates } : setting)),
    )
  }

  const handleSaveSystemSettings = async () => {
    setSaving(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast({
        title: "Einstellungen gespeichert",
        description: "Die Systemeinstellungen wurden erfolgreich aktualisiert.",
      })
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Die Einstellungen konnten nicht gespeichert werden.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveCockpitSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/super-admin/cockpit-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: cockpitSettings }),
      })

      if (!response.ok) {
        throw new Error("Failed to save cockpit settings")
      }

      toast({
        title: "Cockpit-Einstellungen gespeichert",
        description: "Die Cockpit-Karten wurden erfolgreich konfiguriert.",
      })
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Die Cockpit-Einstellungen konnten nicht gespeichert werden.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Systemeinstellungen</h1>
        <p className="text-muted-foreground">Verwalten Sie globale Systemeinstellungen</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            System
          </TabsTrigger>
          <TabsTrigger value="cockpit" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Cockpit-Karten
          </TabsTrigger>
          <TabsTrigger value="parameters" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Globale Kennzahlen
          </TabsTrigger>
        </TabsList>

        <TabsContent value="system" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Systemstatus</CardTitle>
              <CardDescription>Kontrollieren Sie den Status des Systems</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="maintenance">Wartungsmodus</Label>
                  <p className="text-sm text-muted-foreground">
                    Aktivieren Sie den Wartungsmodus für alle Benutzer außer Super Admins
                  </p>
                </div>
                <Switch
                  id="maintenance"
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, maintenanceMode: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="registrations">Neue Registrierungen</Label>
                  <p className="text-sm text-muted-foreground">Erlauben Sie neue Benutzerregistrierungen</p>
                </div>
                <Switch
                  id="registrations"
                  checked={settings.allowNewRegistrations}
                  onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, allowNewRegistrations: checked }))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Benachrichtigungen</CardTitle>
              <CardDescription>Konfigurieren Sie Systembenachrichtigungen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">E-Mail-Benachrichtigungen</Label>
                  <p className="text-sm text-muted-foreground">
                    Senden Sie E-Mail-Benachrichtigungen an Administratoren
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={settings.enableEmailNotifications}
                  onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, enableEmailNotifications: checked }))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Backup & Sicherheit</CardTitle>
              <CardDescription>Konfigurieren Sie automatische Backups</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="backups">Automatische Backups</Label>
                  <p className="text-sm text-muted-foreground">Erstellen Sie automatische Datenbank-Backups</p>
                </div>
                <Switch
                  id="backups"
                  checked={settings.enableBackups}
                  onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, enableBackups: checked }))}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveSystemSettings} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Speichert..." : "Einstellungen speichern"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="parameters" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Globale Kennzahlen-Verwaltung
              </CardTitle>
              <CardDescription>
                Verwalten Sie globale Kennzahlen (KPIs) die allen Praxen zur Verfügung stehen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GlobalParameterManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cockpit" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LayoutDashboard className="h-5 w-5" />
                Cockpit-Karten Konfiguration
              </CardTitle>
              <CardDescription>
                Definieren Sie die Standard-Spaltenbreite (1-4) und Reihenanzahl für jede Cockpit-Karte. Ziehen Sie die
                Karten, um die Reihenfolge zu ändern.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Column span legend */}
              <div className="mb-6 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Spalten-Legende:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-4 bg-primary rounded" />
                    <span>1 Spalte (25%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-4 bg-primary rounded" />
                    <span>2 Spalten (50%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-4 bg-primary rounded" />
                    <span>3 Spalten (75%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-4 bg-primary rounded" />
                    <span>4 Spalten (100%)</span>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : cockpitSettings.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <LayoutDashboard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Keine Cockpit-Karten konfiguriert.</p>
                  <p className="text-sm">Führen Sie das SQL-Skript aus, um die Standard-Karten zu erstellen.</p>
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext
                    items={cockpitSettings.map((s) => s.widget_id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      {cockpitSettings.map((setting) => (
                        <SortableCockpitCard
                          key={setting.widget_id}
                          setting={setting}
                          onUpdate={handleUpdateCockpitCard}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveCockpitSettings} disabled={saving || cockpitSettings.length === 0}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Speichert..." : "Cockpit-Einstellungen speichern"}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
