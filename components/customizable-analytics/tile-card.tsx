"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2, LayoutDashboard } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DashboardTile } from "./types"

function getTileColorClasses(color: DashboardTile["color"]) {
  const colors = {
    default: "bg-card border-border",
    blue: "bg-blue-500/10 border-blue-500/30",
    green: "bg-green-500/10 border-green-500/30",
    yellow: "bg-yellow-500/10 border-yellow-500/30",
    red: "bg-red-500/10 border-red-500/30",
    purple: "bg-purple-500/10 border-purple-500/30",
  }
  return colors[color]
}

function getTileSizeClasses(size: DashboardTile["size"]) {
  const sizes = { small: "col-span-1", medium: "col-span-2", large: "col-span-3" }
  return sizes[size]
}

interface TileCardProps {
  tile: DashboardTile
  onEdit: (tile: DashboardTile) => void
  onDelete: (id: string) => void
  onToggleDashboard: (id: string) => void
}

export function TileCard({ tile, onEdit, onDelete, onToggleDashboard }: TileCardProps) {
  return (
    <Card className={cn("relative group transition-all", getTileColorClasses(tile.color), getTileSizeClasses(tile.size))}>
      <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(tile)} title="Bearbeiten">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-7 w-7", tile.showOnDashboard && "text-primary")}
          onClick={() => onToggleDashboard(tile.id)}
          title={tile.showOnDashboard ? "Vom Dashboard entfernen" : "Zum Dashboard hinzufügen"}
        >
          <LayoutDashboard className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive"
          onClick={() => onDelete(tile.id)}
          title="Loschen"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{tile.title}</CardTitle>
        {tile.description && <CardDescription className="text-xs">{tile.description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">{tile.value || "\u2014"}</span>
          {tile.unit && <span className="text-sm text-muted-foreground">{tile.unit}</span>}
        </div>
        {tile.trend && (
          <div
            className={cn(
              "text-xs mt-1",
              tile.trend === "up" && "text-green-600",
              tile.trend === "down" && "text-red-600",
              tile.trend === "neutral" && "text-muted-foreground",
            )}
          >
            {tile.trend === "up" && "\u2191"}
            {tile.trend === "down" && "\u2193"}
            {tile.trend === "neutral" && "\u2192"} {tile.trendValue}
          </div>
        )}
        {tile.showOnDashboard && (
          <Badge variant="outline" className="mt-2 text-xs">
            Im Dashboard
          </Badge>
        )}
      </CardContent>
    </Card>
  )
}
