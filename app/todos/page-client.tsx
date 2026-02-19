"use client"

import { useState, useMemo, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
import {
  List,
  Columns3,
  LayoutGrid,
  Loader2,
  Plus,
  ClipboardList,
  Search,
  X,
} from "lucide-react"
import { useTodos, type Todo } from "@/contexts/todo-context"
import { useTeam } from "@/contexts/team-context"
import { usePractice } from "@/contexts/practice-context"
import TodoMenuBar from "@/components/todo-menu-bar"
import CreateTodoDialog from "@/components/create-todo-dialog"
import { TodoCard } from "./components/todo-card"
import { KanbanColumn } from "./components/kanban-column"
import { MatrixQuadrant } from "./components/matrix-quadrant"
import { TodoStatsHeader } from "./components/todo-stats-header"
import { cn } from "@/lib/utils"
import { useTodoFilters } from "./hooks/use-todo-filters"

interface PageClientProps {
  initialTodos: any[]
  practiceId: string | null | undefined
  user: { id: string; email: string; name?: string }
}

export default function PageClient({ initialTodos, practiceId, user }: PageClientProps) {
  const { todos, updateTodo, deleteTodo, fetchTodos, isLoading } = useTodos()
  const { teamMembers } = useTeam()
  const { currentPractice } = usePractice()

  const [viewMode, setViewMode] = useState<"list" | "kanban" | "matrix">("list")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editTodo, setEditTodo] = useState<Todo | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [todoToDelete, setTodoToDelete] = useState<string | null>(null)

  const activeTodos = useMemo(() => todos || initialTodos || [], [todos, initialTodos])

  const {
    searchQuery, setSearchQuery,
    selectedPriorities, setSelectedPriorities,
    selectedAssignees, setSelectedAssignees,
    sortBy, setSortBy,
    sortOrder, setSortOrder,
    showCompleted, setShowCompleted,
    showOverdue, setShowOverdue,
    statusFilter, setStatusFilter,
    filteredTodos, stats, overdueCount,
    availableAssignees, activeFiltersCount,
    kanbanGroups, matrixGroups,
    clearFilters,
    draggedTodo, dragOverZone, dragOverIndex,
    handleKanbanDragStart, handleKanbanDragOver, handleKanbanDragLeave,
    handleKanbanDrop, handleMatrixDrop, handleDragEnd,
    handleListDragStart, handleListDragOver, handleListDrop,
  } = useTodoFilters(activeTodos, teamMembers, updateTodo)

  // Handlers
  const handleStatusChange = useCallback(
    async (todoId: string, status: string) => {
      await updateTodo(todoId, { status: status as Todo["status"], completed: status === "erledigt" })
    },
    [updateTodo],
  )

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

  const membersList = useMemo(
    () => (teamMembers || []).map((m) => ({ id: m.id, name: m.name, email: m.email, avatar_url: m.avatar })),
    [teamMembers],
  )

  const viewModes = [
    { key: "list" as const, icon: List, label: "Liste" },
    { key: "kanban" as const, icon: Columns3, label: "Kanban" },
    { key: "matrix" as const, icon: LayoutGrid, label: "Matrix" },
  ]

  return (
    <div className="w-full p-4 md:p-6 space-y-6">
      <TodoStatsHeader stats={stats} statusFilter={statusFilter} onStatusFilterChange={setStatusFilter} overdueCount={overdueCount} />

      <TodoMenuBar
        searchQuery={searchQuery} onSearchChange={setSearchQuery}
        selectedPriorities={selectedPriorities} onPriorityChange={setSelectedPriorities}
        selectedAssignees={selectedAssignees} onAssigneeChange={setSelectedAssignees}
        sortBy={sortBy} onSortChange={setSortBy}
        sortOrder={sortOrder} onSortOrderChange={setSortOrder}
        showCompleted={showCompleted} onShowCompletedChange={setShowCompleted}
        showOverdue={showOverdue} onShowOverdueChange={setShowOverdue}
        onCreateTodo={() => { setEditTodo(null); setShowCreateDialog(true) }}
        onRefresh={() => fetchTodos()}
        availableAssignees={availableAssignees}
        activeFiltersCount={activeFiltersCount}
        onClearFilters={clearFilters}
        viewMode={viewMode} onViewModeChange={setViewMode}
      />

      {/* View controls bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground tabular-nums">{filteredTodos.length}</span>{" "}
            {filteredTodos.length === 1 ? "Aufgabe" : "Aufgaben"}
            {statusFilter !== "alle" && (
              <span className="text-muted-foreground">
                {" "}in &quot;{statusFilter === "offen" ? "Offen" : statusFilter === "in_bearbeitung" ? "In Bearbeitung" : statusFilter === "erledigt" ? "Erledigt" : "Abgebrochen"}&quot;
              </span>
            )}
          </p>
          {(searchQuery || activeFiltersCount > 0) && (
            <Button
              variant="ghost" size="sm"
              onClick={() => { setSearchQuery(""); clearFilters(); setStatusFilter("alle") }}
              className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
              Zurücksetzen
            </Button>
          )}
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
          {viewModes.map(({ key, icon: Icon, label }) => (
            <Button
              key={key}
              variant={viewMode === key ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode(key)}
              className={cn("h-8 gap-1.5 text-xs", viewMode === key ? "" : "text-muted-foreground hover:text-foreground")}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="relative">
              <div className="h-12 w-12 rounded-full border-4 border-muted" />
              <Loader2 className="h-12 w-12 animate-spin text-primary absolute inset-0" />
            </div>
            <p className="text-base font-medium mt-4 text-foreground">Aufgaben werden geladen...</p>
            <p className="text-sm text-muted-foreground mt-1">Einen Moment bitte</p>
          </CardContent>
        </Card>
      ) : filteredTodos.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            {searchQuery || activeFiltersCount > 0 ? (
              <>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
                  <Search className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-base font-semibold text-foreground">Keine Ergebnisse</p>
                <p className="text-sm text-muted-foreground mt-1 text-center max-w-sm">
                  Für Ihre aktuellen Filter und Suchbegriffe wurden keine Aufgaben gefunden
                </p>
                <Button variant="outline" className="mt-4" onClick={() => { setSearchQuery(""); clearFilters(); setStatusFilter("alle") }}>
                  Filter zurücksetzen
                </Button>
              </>
            ) : (
              <>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-4">
                  <ClipboardList className="h-6 w-6 text-primary" />
                </div>
                <p className="text-base font-semibold text-foreground">Noch keine Aufgaben</p>
                <p className="text-sm text-muted-foreground mt-1 text-center max-w-sm">
                  Erstellen Sie Ihre erste Aufgabe, um mit der Organisation zu beginnen
                </p>
                <Button className="mt-4 gap-2" onClick={() => { setEditTodo(null); setShowCreateDialog(true) }}>
                  <Plus className="h-4 w-4" />
                  Erste Aufgabe erstellen
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ) : viewMode === "list" ? (
        <div className="space-y-2">
          {filteredTodos.map((todo, index) => (
            <TodoCard
              key={todo.id} todo={todo} teamMembers={membersList}
              onStatusChange={handleStatusChange} onEdit={handleEdit} onDelete={handleConfirmDelete}
              viewMode="list" draggable={sortBy === "manual"}
              isDragging={draggedTodo?.id === todo.id} isDragOver={dragOverIndex === index}
              onDragStart={handleListDragStart} onDragOver={handleListDragOver}
              onDrop={handleListDrop} onDragEnd={handleDragEnd}
              index={index} sortBy={sortBy}
            />
          ))}
        </div>
      ) : viewMode === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(["high", "medium", "low"] as const).map((priority) => (
            <KanbanColumn
              key={priority}
              title={priority === "high" ? "Hohe Priorität" : priority === "medium" ? "Mittlere Priorität" : "Niedrige Priorität"}
              priority={priority} todos={kanbanGroups[priority]} teamMembers={membersList}
              onStatusChange={handleStatusChange} onEdit={handleEdit} onDelete={handleConfirmDelete}
              dragOverZone={dragOverZone} draggedTodo={draggedTodo}
              onDragOver={handleKanbanDragOver} onDragLeave={handleKanbanDragLeave}
              onDrop={handleKanbanDrop} onDragStart={handleKanbanDragStart} onDragEnd={handleDragEnd}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(["urgentImportant", "notUrgentImportant", "urgentNotImportant", "notUrgentNotImportant"] as const).map((type) => (
            <MatrixQuadrant
              key={type} type={type} todos={matrixGroups[type]} teamMembers={membersList}
              onStatusChange={handleStatusChange} onEdit={handleEdit} onDelete={handleConfirmDelete}
              dragOverZone={dragOverZone} draggedTodo={draggedTodo}
              onDragOver={handleKanbanDragOver} onDragLeave={handleKanbanDragLeave}
              onDrop={handleMatrixDrop} onDragStart={handleKanbanDragStart} onDragEnd={handleDragEnd}
            />
          ))}
        </div>
      )}

      <CreateTodoDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aufgabe löschen?</AlertDialogTitle>
            <AlertDialogDescription>Diese Aktion kann nicht rückgängig gemacht werden. Die Aufgabe wird permanent gelöscht.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Löschen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
