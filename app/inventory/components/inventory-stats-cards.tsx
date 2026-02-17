"use client"

import { Package, AlertTriangle, TrendingUp } from "lucide-react"
import { StatCard, statCardColors } from "@/components/ui/stat-card"
import type { InventoryItem } from "../types"

interface InventoryStatsCardsProps {
  items: InventoryItem[]
}

export function InventoryStatsCards({ items = [] }: InventoryStatsCardsProps) {
  const totalItems = items.length
  const lowStockItems = items.filter((i) => i.current_stock <= i.reorder_point).length
  const criticalItems = items.filter((i) => i.current_stock <= i.minimum_stock).length
  const totalValue = items.reduce((sum, i) => sum + i.current_stock * (i.unit_cost || 0), 0)

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Artikel gesamt"
        value={totalItems}
        icon={Package}
        {...statCardColors.blue}
      />
      <StatCard
        label="Niedriger Bestand"
        value={lowStockItems}
        icon={AlertTriangle}
        {...statCardColors.amber}
      />
      <StatCard
        label="Kritisch"
        value={criticalItems}
        icon={AlertTriangle}
        {...statCardColors.red}
      />
      <StatCard
        label="Gesamtwert"
        value={`${totalValue.toFixed(2)} \u20AC`}
        icon={TrendingUp}
        {...statCardColors.green}
      />
    </div>
  )
}
