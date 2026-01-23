"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Package, AlertTriangle, ShoppingCart, TrendingUp } from "lucide-react"

interface InventoryStatsCardsProps {
  items: any[]
  loading: boolean
}

export function InventoryStatsCards({ items, loading }: InventoryStatsCardsProps) {
  const stats = {
    totalItems: items.length,
    lowStock: items.filter((item) => {
      const minStock = item.min_stock || 5
      return item.current_stock <= minStock && item.current_stock > 0
    }).length,
    critical: items.filter((item) => item.current_stock === 0).length,
    totalValue: items.reduce((sum, item) => sum + (item.current_stock || 0) * (item.price || 0), 0),
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Artikel gesamt</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalItems}</div>
          <p className="text-xs text-muted-foreground">verschiedene Artikel im Bestand</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Niedriger Bestand</CardTitle>
          <AlertTriangle className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-600">{stats.lowStock}</div>
          <p className="text-xs text-muted-foreground">Artikel unter Mindestbestand</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Kritisch</CardTitle>
          <ShoppingCart className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
          <p className="text-xs text-muted-foreground">Artikel nicht verfügbar</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Bestandswert</CardTitle>
          <TrendingUp className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-600">{stats.totalValue.toFixed(2)} €</div>
          <p className="text-xs text-muted-foreground">Gesamtwert des Inventars</p>
        </CardContent>
      </Card>
    </div>
  )
}
