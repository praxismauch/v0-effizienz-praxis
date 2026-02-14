"use client"

import { useState, useEffect, useMemo } from "react"
import {
  ToggleLeft,
  Search,
  Monitor,
  Server,
  RefreshCw,
  Info,
  Building2,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
import { toast } from "sonner"
import type { FeatureFlag, Practice, PracticeOverride, FeatureGroup } from "./types"
import { FeatureRow } from "./feature-row"
import { StatsCards } from "./stats-cards"
import { ScopeSelector } from "./scope-selector"

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
      if (selectedPractice !== "global") body.practice_id = selectedPractice

      const response = await fetch("/api/super-admin/features", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        if (selectedPractice !== "global") {
          setPracticeOverrides((prev) => ({
            ...prev,
            [featureKey]: {
              ...prev[featureKey],
              ...(typeof updates.is_enabled === "boolean" ? { is_enabled: updates.is_enabled } : {}),
              ...(typeof updates.is_beta === "boolean" ? { is_beta: updates.is_beta } : {}),
            },
          }))
        } else {
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
        toast.success("Auf globale Einstellung zuruckgesetzt")
      } else {
        toast.error("Fehler beim Zurucksetzen")
      }
    } catch (error) {
      console.error("Error resetting feature:", error)
      toast.error("Fehler beim Zurucksetzen")
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
        toast.success(action === "reset" ? "Alle Einstellungen zuruckgesetzt" : "Globale Einstellungen kopiert")
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
      if (newSet.has(groupKey)) newSet.delete(groupKey)
      else newSet.add(groupKey)
      return newSet
    })
  }

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

  const organizedFeatures = useMemo(() => {
    const filtered = features.filter((f) => f.feature_type === activeTab)
    const groups: FeatureGroup[] = []
    const parentFeatures = filtered.filter((f) => !f.parent_key)

    for (const parent of parentFeatures) {
      const children = filtered.filter((f) => f.parent_key === parent.feature_key)
      groups.push({ feature: parent, children })
    }

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

  const stats = useMemo(() => {
    const frontendFeatures = features.filter((f) => f.feature_type === "frontend" && f.parent_key)
    const backendFeatures = features.filter((f) => f.feature_type === "backend" && f.parent_key)

    const getEnabled = (f: FeatureFlag) => getEffectiveValue(f, "is_enabled")
    const getBeta = (f: FeatureFlag) => getEffectiveValue(f, "is_beta")

    return {
      frontend: {
        total: frontendFeatures.length,
        enabled: frontendFeatures.filter(getEnabled).length,
        beta: frontendFeatures.filter(getBeta).length,
        overrides: frontendFeatures.filter((f) => hasOverride(f.feature_key)).length,
      },
      backend: {
        total: backendFeatures.length,
        enabled: backendFeatures.filter(getEnabled).length,
        beta: backendFeatures.filter(getBeta).length,
        overrides: backendFeatures.filter((f) => hasOverride(f.feature_key)).length,
      },
    }
  }, [features, practiceOverrides, selectedPractice])

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ToggleLeft className="h-6 w-6 text-primary" />
            Feature-Verwaltung
          </h1>
          <p className="text-muted-foreground mt-1">
            {"Verwalten Sie die Sichtbarkeit und den Beta-Status von Menupunkten"}
          </p>
        </div>
        <Button variant="outline" onClick={loadFeatures}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Aktualisieren
        </Button>
      </div>

      <ScopeSelector
        selectedPractice={selectedPractice}
        practices={practices}
        selectedPracticeName={selectedPracticeName}
        onPracticeChange={setSelectedPractice}
        onCopyGlobal={() => setConfirmDialog({ open: true, action: "copy" })}
        onResetAll={() => setConfirmDialog({ open: true, action: "reset" })}
      />

      <StatsCards
        frontend={stats.frontend}
        backend={stats.backend}
        showOverrides={selectedPractice !== "global"}
      />

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          {selectedPractice === "global" ? (
            <>
              <strong>Globale Einstellungen:</strong> Diese Einstellungen gelten fur alle Praxen, sofern keine
              praxis-spezifischen Uberschreibungen definiert sind.
            </>
          ) : (
            <>
              <strong>Praxis-spezifische Einstellungen:</strong> Anderungen hier uberschreiben die globalen
              Einstellungen nur fur <strong>{selectedPracticeName}</strong>. Features mit{" "}
              <Building2 className="h-4 w-4 inline text-blue-500" /> haben eine Uberschreibung.
            </>
          )}
        </AlertDescription>
      </Alert>

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

      <Card>
        <CardHeader>
          <CardTitle>{activeTab === "frontend" ? "App-Menupunkte" : "Super-Admin-Menupunkte"}</CardTitle>
          <CardDescription>
            {activeTab === "frontend"
              ? "Alle Menupunkte, die in der Haupt-App angezeigt werden"
              : "Alle Menupunkte im Super-Admin Bereich"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {organizedFeatures.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? "Keine Features gefunden" : "Keine Features vorhanden"}
            </div>
          ) : (
            organizedFeatures.map((group) => (
              <FeatureRow
                key={group.feature.id}
                feature={group.feature}
                features={features}
                expandedGroups={expandedGroups}
                saving={saving}
                onToggleGroup={toggleGroup}
                onUpdateFeature={updateFeature}
                onResetToGlobal={resetPracticeToGlobal}
                getEffectiveValue={getEffectiveValue}
                hasOverride={hasOverride}
              />
            ))
          )}
        </CardContent>
      </Card>

      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.action === "reset" ? "Einstellungen zurucksetzen?" : "Globale Einstellungen kopieren?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.action === "reset" ? (
                <>
                  Alle praxis-spezifischen Einstellungen fur <strong>{selectedPracticeName}</strong> werden
                  entfernt. Die Praxis verwendet dann wieder die globalen Einstellungen.
                </>
              ) : (
                <>
                  Die aktuellen globalen Einstellungen werden als Uberschreibungen fur{" "}
                  <strong>{selectedPracticeName}</strong> gespeichert. Bestehende Uberschreibungen werden
                  aktualisiert.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleBulkAction(confirmDialog.action)}>
              {confirmDialog.action === "reset" ? "Zurucksetzen" : "Kopieren"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
