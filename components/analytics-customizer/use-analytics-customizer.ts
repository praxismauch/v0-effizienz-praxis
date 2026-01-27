"use client"

import { useState, useEffect, useCallback } from "react"
import { usePractice } from "@/contexts/practice-context"
import { useUser } from "@/contexts/user-context"
import type { AnalyticsTab, AnalyticsItem } from "./types"
import { defaultTabs, defaultAnalyticsItems } from "./data"
import type { Parameter } from "@/types/parameter"
import type { DropResult } from "@hello-pangea/dnd"

interface UseAnalyticsCustomizerProps {
  onItemsChange?: (items: AnalyticsItem[]) => void
  onTabsChange?: (tabs: AnalyticsTab[]) => void
  onSaved?: () => void
}

export function useAnalyticsCustomizer({ onItemsChange, onTabsChange, onSaved }: UseAnalyticsCustomizerProps) {
  const { currentPractice } = usePractice()
  const { user } = useUser()
  
  const [analyticsItems, setAnalyticsItems] = useState<AnalyticsItem[]>(defaultAnalyticsItems)
  const [analyticsTabs, setAnalyticsTabs] = useState<AnalyticsTab[]>(defaultTabs)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isTabDialogOpen, setIsTabDialogOpen] = useState(false)
  const [isManageTabItemsDialogOpen, setIsManageTabItemsDialogOpen] = useState(false)
  const [selectedTabForItemManagement, setSelectedTabForItemManagement] = useState<string | null>(null)
  
  // Form states
  const [newItemTitle, setNewItemTitle] = useState("")
  const [newItemDescription, setNewItemDescription] = useState("")
  const [newItemCategory, setNewItemCategory] = useState<"overview" | "performance" | "charts">("charts")
  const [newItemChartType, setNewItemChartType] = useState<"area" | "line" | "pie" | "bar">("bar")
  const [selectedParameters, setSelectedParameters] = useState<string[]>([])
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)
  
  // Tab form states
  const [editingTabId, setEditingTabId] = useState<string | null>(null)
  const [newTabName, setNewTabName] = useState("")
  const [tabToDelete, setTabToDelete] = useState<string | null>(null)
  
  // Parameters
  const [parameterFilter, setParameterFilter] = useState<"all" | "weekly" | "monthly" | "quarterly" | "yearly">("all")
  const [availableParameters, setAvailableParameters] = useState<Parameter[]>([])
  const [isLoadingParameters, setIsLoadingParameters] = useState(false)

  // Load settings on mount
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
          }

          if (data.analyticsTabs && Array.isArray(data.analyticsTabs) && data.analyticsTabs.length > 0) {
            setAnalyticsTabs(data.analyticsTabs)
            onTabsChange?.(data.analyticsTabs)
          }
        }
      } catch (error) {
        console.error("Failed to load analytics settings:", error)
        // Fallback to localStorage
        const savedLayout = localStorage.getItem("analytics-customizer-layout")
        const savedTabs = localStorage.getItem("analytics-customizer-tabs")

        if (savedLayout) {
          try {
            const parsedLayout = JSON.parse(savedLayout)
            setAnalyticsItems(parsedLayout)
            onItemsChange?.(parsedLayout)
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

  // Fetch parameters when dialog opens
  useEffect(() => {
    const fetchParameters = async () => {
      if (!currentPractice?.id || !isAddDialogOpen) return

      try {
        setIsLoadingParameters(true)
        const response = await fetch(`/api/practices/${currentPractice.id}/parameters`)
        const data = await response.json()
        setAvailableParameters(data.parameters || [])
      } catch (error) {
        console.error("Error fetching parameters:", error)
      } finally {
        setIsLoadingParameters(false)
      }
    }

    fetchParameters()
  }, [currentPractice?.id, isAddDialogOpen])

  const sortedItems = [...analyticsItems].sort((a, b) => a.order - b.order)
  const enabledCount = analyticsItems.filter((item) => item.enabled).length
  const totalCount = analyticsItems.length

  const handleToggleItem = useCallback((id: string, enabled: boolean) => {
    const updatedItems = analyticsItems.map((item) => (item.id === id ? { ...item, enabled } : item))
    setAnalyticsItems(updatedItems)
    setHasUnsavedChanges(true)
    setJustSaved(false)
    onItemsChange?.(updatedItems)
  }, [analyticsItems, onItemsChange])

  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return

    const items = Array.from(sortedItems)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    const updatedItems = items.map((item, index) => ({ ...item, order: index + 1 }))
    setAnalyticsItems(updatedItems)
    setHasUnsavedChanges(true)
    setJustSaved(false)
    onItemsChange?.(updatedItems)
  }, [sortedItems, onItemsChange])

  const handleSave = useCallback(async () => {
    if (!user?.id) {
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
        localStorage.removeItem("analytics-customizer-layout")
        localStorage.removeItem("analytics-customizer-tabs")
        setHasUnsavedChanges(false)
        setJustSaved(true)
        setTimeout(() => setJustSaved(false), 3000)
        onSaved?.()
      } else {
        localStorage.setItem("analytics-customizer-layout", JSON.stringify(analyticsItems))
        localStorage.setItem("analytics-customizer-tabs", JSON.stringify(analyticsTabs))
      }
    } catch (error) {
      console.error("Error saving analytics settings:", error)
      localStorage.setItem("analytics-customizer-layout", JSON.stringify(analyticsItems))
      localStorage.setItem("analytics-customizer-tabs", JSON.stringify(analyticsTabs))
    } finally {
      setIsSaving(false)
    }
  }, [user?.id, analyticsItems, analyticsTabs, onSaved])

  const handleReset = useCallback(async () => {
    setAnalyticsItems(defaultAnalyticsItems)
    setAnalyticsTabs(defaultTabs)
    setHasUnsavedChanges(false)
    setJustSaved(false)
    localStorage.removeItem("analytics-customizer-layout")
    localStorage.removeItem("analytics-customizer-tabs")
    onItemsChange?.(defaultAnalyticsItems)
    onTabsChange?.(defaultTabs)

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
        console.error("Error resetting analytics settings:", error)
      }
    }
  }, [user?.id, onItemsChange, onTabsChange])

  const handleEditItem = useCallback((item: AnalyticsItem) => {
    setEditingItemId(item.id)
    setNewItemTitle(item.title)
    setNewItemDescription(item.description)
    setNewItemCategory(item.category)
    setNewItemChartType(item.chartType)
    setSelectedParameters(item.selectedParameters || [])
    setIsAddDialogOpen(true)
    localStorage.setItem("analytics-edit-item", item.id)
  }, [])

  const handleDeleteItem = useCallback((itemId: string) => {
    const updatedItems = analyticsItems.filter((item) => item.id !== itemId)
    setAnalyticsItems(updatedItems)
    setHasUnsavedChanges(true)
    setJustSaved(false)
    onItemsChange?.(updatedItems)
    setItemToDelete(null)
  }, [analyticsItems, onItemsChange])

  const handleDisplayLocationChange = useCallback((id: string, displayIn: "analytics" | "dashboard" | "both") => {
    const updatedItems = analyticsItems.map((item) => (item.id === id ? { ...item, displayIn } : item))
    setAnalyticsItems(updatedItems)
    setHasUnsavedChanges(true)
    setJustSaved(false)
    onItemsChange?.(updatedItems)
  }, [analyticsItems, onItemsChange])

  // Tab handlers
  const handleAddTab = useCallback(() => {
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
  }, [newTabName, editingTabId, analyticsTabs, onTabsChange])

  const handleEditTab = useCallback((tab: AnalyticsTab) => {
    setEditingTabId(tab.id)
    setNewTabName(tab.name)
    setIsTabDialogOpen(true)
  }, [])

  const handleDeleteTab = useCallback((tabId: string) => {
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
  }, [analyticsTabs, analyticsItems, onTabsChange, onItemsChange])

  const handleToggleTab = useCallback((tabId: string, enabled: boolean) => {
    const updatedTabs = analyticsTabs.map((tab) => (tab.id === tabId ? { ...tab, enabled } : tab))
    setAnalyticsTabs(updatedTabs)
    onTabsChange?.(updatedTabs)
    setHasUnsavedChanges(true)
    setJustSaved(false)
  }, [analyticsTabs, onTabsChange])

  const handleTabDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return

    const sortedTabs = [...analyticsTabs].sort((a, b) => a.order - b.order)
    const [reorderedTab] = sortedTabs.splice(result.source.index, 1)
    sortedTabs.splice(result.destination.index, 0, reorderedTab)

    const updatedTabs = sortedTabs.map((tab, index) => ({ ...tab, order: index + 1 }))
    setAnalyticsTabs(updatedTabs)
    onTabsChange?.(updatedTabs)
    setHasUnsavedChanges(true)
    setJustSaved(false)
  }, [analyticsTabs, onTabsChange])

  const handleItemTabChange = useCallback((itemId: string, tabIds: string[]) => {
    const updatedItems = analyticsItems.map((item) => (item.id === itemId ? { ...item, tabIds } : item))
    setAnalyticsItems(updatedItems)
    onItemsChange?.(updatedItems)
    setHasUnsavedChanges(true)
    setJustSaved(false)
  }, [analyticsItems, onItemsChange])

  const handleToggleItemInTab = useCallback((itemId: string, assign: boolean) => {
    const updatedItems = analyticsItems.map((item) => {
      if (item.id !== itemId) return item

      const currentTabIds = item.tabIds || []
      if (assign) {
        if (!currentTabIds.includes(selectedTabForItemManagement!)) {
          return { ...item, tabIds: [...currentTabIds, selectedTabForItemManagement!] }
        }
      } else {
        return { ...item, tabIds: currentTabIds.filter((id) => id !== selectedTabForItemManagement!) }
      }
      return item
    })
    setAnalyticsItems(updatedItems)
    onItemsChange?.(updatedItems)
    setHasUnsavedChanges(true)
    setJustSaved(false)
  }, [analyticsItems, selectedTabForItemManagement, onItemsChange])

  const handleConfirmDeleteItem = useCallback((itemId: string) => {
    const updatedItems = analyticsItems.filter((item) => item.id !== itemId)
    setAnalyticsItems(updatedItems)
    setHasUnsavedChanges(true)
    setJustSaved(false)
    onItemsChange?.(updatedItems)
    setItemToDelete(null)
  }, [analyticsItems, onItemsChange])

  const handleConfirmDeleteTab = useCallback((tabId: string) => {
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
  }, [analyticsTabs, analyticsItems, onTabsChange, onItemsChange])

  const handleAddNewItem = useCallback(() => {
    if (!newItemTitle.trim()) return

    if (editingItemId) {
      const updatedItems = analyticsItems.map((item) =>
        item.id === editingItemId
          ? {
              ...item,
              title: newItemTitle,
              description: newItemDescription || "Benutzerdefiniertes Diagramm",
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
        description: newItemDescription || "Benutzerdefiniertes Diagramm",
        chartType: newItemChartType,
        selectedParameters: selectedParameters,
        displayIn: "analytics",
        tabIds: ["overview"],
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
  }, [newItemTitle, newItemDescription, newItemCategory, newItemChartType, selectedParameters, editingItemId, analyticsItems, onItemsChange])

  const handleCloseDialog = useCallback(() => {
    setIsAddDialogOpen(false)
    setEditingItemId(null)
    setNewItemTitle("")
    setNewItemDescription("")
    setNewItemCategory("charts")
    setNewItemChartType("bar")
    setSelectedParameters([])
    localStorage.removeItem("analytics-edit-item")
  }, [])

  const handleToggleParameter = useCallback((parameterId: string) => {
    setSelectedParameters((prev) =>
      prev.includes(parameterId) ? prev.filter((id) => id !== parameterId) : [...prev, parameterId],
    )
  }, [])

  const handleManageTabItems = useCallback((tabId: string) => {
    setSelectedTabForItemManagement(tabId)
    setIsManageTabItemsDialogOpen(true)
  }, [])

  const handleCloseTabDialog = useCallback(() => {
    setIsTabDialogOpen(false)
    setEditingTabId(null)
    setNewTabName("")
  }, [])

  const handleCloseManageTabItemsDialog = useCallback(() => {
    setIsManageTabItemsDialogOpen(false)
    setSelectedTabForItemManagement(null)
  }, [])

  const filteredAvailableParameters =
    parameterFilter === "all"
      ? availableParameters
      : availableParameters.filter((param) => param.interval === parameterFilter)

  return {
    // State
    analyticsItems,
    analyticsTabs,
    sortedItems,
    enabledCount,
    totalCount,
    hasUnsavedChanges,
    justSaved,
    mounted,
    isSaving,
    isLoading,
    
    // Dialog states
    isAddDialogOpen,
    setIsAddDialogOpen,
    isTabDialogOpen,
    setIsTabDialogOpen,
    isManageTabItemsDialogOpen,
    setIsManageTabItemsDialogOpen,
    selectedTabForItemManagement,
    setSelectedTabForItemManagement,
    
    // Form states
    newItemTitle,
    setNewItemTitle,
    newItemDescription,
    setNewItemDescription,
    newItemCategory,
    setNewItemCategory,
    newItemChartType,
    setNewItemChartType,
    selectedParameters,
    setSelectedParameters,
    editingItemId,
    setEditingItemId,
    itemToDelete,
    setItemToDelete,
    
    // Tab states
    editingTabId,
    setEditingTabId,
    newTabName,
    setNewTabName,
    tabToDelete,
    setTabToDelete,
    
    // Parameters
    parameterFilter,
    setParameterFilter,
    availableParameters,
    filteredAvailableParameters,
    isLoadingParameters,
    
    // Handlers
    handleToggleItem,
    handleDragEnd,
    handleSave,
    handleReset,
    handleEditItem,
    handleDeleteItem,
    handleDisplayLocationChange,
    handleAddTab,
    handleEditTab,
    handleDeleteTab,
    handleToggleTab,
    handleTabDragEnd,
    handleItemTabChange,
    handleToggleItemInTab,
  }
}
