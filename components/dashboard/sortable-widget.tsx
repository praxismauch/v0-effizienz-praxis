"use client"

import type React from "react"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { GripVertical, Minus, Trash2 } from "lucide-react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  type WidgetConfig,
  WIDGET_DEFINITIONS,
  FULL_WIDTH_WIDGET_IDS,
  COLUMN_OPTIONS,
  ROW_SPAN_OPTIONS,
} from "./editor-constants"

// ── SortableWidget ─────────────────────────────────────────────────────────────

interface SortableWidgetProps {
  widget: (typeof WIDGET_DEFINITIONS)[0]
  config: WidgetConfig
  setConfig: React.Dispatch<React.SetStateAction<WidgetConfig>>
  defaultSpan?: number
}

export function SortableWidget({ widget, config, setConfig, defaultSpan }: SortableWidgetProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: widget.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  }

  const Icon = widget.icon
  const isEnabled = config[widget.id as keyof WidgetConfig] as boolean
  const showSubOptions = widget.id === "showTodos" && config.showTodos

  return (
    <Card ref={setNodeRef} style={style} className={`p-4 ${isDragging ? "shadow-lg ring-2 ring-primary" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div
          {...attributes}
          {...listeners}
          className="mt-1 p-1.5 rounded hover:bg-muted cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex items-start gap-3 flex-1">
          <div className="mt-1 p-2 rounded-lg bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div className="space-y-1 flex-1">
            <Label htmlFor={widget.id} className="text-base cursor-pointer">
              {widget.label}
            </Label>
            <p className="text-sm text-muted-foreground">{widget.description}</p>
          </div>
        </div>
        <Switch
          id={widget.id}
          checked={isEnabled}
          onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, [widget.id]: checked }))}
        />
      </div>

      {isEnabled && (
        <div className="mt-3 pl-12 space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground whitespace-nowrap w-12">Breite:</Label>
            <div className="flex gap-1">
              {COLUMN_OPTIONS.map((opt) => {
                const currentSpan = config.columnSpans?.[widget.id] || 0
                const isSelected = currentSpan === opt.value
                const computedDefault = FULL_WIDTH_WIDGET_IDS.has(widget.id) ? 5 : (defaultSpan || 1)
                const displayLabel = opt.value === 0 ? `Std. (${computedDefault})` : String(opt.value === 5 ? "Voll" : opt.value)
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={`px-2 py-0.5 text-xs rounded border transition-colors ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-input hover:border-primary/50"
                    }`}
                    title={opt.label}
                    onClick={() =>
                      setConfig((prev) => ({
                        ...prev,
                        columnSpans: { ...(prev.columnSpans || {}), [widget.id]: opt.value },
                      }))
                    }
                  >
                    {displayLabel}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground whitespace-nowrap w-12">Hohe:</Label>
            <div className="flex gap-1">
              {ROW_SPAN_OPTIONS.map((opt) => {
                const currentRowSpan = config.rowSpans?.[widget.id] || 0
                const isSelected = currentRowSpan === opt.value
                const displayLabel = opt.value === 0 ? "Std. (1)" : opt.label
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={`px-2 py-0.5 text-xs rounded border transition-colors ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-input hover:border-primary/50"
                    }`}
                    title={opt.label}
                    onClick={() =>
                      setConfig((prev) => ({
                        ...prev,
                        rowSpans: { ...(prev.rowSpans || {}), [widget.id]: opt.value },
                      }))
                    }
                  >
                    {displayLabel}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {showSubOptions && (
        <div className="mt-4 pl-12 space-y-3 border-l-2 border-primary/20">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Filter Optionen</Label>
            <p className="text-xs text-muted-foreground">Wählen Sie die Filter für Ihre Aufgaben</p>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="wichtig-filter" className="text-sm">
              Nur wichtige Aufgaben
            </Label>
            <Switch
              id="wichtig-filter"
              checked={config.todosFilterWichtig === true}
              onCheckedChange={(checked) =>
                setConfig((prev) => ({
                  ...prev,
                  todosFilterWichtig: checked ? true : undefined,
                }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="dringend-filter" className="text-sm">
              Nur dringende Aufgaben
            </Label>
            <Switch
              id="dringend-filter"
              checked={config.todosFilterDringend === true}
              onCheckedChange={(checked) =>
                setConfig((prev) => ({
                  ...prev,
                  todosFilterDringend: checked ? true : undefined,
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority-filter" className="text-sm">
              Priorität Filter
            </Label>
            <select
              id="priority-filter"
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
              value={config.todosFilterPriority || "all"}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  todosFilterPriority: e.target.value === "all" ? undefined : e.target.value,
                }))
              }
            >
              <option value="all">Alle Prioritäten</option>
              <option value="high">Nur Hoch</option>
              <option value="medium">Nur Mittel</option>
              <option value="low">Nur Niedrig</option>
            </select>
          </div>
        </div>
      )}
    </Card>
  )
}

// ── SortableLinebreak ──────────────────────────────────────────────────────────

interface SortableLinebreakProps {
  id: string
  onRemove: (id: string) => void
}

export function SortableLinebreak({ id, onRemove }: SortableLinebreakProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`p-3 bg-muted/50 border-dashed ${isDragging ? "shadow-lg ring-2 ring-primary" : ""}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div
          {...attributes}
          {...listeners}
          className="p-1.5 rounded hover:bg-muted cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex items-center gap-3 flex-1">
          <div className="p-2 rounded-lg bg-muted">
            <Minus className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">Trennlinie</p>
            <p className="text-xs text-muted-foreground/70">Visuelle Trennung zwischen Widgets</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => onRemove(id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  )
}
