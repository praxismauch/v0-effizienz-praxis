"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, X, Plus } from "lucide-react"
import { getTypeLabel } from "@/lib/tickets/utils"

interface FilterOption {
  value: string
  label: string
}

interface TicketFiltersProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  activeTab: string
  onTabChange: (value: string) => void
  filterType: string
  onFilterTypeChange: (value: string) => void
  filterPriority: string
  onFilterPriorityChange: (value: string) => void
  sortOrder: string
  onSortOrderChange: (value: string) => void
  statusOptions: FilterOption[]
  priorityOptions: FilterOption[]
  types: string[] | undefined
  onCreateTicket: () => void
}

export function TicketFilters({
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
  filterType,
  onFilterTypeChange,
  filterPriority,
  onFilterPriorityChange,
  sortOrder,
  onSortOrderChange,
  statusOptions,
  priorityOptions,
  types,
  onCreateTicket,
}: TicketFiltersProps) {
  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Ticket durchsuchen..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button onClick={onCreateTicket} className="whitespace-nowrap">
          <Plus className="h-4 w-4 mr-2" />
          Neues Ticket
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">Status</label>
          <Select value={activeTab} onValueChange={onTabChange}>
            <SelectTrigger>
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Alle Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Status</SelectItem>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">Typ</label>
          <Select value={filterType} onValueChange={onFilterTypeChange}>
            <SelectTrigger>
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Alle Typen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Typen</SelectItem>
              {types?.map((type) => (
                <SelectItem key={type} value={type}>
                  {getTypeLabel(type)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">Priorität</label>
          <Select value={filterPriority} onValueChange={onFilterPriorityChange}>
            <SelectTrigger>
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Alle Prioritäten" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Prioritäten</SelectItem>
              {priorityOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">Sortierung</label>
          <Select value={sortOrder} onValueChange={onSortOrderChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Neueste zuerst</SelectItem>
              <SelectItem value="oldest">Älteste zuerst</SelectItem>
              <SelectItem value="priority">Nach Priorität</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
