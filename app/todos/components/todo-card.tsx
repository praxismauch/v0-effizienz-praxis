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
  AlertTriangle,
  ArrowRight,
  MoreHorizontal,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

const statusConfig = {
  offen: {
    label: "Offen",
    dotColor: "bg-primary",
    bgColor: "bg-primary/10",
    textColor: "text-primary",
  },
  in_bearbeitung: {
    label: "In Bearbeitung",
    dotColor: "bg-warning",
    bgColor: "bg-warning/10",
    textColor: "text-warning",
  },
  erledigt: {
    label: "Erledigt",
    dotColor: "bg-success",
    bgColor: "bg-success/10",
    textColor: "text-success",
  },
  abgebrochen: {
    label: "Abgebrochen",
    dotColor: "bg-destructive",
    bgColor: "bg-destructive/10",
    textColor: "text-destructive",
  },
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

  const getDaysUntilDue = (dueDate: string | null) => {
    if (!dueDate) return null
    const now = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case "high":
        return { label: "Hoch", color: "bg-destructive/10 text-destructive border-destructive/20", dotColor: "bg-destructive" }
      case "medium":
        return { label: "Mittel", color: "bg-warning/10 text-warning border-warning/20", dotColor: "bg-warning" }
      case "low":
        return { label: "Niedrig", color: "bg-success/10 text-success border-success/20", dotColor: "bg-success" }
      default:
        return { label: priority, color: "bg-secondary text-secondary-foreground border-border", dotColor: "bg-muted-foreground" }
    }
  }

  const handleDragStart = (e: React.DragEvent) => {
    if (onDragStart) onDragStart(e, todo, index)
  }

  const handleDragOver = (e: React.DragEvent) => {
    if (onDragOver) onDragOver(e, index)
  }

  const handleDrop = (e: React.DragEvent) => {
    if (onDrop) onDrop(e, index)
  }

  const currentStatus = (todo.status || "offen") as keyof typeof statusConfig
  const statusInfo = statusConfig[currentStatus] || statusConfig.offen
  const priorityInfo = getPriorityConfig(todo.priority)
  const daysUntilDue = getDaysUntilDue(todo.due_date || null)
  const overdue = isOverdue(todo.due_date || null, todo.status)

  // List view - the richest layout
  if (viewMode === "list") {
    return (
      <Card
        draggable={draggable}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDragEnd={onDragEnd}
        className={cn(
          "group relative overflow-hidden transition-all duration-200",
          "hover:shadow-md hover:border-primary/20",
          todo.status === "erledigt" && "opacity-60",
          draggable && "cursor-grab active:cursor-grabbing",
          isDragging && "opacity-40 scale-[1.02] rotate-1 shadow-xl",
          isDragOver && draggable && "border-primary ring-2 ring-primary/20",
        )}
      >
        {/* Priority indicator bar on left edge */}
        <div
          className={cn(
            "absolute left-0 top-0 bottom-0 w-1 rounded-l-lg transition-all",
            todo.priority === "high" && "bg-destructive",
            todo.priority === "medium" && "bg-warning",
            todo.priority === "low" && "bg-success",
          )}
        />

        <CardContent className="p-4 pl-5">
          <div className="flex items-start gap-3">
            {/* Drag handle + checkbox */}
            <div className="flex flex-col items-center gap-1 pt-0.5">
              {draggable && (
                <GripVertical className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
              )}
              <Checkbox
                checked={todo.status === "erledigt"}
                onCheckedChange={(checked) =>
                  onStatusChange(todo.id, checked ? "erledigt" : "offen")
                }
                className="h-5 w-5"
              />
            </div>

            {/* Main content */}
            <div className="flex-1 min-w-0 space-y-2">
              {/* Title row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p
                      className={cn(
                        "font-semibold text-base text-foreground leading-tight",
                        todo.status === "erledigt" &&
                          "line-through text-muted-foreground"
                      )}
                    >
                      {todo.title}
                    </p>
                    {overdue && (
                      <Badge
                        variant="destructive"
                        className="gap-1 text-xs h-5"
                      >
                        <AlertTriangle className="h-3 w-3" />
                        Uberfällig
                      </Badge>
                    )}
                  </div>
                  {todo.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                      {todo.description}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Status badge - always visible */}
                  <Badge
                    variant="outline"
                    className={cn(
                      "gap-1.5 text-xs font-medium border",
                      statusInfo.bgColor,
                      statusInfo.textColor
                    )}
                  >
                    <div
                      className={cn("h-1.5 w-1.5 rounded-full", statusInfo.dotColor)}
                    />
                    {statusInfo.label}
                  </Badge>

                  {/* Actions dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Aktionen</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => onEdit(todo)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Bearbeiten
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onStatusChange(todo.id, "offen")}
                        disabled={todo.status === "offen"}
                      >
                        <div className="h-2 w-2 rounded-full bg-primary mr-2" />
                        Offen
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          onStatusChange(todo.id, "in_bearbeitung")
                        }
                        disabled={todo.status === "in_bearbeitung"}
                      >
                        <div className="h-2 w-2 rounded-full bg-warning mr-2" />
                        In Bearbeitung
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onStatusChange(todo.id, "erledigt")}
                        disabled={todo.status === "erledigt"}
                      >
                        <div className="h-2 w-2 rounded-full bg-success mr-2" />
                        Erledigt
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onStatusChange(todo.id, "abgebrochen")}
                        disabled={todo.status === "abgebrochen"}
                      >
                        <div className="h-2 w-2 rounded-full bg-destructive mr-2" />
                        Abgebrochen
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(todo.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Loschen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Metadata row */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Priority */}
                <Badge
                  variant="outline"
                  className={cn("gap-1 text-xs border", priorityInfo.color)}
                >
                  <div
                    className={cn("h-1.5 w-1.5 rounded-full", priorityInfo.dotColor)}
                  />
                  {priorityInfo.label}
                </Badge>

                {/* Due date */}
                {todo.due_date && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "gap-1 text-xs border",
                      overdue
                        ? "bg-destructive/10 text-destructive border-destructive/20"
                        : daysUntilDue !== null && daysUntilDue <= 2
                          ? "bg-warning/10 text-warning border-warning/20"
                          : "bg-secondary text-muted-foreground border-border"
                    )}
                  >
                    <Calendar className="h-3 w-3" />
                    {formatDateDE(new Date(todo.due_date))}
                    {daysUntilDue !== null && !overdue && daysUntilDue <= 7 && (
                      <span className="text-[10px] opacity-75 ml-0.5">
                        ({daysUntilDue === 0
                          ? "Heute"
                          : daysUntilDue === 1
                            ? "Morgen"
                            : `${daysUntilDue}T`})
                      </span>
                    )}
                  </Badge>
                )}

                {/* Urgency/Importance tags */}
                {todo.dringend && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-destructive/10 text-destructive border-destructive/20"
                  >
                    Dringend
                  </Badge>
                )}
                {todo.wichtig && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-warning/10 text-warning border-warning/20"
                  >
                    Wichtig
                  </Badge>
                )}

                {/* Recurrence */}
                {todo.recurrence_type && todo.recurrence_type !== "none" && (
                  <Badge
                    variant="outline"
                    className="gap-1 text-xs bg-primary/10 text-primary border-primary/20"
                  >
                    <Clock className="h-3 w-3" />
                    {todo.recurrence_type === "daily" && "Taglich"}
                    {todo.recurrence_type === "weekly" && "Wochentlich"}
                    {todo.recurrence_type === "monthly" && "Monatlich"}
                    {todo.recurrence_type === "yearly" && "Jahrlich"}
                  </Badge>
                )}

                {/* Attachments count */}
                {todo.attachments && todo.attachments.length > 0 && (
                  <Badge
                    variant="outline"
                    className="gap-1 text-xs bg-secondary text-muted-foreground border-border"
                  >
                    <Paperclip className="h-3 w-3" />
                    {todo.attachments.length}
                  </Badge>
                )}

                {/* Spacer to push assignees right */}
                <div className="flex-1" />

                {/* Assigned users */}
                {todo.assigned_user_ids && todo.assigned_user_ids.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <ArrowRight className="h-3 w-3 text-muted-foreground/50" />
                    <div className="flex -space-x-1.5">
                      {todo.assigned_user_ids.slice(0, 4).map((userId) => {
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
                              <TooltipTrigger asChild>
                                <Avatar className="h-6 w-6 ring-2 ring-card">
                                  <AvatarImage
                                    src={member.avatar_url || "/placeholder.svg"}
                                  />
                                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-medium">
                                    {initials}
                                  </AvatarFallback>
                                </Avatar>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-sm">
                                  {member.name || member.email}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )
                      })}
                      {todo.assigned_user_ids.length > 4 && (
                        <div className="flex items-center justify-center h-6 w-6 rounded-full ring-2 ring-card bg-muted text-[10px] font-medium text-muted-foreground">
                          +{todo.assigned_user_ids.length - 4}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Attachments list */}
              <TodoAttachmentsList attachments={todo.attachments} />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Kanban/Matrix view - compact card
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
                  todo.status === "erledigt" &&
                    "line-through text-muted-foreground"
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
            {/* Status pill */}
            <div
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                statusInfo.bgColor,
                statusInfo.textColor
              )}
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
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
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

            {/* Due date */}
            {todo.due_date && (
              <div
                className={cn(
                  "flex items-center gap-1 text-[10px]",
                  overdue
                    ? "text-destructive font-semibold"
                    : "text-muted-foreground"
                )}
              >
                <Calendar className="h-2.5 w-2.5" />
                {formatDateDE(new Date(todo.due_date))}
              </div>
            )}

            {overdue && (
              <AlertTriangle className="h-3 w-3 text-destructive" />
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Assignees */}
            {todo.assigned_user_ids && todo.assigned_user_ids.length > 0 && (
              <div className="flex -space-x-1">
                {todo.assigned_user_ids.slice(0, 2).map((userId) => {
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
                        <TooltipTrigger asChild>
                          <Avatar className="h-5 w-5 ring-1 ring-card">
                            <AvatarImage
                              src={member.avatar_url || "/placeholder.svg"}
                            />
                            <AvatarFallback className="text-[8px] bg-primary/10 text-primary font-medium">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">
                            {member.name || member.email}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )
                })}
                {todo.assigned_user_ids.length > 2 && (
                  <div className="flex items-center justify-center h-5 w-5 rounded-full ring-1 ring-card bg-muted text-[8px] font-medium text-muted-foreground">
                    +{todo.assigned_user_ids.length - 2}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Attachments list for list view
function TodoAttachmentsList({ attachments }: { attachments?: TodoAttachment[] }) {
  if (!attachments || attachments.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5 pt-1">
      {attachments.map((attachment) => (
        <a
          key={attachment.id}
          href={
            attachment.attachment_type === "file"
              ? attachment.file_url
              : attachment.link_url
          }
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors bg-primary/5 rounded-md px-2 py-1 hover:bg-primary/10"
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