"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Minus, Plus } from "lucide-react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"

// Re-export types & constants so existing imports keep working
export {
  type WidgetConfig,
  type DashboardConfig,
  isLinebreakWidget,
  WIDGET_DEFINITIONS,
  DEFAULT_ORDER,
  DEFAULT_ROW_SPANS,
  defaultWidgetConfig,
  FULL_WIDTH_WIDGET_IDS,
  COLUMN_OPTIONS,
  ROW_SPAN_OPTIONS,
} from "./dashboard/editor-constants"

import {
  type WidgetConfig,
  isLinebreakWidget,
  WIDGET_DEFINITIONS,
  DEFAULT_ORDER,
  defaultWidgetConfig,
} from "./dashboard/editor-constants"

import { SortableWidget, SortableLinebreak } from "./dashboard/sortable-widget"

// ── Dialog component ───────────────────────────────────────────────────────────

interface DashboardEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (config: { widgets: WidgetConfig }) => void
  config?: { widgets?: WidgetConfig }
  currentConfig?: { widgets?: WidgetConfig }
}

function getWidgetsFromConfig(cfg: { widgets?: WidgetConfig } | undefined): WidgetConfig {
  if (!cfg) return defaultWidgetConfig
  const widgets = cfg.widgets || (cfg as unknown as WidgetConfig)
  return { ...defaultWidgetConfig, ...widgets }
}

function ensureCompleteOrder(savedOrder: string[]): string[] {
  const order = [...savedOrder]
  for (const id of DEFAULT_ORDER) {
    if (!order.includes(id)) order.push(id)
  }
  return order
}

export function DashboardEditorDialog({
  open,
  onOpenChange,
  onSave,
  config: configProp,
  currentConfig,
}: DashboardEditorDialogProps) {
  const initialWidgets = getWidgetsFromConfig(configProp || currentConfig)

  const [config, setConfig] = useState<WidgetConfig>(initialWidgets)
  const [widgetOrder, setWidgetOrder] = useState<string[]>(ensureCompleteOrder(initialWidgets.widgetOrder || DEFAULT_ORDER))
  const [linebreaks, setLinebreaks] = useState<string[]>(initialWidgets.linebreaks || [])
  const [adminDefaults, setAdminDefaults] = useState<Record<string, number>>({})

  useEffect(() => {
    if (open) {
      const widgets = getWidgetsFromConfig(configProp || currentConfig)
      setConfig(widgets)
      setWidgetOrder(ensureCompleteOrder(widgets.widgetOrder || DEFAULT_ORDER))
      setLinebreaks(widgets.linebreaks || [])

      fetch("/api/cockpit-settings")
        .then((res) => (res.ok ? res.json() : { settings: [] }))
        .then((data) => {
          const defaults: Record<string, number> = {}
          for (const s of data.settings || []) {
            if (s.widget_id && s.column_span) defaults[s.widget_id] = s.column_span
          }
          setAdminDefaults(defaults)
        })
        .catch(() => setAdminDefaults({}))
    }
  }, [open, configProp, currentConfig])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setWidgetOrder((items) => {
        const oldIndex = items.indexOf(active.id as string)
        const newIndex = items.indexOf(over.id as string)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const handleAddLinebreak = () => {
    const newId = `linebreak_${Date.now()}`
    setLinebreaks((prev) => [...prev, newId])
    setWidgetOrder((prev) => [...prev, newId])
  }

  const handleRemoveLinebreak = (id: string) => {
    setLinebreaks((prev) => prev.filter((lb) => lb !== id))
    setWidgetOrder((prev) => prev.filter((w) => w !== id))
  }

  const sortedItems = widgetOrder
    .map((id) => {
      if (isLinebreakWidget(id)) return { type: "linebreak" as const, id }
      const widget = WIDGET_DEFINITIONS.find((w) => w.id === id)
      return widget ? { type: "widget" as const, widget } : null
    })
    .filter(Boolean) as Array<{ type: "linebreak"; id: string } | { type: "widget"; widget: (typeof WIDGET_DEFINITIONS)[0] }>

  const handleSave = () => {
    const cleanedSpans: Record<string, number> = {}
    for (const [key, val] of Object.entries(config.columnSpans || {})) {
      if (val && val > 0) cleanedSpans[key] = val
    }
    const cleanedRowSpans: Record<string, number> = {}
    for (const [key, val] of Object.entries(config.rowSpans || {})) {
      if (val && val > 0) cleanedRowSpans[key] = val
    }
    onSave({
      widgets: {
        ...config,
        columnSpans: cleanedSpans,
        rowSpans: cleanedRowSpans,
        widgetOrder,
        linebreaks,
      },
    })
    onOpenChange(false)
  }

  const handleReset = () => {
    setConfig(defaultWidgetConfig)
    setWidgetOrder(DEFAULT_ORDER)
    setLinebreaks([])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cockpit bearbeiten</DialogTitle>
          <DialogDescription>Wählen Sie die Widgets aus und ordnen Sie sie per Drag & Drop an.</DialogDescription>
        </DialogHeader>

        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={handleAddLinebreak} className="gap-2 bg-transparent">
            <Plus className="h-4 w-4" />
            <Minus className="h-4 w-4" />
            Trennlinie hinzufügen
          </Button>
        </div>

        <div className="space-y-3 py-4">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={widgetOrder} strategy={verticalListSortingStrategy}>
              {sortedItems.map((item) =>
                item.type === "linebreak" ? (
                  <SortableLinebreak key={item.id} id={item.id} onRemove={handleRemoveLinebreak} />
                ) : (
                  <SortableWidget
                    key={item.widget.id}
                    widget={item.widget}
                    config={config}
                    setConfig={setConfig}
                    defaultSpan={adminDefaults[item.widget.id]}
                  />
                ),
              )}
            </SortableContext>
          </DndContext>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={handleReset}>
            Zurücksetzen
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSave}>Speichern</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default DashboardEditorDialog
