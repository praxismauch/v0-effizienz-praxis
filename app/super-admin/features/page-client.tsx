"use client"

import { useState, useEffect, useMemo } from "react"
import {
  ToggleLeft,
  Search,
  ChevronRight,
  ChevronDown,
  Shield,
  Sparkles,
  Monitor,
  Server,
  FolderOpen,
  RefreshCw,
  Check,
  X,
  Info,
  Building2,
  Globe,
  RotateCcw,
  Copy,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface FeatureFlag {
  id: string
  feature_key: string
  feature_name: string
  feature_type: "frontend" | "backend"
  parent_key: string | null
  icon_name: string | null
  route_path: string | null
  is_enabled: boolean
  is_beta: boolean
  is_protected: boolean
  allow_practice_override: boolean
  display_order: number
  description: string | null
  created_at: string
  updated_at: string
  updated_by: string | null
}

interface Practice {
  id: string
  name: string
}

interface PracticeOverride {
  is_enabled: boolean | null
  is_beta: boolean | null
}

interface FeatureGroup {
  feature: FeatureFlag
  children: FeatureFlag[]
}

export default function FeaturesClient() {
  const [features, setFeatures] = useState<FeatureFlag[]>([])
  const [practices, setPractices] = useState<Practice[]>([])
  const [practiceOverrides, setPracticeOverrides] = useState<Record<string, PracticeOverride>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<"frontend" | "backend">("frontend")
  const [selectedPractice, setSelectedPractice] = useState<string>("global")
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    action: "reset" | "copy"
    practiceId?: string
    practiceName?: string
  }>({ open: false, action: "reset" })

  useEffect(() => {
    loadFeatures()
  }, [selectedPractice])

  const loadFeatures = async () => {
    try {
      setLoading(true)
      const url =
        selectedPractice === "global"
          ? "/api/super-admin/features"
          : `/api/super-admin/features?practice_id=${selectedPractice}`

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setFeatures(data.features || [])
        setPractices(data.practices || [])
        setPracticeOverrides(data.practiceOverrides || {})
        // Expand all groups by default
        const groups = (data.features || [])
          .filter((f: FeatureFlag) => !f.parent_key)
          .map((f: FeatureFlag) => f.feature_key)
        setExpandedGroups(new Set(groups))
      } else {
        toast.error("Fehler beim Laden der Features")
      }
    } catch (error) {
      console.error("Error loading features:", error)
      toast.error("Fehler beim Laden der Features")
    } finally {
      setLoading(false)
    }
  }

  const updateFeature = async (featureKey: string, updates: { is_enabled?: boolean; is_beta?: boolean }) => {
    try {
      setSaving(featureKey)
      const body: Record<string, unknown> = { feature_key: featureKey, ...updates }

      if (selectedPractice !== "global") {
        body.practice_id = selectedPractice
      }

      const response = await fetch("/api/super-admin/features", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        if (selectedPractice !== "global") {
          // Update practice override state
          setPracticeOverrides((prev) => ({
            ...prev,
            [featureKey]: {
              ...prev[featureKey],
              ...(typeof updates.is_enabled === "boolean" ? { is_enabled: updates.is_enabled } : {}),
              ...(typeof updates.is_beta === "boolean" ? { is_beta: updates.is_beta } : {}),
            },
          }))
        } else {
          // Update global state
          setFeatures((prev) => prev.map((f) => (f.feature_key === featureKey ? { ...f, ...updates } : f)))
        }
        toast.success("Feature aktualisiert")
      } else {
        const error = await response.json()
        toast.error(error.error || "Fehler beim Aktualisieren")
      }
    } catch (error) {
      console.error("Error updating feature:", error)
      toast.error("Fehler beim Aktualisieren")
    } finally {
      setSaving(null)
    }
  }

  const resetPracticeToGlobal = async (featureKey: string) => {
    if (selectedPractice === "global") return

    try {
      setSaving(featureKey)
      const response = await fetch(
        `/api/super-admin/features?practice_id=${selectedPractice}&feature_key=${featureKey}`,
        { method: "DELETE" },
      )

      if (response.ok) {
        setPracticeOverrides((prev) => {
          const newOverrides = { ...prev }
          delete newOverrides[featureKey]
          return newOverrides
        })
        toast.success("Auf globale Einstellung zurückgesetzt")
      } else {
        toast.error("Fehler beim Zurücksetzen")
      }
    } catch (error) {
      console.error("Error resetting feature:", error)
      toast.error("Fehler beim Zurücksetzen")
    } finally {
      setSaving(null)
    }
  }

  const handleBulkAction = async (action: "reset" | "copy") => {
    if (selectedPractice === "global") return

    try {
      setLoading(true)
      const response = await fetch("/api/super-admin/features", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: action === "reset" ? "reset_practice" : "copy_to_practice",
          practice_id: selectedPractice,
        }),
      })

      if (response.ok) {
        toast.success(action === "reset" ? "Alle Einstellungen zurückgesetzt" : "Globale Einstellungen kopiert")
        loadFeatures()
      } else {
        toast.error("Fehler bei der Aktion")
      }
    } catch (error) {
      console.error("Error in bulk action:", error)
      toast.error("Fehler bei der Aktion")
    } finally {
      setLoading(false)
      setConfirmDialog({ open: false, action: "reset" })
    }
  }

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey)
      } else {
        newSet.add(groupKey)
      }
      return newSet
    })
  }

  // Get effective value considering practice override
  const getEffectiveValue = (feature: FeatureFlag, field: "is_enabled" | "is_beta"): boolean => {
    if (selectedPractice !== "global") {
      const override = practiceOverrides[feature.feature_key]
      if (override && override[field] !== null && override[field] !== undefined) {
        return override[field] as boolean
      }
    }
    return feature[field]
  }

  const hasOverride = (featureKey: string): boolean => {
    if (selectedPractice === "global") return false
    const override = practiceOverrides[featureKey]
    return override !== undefined && (override.is_enabled !== null || override.is_beta !== null)
  }

  // Organize features into groups
  const organizedFeatures = useMemo(() => {
    const filtered = features.filter((f) => f.feature_type === activeTab)
    const groups: FeatureGroup[] = []
    const parentFeatures = filtered.filter((f) => !f.parent_key)

    for (const parent of parentFeatures) {
      const children = filtered.filter((f) => f.parent_key === parent.feature_key)
      groups.push({ feature: parent, children })
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return groups.filter((group) => {
        const parentMatches =
          group.feature.feature_name.toLowerCase().includes(query) ||
          group.feature.feature_key.toLowerCase().includes(query)
        const childMatches = group.children.some(
          (c) => c.feature_name.toLowerCase().includes(query) || c.feature_key.toLowerCase().includes(query),
        )
        return parentMatches || childMatches
      })
    }

    return groups
  }, [features, activeTab, searchQuery])

  // Calculate stats
  const stats = useMemo(() => {
    const frontendFeatures = features.filter((f) => f.feature_type === "frontend" && f.parent_key)
    const backendFeatures = features.filter((f) => f.feature_type === "backend" && f.parent_key)

    const getEffectiveEnabled = (f: FeatureFlag) => getEffectiveValue(f, "is_enabled")
    const getEffectiveBeta = (f: FeatureFlag) => getEffectiveValue(f, "is_beta")

    return {
      frontend: {
        total: frontendFeatures.length,
        enabled: frontendFeatures.filter(getEffectiveEnabled).length,
        beta: frontendFeatures.filter(getEffectiveBeta).length,
        overrides: frontendFeatures.filter((f) => hasOverride(f.feature_key)).length,
      },
      backend: {
        total: backendFeatures.length,
        enabled: backendFeatures.filter(getEffectiveEnabled).length,
        beta: backendFeatures.filter(getEffectiveBeta).length,
        overrides: backendFeatures.filter((f) => hasOverride(f.feature_key)).length,
      },
    }
  }, [features, practiceOverrides, selectedPractice])

  const FeatureRow = ({ feature, isChild = false }: { feature: FeatureFlag; isChild?: boolean }) => {
    const isGroup = !feature.parent_key && feature.feature_type
    const isExpanded = expandedGroups.has(feature.feature_key)
    const groupChildren = isGroup ? features.filter((f) => f.parent_key === feature.feature_key) : []
    const featureHasOverride = hasOverride(feature.feature_key)
    const effectiveEnabled = getEffectiveValue(feature, "is_enabled")
    const effectiveBeta = getEffectiveValue(feature, "is_beta")

    if (isGroup) {
      return (
        <div className="mb-2">
          <button
            onClick={() => toggleGroup(feature.feature_key)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg",
              "bg-muted/50 hover:bg-muted transition-colors",
              "text-left font-medium",
            )}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <FolderOpen className="h-4 w-4 text-primary" />
            <span className="flex-1">{feature.feature_name}</span>
            <Badge variant="secondary" className="text-xs">
              {groupChildren.filter((c) => getEffectiveValue(c, "is_enabled")).length}/{groupChildren.length}
            </Badge>
          </button>
          {isExpanded && (
            <div className="ml-4 mt-1 space-y-1 border-l-2 border-muted pl-4">
              {groupChildren.map((child) => (
                <FeatureRow key={child.id} feature={child} isChild />
              ))}
            </div>
          )}
        </div>
      )
    }

    return (
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-lg",
          "bg-card border transition-all",
          !effectiveEnabled && "opacity-60",
          feature.is_protected && "border-amber-500/30 bg-amber-500/5",
          featureHasOverride && "border-blue-500/30 bg-blue-500/5",
        )}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{feature.feature_name}</span>
            {feature.is_protected && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Shield className="h-4 w-4 text-amber-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Geschützte Funktion - kann nicht deaktiviert werden</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {featureHasOverride && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Building2 className="h-4 w-4 text-blue-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Praxis-spezifische Einstellung (überschreibt global)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {effectiveBeta && (
              <Badge
                variant="outline"
                className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-violet-500/30 text-violet-600 text-xs font-semibold"
              >
                <Sparkles className="h-3 w-3 mr-1" />
                BETA
              </Badge>
            )}
          </div>
          {feature.description && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{feature.description}</p>
          )}
          {feature.route_path && (
            <code className="text-xs text-muted-foreground/70 font-mono">{feature.route_path}</code>
          )}
        </div>

        <div className="flex items-center gap-4 shrink-0">
          {/* Reset to global button (only for practice-specific view with override) */}
          {featureHasOverride && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => resetPracticeToGlobal(feature.feature_key)}
                    disabled={saving === feature.feature_key}
                    className="h-8 px-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Auf globale Einstellung zurücksetzen</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Beta Toggle */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">Beta</span>
                  <Switch
                    checked={effectiveBeta}
                    onCheckedChange={(checked) => updateFeature(feature.feature_key, { is_beta: checked })}
                    disabled={saving === feature.feature_key}
                    className="data-[state=checked]:bg-violet-500 data-[state=unchecked]:bg-slate-300 dark:data-[state=unchecked]:bg-slate-600"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Beta-Label anzeigen</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Enabled Toggle */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Aktiv</span>
                  <Switch
                    checked={effectiveEnabled}
                    onCheckedChange={(checked) => updateFeature(feature.feature_key, { is_enabled: checked })}
                    disabled={saving === feature.feature_key || feature.is_protected}
                    className="data-[state=checked]:bg-green-500"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{feature.is_protected ? "Geschützt" : "Feature aktivieren/deaktivieren"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const selectedPracticeName = practices.find((p) => p.id === selectedPractice)?.name

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ToggleLeft className="h-6 w-6 text-primary" />
            Feature-Verwaltung
          </h1>
          <p className="text-muted-foreground mt-1">
            Verwalten Sie die Sichtbarkeit und den Beta-Status von Menüpunkten
          </p>
        </div>
        <Button variant="outline" onClick={loadFeatures}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Aktualisieren
        </Button>
      </div>

      {/* Scope Selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Einstellungsbereich</CardTitle>
          <CardDescription>Wählen Sie, ob Sie globale oder praxis-spezifische Einstellungen bearbeiten</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={selectedPractice} onValueChange={setSelectedPractice}>
              <SelectTrigger className="w-full sm:w-[300px]">
                <SelectValue placeholder="Bereich auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="global">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-green-500" />
                    <span>Global (alle Praxen)</span>
                  </div>
                </SelectItem>
                {practices.map((practice) => (
                  <SelectItem key={practice.id} value={practice.id}>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-blue-500" />
                      <span>{practice.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedPractice !== "global" && (
              <div className="flex gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setConfirmDialog({
                            open: true,
                            action: "copy",
                            practiceId: selectedPractice,
                            practiceName: selectedPracticeName,
                          })
                        }
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Globale kopieren
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Aktuelle globale Einstellungen für diese Praxis übernehmen</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setConfirmDialog({
                            open: true,
                            action: "reset",
                            practiceId: selectedPractice,
                            practiceName: selectedPracticeName,
                          })
                        }
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Alle zurücksetzen
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Alle praxis-spezifischen Einstellungen entfernen</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Monitor className="h-4 w-4 text-blue-500" />
              Frontend (App)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">{stats.frontend.enabled} aktiv</span>
              </div>
              <div className="flex items-center gap-2">
                <X className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{stats.frontend.total - stats.frontend.enabled} deaktiviert</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-500" />
                <span className="text-sm">{stats.frontend.beta} Beta</span>
              </div>
              {selectedPractice !== "global" && stats.frontend.overrides > 0 && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">{stats.frontend.overrides} Überschreibungen</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Server className="h-4 w-4 text-orange-500" />
              Backend (Super-Admin)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">{stats.backend.enabled} aktiv</span>
              </div>
              <div className="flex items-center gap-2">
                <X className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{stats.backend.total - stats.backend.enabled} deaktiviert</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-500" />
                <span className="text-sm">{stats.backend.beta} Beta</span>
              </div>
              {selectedPractice !== "global" && stats.backend.overrides > 0 && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">{stats.backend.overrides} Überschreibungen</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          {selectedPractice === "global" ? (
            <>
              <strong>Globale Einstellungen:</strong> Diese Einstellungen gelten für alle Praxen, sofern keine
              praxis-spezifischen Überschreibungen definiert sind.
            </>
          ) : (
            <>
              <strong>Praxis-spezifische Einstellungen:</strong> Änderungen hier überschreiben die globalen
              Einstellungen nur für <strong>{selectedPracticeName}</strong>. Features mit{" "}
              <Building2 className="h-4 w-4 inline text-blue-500" /> haben eine Überschreibung.
            </>
          )}
        </AlertDescription>
      </Alert>

      {/* Search and Tabs */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Feature suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "frontend" | "backend")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="frontend" className="gap-2">
              <Monitor className="h-4 w-4" />
              Frontend
            </TabsTrigger>
            <TabsTrigger value="backend" className="gap-2">
              <Server className="h-4 w-4" />
              Backend
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Feature List */}
      <Card>
        <CardHeader>
          <CardTitle>{activeTab === "frontend" ? "App-Menüpunkte" : "Super-Admin-Menüpunkte"}</CardTitle>
          <CardDescription>
            {activeTab === "frontend"
              ? "Alle Menüpunkte, die in der Haupt-App angezeigt werden"
              : "Alle Menüpunkte im Super-Admin Bereich"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {organizedFeatures.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? "Keine Features gefunden" : "Keine Features vorhanden"}
            </div>
          ) : (
            organizedFeatures.map((group) => <FeatureRow key={group.feature.id} feature={group.feature} />)
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.action === "reset" ? "Einstellungen zurücksetzen?" : "Globale Einstellungen kopieren?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.action === "reset" ? (
                <>
                  Alle praxis-spezifischen Einstellungen für <strong>{confirmDialog.practiceName}</strong> werden
                  entfernt. Die Praxis verwendet dann wieder die globalen Einstellungen.
                </>
              ) : (
                <>
                  Die aktuellen globalen Einstellungen werden als Überschreibungen für{" "}
                  <strong>{confirmDialog.practiceName}</strong> gespeichert. Bestehende Überschreibungen werden
                  aktualisiert.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleBulkAction(confirmDialog.action)}>
              {confirmDialog.action === "reset" ? "Zurücksetzen" : "Kopieren"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
