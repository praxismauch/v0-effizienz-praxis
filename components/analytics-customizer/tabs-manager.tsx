"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"
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
import { GripVertical, Plus, Pencil, Trash2, Folder, FolderOpen, Settings, Eye, EyeOff } from "lucide-react"
import { useTranslation } from "@/contexts/translation-context"
import type { AnalyticsTab, AnalyticsItem } from "./types"

interface TabsManagerProps {
  tabs: AnalyticsTab[]
  items: AnalyticsItem[]
  isTabDialogOpen: boolean
  setIsTabDialogOpen: (open: boolean) => void
  editingTabId: string | null
  newTabName: string
  setNewTabName: (name: string) => void
  onAddTab: () => void
  onEditTab: (tab: AnalyticsTab) => void
  onDeleteTab: (tabId: string) => void
  onToggleTab: (tabId: string, enabled: boolean) => void
  onTabDragEnd: (result: DropResult) => void
  onManageTabItems: (tabId: string) => void
  onCloseTabDialog: () => void
}

export function TabsManager({
  tabs,
  items,
  isTabDialogOpen,
  setIsTabDialogOpen,
  editingTabId,
  newTabName,
  setNewTabName,
  onAddTab,
  onEditTab,
  onDeleteTab,
  onToggleTab,
  onTabDragEnd,
  onManageTabItems,
  onCloseTabDialog,
}: TabsManagerProps) {
  const { t } = useTranslation()

  return (
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
                <Button variant="outline" onClick={onCloseTabDialog}>
                  {t("common.cancel", "Abbrechen")}
                </Button>
                <Button onClick={onAddTab} disabled={!newTabName.trim()}>
                  {editingTabId ? t("common.save", "Speichern") : t("common.add", "Hinzufügen")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <DragDropContext onDragEnd={onTabDragEnd}>
          <Droppable droppableId="analytics-tabs">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                {[...tabs]
                  .sort((a, b) => a.order - b.order)
                  .map((tab, index) => {
                    const itemsInTab = items.filter((item) => item.tabIds?.includes(tab.id)).length
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
                                onClick={() => onManageTabItems(tab.id)}
                                title={t("analytics.customizer.manageItems", "Elemente verwalten")}
                              >
                                <Settings className="h-3.5 w-3.5" />
                                {t("analytics.customizer.manageItems", "Elemente verwalten")}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => onEditTab(tab)}
                                title={t("common.edit", "Bearbeiten")}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => onDeleteTab(tab.id)}
                                title={t("common.delete", "Löschen")}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                {tab.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                              </div>
                              <Switch
                                checked={tab.enabled}
                                onCheckedChange={(checked) => onToggleTab(tab.id, checked)}
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
  )
}
