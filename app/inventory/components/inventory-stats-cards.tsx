"use client"

import { Package, AlertTriangle, TrendingUp } from "lucide-react"
import { StatsGrid } from "@/components/shared/stats-card"
import type { InventoryItem } from "../types"

interface InventoryStatsCardsProps {
  items: InventoryItem[]
}

export function InventoryStatsCards({ items = [] }: InventoryStatsCardsProps) {
  const totalItems = items.length
  const lowStockItems = items.filter((i) => i.current_stock <= i.reorder_point).length
  const criticalItems = items.filter((i) => i.current_stock <= i.minimum_stock).length
  const totalValue = items.reduce((sum, i) => sum + i.current_stock * (i.unit_cost || 0), 0)

  const stats = [
    {
      label: "Artikel gesamt",
      value: totalItems,
      icon: Package,
      iconColor: "text-blue-600",
      iconBgColor: "bg-blue-100",
    },
    {
      label: "Niedriger Bestand",
      value: lowStockItems,
      icon: AlertTriangle,
      iconColor: "text-amber-600",
      iconBgColor: "bg-amber-100",
    },
    {
      label: "Kritisch",
      value: criticalItems,
      icon: AlertTriangle,
      iconColor: "text-red-600",
      iconBgColor: "bg-red-100",
    },
    {
      label: "Gesamtwert",
      value: `${totalValue.toFixed(2)} €`,
      icon: TrendingUp,
      iconColor: "text-emerald-600",
      iconBgColor: "bg-emerald-100",
    },
  ]

  return <StatsGrid stats={stats} columns={4} />
}
