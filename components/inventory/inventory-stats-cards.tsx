"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"
import { Package, AlertTriangle, ShoppingCart, TrendingUp } from "lucide-react"
import { StatCard, statCardColors } from "@/components/ui/stat-card"

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
          <Card key={i} className="p-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-12" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Artikel gesamt"
        value={stats.totalItems}
        icon={Package}
        {...statCardColors.primary}
        description="verschiedene Artikel im Bestand"
      />
      <StatCard
        label="Niedriger Bestand"
        value={stats.lowStock}
        icon={AlertTriangle}
        {...statCardColors.amber}
        description="Artikel unter Mindestbestand"
      />
      <StatCard
        label="Kritisch"
        value={stats.critical}
        icon={ShoppingCart}
        {...statCardColors.red}
        description="Artikel nicht verfügbar"
      />
      <StatCard
        label="Bestandswert"
        value={`${stats.totalValue.toFixed(2)} €`}
        icon={TrendingUp}
        {...statCardColors.green}
        description="Gesamtwert des Inventars"
      />
    </div>
  )
}
