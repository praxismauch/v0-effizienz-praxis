"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  BarChart3,
  LineChart,
  PieChart,
  TrendingUp,
  Users,
  Calendar,
  Target,
  Activity,
  Search,
  Edit,
  Trash2,
  Copy,
  MoreVertical,
  Plus,
  Sparkles,
  Lock,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { WIDGET_DEFINITIONS } from "@/components/dashboard/editor-constants"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export interface WidgetItem {
  id: string
  title: string
  description: string
  type: "chart" | "stat" | "table" | "custom"
  chartType?: "bar" | "line" | "pie" | "area" | "radar"
  category: string
  dataSource?: string
  enabled: boolean
  config?: Record<string, any>
}

interface WidgetLibraryProps {
  widgets: WidgetItem[]
  onEdit: (widget: WidgetItem) => void
  onDelete: (widgetId: string) => void
  onDuplicate: (widget: WidgetItem) => void
  onToggleEnabled: (widgetId: string) => void
  onCreateNew: () => void
}

const chartTypeIcons: Record<string, any> = {
  bar: BarChart3,
  line: LineChart,
  pie: PieChart,
  area: TrendingUp,
  radar: Activity,
}

const categoryColors: Record<string, string> = {
  overview: "bg-blue-100 text-blue-700",
  financial: "bg-green-100 text-green-700",
  patients: "bg-purple-100 text-purple-700",
  operations: "bg-amber-100 text-amber-700",
  team: "bg-pink-100 text-pink-700",
}

const categoryLabels: Record<string, string> = {
  overview: "Übersicht",
  financial: "Finanzen",
  patients: "Patienten",
  operations: "Betrieb",
  team: "Team",
}

const typeLabels: Record<string, string> = {
  chart: "Diagramm",
  stat: "Statistik",
  table: "Tabelle",
  custom: "Benutzerdefiniert",
  bar: "Balken",
  line: "Linie",
  pie: "Kreis",
  area: "Fläche",
  radar: "Radar",
}

export function WidgetLibrary({
  widgets,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleEnabled,
  onCreateNew,
}: WidgetLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const categories = Array.from(new Set(widgets.map((w) => w.category)))

  const filteredWidgets = widgets.filter((widget) => {
    const matchesSearch =
      widget.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      widget.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || widget.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const getChartIcon = (widget: WidgetItem) => {
    if (widget.type === "stat") return TrendingUp
    if (widget.type === "table") return Users
    if (widget.chartType) return chartTypeIcons[widget.chartType] || BarChart3
    return Activity
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Widget-Bibliothek</h2>
          <p className="text-muted-foreground">Verwalten Sie Ihre Diagramme und Dashboards</p>
        </div>
        <Button onClick={onCreateNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Neues Widget erstellen
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Widgets durchsuchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            onClick={() => setSelectedCategory(null)}
            size="sm"
          >
            Alle
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category)}
              size="sm"
            >
              {categoryLabels[category] || category}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{widgets.length + WIDGET_DEFINITIONS.length}</div>
            <p className="text-sm text-muted-foreground">Gesamt Widgets</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{widgets.filter((w) => w.enabled).length}</div>
            <p className="text-sm text-muted-foreground">Diagramme aktiv</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{WIDGET_DEFINITIONS.length}</div>
            <p className="text-sm text-muted-foreground">Cockpit-Widgets</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-amber-600">{widgets.filter((w) => !w.enabled).length}</div>
            <p className="text-sm text-muted-foreground">Deaktiviert</p>
          </CardContent>
        </Card>
      </div>

      {/* Widget Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWidgets.map((widget) => {
          const Icon = getChartIcon(widget)
          return (
            <Card
              key={widget.id}
              className={`relative overflow-hidden transition-all ${
                widget.enabled ? "border-primary/20" : "opacity-60"
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className={`p-2 rounded-lg ${widget.enabled ? "bg-primary/10" : "bg-muted"}`}>
                    <Icon className={`h-5 w-5 ${widget.enabled ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(widget)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Bearbeiten
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDuplicate(widget)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplizieren
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onToggleEnabled(widget.id)}>
                        {widget.enabled ? "Deaktivieren" : "Aktivieren"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onDelete(widget.id)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Löschen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-base">{widget.title}</CardTitle>
                  <CardDescription className="text-xs line-clamp-2">{widget.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className={`text-xs ${categoryColors[widget.category] || ""}`}>
                    {categoryLabels[widget.category] || widget.category}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {widget.type === "chart" ? (typeLabels[widget.chartType || ""] || widget.chartType) : (typeLabels[widget.type] || widget.type)}
                  </Badge>
                  {widget.enabled && (
                    <Badge variant="default" className="text-xs bg-green-100 text-green-700 hover:bg-green-100">
                      Aktiv
                    </Badge>
                  )}
                </div>
              </CardContent>
              {widget.enabled && (
                <div className="absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 bg-primary/5 rounded-full" />
              )}
            </Card>
          )
        })}
      </div>

      {filteredWidgets.length === 0 && !searchQuery && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Activity className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">Keine Widgets gefunden</p>
            <p className="text-sm text-muted-foreground mt-1">Versuchen Sie eine andere Suche oder Kategorie</p>
          </CardContent>
        </Card>
      )}

      {/* Dashboard Widgets (read-only) */}
      {!selectedCategory && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Cockpit-Widgets</h3>
              <p className="text-sm text-muted-foreground">
                Diese Widgets werden im Cockpit-Dashboard angezeigt. Konfiguration erfolgt im Cockpit-Bearbeitungsmodus.
              </p>
            </div>
            <Badge variant="outline" className="gap-1.5">
              <Lock className="h-3 w-3" />
              Nur Ansicht
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            <TooltipProvider>
              {WIDGET_DEFINITIONS.filter((w) =>
                !searchQuery ||
                w.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                w.description.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((widget) => {
                const Icon = widget.icon
                return (
                  <Tooltip key={widget.id}>
                    <TooltipTrigger asChild>
                      <Card className="relative overflow-hidden border-muted-foreground/10 bg-muted/20 cursor-default">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">{widget.label}</p>
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{widget.description}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Konfiguration im Cockpit unter &quot;Layout anpassen&quot;</p>
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </TooltipProvider>
          </div>
        </div>
      )}
    </div>
  )
}
