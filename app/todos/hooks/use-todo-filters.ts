"use client"

import type React from "react"
import { useState, useMemo, useCallback } from "react"
import type { Todo } from "@/contexts/todo-context"

interface TeamMember {
  id: string
  name?: string
  email?: string
}

export function useTodoFilters(activeTodos: Todo[], teamMembers: TeamMember[] | null | undefined, updateTodo: (id: string, data: Partial<Todo>) => Promise<void>) {
  // Filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([])
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([])
  const [sortBy, setSortBy] = useState("priority")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [showCompleted, setShowCompleted] = useState(false)
  const [showOverdue, setShowOverdue] = useState(false)
  const [statusFilter, setStatusFilter] = useState("alle")

  // Drag & drop state
  const [draggedTodo, setDraggedTodo] = useState<Todo | null>(null)
  const [dragOverZone, setDragOverZone] = useState<string | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // Overdue count
  const overdueCount = useMemo(() => {
    return activeTodos.filter((t) => {
      if (!t.due_date || t.status === "erledigt" || t.completed) return false
      return new Date(t.due_date) < new Date()
    }).length
  }, [activeTodos])

  // Available assignees for filters
  const availableAssignees = useMemo(() => {
    const assigneeSet = new Set<string>()
    activeTodos.forEach((todo) => {
      todo.assigned_user_ids?.forEach((id: string) => {
        const member = teamMembers?.find((m) => m.id === id)
        if (member) assigneeSet.add(member.name || member.email || id)
      })
    })
    return Array.from(assigneeSet)
  }, [activeTodos, teamMembers])

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (selectedPriorities.length > 0) count++
    if (selectedAssignees.length > 0) count++
    if (showOverdue) count++
    if (showCompleted) count++
    return count
  }, [selectedPriorities, selectedAssignees, showOverdue, showCompleted])

  // Filtered and sorted todos
  const filteredTodos = useMemo(() => {
    let filtered = [...activeTodos]

    if (statusFilter === "offen") filtered = filtered.filter((t) => t.status === "offen" || (!t.status && !t.completed))
    else if (statusFilter === "in_bearbeitung") filtered = filtered.filter((t) => t.status === "in_bearbeitung")
    else if (statusFilter === "erledigt") filtered = filtered.filter((t) => t.status === "erledigt" || t.completed)
    else if (statusFilter === "abgebrochen") filtered = filtered.filter((t) => t.status === "abgebrochen")

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter((t) => t.title?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q))
    }

    if (selectedPriorities.length > 0) {
      filtered = filtered.filter((t) => selectedPriorities.includes(t.priority))
    }

    if (selectedAssignees.length > 0) {
      filtered = filtered.filter((t) =>
        t.assigned_user_ids?.some((id: string) => {
          const member = teamMembers?.find((m) => m.id === id)
          return selectedAssignees.includes(member?.name || member?.email || id)
        }),
      )
    }

    if (!showCompleted) {
      filtered = filtered.filter((t) => t.status !== "erledigt" && !t.completed)
    }

    if (showOverdue) {
      filtered = filtered.filter((t) => {
        if (!t.due_date || t.status === "erledigt" || t.completed) return false
        return new Date(t.due_date) < new Date()
      })
    }

    filtered.sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case "priority": {
          const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }
          comparison = (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2)
          break
        }
        case "dueDate":
          comparison = (a.due_date ? new Date(a.due_date).getTime() : Infinity) - (b.due_date ? new Date(b.due_date).getTime() : Infinity)
          break
        case "title":
          comparison = (a.title || "").localeCompare(b.title || "")
          break
        case "createdAt":
          comparison = new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          break
        case "assignedTo":
          comparison = (a.assigned_user_ids?.length || 0) - (b.assigned_user_ids?.length || 0)
          break
        default:
          comparison = 0
      }
      return sortOrder === "desc" ? -comparison : comparison
    })

    return filtered
  }, [activeTodos, searchQuery, selectedPriorities, selectedAssignees, sortBy, sortOrder, showCompleted, showOverdue, statusFilter, teamMembers])

  // Stats
  const stats = useMemo(
    () => ({
      total: activeTodos.length,
      offen: activeTodos.filter((t) => t.status === "offen" || (!t.status && !t.completed)).length,
      in_bearbeitung: activeTodos.filter((t) => t.status === "in_bearbeitung").length,
      erledigt: activeTodos.filter((t) => t.status === "erledigt" || t.completed).length,
      abgebrochen: activeTodos.filter((t) => t.status === "abgebrochen").length,
    }),
    [activeTodos],
  )

  // Kanban / Matrix groups
  const kanbanGroups = useMemo(
    () => ({
      high: filteredTodos.filter((t) => t.priority === "high"),
      medium: filteredTodos.filter((t) => t.priority === "medium"),
      low: filteredTodos.filter((t) => t.priority === "low"),
    }),
    [filteredTodos],
  )

  const matrixGroups = useMemo(
    () => ({
      urgentImportant: filteredTodos.filter((t) => t.dringend && t.wichtig),
      notUrgentImportant: filteredTodos.filter((t) => !t.dringend && t.wichtig),
      urgentNotImportant: filteredTodos.filter((t) => t.dringend && !t.wichtig),
      notUrgentNotImportant: filteredTodos.filter((t) => !t.dringend && !t.wichtig),
    }),
    [filteredTodos],
  )

  const clearFilters = useCallback(() => {
    setSelectedPriorities([])
    setSelectedAssignees([])
    setShowOverdue(false)
    setShowCompleted(false)
  }, [])

  // ── Drag & drop handlers ─────────────────────────────────────────────────

  const handleKanbanDragStart = useCallback((e: React.DragEvent, todo: Todo) => {
    setDraggedTodo(todo)
    e.dataTransfer.effectAllowed = "move"
  }, [])

  const handleKanbanDragOver = useCallback((e: React.DragEvent, zoneId: string) => {
    e.preventDefault()
    setDragOverZone(zoneId)
  }, [])

  const handleKanbanDragLeave = useCallback((e: React.DragEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement
    if (!relatedTarget?.closest("[data-droppable]")) setDragOverZone(null)
  }, [])

  const handleKanbanDrop = useCallback(
    async (e: React.DragEvent, priority: string) => {
      e.preventDefault()
      if (draggedTodo && draggedTodo.priority !== priority) {
        await updateTodo(draggedTodo.id, { priority: priority as Todo["priority"] })
      }
      setDraggedTodo(null)
      setDragOverZone(null)
    },
    [draggedTodo, updateTodo],
  )

  const handleMatrixDrop = useCallback(
    async (e: React.DragEvent, dringend: boolean, wichtig: boolean) => {
      e.preventDefault()
      if (draggedTodo) await updateTodo(draggedTodo.id, { dringend, wichtig })
      setDraggedTodo(null)
      setDragOverZone(null)
    },
    [draggedTodo, updateTodo],
  )

  const handleDragEnd = useCallback(() => {
    setDraggedTodo(null)
    setDragOverZone(null)
    setDragOverIndex(null)
  }, [])

  const handleListDragStart = useCallback((e: React.DragEvent, todo: Todo, index?: number) => {
    setDraggedTodo(todo)
    if (index !== undefined) setDragOverIndex(index)
    e.dataTransfer.effectAllowed = "move"
  }, [])

  const handleListDragOver = useCallback((e: React.DragEvent, index?: number) => {
    e.preventDefault()
    if (index !== undefined) setDragOverIndex(index)
  }, [])

  const handleListDrop = useCallback(
    async (e: React.DragEvent, index?: number) => {
      e.preventDefault()
      if (draggedTodo && index !== undefined) {
        await updateTodo(draggedTodo.id, { manual_order: index })
      }
      setDraggedTodo(null)
      setDragOverIndex(null)
    },
    [draggedTodo, updateTodo],
  )

  return {
    // Filter state
    searchQuery,
    setSearchQuery,
    selectedPriorities,
    setSelectedPriorities,
    selectedAssignees,
    setSelectedAssignees,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    showCompleted,
    setShowCompleted,
    showOverdue,
    setShowOverdue,
    statusFilter,
    setStatusFilter,
    // Computed
    filteredTodos,
    stats,
    overdueCount,
    availableAssignees,
    activeFiltersCount,
    kanbanGroups,
    matrixGroups,
    clearFilters,
    // Drag & drop
    draggedTodo,
    dragOverZone,
    dragOverIndex,
    handleKanbanDragStart,
    handleKanbanDragOver,
    handleKanbanDragLeave,
    handleKanbanDrop,
    handleMatrixDrop,
    handleDragEnd,
    handleListDragStart,
    handleListDragOver,
    handleListDrop,
  }
}
