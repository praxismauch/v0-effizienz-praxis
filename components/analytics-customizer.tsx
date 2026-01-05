"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"
import {
  BarChart3,
  GripVertical,
  TrendingUp,
  PieChart,
  LineChart,
  RotateCcw,
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  Activity,
  AreaChart,
  Plus,
  Pencil,
  Trash2,
  Folder,
  FolderOpen,
  Settings,
} from "lucide-react"
import { useTranslation } from "@/contexts/translation-context"
import { usePractice } from "@/contexts/practice-context"
import { useUser } from "@/contexts/user-context"
import type { Parameter } from "@/types/parameter" // Import Parameter type
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
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

export interface AnalyticsTab {
  id: string
  name: string
  order: number
  enabled: boolean
}

export interface AnalyticsItem {
  id: string
  title: string
  component: string
  enabled: boolean
  order: number
  category: "overview" | "performance" | "charts"
  description: string
  chartType: "area" | "line" | "pie" | "bar"
  selectedParameters?: string[]
  displayIn: "analytics" | "dashboard" | "both"
  tabIds?: string[] // Changed from tabId to tabIds to support multiple tabs
}

const chartTypeIcons = {
  area: AreaChart,
  line: LineChart,
  pie: PieChart,
  bar: BarChart3,
}

const getChartTypeLabel = (chartType: "area" | "line" | "pie" | "bar", t: any) => {
  const labels = {
    area: t("analytics.chartType.area", "Fläche"),
    line: t("analytics.chartType.line", "Linie"),
    pie: t("analytics.chartType.pie", "Kreis"),
    bar: t("analytics.chartType.bar", "Balken"),
  }
  return labels[chartType]
}

const defaultTabs: AnalyticsTab[] = [
  { id: "overview", name: "Übersicht", order: 1, enabled: true },
  { id: "performance", name: "Leistung", order: 2, enabled: true },
  { id: "charts", name: "Diagramme", order: 3, enabled: true },
]

const defaultAnalyticsItems: AnalyticsItem[] = [
  {
    id: "kpi-cards",
    title: "KPI Dashboard",
    component: "KPICards",
    enabled: true,
    order: 1, // Moved to order 1 to match the settings screenshot
    category: "performance",
    description: "Key performance indicators",
    chartType: "bar",
    displayIn: "analytics",
    tabIds: ["performance"],
  },
  {
    id: "practice-growth",
    title: "Practice Growth Trends",
    component: "PracticeGrowthChart",
    enabled: true,
    order: 2, // Updated order
    category: "overview",
    description: "Tasks and revenue over time",
    chartType: "area",
    displayIn: "analytics",
    tabIds: ["overview"],
  },
  {
    id: "task-distribution",
    title: "Task Distribution",
    component: "TaskDistributionChart",
    enabled: true,
    order: 3, // Updated order
    category: "overview",
    description: "Breakdown of task categories",
    chartType: "pie",
    displayIn: "analytics",
    tabIds: ["overview"],
  },
  {
    id: "team-satisfaction",
    title: "Team Satisfaction",
    component: "TeamSatisfactionChart",
    enabled: true,
    order: 4, // Updated order
    category: "overview",
    description: "Weekly satisfaction scores",
    chartType: "line",
    displayIn: "analytics",
    tabIds: ["overview"],
  },
  {
    id: "efficiency-metrics",
    title: "Practice Efficiency",
    component: "EfficiencyChart",
    enabled: true,
    order: 5,
    category: "performance",
    description: "Weekly efficiency and throughput",
    chartType: "line",
    displayIn: "analytics",
    tabIds: ["performance"],
  },
  {
    id: "quality-metrics",
    title: "Quality Metrics",
    component: "QualityChart",
    enabled: true,
    order: 6,
    category: "performance",
    description: "Team satisfaction and quality indicators",
    chartType: "area",
    displayIn: "analytics",
    tabIds: ["performance"],
  },
  {
    id: "weekly-tasks",
    title: "Weekly Tasks",
    component: "WeeklyTasksChart",
    enabled: false,
    order: 7,
    category: "charts",
    description: "Completed and pending tasks",
    chartType: "bar",
    displayIn: "analytics",
    tabIds: ["charts"],
  },
  {
    id: "workflow-chart",
    title: "Daily Workflow",
    component: "WorkflowChart",
    enabled: false,
    order: 8,
    category: "charts",
    description: "Task status throughout the day",
    chartType: "area",
    displayIn: "analytics",
    tabIds: ["charts"],
  },
  {
    id: "revenue-analysis",
    title: "Revenue Analysis",
    component: "RevenueChart",
    enabled: false,
    order: 9,
    category: "charts",
    description: "Monthly revenue trends",
    chartType: "line",
    displayIn: "analytics",
    tabIds: ["charts"],
  },
]

interface AnalyticsCustomizerProps {
  onItemsChange?: (items: AnalyticsItem[]) => void
  onTabsChange?: (tabs: AnalyticsTab[]) => void // Added callback for tab changes
  onSaved?: () => void
}

export function AnalyticsCustomizer({ onItemsChange, onTabsChange, onSaved }: AnalyticsCustomizerProps) {
  const { t } = useTranslation()
  const { currentPractice } = usePractice()
  const { user } = useUser()
  const [analyticsItems, setAnalyticsItems] = useState<AnalyticsItem[]>(defaultAnalyticsItems)
  const [analyticsTabs, setAnalyticsTabs] = useState<AnalyticsTab[]>(defaultTabs)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isTabDialogOpen, setIsTabDialogOpen] = useState(false) // Added state for tab dialog
  const [isManageTabItemsDialogOpen, setIsManageTabItemsDialogOpen] = useState(false)
  const [selectedTabForItemManagement, setSelectedTabForItemManagement] = useState<string | null>(null)
  const [parameterFilter, setParameterFilter] = useState<"all" | "weekly" | "monthly" | "quarterly" | "yearly">("all")
  const [newItemTitle, setNewItemTitle] = useState("")
  const [newItemDescription, setNewItemDescription] = useState("")
  const [newItemCategory, setNewItemCategory] = useState<"overview" | "performance" | "charts">("charts")
  const [newItemChartType, setNewItemChartType] = useState<"area" | "line" | "pie" | "bar">("bar")
  const [availableParameters, setAvailableParameters] = useState<Parameter[]>([])
  const [selectedParameters, setSelectedParameters] = useState<string[]>([])
  const [isLoadingParameters, setIsLoadingParameters] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)
  const [editingTabId, setEditingTabId] = useState<string | null>(null) // Added state for editing tab ID
  const [newTabName, setNewTabName] = useState("") // Added state for new tab name
  const [tabToDelete, setTabToDelete] = useState<string | null>(null) // Added state for tab to delete
  const [mounted, setMounted] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setMounted(true)

    const loadSettings = async () => {
      if (!user?.id) {
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/users/${user.id}/analytics-settings`)
        if (response.ok) {
          const data = await response.json()

          if (data.analyticsLayout && Array.isArray(data.analyticsLayout) && data.analyticsLayout.length > 0) {
            setAnalyticsItems(data.analyticsLayout)
            onItemsChange?.(data.analyticsLayout)
            console.log("[v0] Loaded analytics layout from database:", data.analyticsLayout.length, "items")
          }

          if (data.analyticsTabs && Array.isArray(data.analyticsTabs) && data.analyticsTabs.length > 0) {
            setAnalyticsTabs(data.analyticsTabs)
            onTabsChange?.(data.analyticsTabs)
          }
        }
      } catch (error) {
        console.error("Failed to load analytics settings from database:", error)
        // Fallback to localStorage for migration
        const savedLayout = localStorage.getItem("analytics-customizer-layout")
        const savedTabs = localStorage.getItem("analytics-customizer-tabs")

        if (savedLayout) {
          try {
            const parsedLayout = JSON.parse(savedLayout)
            setAnalyticsItems(parsedLayout)
            onItemsChange?.(parsedLayout)
            console.log("[v0] Loaded analytics layout from localStorage:", parsedLayout.length, "items")
          } catch (e) {
            console.error("Error parsing localStorage layout:", e)
          }
        }

        if (savedTabs) {
          try {
            const parsedTabs = JSON.parse(savedTabs)
            setAnalyticsTabs(parsedTabs)
            onTabsChange?.(parsedTabs)
          } catch (e) {
            console.error("Error parsing localStorage tabs:", e)
          }
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()

    const editItemId = localStorage.getItem("analytics-edit-item")
    if (editItemId) {
      localStorage.removeItem("analytics-edit-item")
      // Find the item and focus on it
      setTimeout(() => {
        const element = document.getElementById(`analytics-item-${editItemId}`)
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" })
          element.classList.add("ring-2", "ring-primary", "ring-offset-2")
          setTimeout(() => {
            element.classList.remove("ring-2", "ring-primary", "ring-offset-2")
          }, 2000)
        }
      }, 100)
    }
  }, [user?.id, onItemsChange, onTabsChange])

  useEffect(() => {
    const fetchParameters = async () => {
      if (!currentPractice?.id || !isAddDialogOpen) return

      try {
        setIsLoadingParameters(true)
        const response = await fetch(`/api/practices/${currentPractice.id}/parameters`)
        const data = await response.json()
        setAvailableParameters(data.parameters || [])
      } catch (error) {
        console.error("[v0] Error fetching parameters:", error)
      } finally {
        setIsLoadingParameters(false)
      }
    }

    fetchParameters()
  }, [currentPractice?.id, isAddDialogOpen])

  const categoryLabels = {
    overview: t("analytics.categories.overview", "Übersicht"),
    performance: t("analytics.categories.performance", "Leistung"),
    charts: t("analytics.categories.charts", "Diagramme"),
  }

  const categoryColors = {
    overview: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    performance: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    charts: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  }

  const sortedItems = [...analyticsItems].sort((a, b) => a.order - b.order)
  const enabledCount = analyticsItems.filter((item) => item.enabled).length
  const totalCount = analyticsItems.length

  const handleToggleItem = (id: string, enabled: boolean) => {
    const updatedItems = analyticsItems.map((item) => (item.id === id ? { ...item, enabled } : item))
    setAnalyticsItems(updatedItems)
    setHasUnsavedChanges(true)
    setJustSaved(false)
    onItemsChange?.(updatedItems)
  }

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const items = Array.from(sortedItems)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    const updatedItems = items.map((item, index) => ({ ...item, order: index + 1 }))
    setAnalyticsItems(updatedItems)
    setHasUnsavedChanges(true)
    setJustSaved(false)
    onItemsChange?.(updatedItems)
  }

  const handleSave = async () => {
    if (!user?.id) {
      // Fallback to localStorage if no user
      localStorage.setItem("analytics-customizer-layout", JSON.stringify(analyticsItems))
      localStorage.setItem("analytics-customizer-tabs", JSON.stringify(analyticsTabs))
      setHasUnsavedChanges(false)
      setJustSaved(true)
      setTimeout(() => setJustSaved(false), 3000)
      onSaved?.()
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`/api/users/${user.id}/analytics-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analyticsLayout: analyticsItems,
          analyticsTabs: analyticsTabs,
        }),
      })

      if (response.ok) {
        // Clean up localStorage after successful DB save
        localStorage.removeItem("analytics-customizer-layout")
        localStorage.removeItem("analytics-customizer-tabs")
        setHasUnsavedChanges(false)
        setJustSaved(true)
        setTimeout(() => setJustSaved(false), 3000)
        onSaved?.()
      } else {
        console.error("Failed to save analytics settings to database")
        // Fallback to localStorage
        localStorage.setItem("analytics-customizer-layout", JSON.stringify(analyticsItems))
        localStorage.setItem("analytics-customizer-tabs", JSON.stringify(analyticsTabs))
      }
    } catch (error) {
      console.error("Error saving analytics settings:", error)
      // Fallback to localStorage
      localStorage.setItem("analytics-customizer-layout", JSON.stringify(analyticsItems))
      localStorage.setItem("analytics-customizer-tabs", JSON.stringify(analyticsTabs))
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = async () => {
    setAnalyticsItems(defaultAnalyticsItems)
    setAnalyticsTabs(defaultTabs)
    setHasUnsavedChanges(false)
    setJustSaved(false)
    localStorage.removeItem("analytics-customizer-layout")
    localStorage.removeItem("analytics-customizer-tabs")
    onItemsChange?.(defaultAnalyticsItems)
    onTabsChange?.(defaultTabs)

    // Also reset in database
    if (user?.id) {
      try {
        await fetch(`/api/users/${user.id}/analytics-settings`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            analyticsLayout: defaultAnalyticsItems,
            analyticsTabs: defaultTabs,
          }),
        })
      } catch (error) {
        console.error("Error resetting analytics settings in database:", error)
      }
    }
  }

  const groupedItems = sortedItems.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = []
      }
      acc[item.category].push(item)
      return acc
    },
    {} as Record<string, AnalyticsItem[]>,
  )

  const handleEditItem = (item: AnalyticsItem) => {
    setEditingItemId(item.id)
    setNewItemTitle(item.title)
    setNewItemDescription(item.description)
    setNewItemCategory(item.category)
    setNewItemChartType(item.chartType)
    setSelectedParameters(item.selectedParameters || [])
    setIsAddDialogOpen(true)
    localStorage.setItem("analytics-edit-item", item.id) // Store item ID for scrolling
  }

  const handleDeleteItem = (itemId: string) => {
    const updatedItems = analyticsItems.filter((item) => item.id !== itemId)
    setAnalyticsItems(updatedItems)
    setHasUnsavedChanges(true)
    setJustSaved(false)
    onItemsChange?.(updatedItems)
    setItemToDelete(null)
  }

  const handleAddNewItem = () => {
    if (!newItemTitle.trim()) return

    if (editingItemId) {
      const updatedItems = analyticsItems.map((item) =>
        item.id === editingItemId
          ? {
              ...item,
              title: newItemTitle,
              description: newItemDescription || t("analytics.customizer.customChart", "Benutzerdefiniertes Diagramm"),
              category: newItemCategory,
              chartType: newItemChartType,
              selectedParameters: selectedParameters,
              displayIn: item.displayIn || "analytics",
            }
          : item,
      )
      setAnalyticsItems(updatedItems)
      onItemsChange?.(updatedItems)
      setEditingItemId(null)
    } else {
      const newItem: AnalyticsItem = {
        id: `custom-${Date.now()}`,
        title: newItemTitle,
        component: "CustomChart",
        enabled: true,
        order: analyticsItems.length + 1,
        category: newItemCategory,
        description: newItemDescription || t("analytics.customizer.customChart", "Benutzerdefiniertes Diagramm"),
        chartType: newItemChartType,
        selectedParameters: selectedParameters,
        displayIn: "analytics",
        tabIds: ["overview"], // Default to the first enabled tab
      }

      const updatedItems = [...analyticsItems, newItem]
      setAnalyticsItems(updatedItems)
      onItemsChange?.(updatedItems)
    }

    setHasUnsavedChanges(true)
    setJustSaved(false)
    setNewItemTitle("")
    setNewItemDescription("")
    setNewItemCategory("charts")
    setNewItemChartType("bar")
    setSelectedParameters([])
    setIsAddDialogOpen(false)
  }

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false)
    setEditingItemId(null)
    setNewItemTitle("")
    setNewItemDescription("")
    setNewItemCategory("charts")
    setNewItemChartType("bar")
    setSelectedParameters([])
    localStorage.removeItem("analytics-edit-item") // Clear item ID on close
  }

  const handleToggleParameter = (parameterId: string) => {
    setSelectedParameters((prev) =>
      prev.includes(parameterId) ? prev.filter((id) => id !== parameterId) : [...prev, parameterId],
    )
  }

  const handleDisplayLocationChange = (id: string, displayIn: "analytics" | "dashboard" | "both") => {
    const updatedItems = analyticsItems.map((item) => (item.id === id ? { ...item, displayIn } : item))
    setAnalyticsItems(updatedItems)
    setHasUnsavedChanges(true)
    setJustSaved(false)
    onItemsChange?.(updatedItems)
  }

  const handleAddTab = () => {
    if (!newTabName.trim()) return

    if (editingTabId) {
      const updatedTabs = analyticsTabs.map((tab) => (tab.id === editingTabId ? { ...tab, name: newTabName } : tab))
      setAnalyticsTabs(updatedTabs)
      onTabsChange?.(updatedTabs)
      setEditingTabId(null)
    } else {
      const newTab: AnalyticsTab = {
        id: `tab-${Date.now()}`,
        name: newTabName,
        order: analyticsTabs.length + 1,
        enabled: true,
      }
      const updatedTabs = [...analyticsTabs, newTab]
      setAnalyticsTabs(updatedTabs)
      onTabsChange?.(updatedTabs)
    }

    setHasUnsavedChanges(true)
    setJustSaved(false)
    setNewTabName("")
    setIsTabDialogOpen(false)
  }

  const handleEditTab = (tab: AnalyticsTab) => {
    setEditingTabId(tab.id)
    setNewTabName(tab.name)
    setIsTabDialogOpen(true)
  }

  const handleDeleteTab = (tabId: string) => {
    // Remove tab
    const updatedTabs = analyticsTabs.filter((tab) => tab.id !== tabId)
    setAnalyticsTabs(updatedTabs)
    onTabsChange?.(updatedTabs)

    const updatedItems = analyticsItems.map((item) => ({
      ...item,
      tabIds: item.tabIds?.filter((id) => id !== tabId) || [],
    }))
    setAnalyticsItems(updatedItems)
    onItemsChange?.(updatedItems)

    setHasUnsavedChanges(true)
    setJustSaved(false)
    setTabToDelete(null)
  }

  const handleToggleTab = (tabId: string, enabled: boolean) => {
    const updatedTabs = analyticsTabs.map((tab) => (tab.id === tabId ? { ...tab, enabled } : tab))
    setAnalyticsTabs(updatedTabs)
    onTabsChange?.(updatedTabs)
    setHasUnsavedChanges(true)
    setJustSaved(false)
  }

  const handleTabDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const sortedTabs = [...analyticsTabs].sort((a, b) => a.order - b.order)
    const [reorderedTab] = sortedTabs.splice(result.source.index, 1)
    sortedTabs.splice(result.destination.index, 0, reorderedTab)

    const updatedTabs = sortedTabs.map((tab, index) => ({ ...tab, order: index + 1 }))
    setAnalyticsTabs(updatedTabs)
    onTabsChange?.(updatedTabs)
    setHasUnsavedChanges(true)
    setJustSaved(false)
  }

  const handleItemTabChange = (itemId: string, tabIds: string[]) => {
    const updatedItems = analyticsItems.map((item) => (item.id === itemId ? { ...item, tabIds } : item))
    setAnalyticsItems(updatedItems)
    onItemsChange?.(updatedItems)
    setHasUnsavedChanges(true)
    setJustSaved(false)
  }

  const handleCloseTabDialog = () => {
    setIsTabDialogOpen(false)
    setEditingTabId(null)
    setNewTabName("")
  }

  const handleManageTabItems = (tabId: string) => {
    setSelectedTabForItemManagement(tabId)
    setIsManageTabItemsDialogOpen(true)
  }

  const handleToggleItemInTab = (itemId: string, assign: boolean) => {
    const updatedItems = analyticsItems.map((item) => {
      if (item.id !== itemId) return item

      const currentTabIds = item.tabIds || []
      if (assign) {
        // Add tab if not already present
        if (!currentTabIds.includes(selectedTabForItemManagement!)) {
          return { ...item, tabIds: [...currentTabIds, selectedTabForItemManagement!] }
        }
      } else {
        // Remove tab
        return { ...item, tabIds: currentTabIds.filter((id) => id !== selectedTabForItemManagement!) }
      }
      return item
    })
    setAnalyticsItems(updatedItems)
    onItemsChange?.(updatedItems)
    setHasUnsavedChanges(true)
    setJustSaved(false)
  }

  const handleCloseManageTabItemsDialog = () => {
    setIsManageTabItemsDialogOpen(false)
    setSelectedTabForItemManagement(null)
  }

  const filteredAvailableParameters =
    parameterFilter === "all"
      ? availableParameters
      : availableParameters.filter((param) => param.interval === parameterFilter)

  return (
    <div className="space-y-6">
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary border-opacity-50"></div>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{t("analytics.customizer.title", "Analytics-Layout anpassen")}</h3>
          <p className="text-sm text-muted-foreground">
            {t(
              "analytics.customizer.description",
              "Wählen Sie aus, welche Diagramme und Metriken angezeigt werden sollen und ändern Sie deren Position",
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasUnsavedChanges && (
            <Badge variant="secondary" className="gap-1">
              <Activity className="h-3 w-3" />
              {t("analytics.customizer.unsavedChanges", "Ungespeicherte Änderungen")}
            </Badge>
          )}
          {justSaved && (
            <Badge
              variant="default"
              className="gap-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
            >
              <CheckCircle className="h-3 w-3" />
              {t("analytics.customizer.saved", "Gespeichert")}
            </Badge>
          )}
          <Button variant="outline" onClick={handleReset} className="gap-2 bg-transparent">
            <RotateCcw className="h-4 w-4" />
            {t("analytics.customizer.reset", "Zurücksetzen")}
          </Button>
          <Button onClick={handleSave} className="gap-2" disabled={isSaving}>
            {isSaving ? t("common.saving", "Speichern...") : t("analytics.customizer.saveLayout", "Layout speichern")}
            <Save className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">{t("analytics.customizer.components", "Analytics-Komponenten")}</span>
              </div>
              <Badge variant="outline">
                {enabledCount} {t("analytics.customizer.of", "von")} {totalCount}{" "}
                {t("analytics.customizer.activated", "aktiviert")}
              </Badge>
            </div>
            <div className="flex gap-2">
              {Object.entries(categoryLabels).map(([key, label]) => {
                const count = groupedItems[key]?.filter((item) => item.enabled).length || 0
                const total = groupedItems[key]?.length || 0
                return (
                  <Badge key={key} className={categoryColors[key as keyof typeof categoryColors]}>
                    {label}: {count}/{total}
                  </Badge>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Folder className="h-5 w-5" />
                {t("analytics.customizer.manageTabs", "Tabs verwalten")}
              </CardTitle>
              <CardDescription>
                {t(
                  "analytics.customizer.manageTabsDescription",
                  "Erstellen und organisieren Sie benutzerdefinierte Tabs für Ihre Analytics-Ansicht",
                )}
              </CardDescription>
            </div>
            <Dialog open={isTabDialogOpen} onOpenChange={setIsTabDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  {t("analytics.customizer.addTab", "Neuer Tab")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingTabId
                      ? t("analytics.customizer.editTabTitle", "Tab bearbeiten")
                      : t("analytics.customizer.addTabTitle", "Neuen Tab hinzufügen")}
                  </DialogTitle>
                  <DialogDescription>
                    {t("analytics.customizer.tabDialogDescription", "Geben Sie einen Namen für den Tab ein")}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="tab-name">{t("analytics.customizer.tabName", "Tab-Name")}</Label>
                    <Input
                      id="tab-name"
                      placeholder={t("analytics.customizer.tabNamePlaceholder", "z.B. Umsatzanalyse")}
                      value={newTabName}
                      onChange={(e) => setNewTabName(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={handleCloseTabDialog}>
                    {t("common.cancel", "Abbrechen")}
                  </Button>
                  <Button onClick={handleAddTab} disabled={!newTabName.trim()}>
                    {editingTabId ? t("common.save", "Speichern") : t("common.add", "Hinzufügen")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <DragDropContext onDragEnd={handleTabDragEnd}>
            <Droppable droppableId="analytics-tabs">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                  {[...analyticsTabs]
                    .sort((a, b) => a.order - b.order)
                    .map((tab, index) => {
                      const itemsInTab = analyticsItems.filter((item) => item.tabIds?.includes(tab.id)).length
                      return (
                        <Draggable key={tab.id} draggableId={tab.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`flex items-center gap-4 p-4 border rounded-lg bg-card transition-colors ${
                                snapshot.isDragging ? "shadow-lg" : ""
                              } ${tab.enabled ? "" : "opacity-60"}`}
                            >
                              <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                                <GripVertical className="h-5 w-5 text-muted-foreground" />
                              </div>

                              <div className="flex items-center gap-3 flex-1">
                                <FolderOpen className="h-5 w-5 text-muted-foreground" />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{tab.name}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {itemsInTab} {t("analytics.customizer.items", "Elemente")}
                                    </Badge>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 gap-1.5 bg-transparent"
                                  onClick={() => handleManageTabItems(tab.id)}
                                  title={t("analytics.customizer.manageItems", "Elemente verwalten")}
                                >
                                  <Settings className="h-3.5 w-3.5" />
                                  {t("analytics.customizer.manageItems", "Elemente verwalten")}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleEditTab(tab)}
                                  title={t("common.edit", "Bearbeiten")}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => setTabToDelete(tab.id)}
                                  title={t("common.delete", "Löschen")}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  {tab.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                </div>
                                <Switch
                                  checked={tab.enabled}
                                  onCheckedChange={(checked) => handleToggleTab(tab.id, checked)}
                                />
                              </div>
                            </div>
                          )}
                        </Draggable>
                      )
                    })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </CardContent>
      </Card>

      <Dialog open={isManageTabItemsDialogOpen} onOpenChange={setIsManageTabItemsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {t("analytics.customizer.manageTabItems", "Elemente für Tab verwalten")}
            </DialogTitle>
            <DialogDescription>
              {t(
                "analytics.customizer.manageTabItemsDescription",
                "Wählen Sie, welche Diagramme und Metriken in diesem Tab angezeigt werden sollen",
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedTabForItemManagement && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <FolderOpen className="h-5 w-5 text-muted-foreground" />
                  <span className="font-semibold">
                    {analyticsTabs.find((t) => t.id === selectedTabForItemManagement)?.name}
                  </span>
                  <Badge variant="outline" className="ml-auto">
                    {analyticsItems.filter((item) => item.tabIds?.includes(selectedTabForItemManagement)).length}{" "}
                    {t("analytics.customizer.itemsAssigned", "zugewiesen")}
                  </Badge>
                </div>

                <div className="border rounded-lg divide-y max-h-[400px] overflow-y-auto">
                  {analyticsItems
                    .sort((a, b) => a.order - b.order)
                    .map((item) => {
                      const isAssigned = item.tabIds?.includes(selectedTabForItemManagement!) || false
                      const ChartIcon = chartTypeIcons[item.chartType]
                      return (
                        <div key={item.id} className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors">
                          <Checkbox
                            id={`tab-item-${item.id}`}
                            checked={isAssigned}
                            onCheckedChange={(checked) => handleToggleItemInTab(item.id, checked as boolean)}
                          />
                          <div className="flex items-center gap-3 flex-1">
                            <ChartIcon className="h-5 w-5 text-muted-foreground" />
                            <div className="flex-1">
                              <label
                                htmlFor={`tab-item-${item.id}`}
                                className="text-sm font-medium cursor-pointer block"
                              >
                                {item.title}
                              </label>
                              <p className="text-xs text-muted-foreground">{item.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={categoryColors[item.category]}>
                              {categoryLabels[item.category]}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {item.chartType}
                            </Badge>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleCloseManageTabItemsDialog}>{t("common.close", "Schließen")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GripVertical className="h-5 w-5" />
                {t("analytics.customizer.manageTitle", "Diagramme und Metriken verwalten")}
              </CardTitle>
              <CardDescription>
                {t(
                  "analytics.customizer.manageDescription",
                  "Ziehen Sie die Komponenten, um ihre Position zu ändern, oder verwenden Sie die Schalter, um sie zu aktivieren/deaktivieren",
                )}
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={handleCloseDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  {t("analytics.customizer.addItem", "Neues Diagramm hinzufügen")}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingItemId
                      ? t("analytics.customizer.editItemTitle", "Diagramm bearbeiten")
                      : t("analytics.customizer.addItemTitle", "Neues Diagramm hinzufügen")}
                  </DialogTitle>
                  <DialogDescription>
                    {editingItemId
                      ? t(
                          "analytics.customizer.editItemDescription",
                          "Bearbeiten Sie die Eigenschaften Ihres Diagramms",
                        )
                      : t(
                          "analytics.customizer.addItemDescription",
                          "Erstellen Sie ein neues benutzerdefiniertes Diagramm für Ihre Analytics-Ansicht",
                        )}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">{t("analytics.customizer.itemTitle", "Titel")}</Label>
                    <Input
                      id="title"
                      placeholder={t("analytics.customizer.itemTitlePlaceholder", "z.B. Umsatzanalyse")}
                      value={newItemTitle}
                      onChange={(e) => setNewItemTitle(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">{t("analytics.customizer.itemDescription", "Beschreibung")}</Label>
                    <Textarea
                      id="description"
                      placeholder={t(
                        "analytics.customizer.itemDescriptionPlaceholder",
                        "Kurze Beschreibung des Diagramms",
                      )}
                      value={newItemDescription}
                      onChange={(e) => setNewItemDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="category">{t("analytics.customizer.itemCategory", "Kategorie")}</Label>
                    <Select value={newItemCategory} onValueChange={(value: any) => setNewItemCategory(value)}>
                      <SelectTrigger id="category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="overview">{categoryLabels.overview}</SelectItem>
                        <SelectItem value="performance">{categoryLabels.performance}</SelectItem>
                        <SelectItem value="charts">{categoryLabels.charts}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="chartType">{t("analytics.customizer.itemChartType", "Diagrammtyp")}</Label>
                    <Select value={newItemChartType} onValueChange={(value: any) => setNewItemChartType(value)}>
                      <SelectTrigger id="chartType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="area">
                          {t("analytics.customizer.chartType.area", "Flächendiagramm")}
                        </SelectItem>
                        <SelectItem value="line">
                          {t("analytics.customizer.chartType.line", "Liniendiagramm")}
                        </SelectItem>
                        <SelectItem value="bar">{t("analytics.customizer.chartType.bar", "Balkendiagramm")}</SelectItem>
                        <SelectItem value="pie">{t("analytics.customizer.chartType.pie", "Kreisdiagramm")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label>{t("analytics.customizer.selectParameters", "KPI-Parameter auswählen")}</Label>
                      <Select value={parameterFilter} onValueChange={(value: any) => setParameterFilter(value)}>
                        <SelectTrigger className="h-8 w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            {t("analytics.customizer.allIntervals", "Alle Intervalle")}
                          </SelectItem>
                          <SelectItem value="weekly">{t("analytics.customizer.weekly", "Wöchentlich")}</SelectItem>
                          <SelectItem value="monthly">{t("analytics.customizer.monthly", "Monatlich")}</SelectItem>
                          <SelectItem value="quarterly">
                            {t("analytics.customizer.quarterly", "Quartalsweise")}
                          </SelectItem>
                          <SelectItem value="yearly">{t("analytics.customizer.yearly", "Jährlich")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t(
                        "analytics.customizer.selectParametersDescription",
                        "Wählen Sie die KPI-Parameter aus, die in diesem Diagramm angezeigt werden sollen",
                      )}
                    </p>
                    {isLoadingParameters ? (
                      <div className="text-sm text-muted-foreground">
                        {t("analytics.customizer.loadingParameters", "Parameter werden geladen...")}
                      </div>
                    ) : filteredAvailableParameters.length === 0 ? (
                      <div className="text-sm text-muted-foreground">
                        {parameterFilter === "all"
                          ? t("analytics.customizer.noParameters", "Keine Parameter verfügbar")
                          : t(
                              "analytics.customizer.noParametersForInterval",
                              `Keine ${parameterFilter} Parameter verfügbar`,
                            )}
                      </div>
                    ) : (
                      <div className="border rounded-lg p-4 max-h-[300px] overflow-y-auto space-y-3">
                        {filteredAvailableParameters.map((param) => (
                          <div key={param.id} className="flex items-start gap-3">
                            <Checkbox
                              id={`param-${param.id}`}
                              checked={selectedParameters.includes(param.id)}
                              onCheckedChange={() => handleToggleParameter(param.id)}
                            />
                            <div className="flex-1">
                              <label
                                htmlFor={`param-${param.id}`}
                                className="text-sm font-medium leading-none cursor-pointer"
                              >
                                {param.name}
                              </label>
                              {param.description && (
                                <p className="text-xs text-muted-foreground mt-1">{param.description}</p>
                              )}
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {param.category}
                                </Badge>
                                {param.interval && (
                                  <Badge variant="secondary" className="text-xs">
                                    {param.interval}
                                  </Badge>
                                )}
                                {param.unit && (
                                  <Badge variant="outline" className="text-xs">
                                    {param.unit}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {selectedParameters.length > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {selectedParameters.length}{" "}
                          {t("analytics.customizer.parametersSelected", "Parameter ausgewählt")}
                        </span>
                        <Badge variant="secondary">
                          {filteredAvailableParameters.length} {t("analytics.customizer.available", "verfügbar")}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={handleCloseDialog}>
                    {t("common.cancel", "Abbrechen")}
                  </Button>
                  <Button onClick={handleAddNewItem} disabled={!newItemTitle.trim()}>
                    {editingItemId
                      ? t("common.save", "Speichern")
                      : t("analytics.customizer.addItemButton", "Hinzufügen")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="analytics-items">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                  {sortedItems.map((item, index) => {
                    const ChartIcon = chartTypeIcons[item.chartType]
                    const isCustomItem = item.id.startsWith("custom-")
                    return (
                      <Draggable key={item.id} draggableId={item.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            id={`analytics-item-${item.id}`}
                            className={`flex items-center gap-4 p-4 border rounded-lg bg-card transition-colors ${
                              snapshot.isDragging ? "shadow-lg" : ""
                            } ${item.enabled ? "" : "opacity-60"}`}
                          >
                            <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                              <GripVertical className="h-5 w-5 text-muted-foreground" />
                            </div>

                            <div className="flex items-center gap-3 flex-1">
                              <ChartIcon className="h-5 w-5 text-muted-foreground" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{item.title}</span>
                                  <Badge variant="outline" className={categoryColors[item.category]}>
                                    {categoryLabels[item.category]}
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs">
                                    {getChartTypeLabel(item.chartType, t)}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{item.description}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="flex flex-col gap-1 min-w-[180px]">
                                <Label className="text-xs text-muted-foreground">
                                  {t("analytics.customizer.assignToTabs", "Tabs zuweisen")}
                                </Label>
                                <div className="border rounded-md p-2 max-h-32 overflow-y-auto bg-background">
                                  {analyticsTabs
                                    .filter((tab) => tab.enabled)
                                    .map((tab) => {
                                      const isChecked = item.tabIds?.includes(tab.id) || false
                                      return (
                                        <div key={tab.id} className="flex items-center gap-2 py-1">
                                          <Checkbox
                                            id={`${item.id}-${tab.id}`}
                                            checked={isChecked}
                                            onCheckedChange={(checked) => {
                                              const currentTabIds = item.tabIds || []
                                              const newTabIds = checked
                                                ? [...currentTabIds, tab.id]
                                                : currentTabIds.filter((id) => id !== tab.id)
                                              handleItemTabChange(item.id, newTabIds)
                                            }}
                                          />
                                          <label
                                            htmlFor={`${item.id}-${tab.id}`}
                                            className="text-sm cursor-pointer flex-1"
                                          >
                                            {tab.name}
                                          </label>
                                        </div>
                                      )
                                    })}
                                  {analyticsTabs.filter((tab) => tab.enabled).length === 0 && (
                                    <p className="text-xs text-muted-foreground">
                                      {t("analytics.customizer.noTabsAvailable", "Keine Tabs verfügbar")}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-col gap-1">
                                <Label className="text-xs text-muted-foreground">
                                  {t("analytics.customizer.displayIn", "Anzeigen in")}
                                </Label>
                                <Select
                                  value={item.displayIn || "analytics"}
                                  onValueChange={(value: any) => handleDisplayLocationChange(item.id, value)}
                                >
                                  <SelectTrigger className="h-8 w-[140px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="analytics">
                                      {t("analytics.customizer.analyticsOnly", "Nur Analytics")}
                                    </SelectItem>
                                    <SelectItem value="dashboard">
                                      {t("analytics.customizer.dashboardOnly", "Nur Dashboard")}
                                    </SelectItem>
                                    <SelectItem value="both">{t("analytics.customizer.both", "Beide")}</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleEditItem(item)}
                                  title={t("common.edit", "Bearbeiten")}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                {isCustomItem && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={() => setItemToDelete(item.id)}
                                    title={t("common.delete", "Löschen")}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                {item.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                {item.enabled
                                  ? t("analytics.customizer.visible", "Sichtbar")
                                  : t("analytics.customizer.hidden", "Versteckt")}
                              </div>
                              <Switch
                                checked={item.enabled}
                                onCheckedChange={(checked) => handleToggleItem(item.id, checked)}
                              />
                            </div>
                          </div>
                        )}
                      </Draggable>
                    )
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </CardContent>
      </Card>

      <AlertDialog open={!!tabToDelete} onOpenChange={(open) => !open && setTabToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("analytics.customizer.deleteTabTitle", "Tab löschen?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                "analytics.customizer.deleteTabDescription",
                "Sind Sie sicher, dass Sie diesen Tab löschen möchten? Alle Elemente in diesem Tab werden nicht gelöscht, aber nicht mehr zugewiesen.",
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel", "Abbrechen")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => tabToDelete && handleDeleteTab(tabToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("common.delete", "Löschen")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("analytics.customizer.deleteTitle", "Diagramm löschen?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                "analytics.customizer.deleteDescription",
                "Sind Sie sicher, dass Sie dieses Diagramm löschen möchten? Diese Aktion kann nicht rückgåig gemacht werden.",
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel", "Abbrechen")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => itemToDelete && handleDeleteItem(itemToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("common.delete", "Löschen")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="grid gap-4 md:grid-cols-3">
        {Object.entries(groupedItems).map(([category, items]) => {
          const enabledItems = items.filter((item) => item.enabled)

          return (
            <Card key={category}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4" />
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{t("analytics.customizer.enabled", "Aktiviert")}:</span>
                    <Badge variant="outline">
                      {enabledItems.length}/{items.length}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {enabledItems.map((item) => item.title).join(", ") ||
                      t("analytics.customizer.noneEnabled", "Keine aktiviert")}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export default AnalyticsCustomizer
