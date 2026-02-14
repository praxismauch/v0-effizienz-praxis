"use client"

import { Search, Star, Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { VisibleColumns } from "../contact-types"

interface ContactsToolbarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  showOnlyFavorites: boolean
  onToggleFavorites: () => void
  favoritesCount: number
  totalCount: number
  visibleColumns: VisibleColumns
  onVisibleColumnsChange: (columns: VisibleColumns) => void
}

export function ContactsToolbar({
  searchQuery,
  onSearchChange,
  showOnlyFavorites,
  onToggleFavorites,
  favoritesCount,
  totalCount,
  visibleColumns,
  onVisibleColumnsChange,
}: ContactsToolbarProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Kontakte durchsuchen..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <Button
        variant={showOnlyFavorites ? "default" : "outline"}
        size="sm"
        onClick={onToggleFavorites}
        className={showOnlyFavorites ? "bg-amber-500 hover:bg-amber-600 text-white" : ""}
      >
        <Star className={`h-4 w-4 mr-1 ${showOnlyFavorites ? "fill-current" : ""}`} />
        Favoriten {favoritesCount > 0 && `(${favoritesCount})`}
      </Button>
      <Badge variant="secondary">{totalCount} Kontakte</Badge>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <Settings2 className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Spalten anzeigen</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {(["name", "company", "contact", "address", "category"] as const).map((col) => (
            <DropdownMenuCheckboxItem
              key={col}
              checked={visibleColumns[col]}
              onCheckedChange={(checked) =>
                onVisibleColumnsChange({ ...visibleColumns, [col]: checked })
              }
            >
              {col === "name" ? "Name" : col === "company" ? "Firma" : col === "contact" ? "Kontakt" : col === "address" ? "Adresse" : "Kategorie"}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
