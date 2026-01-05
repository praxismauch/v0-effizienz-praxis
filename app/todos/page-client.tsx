"use client"

import { useState } from "react"
import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"
import { useTodos } from "@/contexts/todo-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Clock } from "lucide-react"
import { format } from "date-fns"
import { de } from "date-fns/locale"

type PageClientProps = {}

export default function PageClient(_props: PageClientProps) {
  const { user } = useUser()
  const { currentPractice } = usePractice()
  const { todos, loading, updateTodo } = useTodos()
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all")

  const filteredTodos = todos
    ?.filter((todo) => {
      const matchesSearch = todo.title?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesFilter = filter === "all" ? true : filter === "completed" ? todo.completed : !todo.completed
      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  const stats = {
    total: todos?.length || 0,
    active: todos?.filter((t) => !t.completed).length || 0,
    completed: todos?.filter((t) => t.completed).length || 0,
  }

  const handleToggle = async (todoId: string, completed: boolean) => {
    await updateTodo(todoId, { completed })
  }

  if (!user || !currentPractice) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Bitte melden Sie sich an</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Aufgaben</h1>
          <p className="text-muted-foreground">Verwalten Sie Ihre To-dos und Aufgaben</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Neue Aufgabe
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Gesamt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Aktiv</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Erledigt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Aufgabenliste</CardTitle>
          <CardDescription>Alle Ihre Aufgaben an einem Ort</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Aufgaben durchsuchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
                Alle
              </Button>
              <Button
                variant={filter === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("active")}
              >
                Aktiv
              </Button>
              <Button
                variant={filter === "completed" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("completed")}
              >
                Erledigt
              </Button>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Lädt...</p>
          ) : filteredTodos && filteredTodos.length > 0 ? (
            <div className="space-y-2">
              {filteredTodos.map((todo) => (
                <div
                  key={todo.id}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <Checkbox
                    checked={todo.completed}
                    onCheckedChange={(checked) => handleToggle(todo.id, checked as boolean)}
                  />
                  <div className="flex-1 space-y-1">
                    <p className={`font-medium ${todo.completed ? "line-through text-muted-foreground" : ""}`}>
                      {todo.title}
                    </p>
                    {todo.description && <p className="text-sm text-muted-foreground">{todo.description}</p>}
                    {todo.due_date && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Fällig: {format(new Date(todo.due_date), "d. MMM yyyy", { locale: de })}
                      </div>
                    )}
                  </div>
                  {todo.priority && (
                    <Badge variant={todo.priority === "high" ? "destructive" : "secondary"}>{todo.priority}</Badge>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              {searchQuery ? "Keine Aufgaben gefunden" : "Noch keine Aufgaben erstellt"}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
