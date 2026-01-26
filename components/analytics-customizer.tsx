"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  RotateCcw,
  Save,
  CheckCircle,
  Activity,
  TrendingUp,
  Loader2,
} from "lucide-react"
import { useTranslation } from "@/contexts/translation-context"

// Import refactored components and hook
import { useAnalyticsCustomizer } from "./analytics-customizer/use-analytics-customizer"
import { TabsManager } from "./analytics-customizer/tabs-manager"
import { ItemsManager } from "./analytics-customizer/items-manager"
import { AddItemDialog } from "./analytics-customizer/add-item-dialog"
import { TabDialog } from "./analytics-customizer/tab-dialog"
import { ManageTabItemsDialog } from "./analytics-customizer/manage-tab-items-dialog"
import { DeleteConfirmDialog } from "./analytics-customizer/delete-confirm-dialog"
import type { AnalyticsTab, AnalyticsItem } from "./analytics-customizer/types"

// Re-export types for backwards compatibility
export type { AnalyticsTab, AnalyticsItem }

interface AnalyticsCustomizerProps {
  onItemsChange?: (items: AnalyticsItem[]) => void
  onTabsChange?: (tabs: AnalyticsTab[]) => void
  onSaved?: () => void
}

const categoryLabels: Record<string, string> = {
  overview: "Übersicht",
  performance: "Leistung",
  charts: "Diagramme",
}

export function AnalyticsCustomizer({ onItemsChange, onTabsChange, onSaved }: AnalyticsCustomizerProps) {
  const { t } = useTranslation()
  
  // Use the refactored hook for all state and handlers
  const {
    analyticsItems,
    analyticsTabs,
    sortedItems,
    enabledCount,
    totalCount,
    hasUnsavedChanges,
    justSaved,
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
    itemToDelete,
    setItemToDelete,
    
    // Tab states
    editingTabId,
    newTabName,
    setNewTabName,
    tabToDelete,
    setTabToDelete,
    
    // Parameters
    parameterFilter,
    setParameterFilter,
    filteredAvailableParameters,
    isLoadingParameters,
    
    // Handlers
    handleToggleItem,
    handleDragEnd,
    handleSave,
    handleReset,
    handleEditItem,
    handleDeleteItem,
    handleConfirmDeleteItem,
    handleDisplayLocationChange,
    handleAddNewItem,
    handleCloseDialog,
    handleToggleParameter,
    handleAddTab,
    handleEditTab,
    handleDeleteTab,
    handleConfirmDeleteTab,
    handleToggleTab,
    handleTabDragEnd,
    handleManageTabItems,
    handleToggleItemInTab,
    handleCloseTabDialog,
    handleCloseManageTabItemsDialog,
  } = useAnalyticsCustomizer({ onItemsChange, onTabsChange, onSaved })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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
            <Badge className="gap-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
              <CheckCircle className="h-3 w-3" />
              {t("analytics.customizer.saved", "Gespeichert")}
            </Badge>
          )}
          <Button variant="outline" onClick={handleReset} className="gap-2 bg-transparent">
            <RotateCcw className="h-4 w-4" />
            {t("analytics.customizer.reset", "Zurücksetzen")}
          </Button>
          <Button onClick={handleSave} className="gap-2" disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isSaving ? t("common.saving", "Speichern...") : t("analytics.customizer.saveLayout", "Layout speichern")}
          </Button>
        </div>
      </div>

      {/* Stats Card */}
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
              {Object.entries(categoryLabels).map(([key, label]) => (
                <Badge key={key} variant="secondary" className="text-xs">
                  {label}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Manager */}
      <TabsManager
        tabs={analyticsTabs}
        onAddTab={() => setIsTabDialogOpen(true)}
        onEditTab={handleEditTab}
        onDeleteTab={handleDeleteTab}
        onToggleTab={handleToggleTab}
        onDragEnd={handleTabDragEnd}
        onManageItems={handleManageTabItems}
      />

      {/* Items Manager */}
      <ItemsManager
        items={sortedItems}
        tabs={analyticsTabs}
        onToggleItem={handleToggleItem}
        onEditItem={handleEditItem}
        onDeleteItem={handleDeleteItem}
        onDragEnd={handleDragEnd}
        onDisplayLocationChange={handleDisplayLocationChange}
        onAddItem={() => setIsAddDialogOpen(true)}
      />

      {/* Dialogs */}
      <AddItemDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        editingItemId={editingItemId}
        title={newItemTitle}
        setTitle={setNewItemTitle}
        description={newItemDescription}
        setDescription={setNewItemDescription}
        category={newItemCategory}
        setCategory={setNewItemCategory}
        chartType={newItemChartType}
        setChartType={setNewItemChartType}
        selectedParameters={selectedParameters}
        parameterFilter={parameterFilter}
        setParameterFilter={setParameterFilter}
        availableParameters={filteredAvailableParameters}
        isLoadingParameters={isLoadingParameters}
        onToggleParameter={handleToggleParameter}
        onSubmit={handleAddNewItem}
        onClose={handleCloseDialog}
      />

      <TabDialog
        open={isTabDialogOpen}
        onOpenChange={setIsTabDialogOpen}
        editingTabId={editingTabId}
        tabName={newTabName}
        setTabName={setNewTabName}
        onSubmit={handleAddTab}
        onClose={handleCloseTabDialog}
      />

      <ManageTabItemsDialog
        open={isManageTabItemsDialogOpen}
        onOpenChange={setIsManageTabItemsDialogOpen}
        selectedTabId={selectedTabForItemManagement}
        tabs={analyticsTabs}
        items={analyticsItems}
        onToggleItemInTab={handleToggleItemInTab}
        onClose={handleCloseManageTabItemsDialog}
      />

      <DeleteConfirmDialog
        open={!!itemToDelete}
        onOpenChange={(open) => !open && setItemToDelete(null)}
        title={t("analytics.customizer.deleteItem", "Element löschen")}
        description={t("analytics.customizer.deleteItemConfirm", "Möchten Sie dieses Element wirklich löschen?")}
        onConfirm={() => itemToDelete && handleConfirmDeleteItem(itemToDelete)}
      />

      <DeleteConfirmDialog
        open={!!tabToDelete}
        onOpenChange={(open) => !open && setTabToDelete(null)}
        title={t("analytics.customizer.deleteTab", "Tab löschen")}
        description={t("analytics.customizer.deleteTabConfirm", "Möchten Sie diesen Tab wirklich löschen?")}
        onConfirm={() => tabToDelete && handleConfirmDeleteTab(tabToDelete)}
      />
    </div>
  )
}
