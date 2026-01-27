"use client"

import { Clock, Edit, Trash2, User, ClipboardList } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatGermanNumber } from "@/lib/utils/number-format"
import type { Responsibility } from "../types"

interface ResponsibilityCardProps {
  responsibility: Responsibility
  onEdit: (r: Responsibility) => void
  onDelete: (r: Responsibility) => void
  onCreateTodo: (r: Responsibility) => void
}

export function ResponsibilityCard({
  responsibility,
  onEdit,
  onDelete,
  onCreateTodo,
}: ResponsibilityCardProps) {
  return (
    <Card
      className="group cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-200 h-full"
      onClick={() => onEdit(responsibility)}
    >
      <CardContent className="p-4 flex flex-col h-full">
        {/* Header with title and actions */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="font-semibold text-base text-foreground line-clamp-2 flex-1">
            {responsibility.name}
          </h4>
          
          {/* Edit/Delete/Todo buttons - visible on hover */}
          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              title="Aufgabe erstellen"
              onClick={(e) => {
                e.stopPropagation()
                onCreateTodo(responsibility)
              }}
            >
              <ClipboardList className="h-3.5 w-3.5 text-primary" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(responsibility)
              }}
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 hover:bg-destructive/10"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(responsibility)
              }}
            >
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
        </div>

        {/* Description */}
        {responsibility.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {responsibility.description}
          </p>
        )}

        {/* Spacer to push footer to bottom */}
        <div className="flex-1" />

        {/* Footer with assignee and hours */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t">
          {/* Assignee */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground truncate">
              {responsibility.responsible_user_name || "Nicht zugewiesen"}
            </span>
          </div>

          {/* Hours badge */}
          {responsibility.suggested_hours_per_week !== null &&
            responsibility.suggested_hours_per_week !== undefined &&
            responsibility.suggested_hours_per_week > 0 && (
              <Badge variant="secondary" className="flex-shrink-0">
                <Clock className="h-3 w-3 mr-1" />
                {formatGermanNumber(responsibility.suggested_hours_per_week)}h/W
              </Badge>
            )}
        </div>

        {/* Practice goal indicator */}
        {responsibility.is_practice_goal && (
          <Badge className="mt-2 bg-amber-500 hover:bg-amber-600 text-white">
            Persönliches Praxisziel
          </Badge>
        )}

        {/* Joint execution indicator */}
        {responsibility.joint_execution && (
          <Badge className="mt-2 bg-blue-500 hover:bg-blue-600 text-white">
            Gemeinsame Durchführung
          </Badge>
        )}
      </CardContent>
    </Card>
  )
}
