"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  Filter,
  SortAsc,
  SortDesc,
  User,
  AlertTriangle,
  CheckCircle2,
  Plus,
  MoreHorizontal,
  Archive,
  Download,
  RefreshCw,
  Sparkles,
} from "lucide-react"

interface TodoMenuBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedPriorities: string[]
  onPriorityChange: (priorities: string[]) => void
  selectedAssignees: string[]
  onAssigneeChange: (assignees: string[]) => void
  sortBy: string
  onSortChange: (sort: string) => void
  sortOrder: "asc" | "desc"
  onSortOrderChange: (order: "asc" | "desc") => void
  showCompleted: boolean
  onShowCompletedChange: (show: boolean) => void
  showOverdue: boolean
  onShowOverdueChange: (show: boolean) => void
  onCreateTodo: () => void
  onBulkArchive?: () => void
  onExportTodos?: () => void
  onRefresh?: () => void
  availableAssignees: string[]
  activeFiltersCount: number
  onClearFilters: () => void
  onAiGenerate?: () => void
  viewMode?: "list" | "kanban" | "matrix"
  onViewModeChange?: (mode: "list" | "kanban" | "matrix") => void
}

function TodoMenuBar({
  searchQuery,
  onSearchChange,
  selectedPriorities,
  onPriorityChange,
  selectedAssignees,
  onAssigneeChange,
  sortBy,
  onSortChange,
  sortOrder,
  onSortOrderChange,
  showCompleted,
  onShowCompletedChange,
  showOverdue,
  onShowOverdueChange,
  onCreateTodo,
  onBulkArchive,
  onExportTodos,
  onRefresh,
  availableAssignees,
  activeFiltersCount,
  onClearFilters,
  onAiGenerate,
  viewMode = "list",
  onViewModeChange,
}: TodoMenuBarProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const handlePriorityToggle = (priority: string) => {
    const updated = selectedPriorities.includes(priority)
      ? selectedPriorities.filter((p) => p !== priority)
      : [...selectedPriorities, priority]
    onPriorityChange(updated)
  }

  const handleAssigneeToggle = (assignee: string) => {
    const updated = selectedAssignees.includes(assignee)
      ? selectedAssignees.filter((a) => a !== assignee)
      : [...selectedAssignees, assignee]
    onAssigneeChange(updated)
  }

  return (
    <div className="space-y-4">
      {/* Action Buttons Row */}
      <div className="flex items-center justify-between gap-4">
        {/* AI Suggestions Button */}
        {onAiGenerate && (
          <Button
            onClick={onAiGenerate}
            className="gap-2 bg-gradient-to-r from-purple-500/90 to-indigo-500/90 hover:from-purple-600 hover:to-indigo-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300"
          >
            <Sparkles className="h-4 w-4" />
            <span className="font-semibold">KI Vorschläge</span>
          </Button>
        )}

        {/* Create Todo Button */}
        <Button
          onClick={onCreateTodo}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Neue Aufgabe
        </Button>

        {/* Action Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" type="button">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Aktualisieren
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExportTodos}>
              <Download className="h-4 w-4 mr-2" />
              Aufgaben exportieren
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onBulkArchive}>
              <Archive className="h-4 w-4 mr-2" />
              Abgeschlossene archivieren
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Aufgaben suchen..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2">
            <Button
              variant={showOverdue ? "default" : "outline"}
              size="sm"
              onClick={() => onShowOverdueChange(!showOverdue)}
              className="gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              Überfällig
            </Button>

            <Button
              variant={showCompleted ? "default" : "outline"}
              size="sm"
              onClick={() => onShowCompletedChange(!showCompleted)}
              className="gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Abgeschlossen
            </Button>
          </div>

          {/* Advanced Filters */}
          <DropdownMenu open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 bg-transparent" type="button">
                <Filter className="h-4 w-4" />
                Filter
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Nach Priorität filtern</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={selectedPriorities.includes("high")}
                onCheckedChange={() => handlePriorityToggle("high")}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  Hohe Priorität
                </div>
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedPriorities.includes("medium")}
                onCheckedChange={() => handlePriorityToggle("medium")}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  Mittlere Priorität
                </div>
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedPriorities.includes("low")}
                onCheckedChange={() => handlePriorityToggle("low")}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  Niedrige Priorität
                </div>
              </DropdownMenuCheckboxItem>

              <DropdownMenuSeparator />
              <DropdownMenuLabel>Nach Zugewiesenem filtern</DropdownMenuLabel>
              {availableAssignees.map((assignee) => (
                <DropdownMenuCheckboxItem
                  key={assignee}
                  checked={selectedAssignees.includes(assignee)}
                  onCheckedChange={() => handleAssigneeToggle(assignee)}
                >
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3" />
                    {assignee}
                  </div>
                </DropdownMenuCheckboxItem>
              ))}

              {activeFiltersCount > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onClearFilters}>Alle Filter löschen</DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="title">Titel</SelectItem>
              <SelectItem value="priority">Priorität</SelectItem>
              <SelectItem value="dueDate">Fälligkeitsdatum</SelectItem>
              <SelectItem value="assignedTo">Zugewiesen</SelectItem>
              <SelectItem value="createdAt">Erstellt</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={() => onSortOrderChange(sortOrder === "asc" ? "desc" : "asc")}>
            {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Aktive Filter:</span>

          {selectedPriorities.map((priority) => (
            <Badge key={priority} variant="secondary" className="gap-1">
              Priorität: {priority === "high" ? "Hoch" : priority === "medium" ? "Mittel" : "Niedrig"}
              <button
                onClick={() => handlePriorityToggle(priority)}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                ×
              </button>
            </Badge>
          ))}

          {selectedAssignees.map((assignee) => (
            <Badge key={assignee} variant="secondary" className="gap-1">
              Zugewiesen: {assignee}
              <button
                onClick={() => handleAssigneeToggle(assignee)}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                ×
              </button>
            </Badge>
          ))}

          {showOverdue && (
            <Badge variant="secondary" className="gap-1">
              Nur überfällige
              <button
                onClick={() => onShowOverdueChange(false)}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                ×
              </button>
            </Badge>
          )}

          {showCompleted && (
            <Badge variant="secondary" className="gap-1">
              Abgeschlossene einschließen
              <button
                onClick={() => onShowCompletedChange(false)}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                ×
              </button>
            </Badge>
          )}

          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            Alle löschen
          </Button>
        </div>
      )}
    </div>
  )
}

export default TodoMenuBar
