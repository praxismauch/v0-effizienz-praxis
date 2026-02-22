"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Settings, Plus, Star, Sparkles, Loader2 } from "lucide-react"
import { AnalyticsCustomizer, type AnalyticsItem, type AnalyticsTab } from "@/components/analytics-customizer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTranslation } from "@/contexts/translation-context"
import { Badge } from "@/components/ui/badge"
import { usePractice } from "@/contexts/practice-context"
import { useUser } from "@/contexts/user-context"
import { toast } from "sonner"

import type { SystemDiagram, DashboardTile } from "./customizable-analytics/types"
import { defaultSystemDiagrams, defaultTiles } from "./customizable-analytics/types"
import { DiagramCard } from "./customizable-analytics/diagram-card"
import { TileCard } from "./customizable-analytics/tile-card"
import { AIGenerationDialog, CustomDiagramDialog, TileDialog } from "./customizable-analytics/analytics-dialogs"

interface CustomizableAnalyticsProps {
  practiceId?: string
}

export function CustomizableAnalytics({ practiceId }: CustomizableAnalyticsProps) {
  const { t } = useTranslation()
  const { currentPractice: practice } = usePractice()
  const { user } = useUser()
  const [analyticsItems, setAnalyticsItems] = useState<AnalyticsItem[]>([])
  const [analyticsTabs, setAnalyticsTabs] = useState<AnalyticsTab[]>([])
  const [showCustomizer, setShowCustomizer] = useState(false)

  const [systemDiagrams, setSystemDiagrams] = useState<SystemDiagram[]>(defaultSystemDiagrams)
  const [customDiagrams, setCustomDiagrams] = useState<SystemDiagram[]>([])
  const [showAddCustomDialog, setShowAddCustomDialog] = useState(false)
  const [availableParameters, setAvailableParameters] = useState<any[]>([])

  const [showAIDialog, setShowAIDialog] = useState(false)
  const [aiPrompt, setAiPrompt] = useState("")
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiMode, setAiMode] = useState<"diagram" | "tile">("diagram")

  const [tiles, setTiles] = useState<DashboardTile[]>(defaultTiles)
  const [showTileDialog, setShowTileDialog] = useState(false)
  const [editingTile, setEditingTile] = useState<DashboardTile | null>(null)

  const [hasMounted, setHasMounted] = useState(false)
  const [isLoadingSettings, setIsLoadingSettings] = useState(true)

  // --- Load settings ---

  useEffect(() => {
    setHasMounted(true)

    const loadSettings = async () => {
      if (!user?.id) { setIsLoadingSettings(false); return }
      try {
        const response = await fetch(`/api/users/${user.id}/analytics-settings`)
        if (response.ok) {
          const data = await response.json()
          if (data.systemDiagrams) setSystemDiagrams(data.systemDiagrams)
          if (data.customDiagrams) setCustomDiagrams(data.customDiagrams)
          if (data.dashboardTiles) setTiles(data.dashboardTiles)
          if (data.analyticsLayout && Array.isArray(data.analyticsLayout)) setAnalyticsItems(data.analyticsLayout)
          if (data.analyticsTabs && Array.isArray(data.analyticsTabs)) setAnalyticsTabs(data.analyticsTabs)
        }
      } catch (error) {
        console.error("Failed to load settings:", error)
        loadFromLocalStorage()
      } finally {
        setIsLoadingSettings(false)
      }
    }

    const loadFromLocalStorage = () => {
      try {
        const savedDiagrams = localStorage.getItem("system-diagrams-settings")
        if (savedDiagrams) {
          const parsed = JSON.parse(savedDiagrams)
          setSystemDiagrams(parsed.system || defaultSystemDiagrams)
          setCustomDiagrams(parsed.custom || [])
        }
        const savedTiles = localStorage.getItem("dashboard-tiles-settings")
        if (savedTiles) setTiles(JSON.parse(savedTiles))
        const savedLayout = localStorage.getItem("analytics-customizer-layout")
        if (savedLayout) setAnalyticsItems(JSON.parse(savedLayout))
        const savedTabs = localStorage.getItem("analytics-customizer-tabs")
        if (savedTabs) setAnalyticsTabs(JSON.parse(savedTabs))
      } catch (error) {
        console.error("Failed to load from localStorage:", error)
      }
    }

    loadSettings()
  }, [user?.id])

  useEffect(() => {
    async function fetchParameters() {
      const pid = practiceId || practice?.id
      if (!pid) return
      try {
        const response = await fetch(`/api/practices/${pid}/parameters`)
        const data = await response.json()
        setAvailableParameters(data.parameters || [])
      } catch (error) {
        console.error("Failed to fetch parameters:", error)
      }
    }
    fetchParameters()
  }, [practice?.id, practiceId])

  // --- Save helpers ---

  const saveDiagramSettings = async (system: SystemDiagram[], custom: SystemDiagram[]) => {
    localStorage.setItem("system-diagrams-settings", JSON.stringify({ system, custom }))
    if (user?.id) {
      try {
        await fetch(`/api/users/${user.id}/analytics-settings`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ systemDiagrams: system, customDiagrams: custom }),
        })
        localStorage.removeItem("system-diagrams-settings")
      } catch (error) {
        console.error("Failed to save diagram settings:", error)
      }
    }
  }

  const saveTilesSettings = async (updatedTiles: DashboardTile[]) => {
    localStorage.setItem("dashboard-tiles-settings", JSON.stringify(updatedTiles))
    if (user?.id) {
      try {
        await fetch(`/api/users/${user.id}/analytics-settings`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dashboardTiles: updatedTiles }),
        })
        localStorage.removeItem("dashboard-tiles-settings")
      } catch (error) {
        console.error("Failed to save tiles settings:", error)
      }
    }
  }

  // --- Diagram handlers ---

  const toggleFavorite = (diagramId: string, isCustom: boolean) => {
    if (isCustom) {
      const updated = customDiagrams.map((d) => (d.id === diagramId ? { ...d, isFavorite: !d.isFavorite } : d))
      setCustomDiagrams(updated)
      saveDiagramSettings(systemDiagrams, updated)
    } else {
      const updated = systemDiagrams.map((d) => (d.id === diagramId ? { ...d, isFavorite: !d.isFavorite } : d))
      setSystemDiagrams(updated)
      saveDiagramSettings(updated, customDiagrams)
    }
  }

  const toggleDashboard = (diagramId: string, isCustom: boolean) => {
    if (isCustom) {
      const updated = customDiagrams.map((d) => (d.id === diagramId ? { ...d, showOnDashboard: !d.showOnDashboard } : d))
      setCustomDiagrams(updated)
      saveDiagramSettings(systemDiagrams, updated)
    } else {
      const updated = systemDiagrams.map((d) => (d.id === diagramId ? { ...d, showOnDashboard: !d.showOnDashboard } : d))
      setSystemDiagrams(updated)
      saveDiagramSettings(updated, customDiagrams)
    }
  }

  const addCustomDiagram = (data: { title: string; description: string; chartType: "area" | "line" | "bar" | "pie"; parameterIds: string[] }) => {
    const newDiagram: SystemDiagram = {
      id: `custom-${Date.now()}`,
      title: data.title,
      description: data.description,
      component: "CustomChart",
      category: "custom",
      isFavorite: false,
      showOnDashboard: false,
      chartType: data.chartType,
      selectedParameters: data.parameterIds,
    }
    const updated = [...customDiagrams, newDiagram]
    setCustomDiagrams(updated)
    saveDiagramSettings(systemDiagrams, updated)
    setShowAddCustomDialog(false)
  }

  const deleteCustomDiagram = (diagramId: string) => {
    const updated = customDiagrams.filter((d) => d.id !== diagramId)
    setCustomDiagrams(updated)
    saveDiagramSettings(systemDiagrams, updated)
  }

  // --- Tile handlers ---

  const handleTileSubmit = (data: { title: string; description: string; type: DashboardTile["type"]; color: DashboardTile["color"]; size: DashboardTile["size"]; value: string; unit: string }) => {
    if (editingTile) {
      const updated = tiles.map((t) => (t.id === editingTile.id ? { ...t, ...data } : t))
      setTiles(updated)
      saveTilesSettings(updated)
      toast.success("Kachel aktualisiert")
    } else {
      const newTile: DashboardTile = { id: `tile-${Date.now()}`, ...data, showOnDashboard: true }
      const updated = [...tiles, newTile]
      setTiles(updated)
      saveTilesSettings(updated)
      toast.success("Kachel erstellt")
    }
    setShowTileDialog(false)
    setEditingTile(null)
  }

  const deleteTile = (tileId: string) => {
    const updated = tiles.filter((t) => t.id !== tileId)
    setTiles(updated)
    saveTilesSettings(updated)
    toast.success("Kachel gelöscht")
  }

  const toggleTileDashboard = (tileId: string) => {
    const updated = tiles.map((t) => (t.id === tileId ? { ...t, showOnDashboard: !t.showOnDashboard } : t))
    setTiles(updated)
    saveTilesSettings(updated)
  }

  // --- AI Generation ---

  const generateWithAI = async () => {
    if (!aiPrompt.trim()) return
    setAiGenerating(true)
    try {
      const response = await fetch("/api/analytics/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt,
          mode: aiMode,
          availableParameters: availableParameters.map((p) => ({ id: p.id, name: p.name, unit: p.unit })),
          practiceId: practiceId || practice?.id,
        }),
      })
      if (!response.ok) throw new Error("AI generation failed")
      const result = await response.json()

      if (aiMode === "diagram" && result.diagram) {
        const newDiagram: SystemDiagram = {
          id: `ai-${Date.now()}`,
          title: result.diagram.title,
          description: result.diagram.description,
          component: "CustomChart",
          category: "custom",
          isFavorite: false,
          showOnDashboard: false,
          chartType: result.diagram.chartType,
          selectedParameters: result.diagram.parameterIds,
        }
        const updated = [...customDiagrams, newDiagram]
        setCustomDiagrams(updated)
        saveDiagramSettings(systemDiagrams, updated)
        toast.success("Diagramm erstellt")
      } else if (aiMode === "tile" && result.tile) {
        const newTile: DashboardTile = {
          id: `ai-tile-${Date.now()}`,
          title: result.tile.title,
          description: result.tile.description,
          type: result.tile.type,
          color: result.tile.color,
          size: result.tile.size,
          value: result.tile.value,
          trend: result.tile.trend,
          trendValue: result.tile.trendValue,
          showOnDashboard: true,
        }
        const updated = [...tiles, newTile]
        setTiles(updated)
        saveTilesSettings(updated)
        toast.success("Kachel erstellt")
      }

      setAiPrompt("")
      setShowAIDialog(false)
    } catch (error) {
      console.error("AI generation error:", error)
      toast.error("Fehler bei der KI-Generierung")
    } finally {
      setAiGenerating(false)
    }
  }

  // --- Computed values ---

  const allDiagrams = [...systemDiagrams, ...customDiagrams]
  const favoriteDiagrams = allDiagrams.filter((d) => d.isFavorite)
  const dashboardDiagrams = allDiagrams.filter((d) => d.showOnDashboard)
  const dashboardTiles = tiles.filter((t) => t.showOnDashboard)

  if (!hasMounted) return null

  if (isLoadingSettings) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (showCustomizer) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{t("analytics.customizer.configureTitle", "Analytics konfigurieren")}</h2>
            <p className="text-muted-foreground">{t("analytics.customizer.configureSubtitle", "Passen Sie Ihre Analytics-Ansicht an")}</p>
          </div>
          <Button variant="outline" onClick={() => setShowCustomizer(false)}>{t("analytics.customizer.backToAnalytics", "Zuruck zu Analytics")}</Button>
        </div>
        <AnalyticsCustomizer onItemsChange={setAnalyticsItems} onTabsChange={setAnalyticsTabs} onSaved={() => setShowCustomizer(false)} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{t("analytics.diagrams.title", "Diagramme")}</h2>
          <p className="text-muted-foreground">{t("analytics.subtitle", "Umfassende Einblicke in Ihre Praxisleistung")}</p>
        </div>
        <div className="flex gap-2">
          <Button
            className="gap-2 bg-gradient-to-r from-purple-500/90 to-indigo-500/90 hover:from-purple-600 hover:to-indigo-600 text-white border-0 shadow-md"
            onClick={() => setShowAIDialog(true)}
          >
            <Sparkles className="h-4 w-4" />
            Mit KI erstellen
          </Button>
          <Button variant="outline" onClick={() => setShowCustomizer(true)} className="gap-2">
            <Settings className="h-4 w-4" />
            {t("analytics.customizer.customizeLayout", "Layout anpassen")}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all" className="gap-2">
            {t("analytics.categories.all", "Alle")}
            <Badge variant="secondary" className="ml-1">{allDiagrams.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="favorites" className="gap-2">
            <Star className="h-4 w-4" />
            {t("analytics.categories.favorites", "Favoriten")}
            {favoriteDiagrams.length > 0 && <Badge variant="secondary" className="ml-1">{favoriteDiagrams.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">System-Diagramme</h3>
              <Badge variant="outline">{systemDiagrams.length} verfügbar</Badge>
            </div>
            <div className="space-y-6">
              {systemDiagrams.map((d) => (
                <DiagramCard key={d.id} diagram={d} isCustom={false} onToggleFavorite={toggleFavorite} onToggleDashboard={toggleDashboard} />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Benutzerdefinierte Diagramme</h3>
              <div className="flex gap-2">
                <Button size="sm" className="gap-2 bg-gradient-to-r from-purple-500/90 to-indigo-500/90 text-white border-0" onClick={() => { setAiMode("diagram"); setShowAIDialog(true) }}>
                  <Sparkles className="h-4 w-4" />Mit KI erstellen
                </Button>
                <Button variant="outline" size="sm" className="gap-2 bg-transparent" onClick={() => setShowAddCustomDialog(true)}>
                  <Plus className="h-4 w-4" />Manuell erstellen
                </Button>
              </div>
            </div>
            {customDiagrams.length > 0 ? (
              <div className="space-y-6">
                {customDiagrams.map((d) => (
                  <DiagramCard key={d.id} diagram={d} isCustom onToggleFavorite={toggleFavorite} onToggleDashboard={toggleDashboard} onDelete={deleteCustomDiagram} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Plus className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Keine benutzerdefinierten Diagramme</h3>
                  <p className="text-sm text-muted-foreground mb-4">Erstellen Sie eigene Diagramme mit KI oder wahlen Sie KPI-Parameter manuell</p>
                  <div className="flex justify-center gap-2">
                    <Button className="gap-2 bg-gradient-to-r from-purple-500/90 to-indigo-500/90 text-white border-0" onClick={() => { setAiMode("diagram"); setShowAIDialog(true) }}>
                      <Sparkles className="h-4 w-4" />Mit KI erstellen
                    </Button>
                    <Button variant="outline" onClick={() => setShowAddCustomDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />Manuell erstellen
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="favorites" className="space-y-6">
          {favoriteDiagrams.length > 0 ? (
            <div className="space-y-6">
              {favoriteDiagrams.map((d) => (
                <DiagramCard key={d.id} diagram={d} isCustom={d.component === "CustomChart"} onToggleFavorite={toggleFavorite} onToggleDashboard={toggleDashboard} onDelete={d.component === "CustomChart" ? deleteCustomDiagram : undefined} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Star className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t("analytics.noFavorites", "Keine Favoriten")}</h3>
                <p className="text-sm text-muted-foreground">Markieren Sie Diagramme als Favoriten</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

      </Tabs>

      {/* Dialog Components */}
      <AIGenerationDialog
        open={showAIDialog}
        onOpenChange={setShowAIDialog}
        aiPrompt={aiPrompt}
        onAIPromptChange={setAiPrompt}
        aiMode={aiMode}
        onAIModeChange={setAiMode}
        onGenerate={generateWithAI}
        isGenerating={aiGenerating}
        availableParameters={availableParameters}
      />
      <CustomDiagramDialog
        open={showAddCustomDialog}
        onOpenChange={setShowAddCustomDialog}
        availableParameters={availableParameters}
        onSubmit={addCustomDiagram}
      />
      <TileDialog
        open={showTileDialog || !!editingTile}
        onOpenChange={(open) => { if (!open) { setShowTileDialog(false); setEditingTile(null) } }}
        editingTile={editingTile}
        onSubmit={handleTileSubmit}
      />
    </div>
  )
}

export default CustomizableAnalytics
