"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Clock } from "lucide-react"
import { formatGermanNumber } from "@/lib/utils/number-format"

interface ResponsibilityCardProps {
  responsibility: any
  onEdit: (responsibility: any) => void
  onDelete: (id: string) => void
  isAdmin: boolean
  responsibilities: any[]
}

export function ResponsibilityCard({ responsibility, onEdit, onDelete, isAdmin }: ResponsibilityCardProps) {
  const isValidId =
    responsibility?.id &&
    responsibility.id.trim() !== "" &&
    responsibility.id !== "00000000-0000-0000-0000-000000000000"

  const responsiblePerson = responsibility.responsible_user_name
  const deputyPerson = responsibility.deputy_user_name

  const getCategoryColor = () => {
    if (!responsibility.group_name) return "#6366f1"

    let hash = 0
    for (let i = 0; i < responsibility.group_name.length; i++) {
      hash = responsibility.group_name.charCodeAt(i) + ((hash << 5) - hash)
    }

    const colors = ["#6366f1", "#8b5cf6", "#ec4899", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6"]

    return colors[Math.abs(hash) % colors.length]
  }

  const handleDelete = () => {
    if (!isValidId) {
      console.error("[v0] Cannot delete responsibility: Invalid or empty ID")
      return
    }
    onDelete(responsibility.id)
  }

  return (
    <Card
      className="p-4 hover:shadow-lg transition-shadow cursor-pointer group"
      onClick={() => isAdmin && onEdit(responsibility)}
    >
      <div className="space-y-3">
        {/* Header row with category indicator and title */}
        <div className="flex items-start gap-3">
          <div className="w-3 h-3 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: getCategoryColor() }} />

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg leading-tight">{responsibility.name}</h3>
          </div>

          {isAdmin && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity print:hidden flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(responsibility)
                }}
                className="h-8 w-8"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete()
                }}
                className="h-8 w-8 text-destructive hover:text-destructive"
                disabled={!isValidId}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Info row with assigned person and hours */}
        <div className="flex items-center justify-between gap-4 pl-6">
          <p className="text-sm text-muted-foreground truncate">
            {responsiblePerson || "Noch nicht zugewiesen"}
            {responsiblePerson && deputyPerson && ` • ${deputyPerson}`}
          </p>

          {responsibility.suggested_hours_per_week !== null && (
            <div className="flex items-center gap-1.5 text-primary flex-shrink-0">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">
                {formatGermanNumber(responsibility.suggested_hours_per_week)}h
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
