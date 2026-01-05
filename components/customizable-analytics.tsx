"use client"

import { useState, useEffect } from "react"
import { AnalyticsOverview } from "@/components/analytics-overview"
import { PerformanceMetrics } from "@/components/performance-metrics"
import { KpiTrendsChart } from "@/components/kpi-trends-chart"
import { CustomAnalyticsChart } from "@/components/custom-analytics-chart"
import { SickDaysChart } from "@/components/sick-days-chart"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Settings,
  Plus,
  Star,
  StarOff,
  LayoutDashboard,
  Sparkles,
  Loader2,
  Pencil,
  Trash2,
  SquareStack,
} from "lucide-react"
import { AnalyticsCustomizer, type AnalyticsItem, type AnalyticsTab } from "@/components/analytics-customizer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTranslation } from "@/contexts/translation-context"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { usePractice } from "@/contexts/practice-context"
import { useUser } from "@/contexts/user-context"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface SystemDiagram {
  id: string
  title: string
  description: string
  component: "AnalyticsOverview" | "PerformanceMetrics" | "KpiTrendsChart" | "CustomChart" | "SickDaysChart"
  category: "overview" | "performance" | "trends" | "custom"
  isFavorite: boolean
  showOnDashboard: boolean
  chartType?: "area" | "line" | "bar" | "pie"
  selectedParameters?: string[]
}

interface DashboardTile {
  id: string
  title: string
  description: string
  type: "stat" | "chart" | "progress" | "list" | "info"
  color: "default" | "blue" | "green" | "yellow" | "red" | "purple"
  size: "small" | "medium" | "large"
  dataSource?: string
  value?: string
  unit?: string
  trend?: "up" | "down" | "neutral"
  trendValue?: string
  showOnDashboard: boolean
  chartType?: "line" | "bar" | "pie" | "area"
  parameterIds?: string[]
}

const defaultSystemDiagrams: SystemDiagram[] = [
  {
    id: "analytics-overview",
    title: "Praxiswachstum & Übersicht",
    description: "Wachstumstrends, Aufgabenverteilung und Teamzufriedenheit",
    component: "AnalyticsOverview",
    category: "overview",
    isFavorite: false,
    showOnDashboard: false,
  },
  {
    id: "performance-metrics",
    title: "Leistungskennzahlen",
    description: "Effizienz- und Qualitätsmetriken der Praxis",
    component: "PerformanceMetrics",
    category: "performance",
    isFavorite: false,
    showOnDashboard: false,
  },
  {
    id: "kpi-trends",
    title: "KPI Trends",
    description: "Zeitliche Entwicklung Ihrer wichtigsten Kennzahlen",
    component: "KpiTrendsChart",
    category: "trends",
    isFavorite: false,
    showOnDashboard: false,
  },
  {
    id: "sick-days",
    title: "Kranktage Übersicht",
    description: "Verteilung der Kranktage nach Monat und Mitarbeiter",
    component: "SickDaysChart",
    category: "overview",
    isFavorite: false,
    showOnDashboard: false,
  },
]

const defaultTiles: DashboardTile[] = [
  {
    id: "tile-patients",
    title: "Patienten heute",
    description: "Anzahl der Patienten für heute",
    type: "stat",
    color: "blue",
    size: "small",
    value: "24",
    trend: "up",
    trendValue: "+12%",
    showOnDashboard: true,
  },
  {
    id: "tile-revenue",
    title: "Monatsumsatz",
    description: "Aktueller Monatsumsatz",
    type: "stat",
    color: "green",
    size: "small",
    value: "€45.230",
    trend: "up",
    trendValue: "+8%",
    showOnDashboard: true,
  },
  {
    id: "tile-tasks",
    title: "Offene Aufgaben",
    description: "Noch zu erledigende Aufgaben",
    type: "stat",
    color: "yellow",
    size: "small",
    value: "7",
    trend: "down",
    trendValue: "-3",
    showOnDashboard: false,
  },
]

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
  const [showAddTileDialog, setShowAddTileDialog] = useState(false)
  const [editingTile, setEditingTile] = useState<DashboardTile | null>(null)

  // New tile form state
  const [newTileTitle, setNewTileTitle] = useState("")
  const [newTileDescription, setNewTileDescription] = useState("")
  const [newTileType, setNewTileType] = useState<DashboardTile["type"]>("stat")
  const [newTileColor, setNewTileColor] = useState<DashboardTile["color"]>("default")
  const [newTileSize, setNewTileSize] = useState<DashboardTile["size"]>("small")
  const [newTileValue, setNewTileValue] = useState("")
  const [newTileUnit, setNewTileUnit] = useState("")

  // New custom diagram form state
  const [newDiagramTitle, setNewDiagramTitle] = useState("")
  const [newDiagramDescription, setNewDiagramDescription] = useState("")
  const [newDiagramChartType, setNewDiagramChartType] = useState<"area" | "line" | "bar" | "pie">("line")
  const [newDiagramParameters, setNewDiagramParameters] = useState<string[]>([])

  const [hasMounted, setHasMounted] = useState(false)
  const [isLoadingSettings, setIsLoadingSettings] = useState(true)

  useEffect(() => {
    setHasMounted(true)

    const loadSettings = async () => {
      if (!user?.id) {
        setIsLoadingSettings(false)
        return
      }

      try {
        const response = await fetch(`/api/users/${user.id}/analytics-settings`)
        if (response.ok) {
          const data = await response.json()

          if (data.systemDiagrams) {
            setSystemDiagrams(data.systemDiagrams)
          }
          if (data.customDiagrams) {
            setCustomDiagrams(data.customDiagrams)
          }
          if (data.dashboardTiles) {
            setTiles(data.dashboardTiles)
          }
          if (data.analyticsLayout && Array.isArray(data.analyticsLayout)) {
            setAnalyticsItems(data.analyticsLayout)
          }
          if (data.analyticsTabs && Array.isArray(data.analyticsTabs)) {
            setAnalyticsTabs(data.analyticsTabs)
          }
        }
      } catch (error) {
        console.error("Failed to load settings from database:", error)
        // Fallback to localStorage for migration
        loadFromLocalStorage()
      } finally {
        setIsLoadingSettings(false)
      }
    }

    const loadFromLocalStorage = () => {
      const savedDiagrams = localStorage.getItem("system-diagrams-settings")
      if (savedDiagrams) {
        try {
          const parsed = JSON.parse(savedDiagrams)
          setSystemDiagrams(parsed.system || defaultSystemDiagrams)
          setCustomDiagrams(parsed.custom || [])
        } catch (error) {
          console.error("Failed to load diagram settings:", error)
        }
      }

      const savedTiles = localStorage.getItem("dashboard-tiles-settings")
      if (savedTiles) {
        try {
          setTiles(JSON.parse(savedTiles))
        } catch (error) {
          console.error("Failed to load tiles settings:", error)
        }
      }

      const savedLayout = localStorage.getItem("analytics-customizer-layout")
      const savedTabs = localStorage.getItem("analytics-customizer-tabs")

      if (savedLayout) {
        try {
          const parsedLayout = JSON.parse(savedLayout)
          setAnalyticsItems(parsedLayout)
        } catch (error) {
          console.error("Failed to load analytics layout:", error)
          setAnalyticsItems([])
        }
      }

      if (savedTabs) {
        try {
          const parsedTabs = JSON.parse(savedTabs)
          setAnalyticsTabs(parsedTabs)
        } catch (error) {
          console.error("Failed to load analytics tabs:", error)
          setAnalyticsTabs([])
        }
      }
    }

    loadSettings()
  }, [user?.id])

  useEffect(() => {
    async function fetchParameters() {
      // Use practiceId prop if available, otherwise fallback to context
      const practiceIdentifier = practiceId || practice?.id
      if (!practiceIdentifier) {
        toast.error("Keine Praxis-ID gefunden. Bitte neu laden.")
        return
      }
      try {
        const response = await fetch(`/api/practices/${practiceIdentifier}/parameters`)
        const data = await response.json()
        setAvailableParameters(data.parameters || [])
      } catch (error) {
        console.error("[v0] Failed to fetch parameters:", error)
        toast.error("Fehler beim Laden der Parameter")
      }
    }
    fetchParameters()
  }, [practice?.id, practiceId])

  const saveDiagramSettings = async (system: SystemDiagram[], custom: SystemDiagram[]) => {
    // Save to localStorage as backup
    localStorage.setItem("system-diagrams-settings", JSON.stringify({ system, custom }))

    // Save to database
    if (user?.id) {
      try {
        await fetch(`/api/users/${user.id}/analytics-settings`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ systemDiagrams: system, customDiagrams: custom }),
        })
        // Clean up localStorage after successful save
        localStorage.removeItem("system-diagrams-settings")
      } catch (error) {
        console.error("Failed to save diagram settings to database:", error)
      }
    }
  }

  const saveTilesSettings = async (updatedTiles: DashboardTile[]) => {
    // Save to localStorage as backup
    localStorage.setItem("dashboard-tiles-settings", JSON.stringify(updatedTiles))

    // Save to database
    if (user?.id) {
      try {
        await fetch(`/api/users/${user.id}/analytics-settings`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dashboardTiles: updatedTiles }),
        })
        // Clean up localStorage after successful save
        localStorage.removeItem("dashboard-tiles-settings")
      } catch (error) {
        console.error("Failed to save tiles settings to database:", error)
      }
    }
  }

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
      const updated = customDiagrams.map((d) =>
        d.id === diagramId ? { ...d, showOnDashboard: !d.showOnDashboard } : d,
      )
      setCustomDiagrams(updated)
      saveDiagramSettings(systemDiagrams, updated)
    } else {
      const updated = systemDiagrams.map((d) =>
        d.id === diagramId ? { ...d, showOnDashboard: !d.showOnDashboard } : d,
      )
      setSystemDiagrams(updated)
      saveDiagramSettings(updated, customDiagrams)
    }
  }

  const addCustomDiagram = () => {
    if (!newDiagramTitle.trim() || newDiagramParameters.length === 0) return

    const newDiagram: SystemDiagram = {
      id: `custom-${Date.now()}`,
      title: newDiagramTitle,
      description: newDiagramDescription,
      component: "CustomChart",
      category: "custom",
      isFavorite: false,
      showOnDashboard: false,
      chartType: newDiagramChartType,
      selectedParameters: newDiagramParameters,
    }

    const updated = [...customDiagrams, newDiagram]
    setCustomDiagrams(updated)
    saveDiagramSettings(systemDiagrams, updated)

    // Reset form
    setNewDiagramTitle("")
    setNewDiagramDescription("")
    setNewDiagramChartType("line")
    setNewDiagramParameters([])
    setShowAddCustomDialog(false)
  }

  const deleteCustomDiagram = (diagramId: string) => {
    const updated = customDiagrams.filter((d) => d.id !== diagramId)
    setCustomDiagrams(updated)
    saveDiagramSettings(systemDiagrams, updated)
  }

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
        toast.success("Diagramm erfolgreich erstellt")
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
        toast.success("Kachel erfolgreich erstellt")
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

  const addTile = () => {
    if (!newTileTitle.trim()) return

    const newTile: DashboardTile = {
      id: `tile-${Date.now()}`,
      title: newTileTitle,
      description: newTileDescription,
      type: newTileType,
      color: newTileColor,
      size: newTileSize,
      value: newTileValue,
      unit: newTileUnit,
      showOnDashboard: true,
    }

    const updated = [...tiles, newTile]
    setTiles(updated)
    saveTilesSettings(updated)
    resetTileForm()
    setShowAddTileDialog(false)
    toast.success("Kachel erfolgreich erstellt")
  }

  const updateTile = () => {
    if (!editingTile || !newTileTitle.trim()) return

    const updated = tiles.map((t) =>
      t.id === editingTile.id
        ? {
            ...t,
            title: newTileTitle,
            description: newTileDescription,
            type: newTileType,
            color: newTileColor,
            size: newTileSize,
            value: newTileValue,
            unit: newTileUnit,
          }
        : t,
    )
    setTiles(updated)
    saveTilesSettings(updated)
    resetTileForm()
    setEditingTile(null)
    toast.success("Kachel erfolgreich aktualisiert")
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

  const resetTileForm = () => {
    setNewTileTitle("")
    setNewTileDescription("")
    setNewTileType("stat")
    setNewTileColor("default")
    setNewTileSize("small")
    setNewTileValue("")
    setNewTileUnit("")
  }

  const startEditTile = (tile: DashboardTile) => {
    setEditingTile(tile)
    setNewTileTitle(tile.title)
    setNewTileDescription(tile.description)
    setNewTileType(tile.type)
    setNewTileColor(tile.color)
    setNewTileSize(tile.size)
    setNewTileValue(tile.value || "")
    setNewTileUnit(tile.unit || "")
  }

  const renderDiagram = (diagram: SystemDiagram) => {
    switch (diagram.component) {
      case "AnalyticsOverview":
        return <AnalyticsOverview key={diagram.id} />
      case "PerformanceMetrics":
        return <PerformanceMetrics key={diagram.id} />
      case "KpiTrendsChart":
        return <KpiTrendsChart key={diagram.id} />
      case "SickDaysChart":
        return <SickDaysChart key={diagram.id} />
      case "CustomChart":
        return (
          <CustomAnalyticsChart
            key={diagram.id}
            title={diagram.title}
            description={diagram.description}
            chartType={diagram.chartType || "line"}
            parameterIds={diagram.selectedParameters || []}
          />
        )
      default:
        return null
    }
  }

  const renderDiagramCard = (diagram: SystemDiagram, isCustom = false) => (
    <div key={diagram.id} className="relative group">
      <div className="absolute top-4 right-4 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant={diagram.isFavorite ? "default" : "secondary"}
          size="sm"
          onClick={() => toggleFavorite(diagram.id, isCustom)}
          title={diagram.isFavorite ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
        >
          {diagram.isFavorite ? <Star className="h-4 w-4 fill-current" /> : <StarOff className="h-4 w-4" />}
        </Button>
        <Button
          variant={diagram.showOnDashboard ? "default" : "secondary"}
          size="sm"
          onClick={() => toggleDashboard(diagram.id, isCustom)}
          title={diagram.showOnDashboard ? "Vom Dashboard entfernen" : "Zum Dashboard hinzufügen"}
        >
          <LayoutDashboard className="h-4 w-4" />
        </Button>
        {isCustom && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => deleteCustomDiagram(diagram.id)}
            title="Diagramm löschen"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      {renderDiagram(diagram)}
    </div>
  )

  const getTileColorClasses = (color: DashboardTile["color"]) => {
    const colors = {
      default: "bg-card border-border",
      blue: "bg-blue-500/10 border-blue-500/30",
      green: "bg-green-500/10 border-green-500/30",
      yellow: "bg-yellow-500/10 border-yellow-500/30",
      red: "bg-red-500/10 border-red-500/30",
      purple: "bg-purple-500/10 border-purple-500/30",
    }
    return colors[color]
  }

  const getTileSizeClasses = (size: DashboardTile["size"]) => {
    const sizes = {
      small: "col-span-1",
      medium: "col-span-2",
      large: "col-span-3",
    }
    return sizes[size]
  }

  const renderTileCard = (tile: DashboardTile) => (
    <Card
      key={tile.id}
      className={cn("relative group transition-all", getTileColorClasses(tile.color), getTileSizeClasses(tile.size))}
    >
      <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEditTile(tile)} title="Bearbeiten">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-7 w-7", tile.showOnDashboard && "text-primary")}
          onClick={() => toggleTileDashboard(tile.id)}
          title={tile.showOnDashboard ? "Vom Dashboard entfernen" : "Zum Dashboard hinzufügen"}
        >
          <LayoutDashboard className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive"
          onClick={() => deleteTile(tile.id)}
          title="Löschen"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{tile.title}</CardTitle>
        {tile.description && <CardDescription className="text-xs">{tile.description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">{tile.value || "—"}</span>
          {tile.unit && <span className="text-sm text-muted-foreground">{tile.unit}</span>}
        </div>
        {tile.trend && (
          <div
            className={cn(
              "text-xs mt-1",
              tile.trend === "up" && "text-green-600",
              tile.trend === "down" && "text-red-600",
              tile.trend === "neutral" && "text-muted-foreground",
            )}
          >
            {tile.trend === "up" && "↑"}
            {tile.trend === "down" && "↓"}
            {tile.trend === "neutral" && "→"} {tile.trendValue}
          </div>
        )}
        {tile.showOnDashboard && (
          <Badge variant="outline" className="mt-2 text-xs">
            Im Dashboard
          </Badge>
        )}
      </CardContent>
    </Card>
  )

  const allDiagrams = [...systemDiagrams, ...customDiagrams]
  const favoriteDiagrams = allDiagrams.filter((d) => d.isFavorite)
  const dashboardDiagrams = allDiagrams.filter((d) => d.showOnDashboard)
  const dashboardTiles = tiles.filter((t) => t.showOnDashboard)

  // Hydration safety check
  if (!hasMounted) {
    return null
  }

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
            <h2 className="text-2xl font-bold text-foreground">
              {t("analytics.customizer.configureTitle", "Analytics konfigurieren")}
            </h2>
            <p className="text-muted-foreground">
              {t("analytics.customizer.configureSubtitle", "Passen Sie Ihre Analytics-Ansicht an")}
            </p>
          </div>
          <Button variant="outline" onClick={() => setShowCustomizer(false)}>
            {t("analytics.customizer.backToAnalytics", "Zurück zu Analytics")}
          </Button>
        </div>
        <AnalyticsCustomizer
          onItemsChange={setAnalyticsItems}
          onTabsChange={setAnalyticsTabs}
          onSaved={() => setShowCustomizer(false)}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{t("analytics.diagrams.title", "Diagramme")}</h2>
          <p className="text-muted-foreground">
            {t("analytics.subtitle", "Umfassende Einblicke in Ihre Praxisleistung und Versorgungskennzahlen")}
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-to-r from-purple-500/90 to-indigo-500/90 hover:from-purple-600 hover:to-indigo-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300">
                <Sparkles className="h-4 w-4" />
                Mit KI erstellen
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Mit KI erstellen
                </DialogTitle>
                <DialogDescription>
                  Beschreiben Sie, was Sie erstellen möchten, und die KI generiert es für Sie
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid gap-2">
                  <Label>Was möchten Sie erstellen?</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={aiMode === "diagram" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAiMode("diagram")}
                      className="flex-1"
                    >
                      Diagramm
                    </Button>
                    <Button
                      variant={aiMode === "tile" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAiMode("tile")}
                      className="flex-1"
                    >
                      Kachel
                    </Button>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ai-prompt">Beschreibung</Label>
                  <Textarea
                    id="ai-prompt"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder={
                      aiMode === "diagram"
                        ? "z.B. Zeige mir die Entwicklung der Patientenzahlen über die letzten 12 Monate als Liniendiagramm"
                        : "z.B. Erstelle eine Kachel für den aktuellen Tagesumsatz in grün"
                    }
                    rows={4}
                  />
                </div>
                {aiMode === "diagram" && availableParameters.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium mb-1">Verfügbare KPI-Parameter:</p>
                    <p className="truncate">{availableParameters.map((p) => p.name).join(", ")}</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAIDialog(false)}>
                  Abbrechen
                </Button>
                <Button onClick={generateWithAI} disabled={!aiPrompt.trim() || aiGenerating} className="gap-2">
                  {aiGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generiere...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generieren
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={() => setShowCustomizer(true)} className="gap-2">
            <Settings className="h-4 w-4" />
            {t("analytics.customizer.customizeLayout", "Layout anpassen")}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className="gap-2">
            {t("analytics.categories.all", "Alle")}
            <Badge variant="secondary" className="ml-1">
              {allDiagrams.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="favorites" className="gap-2">
            <Star className="h-4 w-4" />
            {t("analytics.categories.favorites", "Favoriten")}
            {favoriteDiagrams.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {favoriteDiagrams.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="gap-2">
            <LayoutDashboard className="h-4 w-4" />
            {t("analytics.categories.dashboard", "Dashboard")}
            {dashboardDiagrams.length + dashboardTiles.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {dashboardDiagrams.length + dashboardTiles.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="tiles" className="gap-2">
            <SquareStack className="h-4 w-4" />
            Kacheln
            <Badge variant="secondary" className="ml-1">
              {tiles.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {/* System Diagrams Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">System-Diagramme</h3>
              <Badge variant="outline">{systemDiagrams.length} verfügbar</Badge>
            </div>
            <div className="space-y-6">{systemDiagrams.map((diagram) => renderDiagramCard(diagram, false))}</div>
          </div>

          {/* Custom Diagrams Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Benutzerdefinierte Diagramme</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 bg-gradient-to-r from-purple-500/90 to-indigo-500/90 hover:from-purple-600 hover:to-indigo-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300"
                  onClick={() => {
                    setAiMode("diagram")
                    setShowAIDialog(true)
                  }}
                >
                  <Sparkles className="h-4 w-4" />
                  Mit KI erstellen
                </Button>
                <Dialog open={showAddCustomDialog} onOpenChange={setShowAddCustomDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                      <Plus className="h-4 w-4" />
                      Manuell erstellen
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Benutzerdefiniertes Diagramm erstellen</DialogTitle>
                      <DialogDescription>
                        Erstellen Sie ein neues Diagramm mit Ihren eigenen KPI-Parametern
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="diagram-title">Titel</Label>
                        <Input
                          id="diagram-title"
                          value={newDiagramTitle}
                          onChange={(e) => setNewDiagramTitle(e.target.value)}
                          placeholder="z.B. Umsatzentwicklung"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="diagram-description">Beschreibung</Label>
                        <Textarea
                          id="diagram-description"
                          value={newDiagramDescription}
                          onChange={(e) => setNewDiagramDescription(e.target.value)}
                          placeholder="z.B. Monatlicher Umsatz im Vergleich"
                          rows={2}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Diagrammtyp</Label>
                        <Select value={newDiagramChartType} onValueChange={(v: any) => setNewDiagramChartType(v)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="line">Liniendiagramm</SelectItem>
                            <SelectItem value="area">Flächendiagramm</SelectItem>
                            <SelectItem value="bar">Balkendiagramm</SelectItem>
                            <SelectItem value="pie">Kreisdiagramm</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>KPI-Parameter auswählen</Label>
                        <ScrollArea className="h-48 rounded-md border p-4">
                          {availableParameters.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              Keine KPI-Parameter verfügbar. Erstellen Sie zuerst Parameter in den Einstellungen.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {availableParameters.map((param) => (
                                <div key={param.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`param-${param.id}`}
                                    checked={newDiagramParameters.includes(param.id)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setNewDiagramParameters([...newDiagramParameters, param.id])
                                      } else {
                                        setNewDiagramParameters(newDiagramParameters.filter((p) => p !== param.id))
                                      }
                                    }}
                                  />
                                  <label
                                    htmlFor={`param-${param.id}`}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    {param.name}
                                    {param.unit && <span className="text-muted-foreground ml-1">({param.unit})</span>}
                                  </label>
                                </div>
                              ))}
                            </div>
                          )}
                        </ScrollArea>
                        <p className="text-xs text-muted-foreground">
                          {newDiagramParameters.length} Parameter ausgewählt
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowAddCustomDialog(false)}>
                        Abbrechen
                      </Button>
                      <Button
                        onClick={addCustomDiagram}
                        disabled={!newDiagramTitle.trim() || newDiagramParameters.length === 0}
                      >
                        Diagramm erstellen
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            {customDiagrams.length > 0 ? (
              <div className="space-y-6">{customDiagrams.map((diagram) => renderDiagramCard(diagram, true))}</div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Plus className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Keine benutzerdefinierten Diagramme</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Erstellen Sie eigene Diagramme mit KI oder wählen Sie KPI-Parameter manuell
                  </p>
                  <div className="flex justify-center gap-2">
                    <Button
                      className="gap-2 bg-gradient-to-r from-purple-500/90 to-indigo-500/90 hover:from-purple-600 hover:to-indigo-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300"
                      onClick={() => {
                        setAiMode("diagram")
                        setShowAIDialog(true)
                      }}
                    >
                      <Sparkles className="h-4 w-4" />
                      Mit KI erstellen
                    </Button>
                    <Button variant="outline" onClick={() => setShowAddCustomDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Manuell erstellen
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
              {favoriteDiagrams.map((diagram) => {
                const isCustom = diagram.component === "CustomChart"
                return renderDiagramCard(diagram, isCustom)
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Star className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t("analytics.noFavorites", "Keine Favoriten")}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Markieren Sie Diagramme als Favoriten, indem Sie auf das Stern-Symbol klicken
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Dashboard Tiles */}
          {dashboardTiles.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Kacheln im Dashboard</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {dashboardTiles.map(renderTileCard)}
              </div>
            </div>
          )}

          {/* Dashboard Diagrams */}
          {dashboardDiagrams.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Diagramme im Dashboard</h3>
              <div className="space-y-6">
                {dashboardDiagrams.map((diagram) => {
                  const isCustom = diagram.component === "CustomChart"
                  return renderDiagramCard(diagram, isCustom)
                })}
              </div>
            </div>
          ) : dashboardTiles.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <LayoutDashboard className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t("analytics.noDashboard", "Keine Dashboard-Elemente")}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Fügen Sie Diagramme oder Kacheln zum Dashboard hinzu
                </p>
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>

        <TabsContent value="tiles" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Dashboard-Kacheln</h3>
              <p className="text-sm text-muted-foreground">Erstellen und verwalten Sie Kacheln für Ihr Dashboard</p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="gap-2 bg-gradient-to-r from-purple-500/90 to-indigo-500/90 hover:from-purple-600 hover:to-indigo-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300"
                onClick={() => {
                  setAiMode("tile")
                  setShowAIDialog(true)
                }}
              >
                <Sparkles className="h-4 w-4" />
                Mit KI erstellen
              </Button>
              <Dialog
                open={showAddTileDialog || !!editingTile}
                onOpenChange={(open) => {
                  if (!open) {
                    setShowAddTileDialog(false)
                    setEditingTile(null)
                    resetTileForm()
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                    <Plus className="h-4 w-4" />
                    Kachel hinzufügen
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingTile ? "Kachel bearbeiten" : "Neue Kachel erstellen"}</DialogTitle>
                    <DialogDescription>
                      {editingTile
                        ? "Bearbeiten Sie die Eigenschaften der Kachel"
                        : "Erstellen Sie eine neue Kachel für Ihr Dashboard"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="tile-title">Titel</Label>
                      <Input
                        id="tile-title"
                        value={newTileTitle}
                        onChange={(e) => setNewTileTitle(e.target.value)}
                        placeholder="z.B. Patienten heute"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="tile-description">Beschreibung</Label>
                      <Input
                        id="tile-description"
                        value={newTileDescription}
                        onChange={(e) => setNewTileDescription(e.target.value)}
                        placeholder="Optional"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Typ</Label>
                        <Select value={newTileType} onValueChange={(v: any) => setNewTileType(v)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="stat">Statistik</SelectItem>
                            <SelectItem value="chart">Mini-Chart</SelectItem>
                            <SelectItem value="progress">Fortschritt</SelectItem>
                            <SelectItem value="list">Liste</SelectItem>
                            <SelectItem value="info">Info</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>Farbe</Label>
                        <Select value={newTileColor} onValueChange={(v: any) => setNewTileColor(v)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">Standard</SelectItem>
                            <SelectItem value="blue">Blau</SelectItem>
                            <SelectItem value="green">Grün</SelectItem>
                            <SelectItem value="yellow">Gelb</SelectItem>
                            <SelectItem value="red">Rot</SelectItem>
                            <SelectItem value="purple">Lila</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label>Größe</Label>
                      <Select value={newTileSize} onValueChange={(v: any) => setNewTileSize(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Klein (1 Spalte)</SelectItem>
                          <SelectItem value="medium">Mittel (2 Spalten)</SelectItem>
                          <SelectItem value="large">Groß (3 Spalten)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="tile-value">Wert</Label>
                        <Input
                          id="tile-value"
                          value={newTileValue}
                          onChange={(e) => setNewTileValue(e.target.value)}
                          placeholder="z.B. 24"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="tile-unit">Einheit</Label>
                        <Input
                          id="tile-unit"
                          value={newTileUnit}
                          onChange={(e) => setNewTileUnit(e.target.value)}
                          placeholder="z.B. Patienten"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowAddTileDialog(false)
                        setEditingTile(null)
                        resetTileForm()
                      }}
                    >
                      Abbrechen
                    </Button>
                    <Button onClick={editingTile ? updateTile : addTile} disabled={!newTileTitle.trim()}>
                      {editingTile ? "Speichern" : "Erstellen"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {tiles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">{tiles.map(renderTileCard)}</div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <SquareStack className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Keine Kacheln vorhanden</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Erstellen Sie Kacheln für Ihr Dashboard mit KI oder manuell
                </p>
                <div className="flex justify-center gap-2">
                  <Button
                    className="gap-2 bg-gradient-to-r from-purple-500/90 to-indigo-500/90 hover:from-purple-600 hover:to-indigo-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300"
                    onClick={() => {
                      setAiMode("tile")
                      setShowAIDialog(true)
                    }}
                  >
                    <Sparkles className="h-4 w-4" />
                    Mit KI erstellen
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddTileDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Manuell erstellen
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default CustomizableAnalytics
