"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Clock, User, Users, Building2 } from "lucide-react"
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

  const getCategoryStyles = () => {
    const categoryName = responsibility.category || responsibility.group_name
    if (!categoryName) {
      return {
        color: "#6366f1",
        bg: "bg-indigo-500",
        gradient: "from-indigo-50 to-indigo-100/50",
        text: "text-indigo-700",
        border: "border-l-indigo-500",
      }
    }

    let hash = 0
    for (let i = 0; i < categoryName.length; i++) {
      hash = categoryName.charCodeAt(i) + ((hash << 5) - hash)
    }

    const styles = [
      {
        color: "#6366f1",
        bg: "bg-indigo-500",
        gradient: "from-indigo-50 to-indigo-100/50",
        text: "text-indigo-700",
        border: "border-l-indigo-500",
      },
      {
        color: "#8b5cf6",
        bg: "bg-violet-500",
        gradient: "from-violet-50 to-violet-100/50",
        text: "text-violet-700",
        border: "border-l-violet-500",
      },
      {
        color: "#ec4899",
        bg: "bg-pink-500",
        gradient: "from-pink-50 to-pink-100/50",
        text: "text-pink-700",
        border: "border-l-pink-500",
      },
      {
        color: "#f97316",
        bg: "bg-orange-500",
        gradient: "from-orange-50 to-orange-100/50",
        text: "text-orange-700",
        border: "border-l-orange-500",
      },
      {
        color: "#eab308",
        bg: "bg-yellow-500",
        gradient: "from-yellow-50 to-yellow-100/50",
        text: "text-yellow-700",
        border: "border-l-yellow-500",
      },
      {
        color: "#22c55e",
        bg: "bg-emerald-500",
        gradient: "from-emerald-50 to-emerald-100/50",
        text: "text-emerald-700",
        border: "border-l-emerald-500",
      },
      {
        color: "#06b6d4",
        bg: "bg-cyan-500",
        gradient: "from-cyan-50 to-cyan-100/50",
        text: "text-cyan-700",
        border: "border-l-cyan-500",
      },
      {
        color: "#3b82f6",
        bg: "bg-blue-500",
        gradient: "from-blue-50 to-blue-100/50",
        text: "text-blue-700",
        border: "border-l-blue-500",
      },
    ]

    return styles[Math.abs(hash) % styles.length]
  }

  const categoryStyles = getCategoryStyles()

  const handleDelete = () => {
    if (!isValidId) {
      console.error("[v0] Cannot delete responsibility: Invalid or empty ID")
      return
    }
    onDelete(responsibility.id)
  }

  return (
    <Card
      className={`group overflow-hidden border-l-4 ${categoryStyles.border} hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 ${isAdmin ? "cursor-pointer" : ""}`}
      onClick={() => isAdmin && onEdit(responsibility)}
    >
      {/* Gradient header background */}
      <div className={`bg-gradient-to-r ${categoryStyles.gradient} px-4 pt-4 pb-3`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            {/* Category icon container */}
            <div
              className={`w-10 h-10 rounded-xl ${categoryStyles.bg} bg-opacity-15 flex items-center justify-center flex-shrink-0`}
            >
              <div className={`w-3 h-3 rounded-full ${categoryStyles.bg} shadow-sm`} />
            </div>

            <div className="min-w-0 flex-1">
              {/* Title - full width */}
              <h3 className="font-semibold text-base text-foreground leading-tight line-clamp-2">
                {responsibility.name}
              </h3>

              {/* Category/Group badge */}
              {(responsibility.category || responsibility.group_name) && (
                <span
                  className={`inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${categoryStyles.bg} bg-opacity-15 ${categoryStyles.text}`}
                >
                  {responsibility.category || responsibility.group_name}
                </span>
              )}
            </div>
          </div>

          {isAdmin && (
            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity print:hidden flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(responsibility)
                }}
                className="h-8 w-8 hover:bg-white/80"
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
                className="h-8 w-8 hover:bg-destructive/10 text-destructive hover:text-destructive"
                disabled={!isValidId}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Content section */}
      <div className="px-4 py-3 bg-card">
        <div className="flex items-center justify-between gap-4">
          {/* Assignee info */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              {deputyPerson ? (
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <User className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </div>
            <span className="text-sm text-muted-foreground truncate">
              {responsiblePerson || "Noch nicht zugewiesen"}
              {responsiblePerson && deputyPerson && <span className="text-xs opacity-75"> + {deputyPerson}</span>}
            </span>
          </div>

          {/* Hours badge */}
          {responsibility.suggested_hours_per_week !== null &&
            responsibility.suggested_hours_per_week !== undefined &&
            responsibility.suggested_hours_per_week > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 flex-shrink-0">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <span className="text-sm font-semibold text-primary">
                  {formatGermanNumber(responsibility.suggested_hours_per_week)}h
                </span>
              </div>
            )}
        </div>

        {/* Arbeitsplätze if assigned */}
        {responsibility.arbeitsplatz_names && responsibility.arbeitsplatz_names.length > 0 && (
          <div className="flex items-center gap-1.5 mt-2">
            <Building2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <span className="text-xs text-muted-foreground truncate">
              {responsibility.arbeitsplatz_names.join(", ")}
            </span>
          </div>
        )}

        {/* Description preview if exists */}
        {responsibility.description && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
            {responsibility.description}
          </p>
        )}
      </div>
    </Card>
  )
}
