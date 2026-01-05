"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { usePractice } from "./practice-context"
import { toast } from "sonner"

export interface Todo {
  id: string
  title: string
  description?: string
  completed: boolean
  priority: "low" | "medium" | "high"
  due_date?: string
  assigned_to?: string
  assigned_user_ids?: string[]
  practice_id: string
  created_at: string
  updated_at: string
  dringend?: boolean // urgent
  wichtig?: boolean // important
  recurrence_type?: "none" | "daily" | "weekly" | "monthly" | "yearly"
  recurrence_end_date?: string
  parent_todo_id?: string
  is_recurring_instance?: boolean
  last_generated_date?: string
  attachments?: TodoAttachment[]
  manual_order?: number
}

export interface TodoAttachment {
  id: string
  todo_id: string
  practice_id: string
  attachment_type: "file" | "link"
  file_name?: string
  file_url?: string
  file_type?: string
  file_size?: number
  link_url?: string
  link_title?: string
  created_by?: string
  created_at: string
  updated_at: string
}

interface TodoContextType {
  todos: Todo[]
  addTodo: (todo: Omit<Todo, "id" | "created_at" | "updated_at" | "practice_id">) => Promise<Todo | null>
  updateTodo: (id: string, updates: Partial<Todo>) => Promise<void>
  deleteTodo: (id: string) => Promise<void>
  toggleTodo: (id: string) => Promise<void>
  getTodosByPractice: (practiceId: string) => Todo[]
  fetchTodos: () => Promise<void>
  isLoading: boolean
}

const TodoContext = createContext<TodoContextType | undefined>(undefined)

async function safeJsonParse(response: Response): Promise<any> {
  const text = await response.text()

  // Check if it's a rate limit response
  if (response.status === 429 || text.includes("Too Many") || text.includes("rate limit")) {
    console.warn("Rate limited, returning empty array")
    return []
  }

  try {
    return JSON.parse(text)
  } catch (e) {
    console.error("Failed to parse JSON:", text.substring(0, 100))
    return []
  }
}

export function TodoProvider({ children }: { children: ReactNode }) {
  const [todos, setTodos] = useState<Todo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { currentPractice, isLoading: practiceLoading } = usePractice()

  const fetchTodosInternal = async (practiceId: string, isMounted: { current: boolean }) => {
    if (!practiceId) {
      toast.error("Keine Praxis-ID gefunden. Bitte Seite neu laden.")
      setTodos([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/practices/${practiceId}/todos`)

      if (!isMounted.current) return

      if (response.status === 429) {
        console.warn("Todos fetch rate limited, will retry later")
        toast.warning("Zu viele Anfragen. Bitte warten Sie einen Moment.")
        setIsLoading(false)
        return
      }

      if (response.ok) {
        const data = await safeJsonParse(response)
        setTodos(Array.isArray(data) ? data : [])
      } else {
        toast.error("Fehler beim Laden der Todos")
        setTodos([])
      }
    } catch (error: any) {
      if (!isMounted.current) return
      toast.error("Fehler beim Laden der Todos")
      console.error("Todos fetch error:", error)
      setTodos([])
    } finally {
      if (isMounted.current) {
        setIsLoading(false)
      }
    }
  }

  const fetchTodos = async () => {
    if (currentPractice?.id) {
      await fetchTodosInternal(currentPractice.id, { current: true })
    }
  }

  useEffect(() => {
    const isMounted = { current: true }

    // Don't fetch until practice loading is complete
    if (practiceLoading) {
      return
    }

    if (currentPractice?.id) {
      fetchTodosInternal(currentPractice.id, isMounted)
    } else {
      setTodos([])
      setIsLoading(false)
    }

    return () => {
      isMounted.current = false
    }
  }, [currentPractice?.id, practiceLoading])

  const addTodo = async (todoData: Omit<Todo, "id" | "created_at" | "updated_at" | "practice_id">) => {
    if (!currentPractice) {
      toast.error("Keine Praxis ausgewählt. Bitte Seite neu laden.")
      return null
    }

    const cleanedData = {
      ...todoData,
      due_date: todoData.due_date && todoData.due_date.trim() !== "" ? todoData.due_date : null,
      recurrence_end_date:
        todoData.recurrence_end_date && todoData.recurrence_end_date.trim() !== ""
          ? todoData.recurrence_end_date
          : null,
    }

    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/todos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanedData),
      })

      if (response.ok) {
        const newTodo = await response.json()
        setTodos((prev) => {
          const updated = [newTodo, ...prev]
          return updated
        })
        toast.success("Todo erfolgreich erstellt")
        return newTodo
      } else {
        toast.error("Fehler beim Erstellen des Todos")
        console.error("TodoContext - Failed to add todo, status:", response.status)
        return null
      }
    } catch (error) {
      toast.error("Fehler beim Erstellen des Todos")
      console.error("Error adding todo:", error)
      return null
    }
  }

  const updateTodo = async (id: string, updates: Partial<Todo>) => {
    if (!currentPractice) {
      toast.error("Keine Praxis ausgewählt. Bitte Seite neu laden.")
      return
    }

    const cleanedUpdates = {
      ...updates,
      due_date: updates.due_date !== undefined && updates.due_date?.trim() === "" ? null : updates.due_date,
      recurrence_end_date:
        updates.recurrence_end_date !== undefined && updates.recurrence_end_date?.trim() === ""
          ? null
          : updates.recurrence_end_date,
    }

    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/todos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanedUpdates),
      })

      if (response.ok) {
        const updatedTodo = await response.json()
        setTodos((prev) => prev.map((todo) => (todo.id === id ? updatedTodo : todo)))
        toast.success("Todo erfolgreich aktualisiert")
      } else {
        toast.error("Fehler beim Aktualisieren des Todos")
      }
    } catch (error) {
      toast.error("Fehler beim Aktualisieren des Todos")
      console.error("Error updating todo:", error)
    }
  }

  const deleteTodo = async (id: string) => {
    if (!currentPractice) {
      toast.error("Keine Praxis ausgewählt. Bitte Seite neu laden.")
      return
    }

    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/todos/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setTodos((prev) => prev.filter((todo) => todo.id !== id))
        toast.success("Todo erfolgreich gelöscht")
      } else {
        toast.error("Fehler beim Löschen des Todos")
      }
    } catch (error) {
      toast.error("Fehler beim Löschen des Todos")
      console.error("Error deleting todo:", error)
    }
  }

  const toggleTodo = async (id: string) => {
    const todo = todos.find((t) => t.id === id)
    if (!todo) return

    await updateTodo(id, { completed: !todo.completed })
  }

  const getTodosByPractice = (practiceId: string) => {
    return todos.filter((todo) => todo.practice_id === practiceId)
  }

  return (
    <TodoContext.Provider
      value={{
        todos,
        addTodo,
        updateTodo,
        deleteTodo,
        toggleTodo,
        getTodosByPractice,
        fetchTodos,
        isLoading,
      }}
    >
      {children}
    </TodoContext.Provider>
  )
}

export function useTodos() {
  const context = useContext(TodoContext)
  if (context === undefined) {
    throw new Error("useTodos must be used within a TodoProvider")
  }
  return context
}

export default TodoProvider
