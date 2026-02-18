"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card } from "@/components/ui/card"
import {
  Users,
  Target,
  Workflow,
  FileText,
  Activity,
  Zap,
  Briefcase,
  BarChart3,
  CheckSquare,
  Calendar,
  Clock,
  Rss,
  Star,
  GripVertical,
  TrendingUp,
  Lightbulb,
  Minus,
  Plus,
  Trash2,
} from "lucide-react"
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
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface DashboardEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (config: { widgets: WidgetConfig }) => void
  config?: { widgets?: WidgetConfig }
  currentConfig?: { widgets?: WidgetConfig }
}

export interface WidgetConfig {
  showTeamMembers: boolean
  showGoals: boolean
  showWorkflows: boolean
  showDocuments: boolean
  showActivityChart: boolean
  showQuickActions: boolean
  showRecruiting: boolean
  showActiveCandidates: boolean
  showOpenTasks: boolean
  showTodayAppointments: boolean
  showDrafts: boolean
  showWeeklyTasks: boolean
  showTodaySchedule: boolean
  showRecentActivities: boolean
  showGoogleReviews: boolean
  showTodos: boolean
  showBulletin?: boolean
  showKPIs?: boolean
  showJournalActions?: boolean
  columnSpans?: Record<string, number>
  todosFilterWichtig?: boolean
  todosFilterDringend?: boolean
  todosFilterPriority?: string
  widgetOrder?: string[]
  linebreaks?: string[]
}

// Keep DashboardConfig as alias for backward compatibility
export type DashboardConfig = WidgetConfig

export const isLinebreakWidget = (id: string) => id.startsWith("linebreak_")

export const WIDGET_DEFINITIONS = [
  {
    id: "showOpenTasks",
    label: "Offene Aufgaben",
    description: "Zu erledigende Aufgaben anzeigen",
    icon: CheckSquare,
  },
  {
    id: "showTodayAppointments",
    label: "Termine heute",
    description: "Heutige Termine anzeigen",
    icon: Calendar,
  },
  {
    id: "showActiveCandidates",
    label: "Aktive Kandidaten",
    description: "Nicht archivierte Bewerber anzeigen",
    icon: Users,
  },
  {
    id: "showGoogleReviews",
    label: "Google Bewertungen",
    description: "Ihre Google Business Bewertungen anzeigen",
    icon: Star,
  },
  {
    id: "showTeamMembers",
    label: "Team Mitglieder",
    description: "Anzahl der Teammitglieder anzeigen",
    icon: Users,
  },
  {
    id: "showDrafts",
    label: "Entwürfe",
    description: "QM-Dokumentation Entwürfe",
    icon: FileText,
  },
  {
    id: "showGoals",
    label: "Aktive Ziele",
    description: "Übersicht aktiver Ziele",
    icon: Target,
  },
  {
    id: "showWorkflows",
    label: "Workflows",
    description: "Anzahl der Workflows anzeigen",
    icon: Workflow,
  },
  {
    id: "showDocuments",
    label: "Dokumente",
    description: "Dokumentenanzahl anzeigen",
    icon: FileText,
  },
  {
    id: "showRecruiting",
    label: "Personalsuche",
    description: "Offene Stellen und Bewerbungen",
    icon: Briefcase,
  },
  {
    id: "showKPIs",
    label: "Praxis-Score",
    description: "KPI-Bewertung Ihrer Praxisleistung",
    icon: TrendingUp,
  },
  {
    id: "showWeeklyTasks",
    label: "Wöchentliche Aufgaben",
    description: "Erledigte und ausstehende Aufgaben diese Woche",
    icon: BarChart3,
  },
  {
    id: "showTodaySchedule",
    label: "Heutige Termine",
    description: "Kalendertermine im Tagesverlauf",
    icon: Clock,
  },
  {
    id: "showActivityChart",
    label: "Aktivitäts-Chart",
    description: "7-Tage Aktivitätsverlauf",
    icon: Activity,
  },
  {
    id: "showRecentActivities",
    label: "Letzte Aktivitäten",
    description: "Aktuelle Updates aus Ihrer Praxis",
    icon: Rss,
  },
  {
    id: "showJournalActions",
    label: "Journal Handlungsempfehlungen",
    description: "KI-generierte Handlungsempfehlungen aus dem Journal",
    icon: Lightbulb,
  },
  {
    id: "showQuickActions",
    label: "Schnellaktionen",
    description: "Schnellzugriff auf häufige Aktionen",
    icon: Zap,
  },
  {
    id: "showTodos",
    label: "Aufgaben (Todos)",
    description: "Gefilterte Aufgabenliste mit konfigurierbaren Filtern",
    icon: CheckSquare,
  },
  {
    id: "showBulletin",
    label: "Schwarzes Brett",
    description: "Neueste Beiträge vom Schwarzen Brett",
    icon: FileText,
  },
]

export const DEFAULT_ORDER = WIDGET_DEFINITIONS.map((w) => w.id)

const defaultWidgetConfig: WidgetConfig = {
  showTeamMembers: false,
  showGoals: true,
  showWorkflows: true,
  showDocuments: false,
  showActivityChart: true,
  showQuickActions: true,
  showRecruiting: false,
  showActiveCandidates: true,
  showOpenTasks: true,
  showTodayAppointments: true,
  showDrafts: false,
  showWeeklyTasks: true,
  showTodaySchedule: true,
  showRecentActivities: true,
  showGoogleReviews: true,
  showTodos: true,
  showKPIs: true,
  showJournalActions: true,
  showBulletin: true,
  columnSpans: {},
  todosFilterWichtig: undefined,
  todosFilterDringend: undefined,
  todosFilterPriority: undefined,
  widgetOrder: DEFAULT_ORDER,
  linebreaks: [],
}

const FULL_WIDTH_WIDGET_IDS = new Set(["showBulletin", "showJournalActions"])

const COLUMN_OPTIONS = [
  { value: 0, label: "Standard" },
  { value: 1, label: "1 Spalte" },
  { value: 2, label: "2 Spalten" },
  { value: 3, label: "3 Spalten" },
  { value: 4, label: "4 Spalten" },
  { value: 5, label: "Volle Breite" },
]

interface SortableWidgetProps {
  widget: (typeof WIDGET_DEFINITIONS)[0]
  config: WidgetConfig
  setConfig: React.Dispatch<React.SetStateAction<WidgetConfig>>
  defaultSpan?: number
}

function SortableWidget({ widget, config, setConfig, defaultSpan }: SortableWidgetProps) {
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
        <div className="mt-3 pl-12 flex items-center gap-2">
          <Label className="text-xs text-muted-foreground whitespace-nowrap">Breite:</Label>
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

interface SortableLinebreakProps {
  id: string
  onRemove: (id: string) => void
}

function SortableLinebreak({ id, onRemove }: SortableLinebreakProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  })

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

export function DashboardEditorDialog({
  open,
  onOpenChange,
  onSave,
  config: configProp,
  currentConfig,
}: DashboardEditorDialogProps) {
  const getWidgetsFromConfig = (cfg: { widgets?: WidgetConfig } | undefined): WidgetConfig => {
    if (!cfg) return defaultWidgetConfig
    // If config has widgets property, use that; otherwise treat cfg as the widget config itself
    const widgets = cfg.widgets || (cfg as unknown as WidgetConfig)
    return { ...defaultWidgetConfig, ...widgets }
  }

  const initialWidgets = getWidgetsFromConfig(configProp || currentConfig)

  // Ensure saved order includes all known widget IDs (handles newly added widgets)
  const ensureCompleteOrder = (savedOrder: string[]): string[] => {
    const order = [...savedOrder]
    for (const id of DEFAULT_ORDER) {
      if (!order.includes(id)) {
        order.push(id)
      }
    }
    return order
  }

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

      // Fetch super-admin default column spans (Vorlagen)
      fetch("/api/cockpit-settings")
        .then((res) => res.ok ? res.json() : { settings: [] })
        .then((data) => {
          const defaults: Record<string, number> = {}
          for (const s of data.settings || []) {
            if (s.widget_id && s.column_span) {
              defaults[s.widget_id] = s.column_span
            }
          }
          setAdminDefaults(defaults)
        })
        .catch(() => setAdminDefaults({}))
    }
  }, [open, configProp, currentConfig])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
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
      if (isLinebreakWidget(id)) {
        return { type: "linebreak" as const, id }
      }
      const widget = WIDGET_DEFINITIONS.find((w) => w.id === id)
      if (widget) {
        return { type: "widget" as const, widget }
      }
      return null
    })
    .filter(Boolean) as Array<
    { type: "linebreak"; id: string } | { type: "widget"; widget: (typeof WIDGET_DEFINITIONS)[0] }
  >

  const handleSave = () => {
    // Clean columnSpans: remove entries with value 0 (= use default)
    const cleanedSpans: Record<string, number> = {}
    for (const [key, val] of Object.entries(config.columnSpans || {})) {
      if (val && val > 0) cleanedSpans[key] = val
    }
    onSave({ widgets: { ...config, columnSpans: cleanedSpans, widgetOrder, linebreaks } })
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
                  <SortableWidget key={item.widget.id} widget={item.widget} config={config} setConfig={setConfig} defaultSpan={adminDefaults[item.widget.id]} />
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
