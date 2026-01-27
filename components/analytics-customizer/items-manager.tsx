"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GripVertical, Plus, Pencil, Trash2, Eye, EyeOff, Monitor, LayoutDashboard, Layout } from "lucide-react"
import { useTranslation } from "@/contexts/translation-context"
import type { AnalyticsItem, AnalyticsTab } from "./types"
import { chartTypeIcons, categoryColors } from "./types"

interface ItemsManagerProps {
  items: AnalyticsItem[]
  tabs: AnalyticsTab[]
  onToggleItem: (id: string, enabled: boolean) => void
  onDragEnd: (result: DropResult) => void
  onEditItem: (item: AnalyticsItem) => void
  onDeleteItem: (itemId: string) => void
  onDisplayLocationChange: (id: string, displayIn: "analytics" | "dashboard" | "both") => void
  onItemTabChange: (itemId: string, tabIds: string[]) => void
  onOpenAddDialog: () => void
}

export function ItemsManager({
  items,
  tabs,
  onToggleItem,
  onDragEnd,
  onEditItem,
  onDeleteItem,
  onDisplayLocationChange,
  onItemTabChange,
  onOpenAddDialog,
}: ItemsManagerProps) {
  const { t } = useTranslation()

  const categoryLabels = {
    overview: t("analytics.categories.overview", "Übersicht"),
    performance: t("analytics.categories.performance", "Leistung"),
    charts: t("analytics.categories.charts", "Diagramme"),
  }

  const displayLabels = {
    analytics: t("analytics.displayIn.analytics", "Analytics"),
    dashboard: t("analytics.displayIn.dashboard", "Dashboard"),
    both: t("analytics.displayIn.both", "Beides"),
  }

  const sortedItems = [...items].sort((a, b) => a.order - b.order)

  return (
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
          <Button className="gap-2" onClick={onOpenAddDialog}>
            <Plus className="h-4 w-4" />
            {t("analytics.customizer.addItem", "Neues Diagramm hinzufügen")}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="analytics-items">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                {sortedItems.map((item, index) => {
                  const ChartIcon = chartTypeIcons[item.chartType]
                  const DisplayIcon =
                    item.displayIn === "analytics" ? Monitor : item.displayIn === "dashboard" ? LayoutDashboard : Layout

                  return (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          id={`analytics-item-${item.id}`}
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`flex items-center gap-4 p-4 border rounded-lg bg-card transition-all ${
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
                              </div>
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <Select
                              value={item.displayIn || "analytics"}
                              onValueChange={(value: "analytics" | "dashboard" | "both") =>
                                onDisplayLocationChange(item.id, value)
                              }
                            >
                              <SelectTrigger className="w-[140px] h-8 bg-transparent">
                                <div className="flex items-center gap-2">
                                  <DisplayIcon className="h-3.5 w-3.5" />
                                  <SelectValue />
                                </div>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="analytics">{displayLabels.analytics}</SelectItem>
                                <SelectItem value="dashboard">{displayLabels.dashboard}</SelectItem>
                                <SelectItem value="both">{displayLabels.both}</SelectItem>
                              </SelectContent>
                            </Select>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => onEditItem(item)}
                              title={t("common.edit", "Bearbeiten")}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => onDeleteItem(item.id)}
                              title={t("common.delete", "Löschen")}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>

                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              {item.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                            </div>

                            <Switch
                              checked={item.enabled}
                              onCheckedChange={(checked) => onToggleItem(item.id, checked)}
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
