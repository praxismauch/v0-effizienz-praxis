"use client"

import { createContext, useContext, useMemo, useCallback, type ReactNode } from "react"
import useSWR, { useSWRConfig } from "swr"
import { usePractice } from "./practice-context"
import { SWR_KEYS, DEFAULT_PRACTICE_ID } from "@/lib/swr-keys"
import { swrFetcher, mutationFetcher } from "@/lib/swr-fetcher"
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
  dringend?: boolean
  wichtig?: boolean
  recurrence_type?: "none" | "daily" | "weekly" | "monthly" | "yearly"
  recurrence_end_date?: string
  parent_todo_id?: string
  is_recurring_instance?: boolean
  last_generated_date?: string
  attachments?: TodoAttachment[]
  manual_order?: number
  status?: "offen" | "in_bearbeitung" | "erledigt" | "abgebrochen"
  orga_category_id?: string
  created_by?: string
  responsibility_id?: string
  assigned_team_ids?: string[]
  recurring?: boolean
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

export function TodoProvider({ children }: { children: ReactNode }) {
  const { currentPractice, isLoading: practiceLoading } = usePractice()
  const { mutate: globalMutate } = useSWRConfig()

  const practiceId = currentPractice?.id || DEFAULT_PRACTICE_ID

  const { data, error, isLoading, mutate } = useSWR<Todo[]>(
    !practiceLoading ? SWR_KEYS.todos(practiceId) : null,
    swrFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    },
  )

  const todos = data || []

  const fetchTodos = useCallback(async () => {
    await mutate()
  }, [mutate])

  const addTodo = useCallback(
    async (todoData: Omit<Todo, "id" | "created_at" | "updated_at" | "practice_id">) => {
      const cleanedData = {
        ...todoData,
        due_date: todoData.due_date && todoData.due_date.trim() !== "" ? todoData.due_date : null,
        recurrence_end_date:
          todoData.recurrence_end_date && todoData.recurrence_end_date.trim() !== ""
            ? todoData.recurrence_end_date
            : null,
      }

      try {
        const newTodo = await mutationFetcher<Todo>(SWR_KEYS.todos(practiceId), {
          method: "POST",
          body: cleanedData,
        })

        await mutate((current) => [newTodo, ...(current || [])], { revalidate: false })

        toast.success("Todo erfolgreich erstellt")
        return newTodo
      } catch (error) {
        toast.error("Fehler beim Erstellen des Todos")
        console.error("Error adding todo:", error)
        return null
      }
    },
    [practiceId, mutate],
  )

  const updateTodo = useCallback(
    async (id: string, updates: Partial<Todo>) => {
      const cleanedUpdates = {
        ...updates,
        due_date: updates.due_date !== undefined && updates.due_date?.trim() === "" ? null : updates.due_date,
        recurrence_end_date:
          updates.recurrence_end_date !== undefined && updates.recurrence_end_date?.trim() === ""
            ? null
            : updates.recurrence_end_date,
      }

      const previousTodos = todos
      await mutate(
        (current) => (current || []).map((todo) => (todo.id === id ? { ...todo, ...cleanedUpdates } : todo)),
        { revalidate: false },
      )

      try {
        await mutationFetcher(`${SWR_KEYS.todos(practiceId)}/${id}`, {
          method: "PUT",
          body: cleanedUpdates,
        })
        toast.success("Todo erfolgreich aktualisiert")
        // Revalidate to sync with server
        await mutate()
      } catch (error) {
        // Rollback on error
        await mutate(previousTodos, { revalidate: false })
        toast.error("Fehler beim Aktualisieren des Todos")
        console.error("Error updating todo:", error)
      }
    },
    [practiceId, mutate, todos],
  )

  const deleteTodo = useCallback(
    async (id: string) => {
      const previousTodos = todos
      await mutate((current) => (current || []).filter((todo) => todo.id !== id), { revalidate: false })

      try {
        await mutationFetcher(`${SWR_KEYS.todos(practiceId)}/${id}`, {
          method: "DELETE",
        })
        toast.success("Todo erfolgreich gelöscht")
      } catch (error) {
        // Rollback on error
        await mutate(previousTodos, { revalidate: false })
        toast.error("Fehler beim Löschen des Todos")
        console.error("Error deleting todo:", error)
      }
    },
    [practiceId, mutate, todos],
  )

  const toggleTodo = useCallback(
    async (id: string) => {
      const todo = todos.find((t) => t.id === id)
      if (!todo) return

      await updateTodo(id, { completed: !todo.completed })
    },
    [todos, updateTodo],
  )

  const getTodosByPractice = useCallback(
    (practiceId: string) => {
      return todos.filter((todo) => todo.practice_id === practiceId)
    },
    [todos],
  )

  const contextValue = useMemo(
    () => ({
      todos,
      addTodo,
      updateTodo,
      deleteTodo,
      toggleTodo,
      getTodosByPractice,
      fetchTodos,
      isLoading: practiceLoading || isLoading,
    }),
    [todos, addTodo, updateTodo, deleteTodo, toggleTodo, getTodosByPractice, fetchTodos, practiceLoading, isLoading],
  )

  return <TodoContext.Provider value={contextValue}>{children}</TodoContext.Provider>
}

export function useTodos() {
  const context = useContext(TodoContext)
  if (context === undefined) {
    throw new Error("useTodos must be used within a TodoProvider")
  }
  return context
}

export default TodoProvider
