"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Package, Plus, Search, MoreVertical, Edit, Trash2, PackageMinus } from "lucide-react"
import type { InventoryItem } from "../types"
import { CATEGORIES, URGENCY_COLORS } from "../types"

interface InventoryListTabProps {
  items: InventoryItem[]
  loading: boolean
  searchQuery: string
  categoryFilter: string
  onSearchChange: (query: string) => void
  onCategoryChange: (category: string) => void
  onCreateItem: () => void
  onEditItem: (item: InventoryItem) => void
  onDeleteItem: (item: InventoryItem) => void
  onConsumeItem: (item: InventoryItem) => void
}

export function InventoryListTab({
  items,
  loading,
  searchQuery,
  categoryFilter,
  onSearchChange,
  onCategoryChange,
  onCreateItem,
  onEditItem,
  onDeleteItem,
  onConsumeItem,
}: InventoryListTabProps) {
  const filteredItems = items.filter((item) => {
    const matchesSearch = !searchQuery || item.name?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Bestandsliste</CardTitle>
            <CardDescription>Alle Materialien und Verbrauchsgüter</CardDescription>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Suchen..."
                value={searchQuery || ""}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={categoryFilter} onValueChange={onCategoryChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Kategorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Kategorien</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">Keine Artikel gefunden</h3>
            <p className="text-muted-foreground max-w-md">
              Erstellen Sie Ihren ersten Bestandsartikel, um mit der Inventarverwaltung zu beginnen.
            </p>
            <Button variant="outline" className="mt-4 bg-transparent" onClick={onCreateItem}>
              <Plus className="mr-2 h-4 w-4" />
              Ersten Artikel anlegen
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6 px-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px]">Artikel</TableHead>
                  <TableHead className="min-w-[120px]">Kategorie</TableHead>
                  <TableHead className="text-center min-w-[100px]">Bestand</TableHead>
                  <TableHead className="text-center min-w-[80px]">Status</TableHead>
                  <TableHead className="text-right min-w-[100px]">Stückpreis</TableHead>
                  <TableHead className="text-right min-w-[80px]">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => {
                  const stockPercent = Math.round((item.current_stock / item.optimal_stock) * 100)
                  const isCritical = item.current_stock <= item.minimum_stock
                  const isLow = item.current_stock <= item.reorder_point
                  const category = CATEGORIES.find((c) => c.value === item.category)

                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          {item.sku && <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {category?.icon} {category?.label || item.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-medium">
                            {item.current_stock} {item.unit}
                          </span>
                          <Progress
                            value={stockPercent}
                            className={`w-16 h-1.5 ${isCritical ? "[&>div]:bg-red-500" : isLow ? "[&>div]:bg-amber-500" : "[&>div]:bg-emerald-500"}`}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={isCritical ? URGENCY_COLORS.critical : isLow ? URGENCY_COLORS.high : URGENCY_COLORS.low}
                        >
                          {isCritical ? "Kritisch" : isLow ? "Niedrig" : "OK"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{item.unit_cost ? `${item.unit_cost.toFixed(2)} €` : "-"}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onConsumeItem(item)}>
                              <PackageMinus className="mr-2 h-4 w-4" />
                              Verbrauch erfassen
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEditItem(item)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Bearbeiten
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onDeleteItem(item)} className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Löschen
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
