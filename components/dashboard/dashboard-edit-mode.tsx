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
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  GripVertical,
  X,
  Plus,
  Minus,
  Columns,
  Save,
  XCircle,
  RotateCcw,
  Library,
} from "lucide-react"
import {
  WIDGET_DEFINITIONS,
  DEFAULT_ORDER,
  isLinebreakWidget,
  type WidgetConfig,
} from "@/components/dashboard-editor-dialog"

// --- Types ---

interface EditModeProps {
  config: WidgetConfig
  widgetOrder: string[]
  linebreaks: string[]
  onSave: (config: WidgetConfig) => void
  onCancel: () => void
  renderWidgetPreview: (widgetId: string) => React.ReactNode
  getColumnSpan: (widgetId: string) => number
}

// --- Column span options ---
const SPAN_OPTIONS = [
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
  { value: 4, label: "4" },
  { value: 5, label: "Full" },
]

const getSpanClass = (span: number): string => {
  switch (span) {
    case 2: return "md:col-span-2"
    case 3: return "md:col-span-3"
    case 4: return "md:col-span-4"
    case 5: return "col-span-full"
    default: return ""
  }
}

// --- Sortable Widget Wrapper ---

function SortableEditWidget({
  id,
  children,
  span,
  onRemove,
  onChangeSpan,
  isLinebreak,
}: {
  id: string
  children: React.ReactNode
  span: number
  onRemove: () => void
  onChangeSpan: (span: number) => void
  isLinebreak: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  if (isLinebreak) {
    return (
      <div ref={setNodeRef} style={style} className="col-span-full group relative">
        <div className="flex items-center gap-2 py-2">
          <div
            {...attributes}
            {...listeners}
            className="p-1 rounded hover:bg-muted cursor-grab active:cursor-grabbing touch-none"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 h-px bg-border" />
          <Badge variant="secondary" className="text-xs shrink-0">Trennlinie</Badge>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={onRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div ref={setNodeRef} style={style} className={`${getSpanClass(span)} group relative`}>
      {/* Edit overlay controls */}
      <div className="absolute -top-2 -right-2 z-20 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="destructive"
          size="icon"
          className="h-6 w-6 rounded-full shadow-md"
          onClick={onRemove}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* Drag handle + column controls at bottom */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background border rounded-full shadow-md px-2 py-0.5">
        <div
          {...attributes}
          {...listeners}
          className="p-0.5 cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <div className="w-px h-4 bg-border" />
        <Columns className="h-3 w-3 text-muted-foreground" />
        {SPAN_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`w-5 h-5 text-[10px] rounded-full font-medium transition-colors ${
              span === opt.value
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-muted-foreground"
            }`}
            onClick={() => onChangeSpan(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Widget content with edit ring */}
      <div className="ring-2 ring-transparent group-hover:ring-primary/30 rounded-lg transition-all">
        {children}
      </div>
    </div>
  )
}

// --- Widget Library Sidebar ---

function WidgetLibrary({
  enabledWidgets,
  onToggleWidget,
  onAddLinebreak,
}: {
  enabledWidgets: Record<string, boolean>
  onToggleWidget: (id: string) => void
  onAddLinebreak: () => void
}) {
  const disabledWidgets = WIDGET_DEFINITIONS.filter((w) => !enabledWidgets[w.id])
  const activeWidgets = WIDGET_DEFINITIONS.filter((w) => enabledWidgets[w.id])

  return (
    <div className="space-y-6">
      {disabledWidgets.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Verfugbare Widgets</h4>
          <div className="space-y-2">
            {disabledWidgets.map((widget) => {
              const Icon = widget.icon
              return (
                <button
                  key={widget.id}
                  type="button"
                  onClick={() => onToggleWidget(widget.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-dashed border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5 transition-colors text-left"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{widget.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{widget.description}</p>
                  </div>
                  <Plus className="h-4 w-4 text-primary shrink-0" />
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div>
        <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Aktive Widgets</h4>
        <div className="space-y-2">
          {activeWidgets.map((widget) => {
            const Icon = widget.icon
            return (
              <div
                key={widget.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{widget.label}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:bg-destructive/10"
                  onClick={() => onToggleWidget(widget.id)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            )
          })}
        </div>
      </div>

      <Button variant="outline" className="w-full gap-2" onClick={onAddLinebreak}>
        <Minus className="h-4 w-4" />
        Trennlinie hinzufugen
      </Button>
    </div>
  )
}

// --- Main Edit Mode Component ---

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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

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

  const handleToggleWidget = useCallback((widgetId: string) => {
    const isEnabled = localConfig[widgetId as keyof WidgetConfig] as boolean
    if (isEnabled) {
      // Disable - remove from order
      setLocalConfig((prev) => ({ ...prev, [widgetId]: false }))
      setOrder((prev) => prev.filter((id) => id !== widgetId))
    } else {
      // Enable - add to end of order
      setLocalConfig((prev) => ({ ...prev, [widgetId]: true }))
      setOrder((prev) => {
        if (prev.includes(widgetId)) return prev
        return [...prev, widgetId]
      })
    }
  }, [localConfig])

  const handleChangeSpan = useCallback((widgetId: string, span: number) => {
    setLocalConfig((prev) => ({
      ...prev,
      columnSpans: { ...(prev.columnSpans || {}), [widgetId]: span },
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
    onSave({
      ...localConfig,
      columnSpans: cleanedSpans,
      widgetOrder: order,
      linebreaks,
    })
  }

  const handleReset = () => {
    setLocalConfig({ ...config })
    setOrder([...initialOrder])
    setLinebreaks([...initialLinebreaks])
  }

  // Build the visible items (only enabled widgets + linebreaks)
  const visibleItems = order.filter((id) => {
    if (isLinebreakWidget(id)) return linebreaks.includes(id)
    return localConfig[id as keyof WidgetConfig] === true
  })

  // Build enabled map for widget library
  const enabledWidgets: Record<string, boolean> = {}
  for (const w of WIDGET_DEFINITIONS) {
    enabledWidgets[w.id] = localConfig[w.id as keyof WidgetConfig] === true
  }

  const getCurrentSpan = (widgetId: string): number => {
    return localConfig.columnSpans?.[widgetId] || getColumnSpan(widgetId)
  }

  return (
    <div className="space-y-4">
      {/* Edit Mode Toolbar */}
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
                  <SheetDescription>
                    Widgets zum Dashboard hinzufugen oder entfernen
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 overflow-y-auto max-h-[calc(100vh-120px)] pr-1">
                  <WidgetLibrary
                    enabledWidgets={enabledWidgets}
                    onToggleWidget={handleToggleWidget}
                    onAddLinebreak={handleAddLinebreak}
                  />
                </div>
              </SheetContent>
            </Sheet>

            <Button variant="ghost" size="sm" onClick={handleReset} className="gap-2 text-muted-foreground">
              <RotateCcw className="h-4 w-4" />
              Zurucksetzen
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
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={visibleItems} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 min-w-0 auto-rows-min">
            {visibleItems.map((id) => (
              <SortableEditWidget
                key={id}
                id={id}
                span={isLinebreakWidget(id) ? 5 : getCurrentSpan(id)}
                onRemove={() => handleRemoveWidget(id)}
                onChangeSpan={(span) => handleChangeSpan(id, span)}
                isLinebreak={isLinebreakWidget(id)}
              >
                {renderWidgetPreview(id)}
              </SortableEditWidget>
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeId && !isLinebreakWidget(activeId) ? (
            <div className="opacity-80 rotate-2 shadow-2xl">
              {renderWidgetPreview(activeId)}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {visibleItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Columns className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Keine Widgets aktiviert</p>
          <p className="text-sm text-muted-foreground/70 mb-4">
            Offnen Sie die Widget-Bibliothek um Widgets hinzuzufugen
          </p>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Library className="h-4 w-4" />
                Widget-Bibliothek offnen
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[380px] sm:w-[420px]">
              <SheetHeader>
                <SheetTitle>Widget-Bibliothek</SheetTitle>
                <SheetDescription>
                  Widgets zum Dashboard hinzufugen oder entfernen
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 overflow-y-auto max-h-[calc(100vh-120px)] pr-1">
                <WidgetLibrary
                  enabledWidgets={enabledWidgets}
                  onToggleWidget={handleToggleWidget}
                  onAddLinebreak={handleAddLinebreak}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      )}
    </div>
  )
}
