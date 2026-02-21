"use client"

import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, Edit, Trash2 } from "lucide-react"
import { cn, formatDateDE } from "@/lib/utils"
import { statusConfig, isOverdue, type TodoCardProps } from "./todo-card-utils"

export function TodoCompactView({
  todo,
  teamMembers,
  onStatusChange,
  onEdit,
  onDelete,
  isDragging = false,
  onDragStart,
  onDragEnd,
  index,
}: TodoCardProps) {
  const handleDragStart = (e: React.DragEvent) => {
    if (onDragStart) onDragStart(e, todo, index)
  }

  const currentStatus = (todo.status || "offen") as keyof typeof statusConfig
  const statusInfo = statusConfig[currentStatus] || statusConfig.offen
  const overdue = isOverdue(todo.due_date || null, todo.status)
  const assignee = todo.assigned_to
    ? teamMembers?.find((m) => m.id === todo.assigned_to)
    : undefined

  return (
    <Card
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        "p-4 cursor-move transition-all duration-200 bg-white dark:bg-slate-900",
        isDragging ? "opacity-50 scale-95 rotate-2 shadow-2xl" : "hover:shadow-md hover:scale-[1.02]"
      )}
    >
      {/* Left priority bar */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-0.5",
          todo.priority === "high" && "bg-destructive",
          todo.priority === "medium" && "bg-warning",
          todo.priority === "low" && "bg-success",
        )}
      />

      <CardContent className="p-3 pl-3.5">
        <div className="space-y-2">
          {/* Header */}
          <div className="flex items-start gap-2">
            <Checkbox
              checked={todo.status === "erledigt"}
              onCheckedChange={(checked) =>
                onStatusChange(todo.id, checked ? "erledigt" : "offen")
              }
              className="mt-0.5 h-4 w-4"
            />
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "font-medium text-sm line-clamp-2 text-foreground leading-snug",
                  todo.status === "erledigt" && "line-through text-muted-foreground"
                )}
              >
                {todo.title}
              </p>
              {todo.description && (
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                  {todo.description}
                </p>
              )}
            </div>
          </div>

          {/* Compact metadata */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Select
              value={todo.status}
              onValueChange={(value) => onStatusChange(todo.id, value)}
            >
              <SelectTrigger className={cn(
                "h-7 w-[140px] rounded-full px-2 py-0.5 text-[10px] font-medium border-0",
                statusInfo.bgColor,
                statusInfo.textColor
              )}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="offen">Offen</SelectItem>
                <SelectItem value="in_bearbeitung">In Bearbeitung</SelectItem>
                <SelectItem value="erledigt">Erledigt</SelectItem>
                <SelectItem value="abgebrochen">Abgebrochen</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onEdit(todo)}>
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-red-600 hover:bg-red-100 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-300"
              onClick={() => onDelete(todo.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Due date + assignee */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {todo.due_date && (
              <Badge
                variant="outline"
                className={cn(
                  "gap-1 text-[10px] h-5 border",
                  overdue
                    ? "bg-destructive/10 text-destructive border-destructive/20"
                    : "bg-secondary text-muted-foreground border-border"
                )}
              >
                <Calendar className="h-2.5 w-2.5" />
                {formatDateDE(new Date(todo.due_date))}
              </Badge>
            )}
            {assignee && (
              <Avatar className="h-5 w-5">
                {assignee.avatar_url && <AvatarImage src={assignee.avatar_url} />}
                <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                  {(assignee.name || assignee.email || "?").substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
