export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { getCurrentUser, getCurrentPracticeId } from "@/lib/server/get-current-user"
import { getTodoData } from "@/lib/server/get-todo-data"
import { AppLayout } from "@/components/app-layout"
import PageClient from "./page-client-refactored"

export default async function TodosPage() {
  // Fetch user and practice data server-side
  const [user, practiceId] = await Promise.all([
    getCurrentUser(),
    getCurrentPracticeId(),
  ])
  
  // Redirect if not authenticated
  if (!user) {
    redirect("/auth/login")
  }
  
  // Fetch todo data if practice exists
  const todoData = practiceId ? await getTodoData(practiceId) : null

  return (
    <AppLayout>
      <PageClient 
        initialTodos={todoData?.todos || []}
        practiceId={practiceId}
        user={user}
      />
    </AppLayout>
  )
}

/* OLD CLIENT CODE MOVED TO page-client-refactored.tsx
import { useState, useEffect, useMemo, useRef } from "react"
import { useTodos, type Todo, type TodoAttachment } from "@/contexts/todo-context"
import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calendar,
  AlertTriangle,
  Clock,
  Paperclip,
  LinkIcon,
  FileText,
  LayoutList,
  KanbanIcon,
  LayoutGrid,
  GripVertical,
  Flag,
  Plus,
  Search,
  Filter,
  ChevronDown,
  CheckCircle2,
  Sparkles,
  ListTodo,
  CircleCheckBig,
  Edit,
  Trash2,
  ArrowUpDown,
  Brain,
} from "lucide-react"
import { cn, formatDateDE } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { useRouter, useSearchParams } from "next/navigation"
import { isPracticeAdminRole, isSuperAdminRole } from "@/lib/auth-utils"
import React from "react" // Added for React.useState
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar" // Import Avatar components
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip" // Import Tooltip components

// REMOVED IMPORT: import { SidebarProvider } from "@/components/ui/sidebar" // ADDED IMPORT
import { StatCard, statCardColors } from "@/components/ui/stat-card"
import { TaskDistributionTab } from "@/components/task-distribution-tab" // Added import for TaskDistributionTab
import CreateTodoDialog from "@/components/create-todo-dialog"

export default function TodosPage() {
  const { todos, addTodo, updateTodo, deleteTodo, isLoading, fetchTodos } = useTodos() // Added fetchTodos
  const { currentUser } = useUser()
  const { currentPractice } = usePractice()
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  // Use practice context for practiceId (supports practice switching for super admins)
  const practiceId = currentPractice?.id?.toString() || ""
  const isAdmin = isPracticeAdminRole(currentUser?.role) || isSuperAdminRole(currentUser?.role)

  // Menu bar state
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([])
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([])
  const [sortBy, setSortBy] = useState("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [showCompleted, setShowCompleted] = useState(false)
  const [showOverdue, setShowOverdue] = useState(false)
  const [viewMode, setViewMode] = useState<"list" | "kanban" | "matrix" | "distribution">("list") // Updated viewMode state

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("todoViewMode")
      if (saved === "list" || saved === "kanban" || saved === "matrix") {
        setViewMode(saved as "list" | "kanban" | "matrix")
      } else if (saved === "distribution" && isAdmin) {
        // Handle distribution view mode
        setViewMode("distribution")
      }
    }
  }, [isAdmin])

  // Filter states for new filter dropdowns
  const [statusFilter, setStatusFilter] = useState<"alle" | "offen" | "in_bearbeitung" | "erledigt" | "abgebrochen">(
    "alle",
  )
  const [priorityFilter, setPriorityFilter] = useState<"alle" | "niedrig" | "mittel" | "hoch" | "kritisch">("alle")

  // Dialog state
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high",
    due_date: "",
    assigned_to: "",
    recurrence_type: "none" as "none" | "daily" | "weekly" | "monthly" | "yearly",
    recurrence_end_date: "",
    dringend: false,
    wichtig: false,
    status: "offen" as "offen" | "in_bearbeitung" | "erledigt" | "abgebrochen", // Added status
  })
  const [assignedUserIds, setAssignedUserIds] = useState<string[]>([])
  const [attachments, setAttachments] = useState<TodoAttachment[]>([])

  const [pastedFiles, setPastedFiles] = useState<
    Array<{ url: string; file_name: string; file_size: number; file_type: string }>
  >([])
  const [isUploadingFile, setIsUploadingFile] = useState(false)

  // Team members for assignment
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const hasProcessedUrlParam = useRef(false)

  const [draggedOverIndex, setDraggedOverIndex] = useState<number | null>(null)

  // Drag and drop state
  const [draggedTodo, setDraggedTodo] = React.useState<Todo | null>(null)
  const [dragOverZone, setDragOverZone] = React.useState<string | null>(null)

  const [isGeneratingAi, setIsGeneratingAi] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([])
  const [showAiDialog, setShowAiDialog] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [todoToDelete, setTodoToDelete] = useState<string | null>(null) // ADDED STATE

  const stats = useMemo(() => {
    const total = todos.length
    const completed = todos.filter((t) => t.completed).length
    const pending = todos.filter((t) => !t.completed).length
    const overdue = todos.filter((t) => {
      if (t.completed) return false
      if (!t.due_date) return false
      return new Date(t.due_date) < new Date()
    }).length
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    return { total, completed, pending, overdue, completionRate }
  }, [todos])

  const generateAiSuggestions = async () => {
    if (!currentPractice) return

    setIsGeneratingAi(true)
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/ai-todo-suggestions`, {
        method: "POST",
      })

      if (response.ok) {
        const data = await response.json()
        setAiSuggestions(data.suggestions || [])
        setShowAiDialog(true)
      } else {
        toast({
          title: "Fehler",
          description: "KI-Vorschläge konnten nicht generiert werden",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error generating AI suggestions:", error)
      toast({
        title: "Fehler",
        description: "Ein Fehler ist aufgetreten",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingAi(false)
    }
  }

  const acceptAiSuggestion = async (suggestion: any) => {
    try {
      const todoData = {
        title: suggestion.title,
        description: suggestion.description || "",
        priority: suggestion.priority || "medium",
        due_date: suggestion.due_date || null,
        practice_id: currentPractice?.id,
        assigned_to: suggestion.assigned_to || null,
        dringend: false,
        wichtig: false,
        // Include assigned_user_ids from suggestion if available
        assigned_user_ids: suggestion.assigned_user_ids || [],
      }

      await addTodo(todoData)

      toast({
        title: "Erfolg",
        description: "Aufgabe wurde hinzugefügt",
      })

      setAiSuggestions((prev) => prev.filter((s) => s !== suggestion))
      if (aiSuggestions.length <= 1) {
        setShowAiDialog(false)
      }
    } catch (error) {
      console.error("[v0] Error accepting AI suggestion:", error)
      toast({
        title: "Fehler",
        description: "Aufgabe konnte nicht erstellt werden",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    if (currentPractice?.id) {
      fetchTeamMembers()
    }
  }, [currentPractice?.id])

  const fetchTeamMembers = async () => {
    if (!currentPractice?.id) return

    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/team-members`)
        if (response.ok) {
          const data = await response.json()
          setTeamMembers(data.teamMembers || [])
        }
    } catch (error) {
      console.error("[v0] Error fetching team members:", error)
    }
  }

  useEffect(() => {
    const shouldCreate = searchParams?.get("create")

    if (shouldCreate === "true" && !hasProcessedUrlParam.current) {
      console.log("[v0] Opening create dialog from URL parameter")
      hasProcessedUrlParam.current = true
      setShowCreateDialog(true)
      // Clean up the URL parameter without triggering re-render
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete("create")
      window.history.replaceState({}, "", newUrl.toString())
    }
  }, [searchParams])

  // Filter and sort todos
  const filteredAndSortedTodos = useMemo(() => {
    let filtered = [...todos]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (todo) =>
          todo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (todo.description && todo.description.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    }

    // Status filter
    if (statusFilter !== "alle") {
      if (statusFilter === "offen") {
        filtered = filtered.filter((todo) => todo.status === "offen")
      } else if (statusFilter === "in_bearbeitung") {
        filtered = filtered.filter((todo) => todo.status === "in_bearbeitung")
      } else if (statusFilter === "erledigt") {
        filtered = filtered.filter((todo) => todo.status === "erledigt")
      } else if (statusFilter === "abgebrochen") {
        filtered = filtered.filter((todo) => todo.status === "abgebrochen")
      }
    }

    // Priority filter
    if (priorityFilter !== "alle") {
      if (priorityFilter === "kritisch") {
        // Assuming critical implies high priority or urgent
        filtered = filtered.filter((todo) => todo.priority === "high" || todo.dringend)
      } else {
        filtered = filtered.filter((todo) => todo.priority === priorityFilter)
      }
    }

    // Assignee filter
    if (selectedAssignees.length > 0) {
      // Filter based on assigned_user_ids
      filtered = filtered.filter((todo) => todo.assigned_user_ids?.some((userId) => selectedAssignees.includes(userId)))
    }

    // Completed filter (This might be redundant with status filter if 'erledigt' status is used)
    if (!showCompleted) {
      filtered = filtered.filter((todo) => todo.status !== "erledigt")
    }

    // Overdue filter
    if (showOverdue) {
      filtered = filtered.filter((todo) => {
        if (!todo.due_date) return false
        return new Date(todo.due_date) < new Date() && todo.status !== "erledigt"
      })
    }

    // Sort
    filtered.sort((a, b) => {
      let compareA: any, compareB: any

      switch (sortBy) {
        case "manual":
          compareA = a.manual_order ?? 999999
          compareB = b.manual_order ?? 999999
          break
        case "title":
          compareA = a.title.toLowerCase()
          compareB = b.title.toLowerCase()
          break
        case "priority":
          const priorityOrder = { high: 3, medium: 2, low: 1 }
          compareA = priorityOrder[a.priority]
          compareB = priorityOrder[b.priority]
          break
        case "due_date":
          compareA = a.due_date ? new Date(a.due_date).getTime() : 0
          compareB = b.due_date ? new Date(b.due_date).getTime() : 0
          break
        case "created_at":
          compareA = new Date(a.created_at).getTime()
          compareB = new Date(b.created_at).getTime()
          break
        case "assignedTo":
          // Sort by the first assigned user if multiple are assigned
          compareA = a.assigned_user_ids?.[0] || ""
          compareB = b.assigned_user_ids?.[0] || ""
          break
        default:
          compareA = new Date(a.created_at).getTime()
          compareB = new Date(b.created_at).getTime()
      }

      // Apply sortOrder
      if (sortOrder === "asc") {
        return compareA > compareB ? 1 : -1
      } else {
        return compareA < compareB ? 1 : -1
      }
    })

    return filtered
  }, [
    todos,
    searchQuery,
    statusFilter,
    priorityFilter,
    selectedAssignees,
    showCompleted,
    showOverdue,
    sortBy,
    sortOrder,
  ])

  const availableAssignees = useMemo(() => {
    // Return user IDs for filtering
    return teamMembers.map((member) => member.id)
  }, [teamMembers])

  const activeFiltersCount =
    selectedPriorities.length + selectedAssignees.length + (showOverdue ? 1 : 0) + (showCompleted ? 1 : 0)

  const handleClearFilters = () => {
    setSelectedPriorities([])
    setSelectedAssignees([])
    setShowOverdue(false)
    setShowCompleted(false)
    setStatusFilter("alle")
    setPriorityFilter("alle")
  }

  const handleCreateTodo = async (todoData: Partial<Todo>) => {
    setEditingTodo(null)
    setFormData({
      title: "",
      description: "",
      priority: "medium",
      due_date: "",
      assigned_to: "",
      recurrence_type: "none",
      recurrence_end_date: "",
      dringend: false,
      wichtig: false,
      status: "offen", // Default status for new todo
    })
    setAssignedUserIds([])
    setAttachments([])
    setPastedFiles([]) // Clear pasted files when opening the dialog for a new todo
    setShowCreateDialog(true)
  }

  const handleEditTodo = (todo: Todo) => {
    setEditingTodo(todo)
    setFormData({
      title: todo.title,
      description: todo.description || "",
      priority: todo.priority,
      due_date: todo.due_date || "",
      assigned_to: todo.assigned_to || "", // Kept for backward compatibility, but assignedUserIds is primary
      recurrence_type: todo.recurrence_type || "none",
      recurrence_end_date: todo.recurrence_end_date || "",
      dringend: todo.dringend || false,
      wichtig: todo.wichtig || false,
      status: todo.status || "offen", // Ensure status is set
    })
    setAssignedUserIds(todo.assigned_user_ids || [])
    setAttachments(todo.attachments || [])
    setShowCreateDialog(true)
  }

  const handleSaveTodo = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie einen Titel ein",
        variant: "destructive",
      })
      return
    }

    try {
      const todoData = {
        ...formData,
        due_date: formData.due_date || null,
        recurrence_end_date: formData.recurrence_end_date || null,
        assigned_user_ids: assignedUserIds.length > 0 ? assignedUserIds : [], // Always send array
        completed: formData.status === "erledigt",
      }

      console.log("[v0] Saving todo with assigned_user_ids:", assignedUserIds)

      if (editingTodo) {
        await updateTodo(editingTodo.id, todoData)

        // Save attachments separately if todo exists
        if (attachments.length > 0) {
          await saveAttachments(editingTodo.id, attachments)
        }

        toast({
          title: "Gespeichert",
          description: "Aufgabe wurde aktualisiert",
        })
      } else {
        // For new todos, we need to get the ID after creation
        await addTodo(todoData)

        // If there are attachments, we'd need to save them after getting the todo ID
        // This would require modifying the addTodo function to return the created todo
        if (attachments.length > 0) {
          toast({
            title: "Hinweis",
            description: "Anhänge werden beim nächsten Bearbeiten gespeichert",
          })
        }

        toast({
          title: "Erstellt",
          description: "Neue Aufgabe wurde erstellt",
        })
      }

      setShowCreateDialog(false)
      // Reset form state after successful save and dialog close
      setEditingTodo(null)
      setFormData({
        title: "",
        description: "",
        priority: "medium",
        due_date: "",
        assigned_to: "",
        recurrence_type: "none",
        recurrence_end_date: "",
        dringend: false,
        wichtig: false,
        status: "offen", // Reset to default status
      })
      setAssignedUserIds([])
      setAttachments([])
    } catch (error) {
      console.error("[v0] Error saving todo:", error)
      toast({
        title: "Fehler",
        description: "Aufgabe konnte nicht gespeichert werden",
        variant: "destructive",
      })
    }
  }

  const saveAttachments = async (todoId: string, attachments: TodoAttachment[]) => {
    if (!currentPractice?.id) return

    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/todos/${todoId}/attachments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attachments }),
      })

      if (!response.ok) {
        throw new Error("Failed to save attachments")
      }
    } catch (error) {
      console.error("[v0] Error saving attachments:", error)
      throw error
    }
  }

  const handleDeleteTodo = async (todoId: string) => {
    // REMOVED: Original confirmation logic
    // if (confirm("Möchten Sie diese Aufgabe wirklich löschen?")) {
    //   await deleteTodo(todoId)
    //   toast({
    //     title: "Gelöscht",
    //     description: "Aufgabe wurde gelöscht",
    //   })
    // }
    setTodoToDelete(todoId) // ADDED SET TODO TO DELETE
  }

  const handleListDragStart = (e: React.DragEvent, todo: Todo, index: number) => {
    setDraggedTodo(todo)
    e.dataTransfer.effectAllowed = "move"
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.5"
    }
  }

  const handleListDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDraggedOverIndex(index)
  }

  const handleListDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    setDraggedOverIndex(null)

    if (!draggedTodo) return

    const draggedIndex = filteredAndSortedTodos.findIndex((t) => t.id === draggedTodo.id)
    if (draggedIndex === dropIndex) {
      setDraggedTodo(null)
      return
    }

    try {
      // Reorder the list
      const reordered = [...filteredAndSortedTodos]
      const [removed] = reordered.splice(draggedIndex, 1)
      reordered.splice(dropIndex, 0, removed)

      // Update manual_order for all affected todos
      const updates = reordered.map((todo, idx) => ({
        id: todo.id,
        manual_order: idx,
      }))

      // Update all todos in parallel
      await Promise.all(updates.map((update) => updateTodo(update.id, { manual_order: update.manual_order })))

      toast({
        title: "Reihenfolge aktualisiert",
        description: "Die Aufgaben wurden neu sortiert",
      })
    } catch (error) {
      console.error("[v0] Error reordering todos:", error)
      toast({
        title: "Fehler",
        description: "Reihenfolge konnte nicht aktualisiert werden",
        variant: "destructive",
      })
    } finally {
      setDraggedTodo(null)
    }
  }

  const handleListDragEnd = (e: React.DragEvent) => {
    setDraggedOverIndex(null)
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1"
    }
    setDraggedTodo(null)
  }

  const handleDragStart = (e: React.DragEvent, todo: Todo) => {
    setDraggedTodo(todo)
    e.dataTransfer.effectAllowed = "move"
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.5"
    }
  }

  const handleDragOver = (e: React.DragEvent, zoneId?: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    if (zoneId) {
      setDragOverZone(zoneId)
    }
  }

  const handleDrop = async (
    e: React.DragEvent,
    targetPriority?: string,
    targetDringend?: boolean,
    targetWichtig?: boolean,
  ) => {
    e.preventDefault()
    setDragOverZone(null)

    if (!draggedTodo) return

    try {
      // Determine the new priority, sedangkan, and wichtig values based on drop target
      const updates: any = {}

      if (targetPriority !== undefined) {
        updates.priority = targetPriority
      }

      if (targetDringend !== undefined) {
        updates.dringend = targetDringend
      }

      if (targetWichtig !== undefined) {
        updates.wichtig = targetWichtig
      }

      // Only update if there are changes
      if (Object.keys(updates).length > 0) {
        await updateTodo(draggedTodo.id, updates)
        toast({
          title: "Verschoben",
          description: "Aufgabe wurde erfolgreich verschoben",
        })
      }
    } catch (error) {
      console.error("[v0] Error dropping todo:", error)
      toast({
        title: "Fehler",
        description: "Aufgabe konnte nicht verschoben werden",
        variant: "destructive",
      })
    } finally {
      setDraggedTodo(null)
    }
  }

  const handleDragEnd = (e: React.DragEvent) => {
    setDragOverZone(null)
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1"
    }
    setDraggedTodo(null)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if we're leaving the drop zone container itself
    if (e.currentTarget === e.target) {
      setDragOverZone(null)
    }
  }

  // CHANGE: Only send the fields that need to be updated, not the entire todo object
  const handleStatusChange = (todoId: string, newStatus: string) => {
    const todo = todos.find((t) => t.id === todoId)
    if (!todo) return

    // Determine if the todo should be marked as completed
    const isCompleted = newStatus === "erledigt"

    updateTodo(todoId, { status: newStatus as any, completed: isCompleted })

    toast({
      title: "Status aktualisiert",
      description: `Aufgabe "${todo.title}" wurde als ${newStatus} markiert.`,
    })
  }

  const handleCloseDialog = () => {
    setShowCreateDialog(false)
    setEditingTodo(null)
    setFormData({
      title: "",
      description: "",
      priority: "medium",
      due_date: "",
      assigned_to: "",
      recurrence_type: "none",
      recurrence_end_date: "",
      dringend: false,
      wichtig: false,
      status: "offen", // Reset to default status
    })
    setAssignedUserIds([])
    setAttachments([])
    // Clear pasted files state
    setPastedFiles([])
  }

  const handleDescriptionPaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items
    if (!items) return

    // Check if clipboard contains files
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.kind === "file") {
        e.preventDefault() // Prevent default paste behavior

        const file = item.getAsFile()
        if (!file) continue

        setIsUploadingFile(true)
        try {
          // Upload file to Blob storage
          const formData = new FormData()
          formData.append("file", file)

          const response = await fetch(`/api/practices/${practiceId}/todos/upload-image`, {
            method: "POST",
            body: formData,
          })

          if (!response.ok) {
            throw new Error("Upload fehlgeschlagen")
          }

          const data = await response.json()

          // Add file to pasted files list
          setPastedFiles((prev) => [
            ...prev,
            {
              url: data.url,
              file_name: data.filename,
              file_size: data.size,
              file_type: data.type,
            },
          ])

          toast({
            title: "Datei eingefügt",
            description: `${file.name} wurde erfolgreich hochgeladen`,
          })
        } catch (error) {
          console.error("[v0] Error uploading pasted file:", error)
          toast({
            title: "Fehler",
            description: "Datei konnte nicht hochgeladen werden",
            variant: "destructive",
          })
        } finally {
          setIsUploadingFile(false)
        }
        break // Only handle the first file
      }
    }
  }

  // Submit handler that saves pasted files as attachments
  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie einen Titel ein",
        variant: "destructive",
      })
      return
    }

    try {
      const todoData = {
        ...formData,
        practice_id: practiceId,
        assigned_user_ids: assignedUserIds,
        due_date: formData.due_date || null,
        recurrence_end_date: formData.recurrence_end_date || null,
        // We use the status from formData directly now.
        // The 'completed' status is derived from formData.status === 'erledigt'
        completed: formData.status === "erledigt",
      }

      let savedTodo
      if (editingTodo) {
        // When updating, ensure we pass the correct 'completed' status based on the current form state
        savedTodo = await updateTodo(editingTodo.id, {
          ...todoData,
          completed: formData.status === "erledigt",
        })
      } else {
        savedTodo = await addTodo(todoData)
      }

      if (pastedFiles.length > 0 && savedTodo?.id) {
        for (const file of pastedFiles) {
          await fetch(`/api/practices/${practiceId}/todos/${savedTodo.id}/attachments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              attachment_type: "file",
              file_url: file.url,
              file_name: file.file_name,
              file_type: file.file_type.startsWith("image/") ? "image" : "document",
              file_size: file.file_size,
            }),
          })
        }
      }

      toast({
        title: editingTodo ? "Aufgabe aktualisiert" : "Aufgabe erstellt",
        description: editingTodo
          ? "Die Aufgabe wurde erfolgreich aktualisiert"
          : "Die Aufgabe wurde erfolgreich erstellt",
      })

      handleCloseDialog()
    } catch (error) {
      console.error("[v0] Error saving todo:", error)
      toast({
        title: "Fehler",
        description: "Die Aufgabe konnte nicht gespeichert werden",
        variant: "destructive",
      })
    }
  }

  // CHANGE: Updated isOverdue to accept status and completed
  const isOverdue = (dueDate: string | null, status?: string) => {
    if (!dueDate || status === "erledigt") return false
    return new Date(dueDate) < new Date()
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-green-500"
      default:
        return "bg-slate-500"
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high":
        return "Hoch"
      case "medium":
        return "Mittel"
      case "low":
        return "Niedrig"
      default:
        return priority
    }
  }

  // Helper function to get status label
  const getStatusLabel = (status: "alle" | "offen" | "in_bearbeitung" | "erledigt" | "abgebrochen"): string => {
    switch (status) {
      case "alle":
        return "Alle"
      case "offen":
        return "Offen"
      case "in_bearbeitung":
        return "In Bearbeitung"
      case "erledigt":
        return "Erledigt"
      case "abgebrochen":
        return "Abgebrochen"
      default:
        return ""
    }
  }

  const todosByMatrix = useMemo(() => {
    return {
      urgentImportant: filteredAndSortedTodos.filter((t) => t.dringend && t.wichtig),
      notUrgentImportant: filteredAndSortedTodos.filter((t) => !t.dringend && t.wichtig),
      urgentNotImportant: filteredAndSortedTodos.filter((t) => t.dringend && !t.wichtig),
      notUrgentNotImportant: filteredAndSortedTodos.filter((t) => !t.dringend && !t.wichtig),
    }
  }, [filteredAndSortedTodos])

  // Filter and sort todos by priority for Kanban view
  const todosByPriority = useMemo(() => {
    return {
      high: filteredAndSortedTodos.filter((t) => t.priority === "high"),
      medium: filteredAndSortedTodos.filter((t) => t.priority === "medium"),
      low: filteredAndSortedTodos.filter((t) => t.priority === "low"),
    }
  }, [filteredAndSortedTodos])

  // This was preventing completed todos from showing when "Abgeschlossen" button is ON
  // Helper for filtering todos based on current view mode, for Kanban and Matrix
  const filteredTodos = useMemo(() => {
    //return filteredAndSortedTodos.filter((todo) => !todo.completed);
    return filteredAndSortedTodos // Use filteredAndSortedTodos directly
  }, [filteredAndSortedTodos])

  // Re-destructuring for clarity in Kanban and Matrix views
  const { urgentImportant, notUrgentImportant, urgentNotImportant, notUrgentNotImportant } = todosByMatrix

  useEffect(() => {
    localStorage.setItem("todoViewMode", viewMode)
  }, [viewMode])

  // REMOVED: handleAddUser, handleRemoveUser, getAvailableMembers, getAssignedMembers functions

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3">
          {/* Row 1: Title only */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold tracking-tight">Aufgaben</h1>
              <p className="text-muted-foreground text-sm">
                Verwalten Sie Ihre Aufgaben und behalten Sie den Überblick
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard label="Gesamt" value={stats.total} icon={ListTodo} {...statCardColors.primary} />
            <StatCard label="Erledigt" value={stats.completed} icon={CircleCheckBig} {...statCardColors.success} />
            <StatCard label="Offen" value={stats.pending} icon={Clock} {...statCardColors.info} />
            <StatCard label="Überfällig" value={stats.overdue} icon={AlertTriangle} {...statCardColors.danger} />
          </div>

          {/* View Mode Tabs */}
          <Tabs
            value={viewMode}
            onValueChange={(value) => setViewMode(value as "list" | "kanban" | "matrix" | "distribution")}
          >
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto gap-1">
              <TabsTrigger value="list" className="gap-2">
                <LayoutList className="h-4 w-4" />
                <span className="hidden sm:inline">Liste</span>
              </TabsTrigger>
              <TabsTrigger value="kanban" className="gap-2">
                <KanbanIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Kanban</span>
              </TabsTrigger>
              <TabsTrigger value="matrix" className="gap-2">
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden sm:inline">Matrix</span>
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="distribution" className="gap-2">
                  <Brain className="h-4 w-4" />
                  <span className="hidden sm:inline">Verteilung</span>
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>

          {/* Row 2: Search, Filters, and Sort */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Aufgaben suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Quick Filters */}
            <Button
              variant={showOverdue ? "default" : "outline"}
              size="sm"
              onClick={() => setShowOverdue(!showOverdue)}
              className="gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              Überfällig
            </Button>

            <Button
              variant={showCompleted ? "default" : "outline"}
              size="sm"
              onClick={() => setShowCompleted(!showCompleted)}
              className="gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Abgeschlossen
            </Button>

            {/* Filter Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 min-w-[120px] bg-transparent">
                  <Filter className="h-4 w-4" />
                  Filter
                  {selectedPriorities.length +
                    selectedAssignees.length +
                    (statusFilter !== "alle" ? 1 : 0) +
                    (priorityFilter !== "alle" ? 1 : 0) >
                    0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-2 text-xs">
                      {selectedPriorities.length +
                        selectedAssignees.length +
                        (statusFilter !== "alle" ? 1 : 0) +
                        (priorityFilter !== "alle" ? 1 : 0)}
                    </Badge>
                  )}
                  <ChevronDown className="h-4 w-4 ml-auto" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Nach Status filtern</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(["alle", "offen", "in_bearbeitung", "erledigt", "abgebrochen"] as const).map((status) => (
                  <DropdownMenuCheckboxItem
                    key={status}
                    checked={statusFilter === status}
                    onCheckedChange={() => setStatusFilter(status)}
                  >
                    {getStatusLabel(status)}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Nach Priorität filtern</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(["alle", "niedrig", "mittel", "hoch", "kritisch"] as const).map((priority) => (
                  <DropdownMenuCheckboxItem
                    key={priority}
                    checked={priorityFilter === priority}
                    onCheckedChange={() => setPriorityFilter(priority)}
                  >
                    {priority === "alle" && "Alle"}
                    {priority === "niedrig" && "Niedrig"}
                    {priority === "mittel" && "Mittel"}
                    {priority === "hoch" && "Hoch"}
                    {priority === "kritisch" && "Kritisch"}
                  </DropdownMenuCheckboxItem>
                ))}
                {(selectedPriorities.length > 0 ||
                  selectedAssignees.length > 0 ||
                  statusFilter !== "alle" ||
                  priorityFilter !== "alle") && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleClearFilters}>Alle Filter löschen</DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Sort Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 min-w-[120px] bg-transparent">
                  <ArrowUpDown className="h-4 w-4" />
                  Sortieren
                  <ChevronDown className="h-4 w-4 ml-auto" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Sortieren nach</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
                  <DropdownMenuRadioItem value="manual">Manuell</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="priority">Priorität</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="due_date">Fälligkeitsdatum</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="created_at">Erstellungsdatum</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="title">Titel</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* AI Suggestions and New Task buttons */}
            <Button
              onClick={generateAiSuggestions}
              disabled={isGeneratingAi}
              className="gap-2 bg-gradient-to-r from-purple-500/90 to-indigo-500/90 hover:from-purple-600 hover:to-indigo-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300"
            >
              <Sparkles className="h-4 w-4" />
              <span className="font-semibold">{isGeneratingAi ? "Generiere..." : "KI Vorschläge"}</span>
            </Button>

            <Button
              onClick={() => {
                console.log("[v0] Create Todo button clicked")
                setShowCreateDialog(true)
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Neue Aufgabe
            </Button>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                <p className="text-sm text-muted-foreground">Lade Aufgaben...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Distribution Tab Content */}
              {viewMode === "distribution" && isAdmin ? (
                <TaskDistributionTab practiceId={practiceId} tasks={filteredTodos} onRefresh={fetchTodos} />
              ) : viewMode === "list" ? (
                // List View
                <div className="space-y-2">
                  {filteredAndSortedTodos.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>Keine Aufgaben gefunden</p>
                    </div>
                  ) : (
                    filteredAndSortedTodos.map((todo, index) => (
                      <Card
                        key={todo.id}
                        draggable={sortBy === "manual"}
                        onDragStart={(e) => handleListDragStart(e, todo, index)}
                        onDragOver={(e) => handleListDragOver(e, index)}
                        onDrop={(e) => handleListDrop(e, index)}
                        onDragEnd={handleListDragEnd}
                        className={cn(
                          "group hover:shadow-md transition-all",
                          todo.status === "erledigt" && "opacity-60",
                          sortBy === "manual" && "cursor-grab active:cursor-grabbing",
                          draggedTodo?.id === todo.id && "opacity-50 scale-105 rotate-1 shadow-xl",
                          draggedOverIndex === index &&
                            sortBy === "manual" &&
                            "border-2 border-primary ring-2 ring-primary/20",
                        )}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={todo.status === "erledigt"}
                              onCheckedChange={(checked) => handleStatusChange(todo.id, checked ? "erledigt" : "offen")}
                              className="mt-1"
                            />

                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  {/* CHANGE: Removed debug logging for todo title */}
                                  <p
                                    className={cn(
                                      "font-medium text-base",
                                      todo.status === "erledigt" && "line-through text-muted-foreground",
                                    )}
                                  >
                                    {todo.title}
                                  </p>
                                  {todo.description && (
                                    <p className="text-sm text-muted-foreground">{todo.description}</p>
                                  )}
                                </div>

                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  <Select
                                    value={todo.status || "offen"}
                                    onValueChange={(value) => handleStatusChange(todo.id, value)}
                                  >
                                    <SelectTrigger className="h-8 w-[140px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="offen">Offen</SelectItem>
                                      <SelectItem value="in_bearbeitung">In Bearbeitung</SelectItem>
                                      <SelectItem value="erledigt">Erledigt</SelectItem>
                                      <SelectItem value="abgebrochen">Abgebrochen</SelectItem>
                                    </SelectContent>
                                  </Select>

                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0"
                                    onClick={() => {
                                      setEditingTodo(todo)
                                      setFormData({
                                        title: todo.title,
                                        description: todo.description || "",
                                        priority: todo.priority,
                                        due_date: todo.due_date || "",
                                        assigned_to: todo.assigned_to || "",
                                        recurrence_type: todo.recurrence_type || "none",
                                        recurrence_end_date: todo.recurrence_end_date || "",
                                        dringend: todo.dringend || false,
                                        wichtig: todo.wichtig || false,
                                        status: todo.status || "offen", // Ensure status is set
                                      })
                                      setAssignedUserIds(todo.assigned_user_ids || [])
                                      setAttachments(todo.attachments || [])
                                      setShowCreateDialog(true)
                                    }}
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-red-600 hover:bg-red-100 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-300"
                                    onClick={() => handleDeleteTodo(todo.id)}
                                    title="Aufgabe löschen"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                <Badge
                                  className={cn(
                                    "gap-1 text-xs text-white",
                                    todo.priority === "high" && "bg-red-500",
                                    todo.priority === "medium" && "bg-yellow-500",
                                    todo.priority === "low" && "bg-green-500",
                                    !["high", "medium", "low"].includes(todo.priority) && "bg-slate-500",
                                    todo.status === "erledigt" && "opacity-60",
                                  )}
                                >
                                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                  {getPriorityLabel(todo.priority)}
                                </Badge>

                                {todo.due_date && (
                                  <div className="flex items-center gap-1">
                                    <Calendar
                                      className={cn(
                                        "h-3 w-3",
                                        isOverdue(todo.due_date, todo.status) &&
                                          todo.status !== "erledigt" &&
                                          "text-red-500",
                                        todo.status === "erledigt" && "opacity-60",
                                      )}
                                    />
                                    <span
                                      className={cn(
                                        "text-xs",
                                        isOverdue(todo.due_date, todo.status) &&
                                          todo.status !== "erledigt" &&
                                          "text-red-500 font-semibold",
                                        todo.status === "erledigt" && "opacity-60",
                                      )}
                                    >
                                      {formatDateDE(new Date(todo.due_date))}
                                    </span>
                                  </div>
                                )}

                                {/* Display assigned users */}
                                {todo.assigned_user_ids && todo.assigned_user_ids.length > 0 && (
                                  <div className="flex -space-x-2 overflow-hidden">
                                    {todo.assigned_user_ids.slice(0, 3).map((userId) => {
                                      const member = teamMembers.find((m) => m.id === userId)
                                      if (!member) return null
                                      const initials = member.name
                                        ? member.name
                                            .split(" ")
                                            .map((n) => n[0])
                                            .join("")
                                            .toUpperCase()
                                        : member.email?.[0]?.toUpperCase() || "?"

                                      return (
                                        <TooltipProvider key={userId}>
                                          <Tooltip>
                                            <TooltipTrigger>
                                              <Avatar className="h-6 w-6 ring-2 ring-background">
                                                <AvatarImage src={member.avatar_url || "/placeholder.svg"} />
                                                <AvatarFallback className="text-xs bg-primary/10">
                                                  {initials}
                                                </AvatarFallback>
                                              </Avatar>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p className="text-sm">{member.name || member.email}</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      )
                                    })}
                                    {todo.assigned_user_ids.length > 3 && (
                                      <div className="flex items-center justify-center h-6 w-6 rounded-full ring-2 ring-background bg-muted text-xs font-medium">
                                        +{todo.assigned_user_ids.length - 3}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {todo.recurrence_type && todo.recurrence_type !== "none" && (
                                  <Badge className="gap-1 bg-blue-500 text-white">
                                    <Clock className="h-3 w-3" />
                                    {todo.recurrence_type === "daily" && "Täglich"}
                                    {todo.recurrence_type === "weekly" && "Wöchentlich"}
                                    {todo.recurrence_type === "monthly" && "Monatlich"}
                                    {todo.recurrence_type === "yearly" && "Jährlich"}
                                  </Badge>
                                )}

                                {todo.attachments && todo.attachments.length > 0 && (
                                  <Badge className="gap-1 bg-purple-500 text-white">
                                    <Paperclip className="h-3 w-3" />
                                    {todo.attachments.length}
                                  </Badge>
                                )}

                                {(todo.dringend || todo.wichtig) && (
                                  <div className="flex gap-1">
                                    {todo.dringend && (
                                      <Badge variant="destructive" className="text-xs">
                                        Dringend
                                      </Badge>
                                    )}
                                    {todo.wichtig && (
                                      <Badge className="text-xs bg-orange-500 text-white">Wichtig</Badge>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Show attachments */}
                              {todo.attachments && todo.attachments.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-1">
                                  {todo.attachments.map((attachment) => (
                                    <a
                                      key={attachment.id}
                                      href={
                                        attachment.attachment_type === "file"
                                          ? attachment.file_url
                                          : attachment.link_url
                                      }
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                                    >
                                      {attachment.attachment_type === "file" ? (
                                        <>
                                          <FileText className="h-3 w-3" />
                                          {attachment.file_name}
                                        </>
                                      ) : (
                                        <>
                                          <LinkIcon className="h-3 w-3" />
                                          {attachment.link_title}
                                        </>
                                      )}
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              ) : viewMode === "kanban" ? (
                // Kanban View
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* High Priority Column */}
                  <div
                    className={`bg-red-50 dark:bg-red-950/20 border rounded-lg p-4 space-y-4 transition-all duration-200 ${
                      dragOverZone === "high-priority"
                        ? "border-red-500 border-2 ring-4 ring-red-200 dark:ring-red-800 scale-[1.02] shadow-lg"
                        : "border-red-200 dark:border-red-800"
                    }`}
                    onDragOver={(e) => handleDragOver(e, "high-priority")}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, "high")}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Flag className="h-5 w-5 text-red-600 dark:text-red-400" />
                        <h3 className="font-semibold text-red-900 dark:text-red-100">Hoch</h3>
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                      >
                        {filteredAndSortedTodos.filter((t) => t.priority === "high").length}
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      {filteredAndSortedTodos
                        .filter((t) => t.priority === "high")
                        .map((todo) => (
                          <Card
                            key={todo.id}
                            draggable={true}
                            onDragStart={(e) => handleDragStart(e, todo)}
                            onDragEnd={handleDragEnd}
                            className={`p-4 cursor-move transition-all duration-200 bg-white dark:bg-slate-900 ${
                              draggedTodo?.id === todo.id
                                ? "opacity-50 scale-95 rotate-2 shadow-2xl"
                                : "hover:shadow-md hover:scale-[1.02]"
                            }`}
                          >
                            <CardContent className="p-3 space-y-2">
                              <div className="space-y-2">
                                {/* First row: drag handle, checkbox, and title */}
                                <div className="flex items-start gap-2">
                                  <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                  <Checkbox
                                    checked={todo.status === "erledigt"}
                                    onCheckedChange={(checked) =>
                                      handleStatusChange(todo.id, checked ? "erledigt" : "offen")
                                    }
                                    className="mt-0.5"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p
                                      className={cn(
                                        "font-medium text-base line-clamp-2",
                                        todo.status === "erledigt" && "line-through text-muted-foreground",
                                      )}
                                    >
                                      {todo.title}
                                    </p>
                                    {todo.description && (
                                      <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                                        {todo.description}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Second row: controls (dropdown, edit, delete) */}
                                <div className="flex items-center gap-1 pl-6">
                                  <Select
                                    value={todo.status || "offen"}
                                    onValueChange={(value) => handleStatusChange(todo.id, value)}
                                  >
                                    <SelectTrigger className="h-7 w-[140px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="offen">Offen</SelectItem>
                                      <SelectItem value="in_bearbeitung">In Bearbeitung</SelectItem>
                                      <SelectItem value="erledigt">Erledigt</SelectItem>
                                      <SelectItem value="abgebrochen">Abgebrochen</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => {
                                      setEditingTodo(todo)
                                      setFormData({
                                        title: todo.title,
                                        description: todo.description || "",
                                        priority: todo.priority,
                                        due_date: todo.due_date || "",
                                        assigned_to: todo.assigned_to || "",
                                        recurrence_type: todo.recurrence_type || "none",
                                        recurrence_end_date: todo.recurrence_end_date || "",
                                        dringend: todo.dringend || false,
                                        wichtig: todo.wichtig || false,
                                        status: todo.status || "offen",
                                      })
                                      setAssignedUserIds(todo.assigned_user_ids || [])
                                      setAttachments(todo.attachments || [])
                                      setShowCreateDialog(true)
                                    }}
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-red-600 hover:bg-red-100 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleDeleteTodo(todo.id)}
                                    title="Aufgabe löschen"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 flex-wrap pl-6">
                                <Badge
                                  className={cn(
                                    "gap-1 text-xs text-white",
                                    todo.priority === "high" && "bg-red-500",
                                    todo.priority === "medium" && "bg-yellow-500",
                                    todo.priority === "low" && "bg-green-500",
                                    !["high", "medium", "low"].includes(todo.priority) && "bg-slate-500",
                                    todo.status === "erledigt" && "opacity-60",
                                  )}
                                >
                                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                  {getPriorityLabel(todo.priority)}
                                </Badge>
                                {todo.due_date && (
                                  <div
                                    className={cn(
                                      "flex items-center gap-1",
                                      todo.status === "erledigt" && "opacity-60",
                                    )}
                                  >
                                    <Calendar
                                      className={cn(
                                        "h-3 w-3",
                                        isOverdue(todo.due_date, todo.status) &&
                                          todo.status !== "erledigt" &&
                                          "text-red-500",
                                        todo.status === "erledigt" && "opacity-60",
                                      )}
                                    />
                                    <span
                                      className={cn(
                                        "text-xs",
                                        isOverdue(todo.due_date, todo.status) &&
                                          todo.status !== "erledigt" &&
                                          "text-red-500 font-semibold",
                                        todo.status === "erledigt" && "opacity-60",
                                      )}
                                    >
                                      {formatDateDE(new Date(todo.due_date))}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      {filteredAndSortedTodos.filter((t) => t.priority === "high").length === 0 && (
                        <div className="text-center py-8 text-muted-foreground text-sm">Keine Aufgaben</div>
                      )}
                    </div>
                  </div>

                  {/* Medium Priority Column */}
                  <div
                    className={`bg-yellow-50 dark:bg-yellow-950/20 border rounded-lg p-4 space-y-4 transition-all duration-200 ${
                      dragOverZone === "medium-priority"
                        ? "border-yellow-500 border-2 ring-4 ring-yellow-200 dark:ring-yellow-800 scale-[1.02] shadow-lg"
                        : "border-yellow-200 dark:border-yellow-800"
                    }`}
                    onDragOver={(e) => handleDragOver(e, "medium-priority")}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, "medium")}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Flag className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                        <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">Mittel</h3>
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                      >
                        {filteredAndSortedTodos.filter((t) => t.priority === "medium").length}
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      {filteredAndSortedTodos
                        .filter((t) => t.priority === "medium")
                        .map((todo) => (
                          <Card
                            key={todo.id}
                            draggable={true}
                            onDragStart={(e) => handleDragStart(e, todo)}
                            onDragEnd={handleDragEnd}
                            className={`p-4 cursor-move transition-all duration-200 bg-white dark:bg-slate-900 ${
                              draggedTodo?.id === todo.id
                                ? "opacity-50 scale-95 rotate-2 shadow-2xl"
                                : "hover:shadow-md hover:scale-[1.02]"
                            }`}
                          >
                            <CardContent className="p-3 space-y-2">
                              <div className="space-y-2">
                                {/* First row: drag handle, checkbox, and title */}
                                <div className="flex items-start gap-2">
                                  <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                  <Checkbox
                                    checked={todo.status === "erledigt"}
                                    onCheckedChange={(checked) =>
                                      handleStatusChange(todo.id, checked ? "erledigt" : "offen")
                                    }
                                    className="mt-0.5"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p
                                      className={cn(
                                        "font-medium text-base line-clamp-2",
                                        todo.status === "erledigt" && "line-through text-muted-foreground",
                                      )}
                                    >
                                      {todo.title}
                                    </p>
                                    {todo.description && (
                                      <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                                        {todo.description}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Second row: controls (dropdown, edit, delete) */}
                                <div className="flex items-center gap-1 pl-6">
                                  <Select
                                    value={todo.status || "offen"}
                                    onValueChange={(value) => handleStatusChange(todo.id, value)}
                                  >
                                    <SelectTrigger className="h-7 w-[140px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="offen">Offen</SelectItem>
                                      <SelectItem value="in_bearbeitung">In Bearbeitung</SelectItem>
                                      <SelectItem value="erledigt">Erledigt</SelectItem>
                                      <SelectItem value="abgebrochen">Abgebrochen</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => {
                                      setEditingTodo(todo)
                                      setFormData({
                                        title: todo.title,
                                        description: todo.description || "",
                                        priority: todo.priority,
                                        due_date: todo.due_date || "",
                                        assigned_to: todo.assigned_to || "",
                                        recurrence_type: todo.recurrence_type || "none",
                                        recurrence_end_date: todo.recurrence_end_date || "",
                                        dringend: todo.dringend || false,
                                        wichtig: todo.wichtig || false,
                                        status: todo.status || "offen",
                                      })
                                      setAssignedUserIds(todo.assigned_user_ids || [])
                                      setAttachments(todo.attachments || [])
                                      setShowCreateDialog(true)
                                    }}
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-red-600 hover:bg-red-100 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleDeleteTodo(todo.id)}
                                    title="Aufgabe löschen"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 flex-wrap pl-6">
                                <Badge
                                  className={cn(
                                    "gap-1 text-xs text-white",
                                    todo.priority === "high" && "bg-red-500",
                                    todo.priority === "medium" && "bg-yellow-500",
                                    todo.priority === "low" && "bg-green-500",
                                    !["high", "medium", "low"].includes(todo.priority) && "bg-slate-500",
                                    todo.status === "erledigt" && "opacity-60",
                                  )}
                                >
                                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                  {getPriorityLabel(todo.priority)}
                                </Badge>
                                {todo.due_date && (
                                  <div
                                    className={cn(
                                      "flex items-center gap-1",
                                      todo.status === "erledigt" && "opacity-60",
                                    )}
                                  >
                                    <Calendar
                                      className={cn(
                                        "h-3 w-3",
                                        isOverdue(todo.due_date, todo.status) &&
                                          todo.status !== "erledigt" &&
                                          "text-red-500",
                                        todo.status === "erledigt" && "opacity-60",
                                      )}
                                    />
                                    <span
                                      className={cn(
                                        "text-xs",
                                        isOverdue(todo.due_date, todo.status) &&
                                          todo.status !== "erledigt" &&
                                          "text-red-500 font-semibold",
                                        todo.status === "erledigt" && "opacity-60",
                                      )}
                                    >
                                      {formatDateDE(new Date(todo.due_date))}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      {filteredAndSortedTodos.filter((t) => t.priority === "medium").length === 0 && (
                        <div className="text-center py-8 text-muted-foreground text-sm">Keine Aufgaben</div>
                      )}
                    </div>
                  </div>

                  {/* Low Priority Column */}
                  <div
                    className={`bg-green-50 dark:bg-green-950/20 border rounded-lg p-4 space-y-4 transition-all duration-200 ${
                      dragOverZone === "low-priority"
                        ? "border-green-500 border-2 ring-4 ring-green-200 dark:ring-green-800 scale-[1.02] shadow-lg"
                        : "border-green-200 dark:border-green-800"
                    }`}
                    onDragOver={(e) => handleDragOver(e, "low-priority")}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, "low")}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Flag className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <h3 className="font-semibold text-green-900 dark:text-green-100">Niedrig</h3>
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                      >
                        {filteredAndSortedTodos.filter((t) => t.priority === "low").length}
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      {filteredAndSortedTodos
                        .filter((t) => t.priority === "low")
                        .map((todo) => (
                          <Card
                            key={todo.id}
                            draggable={true}
                            onDragStart={(e) => handleDragStart(e, todo)}
                            onDragEnd={handleDragEnd}
                            className={`p-4 cursor-move transition-all duration-200 bg-white dark:bg-slate-900 ${
                              draggedTodo?.id === todo.id
                                ? "opacity-50 scale-95 rotate-2 shadow-2xl"
                                : "hover:shadow-md hover:scale-[1.02]"
                            }`}
                          >
                            <CardContent className="p-3 space-y-2">
                              <div className="space-y-2">
                                {/* First row: drag handle, checkbox, and title */}
                                <div className="flex items-start gap-2">
                                  <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                  <Checkbox
                                    checked={todo.status === "erledigt"}
                                    onCheckedChange={(checked) =>
                                      handleStatusChange(todo.id, checked ? "erledigt" : "offen")
                                    }
                                    className="mt-0.5"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p
                                      className={cn(
                                        "font-medium text-base line-clamp-2",
                                        todo.status === "erledigt" && "line-through text-muted-foreground",
                                      )}
                                    >
                                      {todo.title}
                                    </p>
                                    {todo.description && (
                                      <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                                        {todo.description}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Second row: controls (dropdown, edit, delete) */}
                                <div className="flex items-center gap-1 pl-6">
                                  <Select
                                    value={todo.status || "offen"}
                                    onValueChange={(value) => handleStatusChange(todo.id, value)}
                                  >
                                    <SelectTrigger className="h-7 w-[140px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="offen">Offen</SelectItem>
                                      <SelectItem value="in_bearbeitung">In Bearbeitung</SelectItem>
                                      <SelectItem value="erledigt">Erledigt</SelectItem>
                                      <SelectItem value="abgebrochen">Abgebrochen</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => {
                                      setEditingTodo(todo)
                                      setFormData({
                                        title: todo.title,
                                        description: todo.description || "",
                                        priority: todo.priority,
                                        due_date: todo.due_date || "",
                                        assigned_to: todo.assigned_to || "",
                                        recurrence_type: todo.recurrence_type || "none",
                                        recurrence_end_date: todo.recurrence_end_date || "",
                                        dringend: todo.dringend || false,
                                        wichtig: todo.wichtig || false,
                                        status: todo.status || "offen",
                                      })
                                      setAssignedUserIds(todo.assigned_user_ids || [])
                                      setAttachments(todo.attachments || [])
                                      setShowCreateDialog(true)
                                    }}
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-red-600 hover:bg-red-100 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleDeleteTodo(todo.id)}
                                    title="Aufgabe löschen"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 flex-wrap pl-6">
                                <Badge
                                  className={cn(
                                    "gap-1 text-xs text-white",
                                    todo.priority === "high" && "bg-red-500",
                                    todo.priority === "medium" && "bg-yellow-500",
                                    todo.priority === "low" && "bg-green-500",
                                    !["high", "medium", "low"].includes(todo.priority) && "bg-slate-500",
                                    todo.status === "erledigt" && "opacity-60",
                                  )}
                                >
                                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                  {getPriorityLabel(todo.priority)}
                                </Badge>
                                {todo.due_date && (
                                  <div
                                    className={cn(
                                      "flex items-center gap-1",
                                      todo.status === "erledigt" && "opacity-60",
                                    )}
                                  >
                                    <Calendar
                                      className={cn(
                                        "h-3 w-3",
                                        isOverdue(todo.due_date, todo.status) &&
                                          todo.status !== "erledigt" &&
                                          "text-red-500",
                                        todo.status === "erledigt" && "opacity-60",
                                      )}
                                    />
                                    <span
                                      className={cn(
                                        "text-xs",
                                        isOverdue(todo.due_date, todo.status) &&
                                          todo.status !== "erledigt" &&
                                          "text-red-500 font-semibold",
                                        todo.status === "erledigt" && "opacity-60",
                                      )}
                                    >
                                      {formatDateDE(new Date(todo.due_date))}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      {filteredAndSortedTodos.filter((t) => t.priority === "low").length === 0 && (
                        <div className="text-center py-8 text-muted-foreground text-sm">Keine Aufgaben</div>
                      )}
                    </div>
                  </div>
                </div>
              ) : viewMode === "matrix" ? (
                // Matrix View - Eisenhower Matrix
                <div className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-muted-foreground">
                      Ziehen Sie Aufgaben zwischen den Quadranten, um Priorität und Dringlichkeit anzupassen. Wichtige
                      Aufgaben = Hohe Priorität, Dringend = Fällig innerhalb von 3 Tagen
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Top Left: Dringend & Wichtig (Urgent & Important) */}
                    <div
                      className={`bg-red-50 dark:bg-red-950/20 border rounded-lg p-4 space-y-4 transition-all duration-200 ${
                        dragOverZone === "urgent-important"
                          ? "border-red-500 border-2 ring-4 ring-red-200 dark:ring-red-800 scale-[1.02] shadow-lg"
                          : "border-red-200 dark:border-red-800"
                      }`}
                      onDragOver={(e) => handleDragOver(e, "urgent-important")}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, "high", true, true)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Flag className="h-5 w-5 text-red-600 dark:text-red-400" />
                          <h3 className="text-lg font-bold text-red-900 dark:text-red-100">Dringend & Wichtig</h3>
                          <p className="text-sm text-red-700 dark:text-blue-300">Sofort erledigen</p>
                        </div>
                        <Badge className="bg-red-500 text-white text-base px-3 py-1">{urgentImportant.length}</Badge>
                      </div>
                      <div className="space-y-3">
                        {urgentImportant.map((todo) => (
                          <Card
                            key={todo.id}
                            draggable={true}
                            onDragStart={(e) => handleDragStart(e, todo)}
                            onDragEnd={handleDragEnd}
                            className={`p-4 cursor-move transition-all duration-200 bg-white dark:bg-slate-900 ${
                              draggedTodo?.id === todo.id
                                ? "opacity-50 scale-95 rotate-2 shadow-2xl"
                                : "hover:shadow-md hover:scale-[1.02]"
                            }`}
                          >
                            <CardContent className="p-3 space-y-2">
                              <div className="space-y-2">
                                {/* First row: drag handle, checkbox, and title */}
                                <div className="flex items-start gap-2">
                                  <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                  <Checkbox
                                    checked={todo.status === "erledigt"}
                                    onCheckedChange={(checked) =>
                                      handleStatusChange(todo.id, checked ? "erledigt" : "offen")
                                    }
                                    className="mt-0.5"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p
                                      className={cn(
                                        "font-medium text-base line-clamp-2",
                                        todo.status === "erledigt" && "line-through text-muted-foreground",
                                      )}
                                    >
                                      {todo.title}
                                    </p>
                                    {todo.description && (
                                      <p
                                        className={cn(
                                          "text-xs line-clamp-1 mt-1",
                                          todo.status === "erledigt"
                                            ? "text-muted-foreground"
                                            : "text-muted-foreground",
                                        )}
                                      >
                                        {todo.description}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Second row: controls (dropdown, edit, delete) */}
                                <div className="flex items-center gap-1 pl-6">
                                  <Select
                                    value={todo.status || "offen"}
                                    onValueChange={(value) => handleStatusChange(todo.id, value)}
                                  >
                                    <SelectTrigger className="h-7 w-[140px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="offen">Offen</SelectItem>
                                      <SelectItem value="in_bearbeitung">In Bearbeitung</SelectItem>
                                      <SelectItem value="erledigt">Erledigt</SelectItem>
                                      <SelectItem value="abgebrochen">Abgebrochen</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => {
                                      setEditingTodo(todo)
                                      setFormData({
                                        title: todo.title,
                                        description: todo.description || "",
                                        priority: todo.priority,
                                        due_date: todo.due_date || "",
                                        assigned_to: todo.assigned_to || "",
                                        recurrence_type: todo.recurrence_type || "none",
                                        recurrence_end_date: todo.recurrence_end_date || "",
                                        dringend: todo.dringend || false,
                                        wichtig: todo.wichtig || false,
                                        status: todo.status || "offen",
                                      })
                                      setAssignedUserIds(todo.assigned_user_ids || [])
                                      setAttachments(todo.attachments || [])
                                      setShowCreateDialog(true)
                                    }}
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-red-600 hover:bg-red-100 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleDeleteTodo(todo.id)}
                                    title="Aufgabe löschen"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 flex-wrap pl-6">
                                <Badge
                                  className={cn(
                                    "gap-1 text-xs text-white",
                                    todo.priority === "high" && "bg-red-500",
                                    todo.priority === "medium" && "bg-yellow-500",
                                    todo.priority === "low" && "bg-green-500",
                                    !["high", "medium", "low"].includes(todo.priority) && "bg-slate-500",
                                    todo.status === "erledigt" && "opacity-60",
                                  )}
                                >
                                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                  {getPriorityLabel(todo.priority)}
                                </Badge>
                                {todo.due_date && (
                                  <div
                                    className={cn(
                                      "flex items-center gap-1",
                                      todo.status === "erledigt" && "opacity-60",
                                    )}
                                  >
                                    <Calendar
                                      className={cn(
                                        "h-3 w-3",
                                        isOverdue(todo.due_date, todo.status) &&
                                          todo.status !== "erledigt" &&
                                          "text-red-500",
                                        todo.status === "erledigt" && "opacity-60",
                                      )}
                                    />
                                    <span
                                      className={cn(
                                        "text-xs",
                                        isOverdue(todo.due_date, todo.status) &&
                                          todo.status !== "erledigt" &&
                                          "text-red-500 font-semibold",
                                        todo.status === "erledigt" && "opacity-60",
                                      )}
                                    >
                                      {formatDateDE(new Date(todo.due_date))}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                        {urgentImportant.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground text-sm">Keine Aufgaben</div>
                        )}
                      </div>
                    </div>

                    {/* Top Right: Nicht dringend & Wichtig (Not Urgent & Important) */}
                    <div
                      className={`bg-blue-50 dark:bg-blue-950/20 border rounded-lg p-4 space-y-4 transition-all duration-200 ${
                        dragOverZone === "not-urgent-important"
                          ? "border-blue-500 border-2 ring-4 ring-blue-200 dark:ring-blue-800 scale-[1.02] shadow-lg"
                          : "border-blue-200 dark:border-blue-800"
                      }`}
                      onDragOver={(e) => handleDragOver(e, "not-urgent-important")}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, "high", false, true)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Flag className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100">
                            Nicht dringend & Wichtig
                          </h3>
                          <p className="text-sm text-blue-700 dark:text-blue-300">Planen</p>
                        </div>
                        <Badge className="bg-blue-500 text-white text-base px-3 py-1">
                          {notUrgentImportant.length}
                        </Badge>
                      </div>
                      <div className="space-y-3">
                        {notUrgentImportant.map((todo) => (
                          <Card
                            key={todo.id}
                            draggable={true}
                            onDragStart={(e) => handleDragStart(e, todo)}
                            onDragEnd={handleDragEnd}
                            className={`p-4 cursor-move transition-all duration-200 bg-white dark:bg-slate-900 ${
                              draggedTodo?.id === todo.id
                                ? "opacity-50 scale-95 rotate-2 shadow-2xl"
                                : "hover:shadow-md hover:scale-[1.02]"
                            }`}
                          >
                            <CardContent className="p-3 space-y-2">
                              <div className="space-y-2">
                                {/* First row: drag handle, checkbox, and title */}
                                <div className="flex items-start gap-2">
                                  <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                  <Checkbox
                                    checked={todo.status === "erledigt"}
                                    onCheckedChange={(checked) =>
                                      handleStatusChange(todo.id, checked ? "erledigt" : "offen")
                                    }
                                    className="mt-0.5"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p
                                      className={cn(
                                        "font-medium text-base line-clamp-2",
                                        todo.status === "erledigt" && "line-through text-muted-foreground",
                                      )}
                                    >
                                      {todo.title}
                                    </p>
                                    {todo.description && (
                                      <p
                                        className={cn(
                                          "text-xs line-clamp-1 mt-1",
                                          todo.status === "erledigt"
                                            ? "text-muted-foreground"
                                            : "text-muted-foreground",
                                        )}
                                      >
                                        {todo.description}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Second row: controls (dropdown, edit, delete) */}
                                <div className="flex items-center gap-1 pl-6">
                                  <Select
                                    value={todo.status || "offen"}
                                    onValueChange={(value) => handleStatusChange(todo.id, value)}
                                  >
                                    <SelectTrigger className="h-7 w-[140px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="offen">Offen</SelectItem>
                                      <SelectItem value="in_bearbeitung">In Bearbeitung</SelectItem>
                                      <SelectItem value="erledigt">Erledigt</SelectItem>
                                      <SelectItem value="abgebrochen">Abgebrochen</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => {
                                      setEditingTodo(todo)
                                      setFormData({
                                        title: todo.title,
                                        description: todo.description || "",
                                        priority: todo.priority,
                                        due_date: todo.due_date || "",
                                        assigned_to: todo.assigned_to || "",
                                        recurrence_type: todo.recurrence_type || "none",
                                        recurrence_end_date: todo.recurrence_end_date || "",
                                        dringend: todo.dringend || false,
                                        wichtig: todo.wichtig || false,
                                        status: todo.status || "offen",
                                      })
                                      setAssignedUserIds(todo.assigned_user_ids || [])
                                      setAttachments(todo.attachments || [])
                                      setShowCreateDialog(true)
                                    }}
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-red-600 hover:bg-red-100 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleDeleteTodo(todo.id)}
                                    title="Aufgabe löschen"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 flex-wrap pl-6">
                                <Badge
                                  className={cn(
                                    "gap-1 text-xs text-white",
                                    todo.priority === "high" && "bg-red-500",
                                    todo.priority === "medium" && "bg-yellow-500",
                                    todo.priority === "low" && "bg-green-500",
                                    !["high", "medium", "low"].includes(todo.priority) && "bg-slate-500",
                                    todo.status === "erledigt" && "opacity-60",
                                  )}
                                >
                                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                  {getPriorityLabel(todo.priority)}
                                </Badge>
                                {todo.due_date && (
                                  <div
                                    className={cn(
                                      "flex items-center gap-1",
                                      todo.status === "erledigt" && "opacity-60",
                                    )}
                                  >
                                    <Calendar
                                      className={cn(
                                        "h-3 w-3",
                                        isOverdue(todo.due_date, todo.status) &&
                                          todo.status !== "erledigt" &&
                                          "text-red-500",
                                        todo.status === "erledigt" && "opacity-60",
                                      )}
                                    />
                                    <span
                                      className={cn(
                                        "text-xs",
                                        isOverdue(todo.due_date, todo.status) &&
                                          todo.status !== "erledigt" &&
                                          "text-red-500 font-semibold",
                                        todo.status === "erledigt" && "opacity-60",
                                      )}
                                    >
                                      {formatDateDE(new Date(todo.due_date))}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                        {notUrgentImportant.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground text-sm">Keine Aufgaben</div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Left: Dringend & Nicht wichtig (Urgent & Not Important) */}
                    <div
                      className={`bg-orange-50 dark:bg-orange-950/20 border rounded-lg p-4 space-y-4 transition-all duration-200 ${
                        dragOverZone === "urgent-not-important"
                          ? "border-orange-500 border-2 ring-4 ring-orange-200 dark:ring-orange-800 scale-[1.02] shadow-lg"
                          : "border-orange-200 dark:border-orange-800"
                      }`}
                      onDragOver={(e) => handleDragOver(e, "urgent-not-important")}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, "medium", true, false)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Flag className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                          <h3 className="text-lg font-bold text-orange-900 dark:text-orange-100">
                            Dringend & Nicht wichtig
                          </h3>
                          <p className="text-sm text-orange-700 dark:text-orange-300">Delegieren</p>
                        </div>
                        <Badge className="bg-orange-500 text-white text-base px-3 py-1">
                          {urgentNotImportant.length}
                        </Badge>
                      </div>
                      <div className="space-y-3">
                        {urgentNotImportant.map((todo) => (
                          <Card
                            key={todo.id}
                            draggable={true}
                            onDragStart={(e) => handleDragStart(e, todo)}
                            onDragEnd={handleDragEnd}
                            className={`p-4 cursor-move transition-all duration-200 bg-white dark:bg-slate-900 ${
                              draggedTodo?.id === todo.id
                                ? "opacity-50 scale-95 rotate-2 shadow-2xl"
                                : "hover:shadow-md hover:scale-[1.02]"
                            }`}
                          >
                            <CardContent className="p-3 space-y-2">
                              <div className="space-y-2">
                                {/* First row: drag handle, checkbox, and title */}
                                <div className="flex items-start gap-2">
                                  <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                  <Checkbox
                                    checked={todo.status === "erledigt"}
                                    onCheckedChange={(checked) =>
                                      handleStatusChange(todo.id, checked ? "erledigt" : "offen")
                                    }
                                    className="mt-0.5"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p
                                      className={cn(
                                        "font-medium text-base line-clamp-2",
                                        todo.status === "erledigt" && "line-through text-muted-foreground",
                                      )}
                                    >
                                      {todo.title}
                                    </p>
                                    {todo.description && (
                                      <p
                                        className={cn(
                                          "text-xs line-clamp-1 mt-1",
                                          todo.status === "erledigt"
                                            ? "text-muted-foreground"
                                            : "text-muted-foreground",
                                        )}
                                      >
                                        {todo.description}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Second row: controls (dropdown, edit, delete) */}
                                <div className="flex items-center gap-1 pl-6">
                                  <Select
                                    value={todo.status || "offen"}
                                    onValueChange={(value) => handleStatusChange(todo.id, value)}
                                  >
                                    <SelectTrigger className="h-7 w-[140px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="offen">Offen</SelectItem>
                                      <SelectItem value="in_bearbeitung">In Bearbeitung</SelectItem>
                                      <SelectItem value="erledigt">Erledigt</SelectItem>
                                      <SelectItem value="abgebrochen">Abgebrochen</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => {
                                      setEditingTodo(todo)
                                      setFormData({
                                        title: todo.title,
                                        description: todo.description || "",
                                        priority: todo.priority,
                                        due_date: todo.due_date || "",
                                        assigned_to: todo.assigned_to || "",
                                        recurrence_type: todo.recurrence_type || "none",
                                        recurrence_end_date: todo.recurrence_end_date || "",
                                        dringend: todo.dringend || false,
                                        wichtig: todo.wichtig || false,
                                        status: todo.status || "offen",
                                      })
                                      setAssignedUserIds(todo.assigned_user_ids || [])
                                      setAttachments(todo.attachments || [])
                                      setShowCreateDialog(true)
                                    }}
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-red-600 hover:bg-red-100 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleDeleteTodo(todo.id)}
                                    title="Aufgabe löschen"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 flex-wrap pl-6">
                                <Badge
                                  className={cn(
                                    "gap-1 text-xs text-white",
                                    todo.priority === "high" && "bg-red-500",
                                    todo.priority === "medium" && "bg-yellow-500",
                                    todo.priority === "low" && "bg-green-500",
                                    !["high", "medium", "low"].includes(todo.priority) && "bg-slate-500",
                                    todo.status === "erledigt" && "opacity-60",
                                  )}
                                >
                                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                  {getPriorityLabel(todo.priority)}
                                </Badge>
                                {todo.due_date && (
                                  <div
                                    className={cn(
                                      "flex items-center gap-1",
                                      todo.status === "erledigt" && "opacity-60",
                                    )}
                                  >
                                    <Calendar
                                      className={cn(
                                        "h-3 w-3",
                                        isOverdue(todo.due_date, todo.status) &&
                                          todo.status !== "erledigt" &&
                                          "text-red-500",
                                        todo.status === "erledigt" && "opacity-60",
                                      )}
                                    />
                                    <span
                                      className={cn(
                                        "text-xs",
                                        isOverdue(todo.due_date, todo.status) &&
                                          todo.status !== "erledigt" &&
                                          "text-red-500 font-semibold",
                                        todo.status === "erledigt" && "opacity-60",
                                      )}
                                    >
                                      {formatDateDE(new Date(todo.due_date))}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                        {urgentNotImportant.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground text-sm">Keine Aufgaben</div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Right: Nicht Dringend & Nicht wichtig (Not Urgent & Not Important) */}
                    <div
                      className={`bg-gray-50 dark:bg-gray-950/20 border rounded-lg p-4 space-y-4 transition-all duration-200 ${
                        dragOverZone === "not-urgent-not-important"
                          ? "border-gray-500 border-2 ring-4 ring-gray-200 dark:ring-gray-800 scale-[1.02] shadow-lg"
                          : "border-gray-200 dark:border-gray-800"
                      }`}
                      onDragOver={(e) => handleDragOver(e, "not-urgent-not-important")}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, "low", false, false)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Flag className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            Nicht dringend & Nicht wichtig
                          </h3>
                          <p className="text-sm text-gray-700 dark:text-gray-300">Eliminieren</p>
                        </div>
                        <Badge className="bg-gray-500 text-white text-base px-3 py-1">
                          {notUrgentNotImportant.length}
                        </Badge>
                      </div>
                      <div className="space-y-3">
                        {notUrgentNotImportant.map((todo) => (
                          <Card
                            key={todo.id}
                            draggable={true}
                            onDragStart={(e) => handleDragStart(e, todo)}
                            onDragEnd={handleDragEnd}
                            className={`p-4 cursor-move transition-all duration-200 bg-white dark:bg-slate-900 ${
                              draggedTodo?.id === todo.id
                                ? "opacity-50 scale-95 rotate-2 shadow-2xl"
                                : "hover:shadow-md hover:scale-[1.02]"
                            }`}
                          >
                            <CardContent className="p-3 space-y-2">
                              <div className="space-y-2">
                                {/* First row: drag handle, checkbox, and title */}
                                <div className="flex items-start gap-2">
                                  <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                  <Checkbox
                                    checked={todo.status === "erledigt"}
                                    onCheckedChange={(checked) =>
                                      handleStatusChange(todo.id, checked ? "erledigt" : "offen")
                                    }
                                    className="mt-0.5"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p
                                      className={cn(
                                        "font-medium text-base line-clamp-2",
                                        todo.status === "erledigt" && "line-through text-muted-foreground",
                                      )}
                                    >
                                      {todo.title}
                                    </p>
                                    {todo.description && (
                                      <p
                                        className={cn(
                                          "text-xs line-clamp-1 mt-1",
                                          todo.status === "erledigt"
                                            ? "text-muted-foreground"
                                            : "text-muted-foreground",
                                        )}
                                      >
                                        {todo.description}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Second row: controls (dropdown, edit, delete) */}
                                <div className="flex items-center gap-1 pl-6">
                                  <Select
                                    value={todo.status || "offen"}
                                    onValueChange={(value) => handleStatusChange(todo.id, value)}
                                  >
                                    <SelectTrigger className="h-7 w-[140px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="offen">Offen</SelectItem>
                                      <SelectItem value="in_bearbeitung">In Bearbeitung</SelectItem>
                                      <SelectItem value="erledigt">Erledigt</SelectItem>
                                      <SelectItem value="abgebrochen">Abgebrochen</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => {
                                      setEditingTodo(todo)
                                      setFormData({
                                        title: todo.title,
                                        description: todo.description || "",
                                        priority: todo.priority,
                                        due_date: todo.due_date || "",
                                        assigned_to: todo.assigned_to || "",
                                        recurrence_type: todo.recurrence_type || "none",
                                        recurrence_end_date: todo.recurrence_end_date || "",
                                        dringend: todo.dringend || false,
                                        wichtig: todo.wichtig || false,
                                        status: todo.status || "offen",
                                      })
                                      setAssignedUserIds(todo.assigned_user_ids || [])
                                      setAttachments(todo.attachments || [])
                                      setShowCreateDialog(true)
                                    }}
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-red-600 hover:bg-red-100 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleDeleteTodo(todo.id)}
                                    title="Aufgabe löschen"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 flex-wrap pl-6">
                                <Badge
                                  className={cn(
                                    "gap-1 text-xs text-white",
                                    todo.priority === "high" && "bg-red-500",
                                    todo.priority === "medium" && "bg-yellow-500",
                                    todo.priority === "low" && "bg-green-500",
                                    !["high", "medium", "low"].includes(todo.priority) && "bg-slate-500",
                                    todo.status === "erledigt" && "opacity-60",
                                  )}
                                >
                                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                  {getPriorityLabel(todo.priority)}
                                </Badge>
                                {todo.due_date && (
                                  <div
                                    className={cn(
                                      "flex items-center gap-1",
                                      todo.status === "erledigt" && "opacity-60",
                                    )}
                                  >
                                    <Calendar
                                      className={cn(
                                        "h-3 w-3",
                                        isOverdue(todo.due_date, todo.status) &&
                                          todo.status !== "erledigt" &&
                                          "text-red-500",
                                        todo.status === "erledigt" && "opacity-60",
                                      )}
                                    />
                                    <span
                                      className={cn(
                                        "text-xs",
                                        isOverdue(todo.due_date, todo.status) &&
                                          todo.status !== "erledigt" &&
                                          "text-red-500 font-semibold",
                                        todo.status === "erledigt" && "opacity-60",
                                      )}
                                    >
                                      {formatDateDE(new Date(todo.due_date))}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                        {notUrgentNotImportant.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground text-sm">Keine Aufgaben</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Fallback for unexpected view modes or non-admin users viewing distribution
                <div className="text-center py-12 text-muted-foreground">
                  <p>Keine Aufgabenansicht gefunden oder Sie haben keine Berechtigung.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <CreateTodoDialog
        open={showCreateDialog}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseDialog()
          }
          setShowCreateDialog(open)
        }}
        formData={formData}
        setFormData={setFormData}
        assignedUserIds={assignedUserIds}
        setAssignedUserIds={setAssignedUserIds}
        attachments={attachments}
        setAttachments={setAttachments}
        pastedFiles={pastedFiles}
        setPastedFiles={setPastedFiles}
        isUploadingFile={isUploadingFile}
        teamMembers={teamMembers}
        editingTodo={editingTodo}
        setEditingTodo={setEditingTodo}
        onDescriptionPaste={handleDescriptionPaste}
      />
      {/* Dialog for deleting todo */}
      {todoToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl">
            <h2 className="text-lg font-semibold mb-4">Aufgabe löschen?</h2>
            <p className="mb-6">
              Sind Sie sicher, dass Sie diese Aufgabe löschen möchten? Diese Aktion kann nicht rückgängig gemacht
              werden.
            </p>
            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={() => setTodoToDelete(null)}>
                Abbrechen
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  await deleteTodo(todoToDelete)
                  toast({
                    title: "Gelöscht",
                    description: "Aufgabe wurde gelöscht",
                  })
                  setTodoToDelete(null)
                }}
              >
                Löschen
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
