"use client"

import { useState, useMemo, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { List, Columns3, LayoutGrid, Loader2 } from "lucide-react"
import { useTodos, type Todo } from "@/contexts/todo-context"
import { useTeam } from "@/contexts/team-context"
import { usePractice } from "@/contexts/practice-context"
import TodoMenuBar from "@/components/todo-menu-bar"
import CreateTodoDialog from "@/components/create-todo-dialog"
import { TodoCard } from "./components/todo-card"
import { KanbanColumn } from "./components/kanban-column"
import { MatrixQuadrant } from "./components/matrix-quadrant"

interface PageClientProps {
  initialTodos: any[]
  practiceId: string | null | undefined
  user: {
    id: string
    email: string
    name?: string
  }
}

export default function PageClient({ initialTodos, practiceId, user }: PageClientProps) {
  const { todos, updateTodo, deleteTodo, fetchTodos, isLoading } = useTodos()
  const { teamMembers } = useTeam()
  const { currentPractice } = usePractice()

  // View mode
  const [viewMode, setViewMode] = useState<"list" | "kanban" | "matrix">("list")

  // Filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([])
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([])
  const [sortBy, setSortBy] = useState("priority")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [showCompleted, setShowCompleted] = useState(false)
  const [showOverdue, setShowOverdue] = useState(false)
  const [statusFilter, setStatusFilter] = useState("alle")

  // Dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editTodo, setEditTodo] = useState<Todo | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [todoToDelete, setTodoToDelete] = useState<string | null>(null)

  // Drag & drop state
  const [draggedTodo, setDraggedTodo] = useState<Todo | null>(null)
  const [dragOverZone, setDragOverZone] = useState<string | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const activeTodos = useMemo(() => todos || initialTodos || [], [todos, initialTodos])

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

    // Status filter
    if (statusFilter === "offen") filtered = filtered.filter((t) => t.status === "offen" || (!t.status && !t.completed))
    else if (statusFilter === "in_bearbeitung") filtered = filtered.filter((t) => t.status === "in_bearbeitung")
    else if (statusFilter === "erledigt") filtered = filtered.filter((t) => t.status === "erledigt" || t.completed)
    else if (statusFilter === "abgebrochen") filtered = filtered.filter((t) => t.status === "abgebrochen")

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (t) =>
          t.title?.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q)
      )
    }

    // Priority filter
    if (selectedPriorities.length > 0) {
      filtered = filtered.filter((t) => selectedPriorities.includes(t.priority))
    }

    // Assignee filter
    if (selectedAssignees.length > 0) {
      filtered = filtered.filter((t) =>
        t.assigned_user_ids?.some((id: string) => {
          const member = teamMembers?.find((m) => m.id === id)
          return selectedAssignees.includes(member?.name || member?.email || id)
        })
      )
    }

    // Show completed filter
    if (!showCompleted) {
      filtered = filtered.filter((t) => t.status !== "erledigt" && !t.completed)
    }

    // Show overdue filter
    if (showOverdue) {
      filtered = filtered.filter((t) => {
        if (!t.due_date || t.status === "erledigt" || t.completed) return false
        return new Date(t.due_date) < new Date()
      })
    }

    // Sorting
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
  const stats = useMemo(() => ({
    total: activeTodos.length,
    offen: activeTodos.filter((t) => t.status === "offen" || (!t.status && !t.completed)).length,
    in_bearbeitung: activeTodos.filter((t) => t.status === "in_bearbeitung").length,
    erledigt: activeTodos.filter((t) => t.status === "erledigt" || t.completed).length,
    abgebrochen: activeTodos.filter((t) => t.status === "abgebrochen").length,
  }), [activeTodos])

  // Handlers
  const handleStatusChange = useCallback(async (todoId: string, status: string) => {
    await updateTodo(todoId, {
      status: status as Todo["status"],
      completed: status === "erledigt",
    })
  }, [updateTodo])

  const handleEdit = useCallback((todo: Todo) => {
    setEditTodo(todo)
    setShowCreateDialog(true)
  }, [])

  const handleDelete = useCallback(async () => {
    if (!todoToDelete) return
    await deleteTodo(todoToDelete)
    setShowDeleteDialog(false)
    setTodoToDelete(null)
  }, [todoToDelete, deleteTodo])

  const handleConfirmDelete = useCallback((todoId: string) => {
    setTodoToDelete(todoId)
    setShowDeleteDialog(true)
  }, [])

  const clearFilters = useCallback(() => {
    setSelectedPriorities([])
    setSelectedAssignees([])
    setShowOverdue(false)
    setShowCompleted(false)
  }, [])

  // Drag & drop handlers for kanban
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
    if (!relatedTarget?.closest("[data-droppable]")) {
      setDragOverZone(null)
    }
  }, [])

  const handleKanbanDrop = useCallback(async (e: React.DragEvent, priority: string) => {
    e.preventDefault()
    if (draggedTodo && draggedTodo.priority !== priority) {
      await updateTodo(draggedTodo.id, { priority: priority as Todo["priority"] })
    }
    setDraggedTodo(null)
    setDragOverZone(null)
  }, [draggedTodo, updateTodo])

  // Drag & drop handlers for matrix
  const handleMatrixDrop = useCallback(async (e: React.DragEvent, dringend: boolean, wichtig: boolean) => {
    e.preventDefault()
    if (draggedTodo) {
      await updateTodo(draggedTodo.id, { dringend, wichtig })
    }
    setDraggedTodo(null)
    setDragOverZone(null)
  }, [draggedTodo, updateTodo])

  const handleDragEnd = useCallback(() => {
    setDraggedTodo(null)
    setDragOverZone(null)
    setDragOverIndex(null)
  }, [])

  // List drag & drop for reordering
  const handleListDragStart = useCallback((e: React.DragEvent, todo: Todo, index?: number) => {
    setDraggedTodo(todo)
    if (index !== undefined) setDragOverIndex(index)
    e.dataTransfer.effectAllowed = "move"
  }, [])

  const handleListDragOver = useCallback((e: React.DragEvent, index?: number) => {
    e.preventDefault()
    if (index !== undefined) setDragOverIndex(index)
  }, [])

  const handleListDrop = useCallback(async (e: React.DragEvent, index?: number) => {
    e.preventDefault()
    if (draggedTodo && index !== undefined) {
      const newOrder = index
      await updateTodo(draggedTodo.id, { manual_order: newOrder })
    }
    setDraggedTodo(null)
    setDragOverIndex(null)
  }, [draggedTodo, updateTodo])

  // Kanban grouped todos
  const kanbanGroups = useMemo(() => ({
    high: filteredTodos.filter((t) => t.priority === "high"),
    medium: filteredTodos.filter((t) => t.priority === "medium"),
    low: filteredTodos.filter((t) => t.priority === "low"),
  }), [filteredTodos])

  // Matrix grouped todos
  const matrixGroups = useMemo(() => ({
    urgentImportant: filteredTodos.filter((t) => t.dringend && t.wichtig),
    notUrgentImportant: filteredTodos.filter((t) => !t.dringend && t.wichtig),
    urgentNotImportant: filteredTodos.filter((t) => t.dringend && !t.wichtig),
    notUrgentNotImportant: filteredTodos.filter((t) => !t.dringend && !t.wichtig),
  }), [filteredTodos])

  const membersList = useMemo(() =>
    (teamMembers || []).map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      avatar_url: m.avatar,
    })),
    [teamMembers]
  )

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Aufgaben</h1>
          <p className="text-muted-foreground">Verwalten Sie Ihre To-dos und Aufgaben</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter("alle")}>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-muted-foreground">Gesamt</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter("offen")}>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-muted-foreground">Offen</p>
            <p className="text-2xl font-bold text-blue-600">{stats.offen}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter("in_bearbeitung")}>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-muted-foreground">In Bearbeitung</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.in_bearbeitung}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter("erledigt")}>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-muted-foreground">Erledigt</p>
            <p className="text-2xl font-bold text-green-600">{stats.erledigt}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter("abgebrochen")}>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-muted-foreground">Abgebrochen</p>
            <p className="text-2xl font-bold text-red-600">{stats.abgebrochen}</p>
          </CardContent>
        </Card>
      </div>

      {/* Menu Bar with Filters */}
      <TodoMenuBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedPriorities={selectedPriorities}
        onPriorityChange={setSelectedPriorities}
        selectedAssignees={selectedAssignees}
        onAssigneeChange={setSelectedAssignees}
        sortBy={sortBy}
        onSortChange={setSortBy}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
        showCompleted={showCompleted}
        onShowCompletedChange={setShowCompleted}
        showOverdue={showOverdue}
        onShowOverdueChange={setShowOverdue}
        onCreateTodo={() => { setEditTodo(null); setShowCreateDialog(true) }}
        onRefresh={() => fetchTodos()}
        availableAssignees={availableAssignees}
        activeFiltersCount={activeFiltersCount}
        onClearFilters={clearFilters}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="alle">
              Alle <Badge variant="secondary" className="ml-2">{stats.total}</Badge>
            </TabsTrigger>
            <TabsTrigger value="offen">
              Offen <Badge variant="secondary" className="ml-2">{stats.offen}</Badge>
            </TabsTrigger>
            <TabsTrigger value="in_bearbeitung">
              In Bearbeitung <Badge variant="secondary" className="ml-2">{stats.in_bearbeitung}</Badge>
            </TabsTrigger>
            <TabsTrigger value="erledigt">
              Erledigt <Badge variant="secondary" className="ml-2">{stats.erledigt}</Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-1 border rounded-lg p-1">
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            title="Listenansicht"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "kanban" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("kanban")}
            title="Kanban-Ansicht"
          >
            <Columns3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "matrix" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("matrix")}
            title="Eisenhower-Matrix"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-lg font-medium">Aufgaben werden geladen...</p>
          </CardContent>
        </Card>
      ) : filteredTodos.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-lg font-medium mb-2">Keine Aufgaben gefunden</p>
            <p className="text-muted-foreground mb-4">
              {searchQuery || activeFiltersCount > 0
                ? "Versuchen Sie andere Filter oder Suchbegriffe"
                : "Erstellen Sie Ihre erste Aufgabe"}
            </p>
            {(searchQuery || activeFiltersCount > 0) ? (
              <Button variant="outline" onClick={clearFilters}>
                Filter zurucksetzen
              </Button>
            ) : (
              <Button onClick={() => { setEditTodo(null); setShowCreateDialog(true) }}>
                Neue Aufgabe erstellen
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === "list" ? (
        /* List View */
        <div className="space-y-2">
          {filteredTodos.map((todo, index) => (
            <TodoCard
              key={todo.id}
              todo={todo}
              teamMembers={membersList}
              onStatusChange={handleStatusChange}
              onEdit={handleEdit}
              onDelete={handleConfirmDelete}
              viewMode="list"
              draggable={sortBy === "manual"}
              isDragging={draggedTodo?.id === todo.id}
              isDragOver={dragOverIndex === index}
              onDragStart={handleListDragStart}
              onDragOver={handleListDragOver}
              onDrop={handleListDrop}
              onDragEnd={handleDragEnd}
              index={index}
              sortBy={sortBy}
            />
          ))}
        </div>
      ) : viewMode === "kanban" ? (
        /* Kanban View */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KanbanColumn
            title="Hohe Prioritat"
            priority="high"
            todos={kanbanGroups.high}
            teamMembers={membersList}
            onStatusChange={handleStatusChange}
            onEdit={handleEdit}
            onDelete={handleConfirmDelete}
            dragOverZone={dragOverZone}
            draggedTodo={draggedTodo}
            onDragOver={handleKanbanDragOver}
            onDragLeave={handleKanbanDragLeave}
            onDrop={handleKanbanDrop}
            onDragStart={handleKanbanDragStart}
            onDragEnd={handleDragEnd}
          />
          <KanbanColumn
            title="Mittlere Prioritat"
            priority="medium"
            todos={kanbanGroups.medium}
            teamMembers={membersList}
            onStatusChange={handleStatusChange}
            onEdit={handleEdit}
            onDelete={handleConfirmDelete}
            dragOverZone={dragOverZone}
            draggedTodo={draggedTodo}
            onDragOver={handleKanbanDragOver}
            onDragLeave={handleKanbanDragLeave}
            onDrop={handleKanbanDrop}
            onDragStart={handleKanbanDragStart}
            onDragEnd={handleDragEnd}
          />
          <KanbanColumn
            title="Niedrige Prioritat"
            priority="low"
            todos={kanbanGroups.low}
            teamMembers={membersList}
            onStatusChange={handleStatusChange}
            onEdit={handleEdit}
            onDelete={handleConfirmDelete}
            dragOverZone={dragOverZone}
            draggedTodo={draggedTodo}
            onDragOver={handleKanbanDragOver}
            onDragLeave={handleKanbanDragLeave}
            onDrop={handleKanbanDrop}
            onDragStart={handleKanbanDragStart}
            onDragEnd={handleDragEnd}
          />
        </div>
      ) : (
        /* Matrix View (Eisenhower) */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <MatrixQuadrant
            type="urgentImportant"
            todos={matrixGroups.urgentImportant}
            teamMembers={membersList}
            onStatusChange={handleStatusChange}
            onEdit={handleEdit}
            onDelete={handleConfirmDelete}
            dragOverZone={dragOverZone}
            draggedTodo={draggedTodo}
            onDragOver={handleKanbanDragOver}
            onDragLeave={handleKanbanDragLeave}
            onDrop={handleMatrixDrop}
            onDragStart={handleKanbanDragStart}
            onDragEnd={handleDragEnd}
          />
          <MatrixQuadrant
            type="notUrgentImportant"
            todos={matrixGroups.notUrgentImportant}
            teamMembers={membersList}
            onStatusChange={handleStatusChange}
            onEdit={handleEdit}
            onDelete={handleConfirmDelete}
            dragOverZone={dragOverZone}
            draggedTodo={draggedTodo}
            onDragOver={handleKanbanDragOver}
            onDragLeave={handleKanbanDragLeave}
            onDrop={handleMatrixDrop}
            onDragStart={handleKanbanDragStart}
            onDragEnd={handleDragEnd}
          />
          <MatrixQuadrant
            type="urgentNotImportant"
            todos={matrixGroups.urgentNotImportant}
            teamMembers={membersList}
            onStatusChange={handleStatusChange}
            onEdit={handleEdit}
            onDelete={handleConfirmDelete}
            dragOverZone={dragOverZone}
            draggedTodo={draggedTodo}
            onDragOver={handleKanbanDragOver}
            onDragLeave={handleKanbanDragLeave}
            onDrop={handleMatrixDrop}
            onDragStart={handleKanbanDragStart}
            onDragEnd={handleDragEnd}
          />
          <MatrixQuadrant
            type="notUrgentNotImportant"
            todos={matrixGroups.notUrgentNotImportant}
            teamMembers={membersList}
            onStatusChange={handleStatusChange}
            onEdit={handleEdit}
            onDelete={handleConfirmDelete}
            dragOverZone={dragOverZone}
            draggedTodo={draggedTodo}
            onDragOver={handleKanbanDragOver}
            onDragLeave={handleKanbanDragLeave}
            onDrop={handleMatrixDrop}
            onDragStart={handleKanbanDragStart}
            onDragEnd={handleDragEnd}
          />
        </div>
      )}

      {/* Create/Edit Todo Dialog */}
      <CreateTodoDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aufgabe loschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht ruckgangig gemacht werden. Die Aufgabe wird permanent geloscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Loschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
