"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, AlertTriangle, TrendingUp } from "lucide-react"
import type { InventoryItem } from "../types"

interface InventoryStatsCardsProps {
  items: InventoryItem[]
}

export function InventoryStatsCards({ items }: InventoryStatsCardsProps) {
  const totalItems = items.length
  const lowStockItems = items.filter((i) => i.current_stock <= i.reorder_point).length
  const criticalItems = items.filter((i) => i.current_stock <= i.minimum_stock).length
  const totalValue = items.reduce((sum, i) => sum + i.current_stock * (i.unit_cost || 0), 0)

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Artikel gesamt</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-500" />
            <span className="text-2xl font-bold">{totalItems}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Niedriger Bestand</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <span className="text-2xl font-bold">{lowStockItems}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Kritisch</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <span className="text-2xl font-bold">{criticalItems}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Gesamtwert</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            <span className="text-2xl font-bold">{totalValue.toFixed(2)} €</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
