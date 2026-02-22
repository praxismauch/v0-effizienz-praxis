"use client"

import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import type { TodoAttachment } from "@/contexts/todo-context"
import { statusConfig, isOverdue, getDaysUntilDue, getPriorityConfig, type TodoCardProps } from "./todo-card-utils"

export function TodoListView({
  todo,
  teamMembers,
  onStatusChange,
  onEdit,
  onDelete,
  draggable = false,
  isDragging = false,
  isDragOver = false,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  index,
}: TodoCardProps) {
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
      {/* Priority indicator bar */}
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
                      todo.status === "erledigt" && "line-through text-muted-foreground"
                    )}
                  >
                    {todo.title}
                  </p>
                  {overdue && (
                    <Badge variant="destructive" className="gap-1 text-xs h-5">
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
                <Badge
                  variant="outline"
                  className={cn("gap-1.5 text-xs font-medium border", statusInfo.bgColor, statusInfo.textColor)}
                >
                  <div className={cn("h-1.5 w-1.5 rounded-full", statusInfo.dotColor)} />
                  {statusInfo.label}
                </Badge>

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
                    <DropdownMenuItem onClick={() => onStatusChange(todo.id, "offen")} disabled={todo.status === "offen"}>
                      <div className="h-2 w-2 rounded-full bg-primary mr-2" />
                      Offen
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onStatusChange(todo.id, "in_bearbeitung")} disabled={todo.status === "in_bearbeitung"}>
                      <div className="h-2 w-2 rounded-full bg-warning mr-2" />
                      In Bearbeitung
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onStatusChange(todo.id, "erledigt")} disabled={todo.status === "erledigt"}>
                      <div className="h-2 w-2 rounded-full bg-success mr-2" />
                      Erledigt
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onStatusChange(todo.id, "abgebrochen")} disabled={todo.status === "abgebrochen"}>
                      <div className="h-2 w-2 rounded-full bg-destructive mr-2" />
                      Abgebrochen
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onDelete(todo.id)} className="text-destructive focus:text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Löschen
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Metadata row */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={cn("gap-1 text-xs border", priorityInfo.color)}>
                <div className={cn("h-1.5 w-1.5 rounded-full", priorityInfo.dotColor)} />
                {priorityInfo.label}
              </Badge>

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
                      ({daysUntilDue === 0 ? "Heute" : daysUntilDue === 1 ? "Morgen" : `${daysUntilDue}T`})
                    </span>
                  )}
                </Badge>
              )}

              {todo.dringend && (
                <Badge variant="outline" className="text-xs bg-destructive/10 text-destructive border-destructive/20">
                  Dringend
                </Badge>
              )}
              {todo.wichtig && (
                <Badge variant="outline" className="text-xs bg-warning/10 text-warning border-warning/20">
                  Wichtig
                </Badge>
              )}

              {todo.recurrence_type && todo.recurrence_type !== "none" && (
                <Badge variant="outline" className="gap-1 text-xs bg-primary/10 text-primary border-primary/20">
                  <Clock className="h-3 w-3" />
                  {todo.recurrence_type === "daily" && "Täglich"}
                  {todo.recurrence_type === "weekly" && "Wöchentlich"}
                  {todo.recurrence_type === "monthly" && "Monatlich"}
                  {todo.recurrence_type === "yearly" && "Jährlich"}
                </Badge>
              )}

              {todo.attachments && todo.attachments.length > 0 && (
                <Badge variant="outline" className="gap-1 text-xs bg-secondary text-muted-foreground border-border">
                  <Paperclip className="h-3 w-3" />
                  {todo.attachments.length}
                </Badge>
              )}

              <div className="flex-1" />

              {todo.assigned_user_ids && todo.assigned_user_ids.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <ArrowRight className="h-3 w-3 text-muted-foreground/50" />
                  <div className="flex -space-x-1.5">
                    {todo.assigned_user_ids.slice(0, 4).map((userId) => {
                      const member = teamMembers.find((m) => m.id === userId)
                      if (!member) return null
                      const initials = member.name
                        ? member.name.split(" ").map((n) => n[0]).join("").toUpperCase()
                        : member.email?.[0]?.toUpperCase() || "?"
                      return (
                        <TooltipProvider key={userId}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Avatar className="h-6 w-6 ring-2 ring-card">
                                <AvatarImage src={member.avatar_url || "/placeholder.svg"} />
                                <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-medium">
                                  {initials}
                                </AvatarFallback>
                              </Avatar>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-sm">{member.name || member.email}</p>
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

function TodoAttachmentsList({ attachments }: { attachments?: TodoAttachment[] }) {
  if (!attachments || attachments.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5 pt-1">
      {attachments.map((attachment) => (
        <a
          key={attachment.id}
          href={attachment.attachment_type === "file" ? attachment.file_url : attachment.link_url}
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
