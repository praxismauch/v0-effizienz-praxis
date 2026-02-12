"use client"

import type React from "react"
import { Badge } from "@/components/ui/badge"
import { Flag } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Todo } from "@/contexts/todo-context"
import { TodoCard } from "./todo-card"

interface TeamMember {
  id: string
  name?: string
  email?: string
  avatar_url?: string
}

interface KanbanColumnProps {
  title: string
  priority: "high" | "medium" | "low"
  todos: Todo[]
  teamMembers: TeamMember[]
  onStatusChange: (todoId: string, status: string) => void
  onEdit: (todo: Todo) => void
  onDelete: (todoId: string) => void
  dragOverZone: string | null
  draggedTodo: Todo | null
  onDragOver: (e: React.DragEvent, zoneId: string) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, priority: string) => void
  onDragStart: (e: React.DragEvent, todo: Todo) => void
  onDragEnd: (e: React.DragEvent) => void
}

const priorityConfig = {
  high: {
    bgColor: "bg-red-50 dark:bg-red-950/20",
    borderColor: "border-red-200 dark:border-red-800",
    activeBorderColor: "border-red-500",
    ringColor: "ring-red-200 dark:ring-red-800",
    iconColor: "text-red-600 dark:text-red-400",
    titleColor: "text-red-900 dark:text-red-100",
    badgeBg: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    zoneId: "high-priority",
    label: "Hoch",
  },
  medium: {
    bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
    borderColor: "border-yellow-200 dark:border-yellow-800",
    activeBorderColor: "border-yellow-500",
    ringColor: "ring-yellow-200 dark:ring-yellow-800",
    iconColor: "text-yellow-600 dark:text-yellow-400",
    titleColor: "text-yellow-900 dark:text-yellow-100",
    badgeBg: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    zoneId: "medium-priority",
    label: "Mittel",
  },
  low: {
    bgColor: "bg-green-50 dark:bg-green-950/20",
    borderColor: "border-green-200 dark:border-green-800",
    activeBorderColor: "border-green-500",
    ringColor: "ring-green-200 dark:ring-green-800",
    iconColor: "text-green-600 dark:text-green-400",
    titleColor: "text-green-900 dark:text-green-100",
    badgeBg: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    zoneId: "low-priority",
    label: "Niedrig",
  },
}

export function KanbanColumn({
  title,
  priority,
  todos,
  teamMembers,
  onStatusChange,
  onEdit,
  onDelete,
  dragOverZone,
  draggedTodo,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragStart,
  onDragEnd,
}: KanbanColumnProps) {
  const config = priorityConfig[priority]
  const isActive = dragOverZone === config.zoneId

  return (
    <div
      className={cn(
        config.bgColor,
        "border rounded-lg p-4 space-y-4 transition-all duration-200",
        isActive
          ? `${config.activeBorderColor} border-2 ring-4 ${config.ringColor} scale-[1.02] shadow-lg`
          : config.borderColor
      )}
      data-droppable="true"
      onDragOver={(e) => {
        e.preventDefault()
        onDragOver(e, config.zoneId)
      }}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, priority)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flag className={cn("h-5 w-5", config.iconColor)} />
          <h3 className={cn("font-semibold", config.titleColor)}>{title}</h3>
        </div>
        <Badge variant="secondary" className={config.badgeBg}>
          {todos.length}
        </Badge>
      </div>
      <div className="space-y-3">
        {todos.map((todo) => (
          <TodoCard
            key={todo.id}
            todo={todo}
            teamMembers={teamMembers}
            onStatusChange={onStatusChange}
            onEdit={onEdit}
            onDelete={onDelete}
            viewMode="kanban"
            draggable
            isDragging={draggedTodo?.id === todo.id}
            onDragStart={(e) => onDragStart(e, todo)}
            onDragEnd={onDragEnd}
          />
        ))}
      </div>
    </div>
  )
}