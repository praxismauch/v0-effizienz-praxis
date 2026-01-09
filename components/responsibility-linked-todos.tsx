"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { usePractice } from "@/contexts/practice-context"
import { useToast } from "@/hooks/use-toast"
import { Clock, Link2, Plus, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface LinkedTodo {
  id: string
  title: string
  description?: string
  completed: boolean
  priority: "low" | "medium" | "high"
  due_date?: string
}

interface ResponsibilityLinkedTodosProps {
  responsibilityId: string
  responsibilityName: string
  onCreateTodo?: () => void
}

export function ResponsibilityLinkedTodos({
  responsibilityId,
  responsibilityName,
  onCreateTodo,
}: ResponsibilityLinkedTodosProps) {
  const { currentPractice } = usePractice()
  const { toast } = useToast()
  const [todos, setTodos] = useState<LinkedTodo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (currentPractice?.id && responsibilityId) {
      fetchLinkedTodos()
    }
  }, [currentPractice?.id, responsibilityId])

  const fetchLinkedTodos = async () => {
    if (!currentPractice?.id) return

    setLoading(true)
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/responsibilities/${responsibilityId}/todos`)
      if (response.ok) {
        const data = await response.json()
        setTodos(data || [])
      }
    } catch (error) {
      console.error("[v0] Error fetching linked todos:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleTodo = async (todoId: string, completed: boolean) => {
    if (!currentPractice?.id) return

    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/todos/${todoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !completed }),
      })

      if (response.ok) {
        setTodos((prev) => prev.map((todo) => (todo.id === todoId ? { ...todo, completed: !completed } : todo)))
      }
    } catch (error) {
      console.error("[v0] Error toggling todo:", error)
      toast({
        title: "Fehler",
        description: "Status konnte nicht geändert werden",
        variant: "destructive",
      })
    }
  }

  const priorityColors = {
    low: "bg-slate-100 text-slate-700",
    medium: "bg-amber-100 text-amber-700",
    high: "bg-red-100 text-red-700",
  }

  const priorityLabels = {
    low: "Niedrig",
    medium: "Mittel",
    high: "Hoch",
  }

  const completedCount = todos.filter((t) => t.completed).length
  const totalCount = todos.length

  if (loading) {
    return <div className="text-sm text-muted-foreground py-2">Lade verknüpfte Aufgaben...</div>
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Verknüpfte Aufgaben</span>
          {totalCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {completedCount}/{totalCount}
            </Badge>
          )}
        </div>
        {onCreateTodo && (
          <Button variant="ghost" size="sm" onClick={onCreateTodo} className="h-7 text-xs">
            <Plus className="h-3 w-3 mr-1" />
            Aufgabe
          </Button>
        )}
      </div>

      {todos.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">Keine Aufgaben verknüpft</p>
      ) : (
        <div className="space-y-2">
          {todos.map((todo) => (
            <div
              key={todo.id}
              className={cn(
                "flex items-start gap-2 p-2 rounded-md border bg-background/50 hover:bg-muted/50 transition-colors",
                todo.completed && "opacity-60",
              )}
            >
              <Checkbox
                checked={todo.completed}
                onCheckedChange={() => toggleTodo(todo.id, todo.completed)}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn("text-sm truncate", todo.completed && "line-through text-muted-foreground")}>
                    {todo.title}
                  </span>
                  <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0", priorityColors[todo.priority])}>
                    {priorityLabels[todo.priority]}
                  </Badge>
                </div>
                {todo.due_date && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <Clock className="h-3 w-3" />
                    {new Date(todo.due_date).toLocaleDateString("de-DE")}
                  </div>
                )}
              </div>
              <Link href={`/todos?id=${todo.id}`}>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
