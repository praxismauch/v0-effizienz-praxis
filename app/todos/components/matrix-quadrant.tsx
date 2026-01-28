"use client"

import type React from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Todo } from "@/contexts/todo-context"
import { TodoCard } from "./todo-card"

interface TeamMember {
  id: string
  name?: string
  email?: string
  avatar_url?: string
}

type QuadrantType = "urgentImportant" | "notUrgentImportant" | "urgentNotImportant" | "notUrgentNotImportant"

interface MatrixQuadrantProps {
  type: QuadrantType
  todos: Todo[]
  teamMembers: TeamMember[]
  onStatusChange: (todoId: string, status: string) => void
  onEdit: (todo: Todo) => void
  onDelete: (todoId: string) => void
  dragOverZone: string | null
  draggedTodo: Todo | null
  onDragOver: (e: React.DragEvent, zoneId: string) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, dringend: boolean, wichtig: boolean) => void
  onDragStart: (e: React.DragEvent, todo: Todo) => void
  onDragEnd: (e: React.DragEvent) => void
}

const quadrantConfig = {
  urgentImportant: {
    title: "Sofort erledigen",
    subtitle: "Dringend & Wichtig",
    bgColor: "bg-red-50/50 dark:bg-red-950/20",
    borderColor: "border-red-200 dark:border-red-800",
    activeBorderColor: "border-red-400",
    ringColor: "ring-red-200 dark:ring-red-800",
    titleColor: "text-red-800 dark:text-red-200",
    subtitleColor: "text-red-600 dark:text-red-400",
    badgeBg: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    zoneId: "urgent-important",
    dringend: true,
    wichtig: true,
  },
  notUrgentImportant: {
    title: "Planen",
    subtitle: "Wichtig, nicht dringend",
    bgColor: "bg-amber-50/50 dark:bg-amber-950/20",
    borderColor: "border-amber-200 dark:border-amber-800",
    activeBorderColor: "border-amber-400",
    ringColor: "ring-amber-200 dark:ring-amber-800",
    titleColor: "text-amber-800 dark:text-amber-200",
    subtitleColor: "text-amber-600 dark:text-amber-400",
    badgeBg: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
    zoneId: "not-urgent-important",
    dringend: false,
    wichtig: true,
  },
  urgentNotImportant: {
    title: "Delegieren",
    subtitle: "Dringend, nicht wichtig",
    bgColor: "bg-blue-50/50 dark:bg-blue-950/20",
    borderColor: "border-blue-200 dark:border-blue-800",
    activeBorderColor: "border-blue-400",
    ringColor: "ring-blue-200 dark:ring-blue-800",
    titleColor: "text-blue-800 dark:text-blue-200",
    subtitleColor: "text-blue-600 dark:text-blue-400",
    badgeBg: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    zoneId: "urgent-not-important",
    dringend: true,
    wichtig: false,
  },
  notUrgentNotImportant: {
    title: "Eliminieren",
    subtitle: "Nicht dringend & nicht wichtig",
    bgColor: "bg-slate-50/50 dark:bg-slate-950/20",
    borderColor: "border-slate-200 dark:border-slate-700",
    activeBorderColor: "border-slate-400",
    ringColor: "ring-slate-200 dark:ring-slate-700",
    titleColor: "text-slate-800 dark:text-slate-200",
    subtitleColor: "text-slate-600 dark:text-slate-400",
    badgeBg: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    zoneId: "not-urgent-not-important",
    dringend: false,
    wichtig: false,
  },
}

export function MatrixQuadrant({
  type,
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
}: MatrixQuadrantProps) {
  const config = quadrantConfig[type]
  const isActive = dragOverZone === config.zoneId

  return (
    <div
      className={cn(
        config.bgColor,
        "border rounded-lg p-4 min-h-[300px] transition-all duration-200",
        isActive
          ? `${config.activeBorderColor} border-2 ring-4 ${config.ringColor} scale-[1.01] shadow-lg`
          : config.borderColor
      )}
      data-droppable="true"
      onDragOver={(e) => {
        e.preventDefault()
        onDragOver(e, config.zoneId)
      }}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, config.dringend, config.wichtig)}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className={cn("font-semibold", config.titleColor)}>{config.title}</h3>
          <p className={cn("text-xs", config.subtitleColor)}>{config.subtitle}</p>
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
            viewMode="matrix"
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
