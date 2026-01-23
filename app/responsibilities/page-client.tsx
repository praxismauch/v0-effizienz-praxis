"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import {
  Plus,
  Sparkles,
  Search,
  Filter,
  Users,
  AlertCircle,
  Clock,
  Edit,
  Trash2,
  User,
  Loader2,
  GripVertical,
  UserCheck,
  Printer,
  ClipboardList,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import ResponsibilityFormDialog from "@/components/responsibility-form-dialog"
import { AIResponsibilityGeneratorDialog } from "@/components/responsibilities/ai-responsibility-generator-dialog"
import { CreateTodoFromResponsibilityDialog } from "@/components/create-todo-from-responsibility-dialog"
import { useAuth } from "@/contexts/auth-context"
import { usePractice } from "@/contexts/practice-context"
import { useToast } from "@/hooks/use-toast"
import { useTeam } from "@/contexts/team-context"
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
import { KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
import { arrayMove, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { AppLayout } from "@/components/app-layout"
import { StatCard, statCardColors } from "@/components/ui/stat-card"
import { formatGermanNumber } from "@/lib/utils/number-format" // Import formatGermanNumber here

interface Responsibility {
  id: string
  name: string
  description?: string
  category?: string
  responsible_user_id?: string
  responsible_user_name?: string
  suggested_hours_per_week?: number
  cannot_complete_during_consultation?: boolean
  optimization_suggestions?: string
  deputy_user_id?: string
  team_member_ids?: string[]
  estimated_time_amount?: number
  estimated_time_period?: string
  calculate_time_automatically?: boolean
  attachments?: File[]
  link_url?: string
  link_title?: string
  practice_id?: string
  estimated_time_minutes?: number
  is_active?: boolean
  is_practice_goal?: boolean
  created_at?: string
  updated_at?: string
}

interface SortableItemProps {
  responsibility: Responsibility
  onEdit: (responsibility: Responsibility) => void
  onDelete: (responsibility: Responsibility) => void
  onCreateTodo: (responsibility: Responsibility) => void
  viewMode: "list" | "grid"
}

function ResponsibilityCard({
  responsibility,
  onEdit,
  onDelete,
  onCreateTodo,
}: {
  responsibility: Responsibility
  onEdit: (r: Responsibility) => void
  onDelete: (r: Responsibility) => void
  onCreateTodo: (r: Responsibility) => void
}) {
  return (
    <Card
      className="group cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-200 h-full"
      onClick={() => onEdit(responsibility)}
    >
      <CardContent className="p-4 flex flex-col h-full">
        {/* Header with title and actions */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="font-semibold text-base text-foreground line-clamp-2 flex-1">
            {responsibility.name}
          </h4>
          
          {/* Edit/Delete/Todo buttons - visible on hover */}
          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              title="Aufgabe erstellen"
              onClick={(e) => {
                e.stopPropagation()
                onCreateTodo(responsibility)
              }}
            >
              <ClipboardList className="h-3.5 w-3.5 text-primary" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(responsibility)
              }}
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 hover:bg-destructive/10"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(responsibility)
              }}
            >
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
        </div>

        {/* Description */}
        {responsibility.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {responsibility.description}
          </p>
        )}

        {/* Spacer to push footer to bottom */}
        <div className="flex-1" />

        {/* Footer with assignee and hours */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t">
          {/* Assignee */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground truncate">
              {responsibility.responsible_user_name || "Nicht zugewiesen"}
            </span>
          </div>

          {/* Hours badge */}
          {responsibility.suggested_hours_per_week !== null &&
            responsibility.suggested_hours_per_week !== undefined &&
            responsibility.suggested_hours_per_week > 0 && (
              <Badge variant="secondary" className="flex-shrink-0">
                <Clock className="h-3 w-3 mr-1" />
                {formatGermanNumber(responsibility.suggested_hours_per_week)}h/W
              </Badge>
            )}
        </div>

        {/* Practice goal indicator */}
        {responsibility.is_practice_goal && (
          <Badge className="mt-2 bg-amber-500 hover:bg-amber-600 text-white">
            Persönliches Praxisziel
          </Badge>
        )}
      </CardContent>
    </Card>
  )
}

function SortableResponsibilityItem({ responsibility, onEdit, onDelete, onCreateTodo, viewMode }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: responsibility.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 py-3 first:pt-0">
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1 flex items-center justify-between">
        <div className="flex-1">
          <div className="font-medium">{responsibility.name}</div>
          {responsibility.description && (
            <p className="text-sm text-muted-foreground line-clamp-1">{responsibility.description}</p>
          )}
          <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
            {responsibility.responsible_user_name && (
              <Badge variant="outline">
                <User className="h-3 w-3 mr-1" />
                {responsibility.responsible_user_name}
              </Badge>
            )}
            {responsibility.suggested_hours_per_week && (
              <Badge variant="outline">
                <Clock className="h-3 w-3 mr-1" />
                {formatGermanNumber(responsibility.suggested_hours_per_week)}h/W
              </Badge>
            )}
            {responsibility.cannot_complete_during_consultation && (
              <Badge
                variant="secondary"
                className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
              >
                <Clock className="h-3 w-3 mr-1" />
                Außerhalb der Sprechstunde
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => onEdit(responsibility)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(responsibility)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onCreateTodo(responsibility)}>
            <ClipboardList className="h-4 w-4 text-primary" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// Removed the unused initialFormData, fetchWithRetry, and the old formatGermanNumber function

export default function ResponsibilitiesPageClient() {
  const [responsibilities, setResponsibilities] = useState<Responsibility[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [aiDialogOpen, setAiDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [selectedResponsibility, setSelectedResponsibility] = useState<Responsibility | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [teamMemberFilter, setTeamMemberFilter] = useState("all")
  // const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["Alle"])) // This state was removed in updates

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    optimization_suggestions: "",
    responsible_user_id: null as string | null,
    deputy_user_id: null as string | null,
    team_member_ids: [] as string[],
    suggested_hours_per_week: null as number | null,
    estimated_time_amount: null as number | null,
    estimated_time_period: null as string | null,
    cannot_complete_during_consultation: false,
    calculate_time_automatically: false,
    attachments: [] as File[],
    link_url: "",
    link_title: "",
    group_name: "" as string,
    estimated_time_minutes: null as number | null,
  })
  const [hoursDisplayValue, setHoursDisplayValue] = useState("") // For the input field

  const { user } = useAuth()
  const { currentPractice } = usePractice()
  const { teamMembers } = useTeam()
  const { toast } = useToast()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const fetchResponsibilities = useCallback(async () => {
    if (!currentPractice?.id) {
      setLoading(false) // Ensure loading is false if no practice
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/responsibilities`)
      if (!response.ok) {
        // Handle specific error codes if necessary, e.g., 404
        throw new Error(`Fehler beim Laden: ${response.status}`)
      }
      const data = await response.json()
      setResponsibilities(data || []) // Ensure data is an array

      // Extract categories for the filter
      const uniqueCategories = [...new Set(data.map((r: Responsibility) => r.category).filter(Boolean))] as string[]
      // Ensure "Alle" is handled and categories are sorted or deterministic
      if (!uniqueCategories.includes("Alle")) {
        // categories state will be derived later, no need to set here.
      }
    } catch (err) {
      console.error("[v0] Error fetching responsibilities:", err)
      setError(err instanceof Error ? err.message : "Fehler beim Laden der Zuständigkeiten")
    } finally {
      setLoading(false)
    }
  }, [currentPractice?.id])

  useEffect(() => {
    // Fetch responsibilities when currentPractice changes or on mount
    fetchResponsibilities()
  }, [fetchResponsibilities]) // Depend on fetchResponsibilities

  const handleCreate = () => {
    setSelectedResponsibility(null)
    setFormData({
      name: "",
      description: "",
      optimization_suggestions: "",
      responsible_user_id: null,
      deputy_user_id: null,
      team_member_ids: [],
      suggested_hours_per_week: null,
      estimated_time_amount: null,
      estimated_time_period: null,
      cannot_complete_during_consultation: false,
      calculate_time_automatically: false,
      attachments: [],
      link_url: "",
      link_title: "",
      category: null,
      estimated_time_minutes: null,
    })
    setHoursDisplayValue("")
    setFormDialogOpen(true)
  }

  const handleEdit = (responsibility: Responsibility) => {
    setSelectedResponsibility(responsibility)

    const hoursValue = responsibility.suggested_hours_per_week
    if (hoursValue !== null && hoursValue !== undefined) {
      setHoursDisplayValue(formatGermanNumber(hoursValue))
    } else {
      setHoursDisplayValue("")
    }

    setFormData({
      name: responsibility.name || "",
      description: responsibility.description || "",
      optimization_suggestions: responsibility.optimization_suggestions || "",
      responsible_user_id: responsibility.responsible_user_id || null,
      deputy_user_id: responsibility.deputy_user_id || null,
      team_member_ids: responsibility.team_member_ids || [],
      suggested_hours_per_week: responsibility.suggested_hours_per_week ?? null,
      estimated_time_amount: responsibility.estimated_time_amount || null,
      estimated_time_period: responsibility.estimated_time_period || null,
      cannot_complete_during_consultation: responsibility.cannot_complete_during_consultation || false,
      calculate_time_automatically: responsibility.calculate_time_automatically || false,
      attachments: responsibility.attachments || [],
      link_url: responsibility.link_url || "",
      link_title: responsibility.link_title || "",
      category: responsibility.category || null,
      estimated_time_minutes: responsibility.estimated_time_minutes || null,
    })
    setFormDialogOpen(true)
  }

  const handleDeleteClick = (responsibility: Responsibility) => {
    setSelectedResponsibility(responsibility)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!selectedResponsibility?.id || !currentPractice?.id) return

    const previousResponsibilities = [...responsibilities]
    const itemToDelete = selectedResponsibility

    setResponsibilities((prev) => prev.filter((r) => r.id !== selectedResponsibility.id))
    setDeleteDialogOpen(false)
    setSelectedResponsibility(null)

    setDeleting(true)
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/responsibilities/${itemToDelete.id}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || "Fehler beim Löschen")
      }

      toast({ title: "Erfolg", description: "Zuständigkeit wurde gelöscht" })
    } catch (err) {
      console.error("[v0] Error deleting responsibility:", err)
      setResponsibilities(previousResponsibilities)
      toast({
        title: "Fehler",
        description: err instanceof Error ? err.message : "Zuständigkeit konnte nicht gelöscht werden",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  const handleSave = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }

    if (!currentPractice?.id) {
      console.error("[v0] Cannot save: No practice ID")
      toast({ title: "Fehler", description: "Keine Praxis ausgewählt", variant: "destructive" })
      return
    }
    if (!user?.id) {
      console.error("[v0] Cannot save: No user ID")
      toast({ title: "Fehler", description: "Benutzer nicht authentifiziert", variant: "destructive" })
      return
    }

    const url = selectedResponsibility
      ? `/api/practices/${currentPractice.id}/responsibilities/${selectedResponsibility.id}`
      : `/api/practices/${currentPractice.id}/responsibilities`
    const method = selectedResponsibility ? "PUT" : "POST"

    // Parse suggested_hours_per_week, handling potential errors or empty strings
    let parsedHours: number | null = null
    if (formData.suggested_hours_per_week) {
      // Convert to string first if it's a number
      const valueStr =
        typeof formData.suggested_hours_per_week === "number"
          ? String(formData.suggested_hours_per_week)
          : formData.suggested_hours_per_week
      // Remove thousand separators (dots) and replace comma decimal separator
      const cleanedValue = valueStr.replace(/\./g, "").replace(",", ".")
      parsedHours = Number.parseFloat(cleanedValue)
      if (isNaN(parsedHours)) {
        toast({ title: "Fehler", description: "Ungültiges Format für Stunden pro Woche", variant: "destructive" })
        return
      }
    }

    const previousResponsibilities = [...responsibilities]

    const optimisticItem: Responsibility = {
      id: selectedResponsibility?.id || `temp-${Date.now()}`,
      practice_id: currentPractice.id,
      name: formData.name,
      description: formData.description || null,
      category: formData.category || null,
      responsible_user_id: formData.responsible_user_id || null,
      suggested_hours_per_week: parsedHours,
      estimated_time_minutes: formData.estimated_time_minutes || null,
      estimated_time_period: formData.estimated_time_period || null,
      is_active: true,
      created_at: selectedResponsibility?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (selectedResponsibility) {
      // Update existing
      setResponsibilities((prev) => prev.map((r) => (r.id === selectedResponsibility.id ? optimisticItem : r)))
    } else {
      // Add new
      setResponsibilities((prev) => [...prev, optimisticItem])
    }

    setFormDialogOpen(false)
    setSelectedResponsibility(null)

    try {
      console.log("[v0] Saving responsibility:", { url, method, name: formData.name })

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          responsible_user_id: formData.responsible_user_id || null,
          suggested_hours_per_week: parsedHours,
          ...(!selectedResponsibility && user.id ? { created_by: user.id } : {}),
        }),
      })

      console.log("[v0] Response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] Save error response:", errorText)
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: errorText }
        }
        throw new Error(errorData.error || `Fehler beim Speichern (Status: ${response.status})`)
      }

      const result = await response.json()
      console.log("[v0] Save successful:", result.id)

      if (selectedResponsibility) {
        setResponsibilities((prev) => prev.map((r) => (r.id === selectedResponsibility.id ? result : r)))
      } else {
        // Replace temp ID with real ID from server
        setResponsibilities((prev) => prev.map((r) => (r.id === optimisticItem.id ? result : r)))
      }

      toast({
        title: "Erfolg",
        description: selectedResponsibility ? "Zuständigkeit aktualisiert" : "Zuständigkeit erstellt",
      })
    } catch (err) {
      console.error("[v0] Error saving responsibility:", err)
      setResponsibilities(previousResponsibilities)
      toast({
        title: "Fehler",
        description: err instanceof Error ? err.message : "Fehler beim Speichern",
        variant: "destructive",
      })
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id || !currentPractice?.id) return

    // Find the items in the same group
    const activeItem = responsibilities.find((r) => r.id === active.id)
    const overItem = responsibilities.find((r) => r.id === over.id)

    // Only reorder if items are in the same group
    if (!activeItem || !overItem || activeItem.category !== overItem.category) return

    const groupItems = responsibilities.filter((r) => r.category === activeItem.category)
    const oldIndex = groupItems.findIndex((r) => r.id === active.id)
    const newIndex = groupItems.findIndex((r) => r.id === over.id)

    if (oldIndex !== -1 && newIndex !== -1) {
      const reorderedGroup = arrayMove(groupItems, oldIndex, newIndex)

      // Update local state optimistically
      setResponsibilities((prev) => {
        const otherItems = prev.filter((r) => r.category !== activeItem.category)
        return [...otherItems, ...reorderedGroup]
      })

      // Persist to server (you may need to implement this API endpoint)
      try {
        await fetch(`/api/practices/${currentPractice.id}/responsibilities/reorder`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            categoryName: activeItem.category,
            orderedIds: reorderedGroup.map((r) => r.id),
          }),
        })
        toast({ title: "Reihenfolge gespeichert" })
      } catch (error) {
        console.error("[v0] Error reordering responsibilities:", error)
        toast({ title: "Fehler", description: "Reihenfolge konnte nicht gespeichert werden", variant: "destructive" })
        // Revert on error
        fetchResponsibilities()
      }
    }
  }

  // const toggleGroup = (groupName: string) => {
  //   setExpandedGroups((prev) => {
  //     const newSet = new Set(prev)
  //     if (newSet.has(groupName)) {
  //       newSet.delete(groupName)
  //     } else {
  //       newSet.add(groupName)
  //     }
  //     return newSet
  //   })
  // }

  const filteredResponsibilities = responsibilities.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || r.category === categoryFilter

    // Fixed: "all" shows all, "unassigned" shows unassigned only, otherwise match specific user
    let matchesTeamMember = true
    if (teamMemberFilter === "all") {
      matchesTeamMember = true
    } else if (teamMemberFilter === "unassigned") {
      matchesTeamMember = !r.responsible_user_id
    } else {
      matchesTeamMember = r.responsible_user_id === teamMemberFilter
    }

    return matchesSearch && matchesCategory && matchesTeamMember
  })

  const groupedResponsibilities = filteredResponsibilities.reduce(
    (acc, r) => {
      const group = r.category || "Nicht kategorisiert"
      if (!acc[group]) acc[group] = []
      acc[group].push(r)
      return acc
    },
    {} as Record<string, Responsibility[]>,
  )

  // Derive categories from the current responsibilities for the filter dropdown
  const categories = Array.from(new Set(responsibilities.map((r) => r.category).filter(Boolean))) as string[]
  // Add 'Alle' to categories if it's not there, or handle it in the filter logic
  const filterCategories = ["all", ...categories]

  const totalHours = responsibilities.reduce((sum, r) => sum + (r.suggested_hours_per_week || 0), 0)

  const getCategoryHours = (items: Responsibility[]) => {
    return items.reduce((sum, r) => sum + (r.suggested_hours_per_week || 0), 0)
  }

  // Category color mapping
  const categoryColors: Record<string, string> = {
    "Verwaltung": "bg-blue-500",
    "Administration": "bg-blue-500",
    "Qualitätsmanagement": "bg-purple-500",
    "QM": "bg-purple-500",
    "Labor & Diagnostik": "bg-emerald-500",
    "Labor": "bg-emerald-500",
    "Patientenversorgung": "bg-rose-500",
    "Kommunikation": "bg-amber-500",
    "Hygiene": "bg-teal-500",
    "Praxisorganisation": "bg-indigo-500",
    "IT & Technik": "bg-cyan-500",
    "Finanzen": "bg-green-500",
    "Personal": "bg-orange-500",
    "Marketing": "bg-pink-500",
    "Nicht kategorisiert": "bg-gray-400",
  }

  const getCategoryColor = (category: string) => {
    return categoryColors[category] || "bg-primary"
  }

  const stats = {
    total: responsibilities.length,
    assigned: responsibilities.filter((r) => r.responsible_user_id).length,
    unassigned: responsibilities.filter((r) => !r.responsible_user_id).length,
    totalHours: responsibilities.reduce((sum, r) => sum + (r.suggested_hours_per_week || 0), 0),
  }

  const [createTodoDialogOpen, setCreateTodoDialogOpen] = useState(false)
  const [responsibilityForTodo, setResponsibilityForTodo] = useState<Responsibility | null>(null)

  const handleCreateTodo = (responsibility: Responsibility) => {
    setResponsibilityForTodo(responsibility)
    setCreateTodoDialogOpen(true)
  }

  return (
    <AppLayout loading={loading} loadingMessage="Zuständigkeiten werden geladen...">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Zuständigkeiten</h1>
            <p className="text-muted-foreground">Verwalten Sie Aufgaben und Verantwortlichkeiten</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Drucken
            </Button>
            <Button
              onClick={() => setAiDialogOpen(true)}
              className="gap-2 bg-gradient-to-r from-purple-500/90 to-indigo-500/90 hover:from-purple-600 hover:to-indigo-600 text-white border-0"
            >
              <Sparkles className="h-4 w-4" />
              Mit KI generieren
            </Button>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Neue Zuständigkeit
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Gesamt" value={stats.total} icon={Users} {...statCardColors.primary} />
          <StatCard label="Zugewiesen" value={stats.assigned} icon={UserCheck} {...statCardColors.success} />
          <StatCard label="Offen" value={stats.unassigned} icon={AlertCircle} {...statCardColors.warning} />
          <StatCard
            label="Stunden/Woche"
            value={formatGermanNumber(stats.totalHours)}
            icon={Clock}
            {...statCardColors.info}
          />
        </div>

        {/* View Mode Toggle and Filters Row */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4 flex-1 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Suche nach Namen oder Beschreibung..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            {/* Team Member Filter Dropdown */}
            <Select value={teamMemberFilter} onValueChange={setTeamMemberFilter}>
              <SelectTrigger className="w-[200px]">
                <User className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Alle Mitarbeiter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Mitarbeiter</SelectItem>
                <SelectItem value="unassigned">Nicht zugewiesen</SelectItem>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.first_name} {member.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Alle Kategorien" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Kategorien</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Error state */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
              <Button onClick={fetchResponsibilities} variant="outline" className="mt-4 bg-transparent">
                Erneut versuchen
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {!loading && !error && filteredResponsibilities.length === 0 && (
          <Card>
            <CardContent className="pt-6 flex flex-col items-center gap-4">
              <Users className="h-12 w-12 text-muted-foreground" />
              <div className="text-center">
                <h3 className="font-semibold">Keine Zuständigkeiten gefunden</h3>
                <p className="text-sm text-muted-foreground">
                  {searchTerm || categoryFilter !== "all" || teamMemberFilter !== "all"
                    ? "Versuchen Sie andere Filteroptionen"
                    : "Erstellen Sie Ihre erste Zuständigkeit oder nutzen Sie die KI-Vorschläge"}
                </p>
              </div>
              {!searchTerm && categoryFilter === "all" && teamMemberFilter === "all" && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => setAiDialogOpen(true)}
                    className="gap-2 bg-gradient-to-r from-purple-500/90 to-indigo-500/90 hover:from-purple-600 hover:to-indigo-600 text-white border-0"
                  >
                    <Sparkles className="h-4 w-4" />
                    KI-Vorschläge
                  </Button>
                  <Button onClick={handleCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Erstellen
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!loading && !error && Object.keys(groupedResponsibilities).length > 0 && (
          <div className="bg-muted/50 rounded-xl p-6 space-y-6">
            <Card className="border-0 shadow-sm">
              <CardContent className="py-4 px-6">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Gesamt Zeitbedarf aller Zuständigkeiten</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-primary">{formatGermanNumber(totalHours)}h</span>
                    <span className="text-sm text-muted-foreground ml-2">pro Woche</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {Object.entries(groupedResponsibilities).map(([groupName, items]) => (
              <div key={groupName} className="space-y-3">
                {/* Category header with count and total hours */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getCategoryColor(groupName)}`} />
                    <h3 className="font-semibold text-lg">{groupName}</h3>
                    <span className="text-muted-foreground">({items.length})</span>
                  </div>
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                    Gesamt: {formatGermanNumber(getCategoryHours(items))} Std./Woche
                  </Badge>
                </div>

                {/* Responsibility cards grid */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((responsibility) => (
                    <ResponsibilityCard
                      key={responsibility.id}
                      responsibility={responsibility}
                      onEdit={handleEdit}
                      onDelete={handleDeleteClick}
                      onCreateTodo={handleCreateTodo}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Form Dialog */}
        <ResponsibilityFormDialog
          open={formDialogOpen}
          onOpenChange={setFormDialogOpen}
          formData={formData}
          setFormData={setFormData}
          hoursDisplayValue={hoursDisplayValue}
          setHoursDisplayValue={setHoursDisplayValue}
          onSave={handleSave}
          editing={!!selectedResponsibility}
        />

        {/* AI Generator Dialog */}
        <AIResponsibilityGeneratorDialog
          open={aiDialogOpen}
          onOpenChange={setAiDialogOpen}
          onResponsibilitiesGenerated={fetchResponsibilities}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Zuständigkeit löschen?</AlertDialogTitle>
              <AlertDialogDescription>
                Möchten Sie die Zuständigkeit "{selectedResponsibility?.name}" wirklich löschen? Diese Aktion kann nicht
                rückgängig gemacht werden.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Abbrechen</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Löschen...
                  </>
                ) : (
                  "Löschen"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Create Todo Dialog */}
        {responsibilityForTodo && (
          <CreateTodoFromResponsibilityDialog
            open={createTodoDialogOpen}
            onOpenChange={setCreateTodoDialogOpen}
            responsibility={responsibilityForTodo}
            onSuccess={() => {
              // Optionally refresh or show success
            }}
          />
        )}
      </div>
    </AppLayout>
  )
}
