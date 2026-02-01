"use client"

import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Calendar,
  Clock,
  Paperclip,
  LinkIcon,
  FileText,
  GripVertical,
  Edit,
  Trash2,
} from "lucide-react"
import { cn, formatDateDE } from "@/lib/utils"
import type { Todo, TodoAttachment } from "@/contexts/todo-context"

interface TeamMember {
  id: string
  name?: string
  email?: string
  avatar_url?: string
}

interface TodoCardProps {
  todo: Todo
  teamMembers: TeamMember[]
  onStatusChange: (todoId: string, status: string) => void
  onEdit: (todo: Todo) => void
  onDelete: (todoId: string) => void
  viewMode?: "list" | "kanban" | "matrix"
  draggable?: boolean
  isDragging?: boolean
  isDragOver?: boolean
  onDragStart?: (e: React.DragEvent, todo: Todo, index?: number) => void
  onDragOver?: (e: React.DragEvent, index?: number) => void
  onDrop?: (e: React.DragEvent, index?: number) => void
  onDragEnd?: (e: React.DragEvent) => void
  index?: number
  sortBy?: string
}

export function TodoCard({
  todo,
  teamMembers,
  onStatusChange,
  onEdit,
  onDelete,
  viewMode = "list",
  draggable = false,
  isDragging = false,
  isDragOver = false,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  index,
  sortBy,
}: TodoCardProps) {
  const isOverdue = (dueDate: string | null, status?: string) => {
    if (!dueDate || status === "erledigt") return false
    return new Date(dueDate) < new Date()
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high":
        return "Hoch"
      case "medium":
        return "Mittel"
      case "low":
        return "Niedrig"
      default:
        return priority
    }
  }

  const handleDragStart = (e: React.DragEvent) => {
    if (onDragStart) {
      onDragStart(e, todo, index)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    if (onDragOver) {
      onDragOver(e, index)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    if (onDrop) {
      onDrop(e, index)
    }
  }

  if (viewMode === "list") {
    return (
      <Card
        draggable={draggable}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDragEnd={onDragEnd}
        className={cn(
          "group hover:shadow-md transition-all",
          todo.status === "erledigt" && "opacity-60",
          draggable && "cursor-grab active:cursor-grabbing",
          isDragging && "opacity-50 scale-105 rotate-1 shadow-xl",
          isDragOver && draggable && "border-2 border-primary ring-2 ring-primary/20"
        )}
      >
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            <Checkbox
              checked={todo.status === "erledigt"}
              onCheckedChange={(checked) => onStatusChange(todo.id, checked ? "erledigt" : "offen")}
              className="mt-1"
            />

            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "font-medium text-base",
                      todo.status === "erledigt" && "line-through text-muted-foreground"
                    )}
                  >
                    {todo.title}
                  </p>
                  {todo.description && (
                    <p className="text-sm text-muted-foreground">{todo.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Select
                    value={todo.status || "offen"}
                    onValueChange={(value) => onStatusChange(todo.id, value)}
                  >
                    <SelectTrigger className="h-8 w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="offen">Offen</SelectItem>
                      <SelectItem value="in_bearbeitung">In Bearbeitung</SelectItem>
                      <SelectItem value="erledigt">Erledigt</SelectItem>
                      <SelectItem value="abgebrochen">Abgebrochen</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => onEdit(todo)}
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-red-600 hover:bg-red-100 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-300"
                    onClick={() => onDelete(todo.id)}
                    title="Aufgabe löschen"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <TodoMetadata
                todo={todo}
                teamMembers={teamMembers}
                isOverdue={isOverdue}
                getPriorityLabel={getPriorityLabel}
              />

              <TodoAttachments attachments={todo.attachments} />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Kanban/Matrix view (compact card)
  return (
    <Card
      draggable={true}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        "group p-4 cursor-move transition-all duration-200 bg-white dark:bg-slate-900",
        isDragging ? "opacity-50 scale-95 rotate-2 shadow-2xl" : "hover:shadow-md hover:scale-[1.02]"
      )}
    >
      <CardContent className="p-3 space-y-2">
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <Checkbox
              checked={todo.status === "erledigt"}
              onCheckedChange={(checked) => onStatusChange(todo.id, checked ? "erledigt" : "offen")}
              className="mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "font-medium text-base line-clamp-2",
                  todo.status === "erledigt" && "line-through text-muted-foreground"
                )}
              >
                {todo.title}
              </p>
              {todo.description && (
                <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                  {todo.description}
                </p>
              )}
            </div>
            {/* Edit/Delete icons visible on hover */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 hover:bg-muted"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(todo)
                }}
                title="Bearbeiten"
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-red-600 hover:bg-red-100 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-300"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(todo.id)
                }}
                title="Löschen"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-1 pl-6">
            <Select
              value={todo.status || "offen"}
              onValueChange={(value) => onStatusChange(todo.id, value)}
            >
              <SelectTrigger className="h-7 w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="offen">Offen</SelectItem>
                <SelectItem value="in_bearbeitung">In Bearbeitung</SelectItem>
                <SelectItem value="erledigt">Erledigt</SelectItem>
                <SelectItem value="abgebrochen">Abgebrochen</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <TodoMetadata
            todo={todo}
            teamMembers={teamMembers}
            isOverdue={isOverdue}
            getPriorityLabel={getPriorityLabel}
            compact
          />
        </div>
      </CardContent>
    </Card>
  )
}

// Reusable metadata component
function TodoMetadata({
  todo,
  teamMembers,
  isOverdue,
  getPriorityLabel,
  compact = false,
}: {
  todo: Todo
  teamMembers: TeamMember[]
  isOverdue: (dueDate: string | null, status?: string) => boolean
  getPriorityLabel: (priority: string) => string
  compact?: boolean
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", compact && "pl-6")}>
      <Badge
        className={cn(
          "gap-1 text-xs text-white",
          todo.priority === "high" && "bg-red-500",
          todo.priority === "medium" && "bg-yellow-500",
          todo.priority === "low" && "bg-green-500",
          !["high", "medium", "low"].includes(todo.priority) && "bg-slate-500",
          todo.status === "erledigt" && "opacity-60"
        )}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-white" />
        {getPriorityLabel(todo.priority)}
      </Badge>

      {todo.due_date && (
        <div className="flex items-center gap-1">
          <Calendar
            className={cn(
              "h-3 w-3",
              isOverdue(todo.due_date, todo.status) && todo.status !== "erledigt" && "text-red-500",
              todo.status === "erledigt" && "opacity-60"
            )}
          />
          <span
            className={cn(
              "text-xs",
              isOverdue(todo.due_date, todo.status) &&
                todo.status !== "erledigt" &&
                "text-red-500 font-semibold",
              todo.status === "erledigt" && "opacity-60"
            )}
          >
            {formatDateDE(new Date(todo.due_date))}
          </span>
        </div>
      )}

      {/* Assigned users */}
      {todo.assigned_user_ids && todo.assigned_user_ids.length > 0 && (
        <div className="flex -space-x-2 overflow-hidden">
          {todo.assigned_user_ids.slice(0, 3).map((userId) => {
            const member = teamMembers.find((m) => m.id === userId)
            if (!member) return null
            const initials = member.name
              ? member.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
              : member.email?.[0]?.toUpperCase() || "?"

            return (
              <TooltipProvider key={userId}>
                <Tooltip>
                  <TooltipTrigger>
                    <Avatar className="h-6 w-6 ring-2 ring-background">
                      <AvatarImage src={member.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback className="text-xs bg-primary/10">{initials}</AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm">{member.name || member.email}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )
          })}
          {todo.assigned_user_ids.length > 3 && (
            <div className="flex items-center justify-center h-6 w-6 rounded-full ring-2 ring-background bg-muted text-xs font-medium">
              +{todo.assigned_user_ids.length - 3}
            </div>
          )}
        </div>
      )}

      {todo.recurrence_type && todo.recurrence_type !== "none" && (
        <Badge className="gap-1 bg-blue-500 text-white">
          <Clock className="h-3 w-3" />
          {todo.recurrence_type === "daily" && "Täglich"}
          {todo.recurrence_type === "weekly" && "Wöchentlich"}
          {todo.recurrence_type === "monthly" && "Monatlich"}
          {todo.recurrence_type === "yearly" && "Jährlich"}
        </Badge>
      )}

      {todo.attachments && todo.attachments.length > 0 && (
        <Badge className="gap-1 bg-purple-500 text-white">
          <Paperclip className="h-3 w-3" />
          {todo.attachments.length}
        </Badge>
      )}

      {(todo.dringend || todo.wichtig) && (
        <div className="flex gap-1">
          {todo.dringend && (
            <Badge variant="destructive" className="text-xs">
              Dringend
            </Badge>
          )}
          {todo.wichtig && (
            <Badge className="text-xs bg-orange-500 text-white">Wichtig</Badge>
          )}
        </div>
      )}
    </div>
  )
}

// Reusable attachments component
function TodoAttachments({ attachments }: { attachments?: TodoAttachment[] }) {
  if (!attachments || attachments.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {attachments.map((attachment) => (
        <a
          key={attachment.id}
          href={attachment.attachment_type === "file" ? attachment.file_url : attachment.link_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          {attachment.attachment_type === "file" ? (
            <>
              <FileText className="h-3 w-3" />
              {attachment.file_name}
            </>
          ) : (
            <>
              <LinkIcon className="h-3 w-3" />
              {attachment.link_title}
            </>
          )}
        </a>
      ))}
    </div>
  )
}
