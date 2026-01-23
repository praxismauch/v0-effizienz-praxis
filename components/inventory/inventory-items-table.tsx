"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, Edit, Trash2, PackageMinus, Package } from "lucide-react"

const CATEGORIES = [
  { value: "medical", label: "Medizinisch", icon: "🏥" },
  { value: "office", label: "Büro", icon: "📎" },
  { value: "hygiene", label: "Hygiene", icon: "🧴" },
  { value: "equipment", label: "Geräte", icon: "⚙️" },
  { value: "lab", label: "Labor", icon: "🔬" },
  { value: "general", label: "Allgemein", icon: "📦" },
]

const URGENCY_COLORS: Record<string, string> = {
  critical: "bg-red-100 text-red-800 border-red-200",
  high: "bg-amber-100 text-amber-800 border-amber-200",
  medium: "bg-blue-100 text-blue-800 border-blue-200",
  low: "bg-emerald-100 text-emerald-800 border-emerald-200",
}

interface InventoryItemsTableProps {
  items: any[]
  loading: boolean
  searchTerm: string
  categoryFilter: string
  onConsume: (item: any) => void
  onEdit: (item: any) => void
  onDelete: (item: any) => void
}

export function InventoryItemsTable({
  items,
  loading,
  searchTerm,
  categoryFilter,
  onConsume,
  onEdit,
  onDelete,
}: InventoryItemsTableProps) {
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const getCategoryInfo = (category: string) => {
    return CATEGORIES.find((c) => c.value === category) || CATEGORIES[5]
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
            <Skeleton className="h-10 w-10 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
    )
  }

  if (filteredItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Package className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">Keine Artikel gefunden</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {searchTerm || categoryFilter !== "all"
            ? "Versuchen Sie andere Suchkriterien"
            : "Fügen Sie Ihren ersten Artikel hinzu"}
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Artikel</TableHead>
            <TableHead>Kategorie</TableHead>
            <TableHead className="text-center">Bestand</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="text-right">Stückpreis</TableHead>
            <TableHead className="text-right">Aktionen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredItems.map((item) => {
            const minStock = item.min_stock || 5
            const maxStock = item.max_stock || 50
            const stockPercent = Math.min(100, (item.current_stock / maxStock) * 100)
            const isLow = item.current_stock <= minStock && item.current_stock > 0
            const isCritical = item.current_stock === 0
            const categoryInfo = getCategoryInfo(item.category)

            return (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-lg">
                      {categoryInfo.icon}
                    </div>
                    <div>
                      <p className="font-medium">{item.name}</p>
                      {item.barcode && <p className="text-xs text-muted-foreground">{item.barcode}</p>}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{categoryInfo.label}</Badge>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <span className={`font-medium ${isCritical ? "text-red-600" : isLow ? "text-amber-600" : ""}`}>
                      {item.current_stock} {item.unit || "Stk"}
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
                    className={
                      isCritical ? URGENCY_COLORS.critical : isLow ? URGENCY_COLORS.high : URGENCY_COLORS.low
                    }
                  >
                    {isCritical ? "Kritisch" : isLow ? "Niedrig" : "OK"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {item.price ? `${item.price.toFixed(2)} €` : "-"}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onConsume(item)}>
                        <PackageMinus className="mr-2 h-4 w-4" />
                        Verbrauch erfassen
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(item)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Bearbeiten
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onDelete(item)} className="text-destructive">
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
  )
}
