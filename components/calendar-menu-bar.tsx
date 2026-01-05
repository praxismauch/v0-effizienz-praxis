"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { Search, Filter, SortAsc, Calendar, Download, RefreshCw, Settings, X } from "lucide-react"
import { CalendarSubscriptionDialog } from "@/components/calendar-subscription-dialog"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface CalendarEvent {
  id: string
  title: string
  description?: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  type: string
  priority: string
  location?: string
  isAllDay: boolean
}

interface CalendarMenuBarProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  selectedTypes: string[]
  onTypesChange: (types: string[]) => void
  selectedPriorities: string[]
  onPrioritiesChange: (priorities: string[]) => void
  sortBy: string
  onSortChange: (sort: string) => void
  viewMode: string
  onViewModeChange: (mode: string) => void
  onRefresh: () => void
  totalEvents: number
  filteredEvents: number
  events?: CalendarEvent[]
}

const eventTypes = [
  { value: "meeting", label: "Besprechung", color: "bg-blue-500" },
  { value: "appointment", label: "Termin", color: "bg-green-500" },
  { value: "task", label: "Aufgabe", color: "bg-orange-500" },
  { value: "event", label: "Event", color: "bg-purple-500" },
  { value: "training", label: "Schulung", color: "bg-teal-500" },
  { value: "maintenance", label: "Wartung", color: "bg-yellow-500" },
  { value: "holiday", label: "Feiertag", color: "bg-red-500" },
  { value: "announcement", label: "Ankündigung", color: "bg-indigo-500" },
  { value: "other", label: "Sonstiges", color: "bg-gray-500" },
]

const priorities = [
  { value: "low", label: "Niedrig", color: "text-green-600" },
  { value: "medium", label: "Mittel", color: "text-yellow-600" },
  { value: "high", label: "Hoch", color: "text-red-600" },
]

const sortOptions = [
  { value: "date-asc", label: "Datum (aufsteigend)" },
  { value: "date-desc", label: "Datum (absteigend)" },
  { value: "title-asc", label: "Titel (A-Z)" },
  { value: "title-desc", label: "Titel (Z-A)" },
  { value: "priority-high", label: "Priorität (hoch zuerst)" },
  { value: "priority-low", label: "Priorität (niedrig zuerst)" },
  { value: "created-desc", label: "Zuletzt erstellt" },
]

function CalendarMenuBar({
  searchTerm,
  onSearchChange,
  selectedTypes,
  onTypesChange,
  selectedPriorities,
  onPrioritiesChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  onRefresh,
  totalEvents,
  filteredEvents,
  events = [],
}: CalendarMenuBarProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const activeFiltersCount = selectedTypes.length + selectedPriorities.length

  const clearAllFilters = () => {
    onTypesChange([])
    onPrioritiesChange([])
    onSearchChange("")
  }

  const toggleEventType = (type: string) => {
    if (selectedTypes.includes(type)) {
      onTypesChange(selectedTypes.filter((t) => t !== type))
    } else {
      onTypesChange([...selectedTypes, type])
    }
  }

  const togglePriority = (priority: string) => {
    if (selectedPriorities.includes(priority)) {
      onPrioritiesChange(selectedPriorities.filter((p) => p !== priority))
    } else {
      onPrioritiesChange([...selectedPriorities, priority])
    }
  }

  const handleExportCSV = () => {
    if (!events || events.length === 0) {
      toast({
        title: "Keine Termine",
        description: "Es gibt keine Termine zum Exportieren.",
        variant: "destructive",
      })
      return
    }

    const headers = [
      "Titel",
      "Beschreibung",
      "Startdatum",
      "Enddatum",
      "Startzeit",
      "Endzeit",
      "Typ",
      "Priorität",
      "Ort",
      "Ganztägig",
    ]

    const typeLabels: Record<string, string> = {
      meeting: "Besprechung",
      appointment: "Termin",
      task: "Aufgabe",
      event: "Event",
      training: "Schulung",
      maintenance: "Wartung",
      holiday: "Feiertag",
      announcement: "Ankündigung",
      other: "Sonstiges",
    }

    const priorityLabels: Record<string, string> = {
      low: "Niedrig",
      medium: "Mittel",
      high: "Hoch",
    }

    const formatDate = (dateStr: string) => {
      if (!dateStr) return ""
      const date = new Date(dateStr)
      return date.toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    }

    const escapeCSV = (value: string | undefined | null): string => {
      if (value === null || value === undefined) return ""
      const str = String(value)
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }

    const rows = events.map((event) => [
      escapeCSV(event.title),
      escapeCSV(event.description),
      escapeCSV(formatDate(event.startDate)),
      escapeCSV(formatDate(event.endDate)),
      escapeCSV(event.startTime),
      escapeCSV(event.endTime),
      escapeCSV(typeLabels[event.type] || event.type),
      escapeCSV(priorityLabels[event.priority] || event.priority),
      escapeCSV(event.location),
      escapeCSV(event.isAllDay ? "Ja" : "Nein"),
    ])

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

    const BOM = "\uFEFF"
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" })

    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    const today = new Date().toLocaleDateString("de-DE").replace(/\./g, "-")
    link.href = url
    link.download = `kalender-export-${today}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: "Export erfolgreich",
      description: `${events.length} Termine wurden exportiert.`,
    })
  }

  return (
    <>
      <div className="space-y-4 w-full">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-1 gap-2 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Termine durchsuchen..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                <DropdownMenuLabel>Termintypen</DropdownMenuLabel>
                {eventTypes.map((type) => (
                  <DropdownMenuCheckboxItem
                    key={type.value}
                    checked={selectedTypes.includes(type.value)}
                    onCheckedChange={() => toggleEventType(type.value)}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${type.color}`} />
                      {type.label}
                    </div>
                  </DropdownMenuCheckboxItem>
                ))}

                <DropdownMenuSeparator />
                <DropdownMenuLabel>Prioritäten</DropdownMenuLabel>
                {priorities.map((priority) => (
                  <DropdownMenuCheckboxItem
                    key={priority.value}
                    checked={selectedPriorities.includes(priority.value)}
                    onCheckedChange={() => togglePriority(priority.value)}
                  >
                    <span className={priority.color}>{priority.label}</span>
                  </DropdownMenuCheckboxItem>
                ))}

                {activeFiltersCount > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={clearAllFilters}>
                      <X className="h-4 w-4 mr-2" />
                      Alle Filter löschen
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger className="w-48">
                <SortAsc className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sortieren nach..." />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Aktionen
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onRefresh}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Aktualisieren
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Als CSV exportieren
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowSubscriptionDialog(true)}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Kalenderabonnement (iCal Sync)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/settings?tab=system")}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Kalender-Einstellungen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {(selectedTypes.length > 0 || selectedPriorities.length > 0 || searchTerm) && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-muted-foreground">Aktive Filter:</span>

            {searchTerm && (
              <Badge variant="secondary" className="gap-1">
                Suche: "{searchTerm}"
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => onSearchChange("")}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}

            {selectedTypes.map((type) => {
              const typeInfo = eventTypes.find((t) => t.value === type)
              return (
                <Badge key={type} variant="secondary" className="gap-1">
                  <div className={`w-2 h-2 rounded-full ${typeInfo?.color}`} />
                  {typeInfo?.label}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => toggleEventType(type)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )
            })}

            {selectedPriorities.map((priority) => {
              const priorityInfo = priorities.find((p) => p.value === priority)
              return (
                <Badge key={priority} variant="secondary" className="gap-1">
                  <span className={`text-xs ${priorityInfo?.color}`}>●</span>
                  {priorityInfo?.label}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => togglePriority(priority)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )
            })}

            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-6 text-xs">
                Alle löschen
              </Button>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {filteredEvents} von {totalEvents} Terminen angezeigt
          </span>
          <span>Sortiert nach: {sortOptions.find((s) => s.value === sortBy)?.label}</span>
        </div>
      </div>

      <CalendarSubscriptionDialog open={showSubscriptionDialog} onOpenChange={setShowSubscriptionDialog} />
    </>
  )
}

export default CalendarMenuBar
