"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { usePractice } from "@/contexts/practice-context"
import { useToast } from "@/hooks/use-toast"
import { formatGermanNumber } from "@/lib/utils/number-format"
import type { Responsibility, ResponsibilityFormData, ResponsibilityStats } from "../types"
import { INITIAL_FORM_DATA } from "../types"

export function useResponsibilities() {
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
  const [createTodoDialogOpen, setCreateTodoDialogOpen] = useState(false)
  const [responsibilityForTodo, setResponsibilityForTodo] = useState<Responsibility | null>(null)

  const [formData, setFormData] = useState<ResponsibilityFormData>(INITIAL_FORM_DATA)
  const [hoursDisplayValue, setHoursDisplayValue] = useState("")

  const { user } = useAuth()
  const { currentPractice } = usePractice()
  const { toast } = useToast()

  const fetchResponsibilities = useCallback(async () => {
    if (!currentPractice?.id) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/responsibilities`)
      if (!response.ok) {
        throw new Error(`Fehler beim Laden: ${response.status}`)
      }
      const data = await response.json()
      // Handle both { responsibilities: [] } and [] formats
      const responsibilitiesArray = Array.isArray(data) ? data : (data.responsibilities || [])
      setResponsibilities(responsibilitiesArray)
    } catch (err) {
      console.error("Error fetching responsibilities:", err)
      setError(err instanceof Error ? err.message : "Fehler beim Laden der Zuständigkeiten")
    } finally {
      setLoading(false)
    }
  }, [currentPractice?.id])

  useEffect(() => {
    fetchResponsibilities()
  }, [fetchResponsibilities])

  const handleCreate = () => {
    setSelectedResponsibility(null)
    setFormData(INITIAL_FORM_DATA)
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
      category: (responsibility as any).group_name || responsibility.category || null,
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
      console.error("Error deleting responsibility:", err)
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
      toast({ title: "Fehler", description: "Keine Praxis ausgewählt", variant: "destructive" })
      return
    }
    if (!user?.id) {
      toast({ title: "Fehler", description: "Benutzer nicht authentifiziert", variant: "destructive" })
      return
    }

    const url = selectedResponsibility
      ? `/api/practices/${currentPractice.id}/responsibilities/${selectedResponsibility.id}`
      : `/api/practices/${currentPractice.id}/responsibilities`
    const method = selectedResponsibility ? "PUT" : "POST"

    let parsedHours: number | null = null
    if (formData.suggested_hours_per_week) {
      const valueStr =
        typeof formData.suggested_hours_per_week === "number"
          ? String(formData.suggested_hours_per_week)
          : formData.suggested_hours_per_week
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
      description: formData.description || undefined,
      category: formData.category || undefined,
      responsible_user_id: formData.responsible_user_id || undefined,
      suggested_hours_per_week: parsedHours || undefined,
      estimated_time_minutes: formData.estimated_time_minutes || undefined,
      estimated_time_period: formData.estimated_time_period || undefined,
      is_active: true,
      created_at: selectedResponsibility?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (selectedResponsibility) {
      setResponsibilities((prev) => prev.map((r) => (r.id === selectedResponsibility.id ? optimisticItem : r)))
    } else {
      setResponsibilities((prev) => [...prev, optimisticItem])
    }

    setFormDialogOpen(false)
    setSelectedResponsibility(null)

    try {
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

      if (!response.ok) {
        const errorText = await response.text()
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: errorText }
        }
        throw new Error(errorData.error || `Fehler beim Speichern (Status: ${response.status})`)
      }

      const result = await response.json()

      if (selectedResponsibility) {
        setResponsibilities((prev) => prev.map((r) => (r.id === selectedResponsibility.id ? result : r)))
      } else {
        setResponsibilities((prev) => prev.map((r) => (r.id === optimisticItem.id ? result : r)))
      }

      toast({
        title: "Erfolg",
        description: selectedResponsibility ? "Zuständigkeit aktualisiert" : "Zuständigkeit erstellt",
      })
    } catch (err) {
      console.error("Error saving responsibility:", err)
      setResponsibilities(previousResponsibilities)
      toast({
        title: "Fehler",
        description: err instanceof Error ? err.message : "Fehler beim Speichern",
        variant: "destructive",
      })
    }
  }

  const handleCreateTodo = (responsibility: Responsibility) => {
    setResponsibilityForTodo(responsibility)
    setCreateTodoDialogOpen(true)
  }

  // Computed values
  const filteredResponsibilities = responsibilities.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || r.category === categoryFilter

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

  const categories = Array.from(new Set(responsibilities.map((r) => r.category).filter(Boolean))) as string[]

  const stats: ResponsibilityStats = {
    total: responsibilities.length,
    assigned: responsibilities.filter((r) => r.responsible_user_id).length,
    unassigned: responsibilities.filter((r) => !r.responsible_user_id).length,
    totalHours: responsibilities.reduce((sum, r) => sum + (r.suggested_hours_per_week || 0), 0),
  }

  const totalHours = responsibilities.reduce((sum, r) => sum + (r.suggested_hours_per_week || 0), 0)

  return {
    // State
    responsibilities,
    loading,
    error,
    formDialogOpen,
    setFormDialogOpen,
    aiDialogOpen,
    setAiDialogOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    deleting,
    selectedResponsibility,
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    teamMemberFilter,
    setTeamMemberFilter,
    createTodoDialogOpen,
    setCreateTodoDialogOpen,
    responsibilityForTodo,
    formData,
    setFormData,
    hoursDisplayValue,
    setHoursDisplayValue,

    // Computed
    filteredResponsibilities,
    groupedResponsibilities,
    categories,
    stats,
    totalHours,

    // Actions
    fetchResponsibilities,
    handleCreate,
    handleEdit,
    handleDeleteClick,
    handleDelete,
    handleSave,
    handleCreateTodo,
  }
}
