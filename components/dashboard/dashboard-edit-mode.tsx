"use client"

import type React from "react"
import { useState, useCallback } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Columns, Save, XCircle, RotateCcw, Library } from "lucide-react"
import {
  WIDGET_DEFINITIONS,
  DEFAULT_ROW_SPANS,
  isLinebreakWidget,
  type WidgetConfig,
} from "@/components/dashboard/editor-constants"
import { SortableEditWidget } from "./sortable-edit-card"
import { WidgetLibrary } from "./widget-library-sheet"

// ── Types ──────────────────────────────────────────────────────────────────────

interface EditModeProps {
  config: WidgetConfig
  widgetOrder: string[]
  linebreaks: string[]
  onSave: (config: WidgetConfig) => void
  onCancel: () => void
  renderWidgetPreview: (widgetId: string) => React.ReactNode
  getColumnSpan: (widgetId: string) => number
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function DashboardEditMode({
  config,
  widgetOrder: initialOrder,
  linebreaks: initialLinebreaks,
  onSave,
  onCancel,
  renderWidgetPreview,
  getColumnSpan,
}: EditModeProps) {
  const [localConfig, setLocalConfig] = useState<WidgetConfig>({ ...config })
  const [order, setOrder] = useState<string[]>([...initialOrder])
  const [linebreaks, setLinebreaks] = useState<string[]>([...initialLinebreaks])
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string)

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    if (over && active.id !== over.id) {
      setOrder((items) => {
        const oldIndex = items.indexOf(active.id as string)
        const newIndex = items.indexOf(over.id as string)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const handleRemoveWidget = useCallback((widgetId: string) => {
    if (isLinebreakWidget(widgetId)) {
      setLinebreaks((prev) => prev.filter((lb) => lb !== widgetId))
      setOrder((prev) => prev.filter((id) => id !== widgetId))
    } else {
      setLocalConfig((prev) => ({ ...prev, [widgetId]: false }))
      setOrder((prev) => prev.filter((id) => id !== widgetId))
    }
  }, [])

  const handleToggleWidget = useCallback(
    (widgetId: string) => {
      const isEnabled = localConfig[widgetId as keyof WidgetConfig] as boolean
      if (isEnabled) {
        setLocalConfig((prev) => ({ ...prev, [widgetId]: false }))
        setOrder((prev) => prev.filter((id) => id !== widgetId))
      } else {
        setLocalConfig((prev) => ({ ...prev, [widgetId]: true }))
        setOrder((prev) => (prev.includes(widgetId) ? prev : [...prev, widgetId]))
      }
    },
    [localConfig],
  )

  const handleChangeSpan = useCallback((widgetId: string, span: number) => {
    setLocalConfig((prev) => ({
      ...prev,
      columnSpans: { ...(prev.columnSpans || {}), [widgetId]: span },
    }))
  }, [])

  const handleChangeRowSpan = useCallback((widgetId: string, rowSpan: number) => {
    setLocalConfig((prev) => ({
      ...prev,
      rowSpans: { ...(prev.rowSpans || {}), [widgetId]: rowSpan },
    }))
  }, [])

  const handleAddLinebreak = useCallback(() => {
    const newId = `linebreak_${Date.now()}`
    setLinebreaks((prev) => [...prev, newId])
    setOrder((prev) => [...prev, newId])
  }, [])

  const handleSave = () => {
    const cleanedSpans: Record<string, number> = {}
    for (const [key, val] of Object.entries(localConfig.columnSpans || {})) {
      if (val && val > 0) cleanedSpans[key] = val
    }
    const cleanedRowSpans: Record<string, number> = {}
    for (const [key, val] of Object.entries(localConfig.rowSpans || {})) {
      if (val && val > 0) cleanedRowSpans[key] = val
    }
    onSave({
      ...localConfig,
      columnSpans: cleanedSpans,
      rowSpans: cleanedRowSpans,
      widgetOrder: order,
      linebreaks,
    })
  }

  const handleReset = () => {
    setLocalConfig({ ...config })
    setOrder([...initialOrder])
    setLinebreaks([...initialLinebreaks])
  }

  const visibleItems = order.filter((id) => {
    if (isLinebreakWidget(id)) return linebreaks.includes(id)
    return localConfig[id as keyof WidgetConfig] === true
  })

  const enabledWidgets: Record<string, boolean> = {}
  for (const w of WIDGET_DEFINITIONS) {
    enabledWidgets[w.id] = localConfig[w.id as keyof WidgetConfig] === true
  }

  const getCurrentSpan = (widgetId: string): number => localConfig.columnSpans?.[widgetId] || getColumnSpan(widgetId)
  const getCurrentRowSpan = (widgetId: string): number => localConfig.rowSpans?.[widgetId] || DEFAULT_ROW_SPANS[widgetId] || 1

  const libraryContent = (
    <WidgetLibrary
      enabledWidgets={enabledWidgets}
      onToggleWidget={handleToggleWidget}
      onAddLinebreak={handleAddLinebreak}
    />
  )

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b -mx-4 px-4 py-3 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Columns className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Bearbeitungsmodus</p>
              <p className="text-xs text-muted-foreground">Widgets verschieben, anpassen oder entfernen</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Library className="h-4 w-4" />
                  Widget-Bibliothek
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[380px] sm:w-[420px]">
                <SheetHeader>
                  <SheetTitle>Widget-Bibliothek</SheetTitle>
                  <SheetDescription>Widgets zum Dashboard hinzufügen oder entfernen</SheetDescription>
                </SheetHeader>
                <div className="mt-6 overflow-y-auto max-h-[calc(100vh-120px)] pr-1">{libraryContent}</div>
              </SheetContent>
            </Sheet>

            <Button variant="ghost" size="sm" onClick={handleReset} className="gap-2 text-muted-foreground">
              <RotateCcw className="h-4 w-4" />
              Zurücksetzen
            </Button>
            <Button variant="ghost" size="sm" onClick={onCancel} className="gap-2 text-muted-foreground">
              <XCircle className="h-4 w-4" />
              Abbrechen
            </Button>
            <Button size="sm" onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" />
              Speichern
            </Button>
          </div>
        </div>
      </div>

      {/* Sortable Grid */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <SortableContext items={visibleItems} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 min-w-0 auto-rows-[minmax(180px,auto)]">
            {visibleItems.map((id) => (
              <SortableEditWidget
                key={id}
                id={id}
                span={isLinebreakWidget(id) ? 5 : getCurrentSpan(id)}
                rowSpan={isLinebreakWidget(id) ? 1 : getCurrentRowSpan(id)}
                onRemove={() => handleRemoveWidget(id)}
                onChangeSpan={(span) => handleChangeSpan(id, span)}
                onChangeRowSpan={(rs) => handleChangeRowSpan(id, rs)}
                isLinebreak={isLinebreakWidget(id)}
              >
                {renderWidgetPreview(id)}
              </SortableEditWidget>
            ))}
          </div>
        </SortableContext>
        <DragOverlay>
          {activeId && !isLinebreakWidget(activeId) ? (
            <div className="opacity-80 rotate-2 shadow-2xl">{renderWidgetPreview(activeId)}</div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {visibleItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Columns className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Keine Widgets aktiviert</p>
          <p className="text-sm text-muted-foreground/70 mb-4">Öffnen Sie die Widget-Bibliothek um Widgets hinzuzufügen</p>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Library className="h-4 w-4" />
                Widget-Bibliothek öffnen
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[380px] sm:w-[420px]">
              <SheetHeader>
                <SheetTitle>Widget-Bibliothek</SheetTitle>
                <SheetDescription>Widgets zum Dashboard hinzufügen oder entfernen</SheetDescription>
              </SheetHeader>
              <div className="mt-6 overflow-y-auto max-h-[calc(100vh-120px)] pr-1">{libraryContent}</div>
            </SheetContent>
          </Sheet>
        </div>
      )}
    </div>
  )
}
