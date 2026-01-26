"use client"

import { Clock, Edit, Trash2, User, ClipboardList, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { formatGermanNumber } from "@/lib/utils/number-format"
import type { Responsibility } from "../types"

interface SortableItemProps {
  responsibility: Responsibility
  onEdit: (responsibility: Responsibility) => void
  onDelete: (responsibility: Responsibility) => void
  onCreateTodo: (responsibility: Responsibility) => void
  viewMode: "list" | "grid"
}

export function SortableResponsibilityItem({ 
  responsibility, 
  onEdit, 
  onDelete, 
  onCreateTodo, 
}: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: responsibility.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 py-3 first:pt-0">
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1 flex items-center justify-between">
        <div className="flex-1">
          <div className="font-medium">{responsibility.name}</div>
          {responsibility.description && (
            <p className="text-sm text-muted-foreground line-clamp-1">{responsibility.description}</p>
          )}
          <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
            {responsibility.responsible_user_name && (
              <Badge variant="outline">
                <User className="h-3 w-3 mr-1" />
                {responsibility.responsible_user_name}
              </Badge>
            )}
            {responsibility.suggested_hours_per_week && (
              <Badge variant="outline">
                <Clock className="h-3 w-3 mr-1" />
                {formatGermanNumber(responsibility.suggested_hours_per_week)}h/W
              </Badge>
            )}
            {responsibility.cannot_complete_during_consultation && (
              <Badge
                variant="secondary"
                className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
              >
                <Clock className="h-3 w-3 mr-1" />
                Außerhalb der Sprechstunde
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => onEdit(responsibility)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(responsibility)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onCreateTodo(responsibility)}>
            <ClipboardList className="h-4 w-4 text-primary" />
          </Button>
        </div>
      </div>
    </div>
  )
}
