"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, ListTodo, LayoutGrid, Columns3, CheckCircle2, Clock, AlertCircle, Sparkles } from "lucide-react"
import { useTodos, type Todo } from "@/contexts/todo-context"
import { usePractice } from "@/contexts/practice-context"
import { useUser } from "@/contexts/user-context"
import { useTeam } from "@/contexts/team-context"
import { Skeleton } from "@/components/ui/skeleton"
import CreateTodoDialog from "@/components/create-todo-dialog"
import { TodoCard } from "./components/todo-card"
import { KanbanColumn } from "./components/kanban-column"
import { MatrixQuadrant } from "./components/matrix-quadrant"
import { AppLayout } from "@/components/app-layout"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type ViewMode = "list" | "kanban" | "matrix"
type FilterStatus = "all" | "offen" | "in_bearbeitung" | "erledigt"
type FilterPriority = "all" | "high" | "medium" | "low"

export default function TodosPageClient() {
  const { todos, updateTodo, deleteTodo, isLoading } = useTodos()
  const { currentPractice, isLoading: practiceLoading } = usePractice()
  const { currentUser, loading: authLoading } = useUser()
  const { teamMembers, loading: teamLoading } = useTeam()
  const { toast } = useToast()

  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all")
  const [filterPriority, setFilterPriority] = useState<FilterPriority>("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)

  // Filter todos based on search and filters
  const filteredTodos = todos.filter((todo) => {
    const matchesSearch =
      todo.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      todo.description?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = filterStatus === "all" || todo.status === filterStatus
    const matchesPriority = filterPriority === "all" || todo.priority === filterPriority

    return matchesSearch && matchesStatus && matchesPriority
  })

  // Calculate statistics
  const stats = {
    total: todos.length,
    open: todos.filter((t) => t.status === "offen").length,
    inProgress: todos.filter((t) => t.status === "in_bearbeitung").length,
    completed: todos.filter((t) => t.status === "erledigt").length,
    overdue: todos.filter((t) => {
      if (!t.due_date || t.status === "erledigt") return false
      return new Date(t.due_date) < new Date()
    }).length,
  }

  const handleStatusChange = async (todoId: string, status: string) => {
    try {
      await updateTodo(todoId, { status: status as Todo["status"] })
    } catch (error) {
      console.error("[v0] Error updating todo status:", error)
      toast({
        title: "Fehler",
        description: "Status konnte nicht aktualisiert werden",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (todo: Todo) => {
    setEditingTodo(todo)
    setIsCreateDialogOpen(true)
  }

  const handleDelete = async (todoId: string) => {
    if (!confirm("Möchten Sie diese Aufgabe wirklich löschen?")) return

    try {
      await deleteTodo(todoId)
      toast({
        title: "Gelöscht",
        description: "Aufgabe wurde erfolgreich gelöscht",
      })
    } catch (error) {
      console.error("[v0] Error deleting todo:", error)
      toast({
        title: "Fehler",
        description: "Aufgabe konnte nicht gelöscht werden",
        variant: "destructive",
      })
    }
  }

  if (authLoading || practiceLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Aufgaben</h1>
            <p className="text-muted-foreground">Organisieren und verwalten Sie Ihre Aufgaben</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Neue Aufgabe
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Gesamt</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                Offen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{stats.open}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Columns3 className="h-4 w-4 text-blue-500" />
                In Bearbeitung
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Erledigt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                Überfällig
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Aufgaben durchsuchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as FilterStatus)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="offen">Offen</SelectItem>
                <SelectItem value="in_bearbeitung">In Bearbeitung</SelectItem>
                <SelectItem value="erledigt">Erledigt</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPriority} onValueChange={(value) => setFilterPriority(value as FilterPriority)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Priorität" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Prioritäten</SelectItem>
                <SelectItem value="high">Hoch</SelectItem>
                <SelectItem value="medium">Mittel</SelectItem>
                <SelectItem value="low">Niedrig</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1.5 p-1 bg-muted rounded-lg">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="gap-2"
            >
              <ListTodo className="h-4 w-4" />
              Liste
            </Button>
            <Button
              variant={viewMode === "kanban" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("kanban")}
              className="gap-2"
            >
              <Columns3 className="h-4 w-4" />
              Kanban
            </Button>
            <Button
              variant={viewMode === "matrix" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("matrix")}
              className="gap-2"
            >
              <LayoutGrid className="h-4 w-4" />
              Matrix
            </Button>
          </div>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : filteredTodos.length === 0 ? (
          <Card className="p-12 text-center">
            <ListTodo className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">Keine Aufgaben gefunden</h3>
            <p className="mt-2 text-muted-foreground">
              {searchQuery
                ? "Versuchen Sie eine andere Suche."
                : "Erstellen Sie Ihre erste Aufgabe, um loszulegen."}
            </p>
            {!searchQuery && (
              <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Aufgabe erstellen
              </Button>
            )}
          </Card>
        ) : (
          <>
            {/* List View */}
            {viewMode === "list" && (
              <div className="space-y-3">
                {filteredTodos.map((todo) => (
                  <TodoCard
                    key={todo.id}
                    todo={todo}
                    teamMembers={teamMembers || []}
                    onStatusChange={handleStatusChange}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    viewMode="list"
                  />
                ))}
              </div>
            )}

            {/* Kanban View */}
            {viewMode === "kanban" && (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <KanbanColumn
                  title="Hoch"
                  priority="high"
                  todos={filteredTodos.filter((t) => t.priority === "high")}
                  teamMembers={teamMembers || []}
                  onStatusChange={handleStatusChange}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
                <KanbanColumn
                  title="Mittel"
                  priority="medium"
                  todos={filteredTodos.filter((t) => t.priority === "medium")}
                  teamMembers={teamMembers || []}
                  onStatusChange={handleStatusChange}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
                <KanbanColumn
                  title="Niedrig"
                  priority="low"
                  todos={filteredTodos.filter((t) => t.priority === "low")}
                  teamMembers={teamMembers || []}
                  onStatusChange={handleStatusChange}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </div>
            )}

            {/* Matrix View */}
            {viewMode === "matrix" && (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <MatrixQuadrant
                  title="Dringend & Wichtig"
                  subtitle="Sofort erledigen"
                  dringend={true}
                  wichtig={true}
                  todos={filteredTodos.filter((t) => t.dringend && t.wichtig)}
                  teamMembers={teamMembers || []}
                  onStatusChange={handleStatusChange}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  variant="urgent"
                />
                <MatrixQuadrant
                  title="Nicht Dringend & Wichtig"
                  subtitle="Einplanen"
                  dringend={false}
                  wichtig={true}
                  todos={filteredTodos.filter((t) => !t.dringend && t.wichtig)}
                  teamMembers={teamMembers || []}
                  onStatusChange={handleStatusChange}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  variant="important"
                />
                <MatrixQuadrant
                  title="Dringend & Nicht Wichtig"
                  subtitle="Delegieren"
                  dringend={true}
                  wichtig={false}
                  todos={filteredTodos.filter((t) => t.dringend && !t.wichtig)}
                  teamMembers={teamMembers || []}
                  onStatusChange={handleStatusChange}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  variant="delegate"
                />
                <MatrixQuadrant
                  title="Nicht Dringend & Nicht Wichtig"
                  subtitle="Später oder löschen"
                  dringend={false}
                  wichtig={false}
                  todos={filteredTodos.filter((t) => !t.dringend && !t.wichtig)}
                  teamMembers={teamMembers || []}
                  onStatusChange={handleStatusChange}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  variant="low"
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <CreateTodoDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
    </AppLayout>
  )
}
