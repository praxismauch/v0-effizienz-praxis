"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import type { TestingCategory, ChecklistTemplate, TestChecklist, ChecklistItem } from "./types"

export function useChecklistData() {
  const [categories, setCategories] = useState<TestingCategory[]>([])
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([])
  const [checklists, setChecklists] = useState<TestChecklist[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedChecklist, setSelectedChecklist] = useState<string | null>(null)
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([])
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [categoriesRes, templatesRes, checklistsRes] = await Promise.all([
        fetch("/api/testing-categories"),
        fetch("/api/test-templates"),
        fetch("/api/test-checklists"),
      ])
      if (categoriesRes.ok) setCategories(await categoriesRes.json())
      if (templatesRes.ok) setTemplates(await templatesRes.json())
      if (checklistsRes.ok) setChecklists(await checklistsRes.json())
    } catch {
      toast({ title: "Fehler", description: "Daten konnten nicht geladen werden", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const loadChecklistItems = async (checklistId: string) => {
    try {
      const response = await fetch(`/api/test-checklists/${checklistId}/items`)
      if (response.ok) {
        const data = await response.json()
        const mapped = data.map((item: any) => ({
          ...item,
          is_completed: item.completed ?? item.is_completed ?? false,
        }))
        setChecklistItems(mapped)
      }
    } catch {
      toast({ title: "Fehler", description: "Checklist-Items konnten nicht geladen werden", variant: "destructive" })
    }
  }

  const handleSubmitTemplate = async (
    formData: { title: string; description: string; category_id: string },
    editingId?: string,
  ) => {
    try {
      const url = editingId ? `/api/test-templates/${editingId}` : "/api/test-templates"
      const method = editingId ? "PATCH" : "POST"
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (response.ok) {
        toast({ title: "Erfolg", description: editingId ? "Vorlage wurde aktualisiert" : "Vorlage wurde erstellt" })
        loadData()
        return true
      }
    } catch {
      toast({ title: "Fehler", description: "Vorlage konnte nicht gespeichert werden", variant: "destructive" })
    }
    return false
  }

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Möchten Sie diese Vorlage wirklich löschen?")) return
    try {
      const response = await fetch(`/api/test-templates/${id}`, { method: "DELETE" })
      if (response.ok) {
        toast({ title: "Erfolg", description: "Vorlage wurde gelöscht" })
        loadData()
      }
    } catch {
      toast({ title: "Fehler", description: "Vorlage konnte nicht gelöscht werden", variant: "destructive" })
    }
  }

  const handleGenerateChecklist = async () => {
    try {
      const response = await fetch("/api/test-checklists/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.error || "Failed to generate checklist")
      }
      const data = await response.json()
      toast({ title: "Erfolg", description: "Checkliste wurde erstellt" })
      loadData()
      setSelectedChecklist(data.id)
      loadChecklistItems(data.id)
      return data.id
    } catch (error) {
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Checkliste konnte nicht erstellt werden",
        variant: "destructive",
      })
      return null
    }
  }

  const handleToggleItem = async (itemId: string, isCompleted: boolean) => {
    if (!selectedChecklist) return
    try {
      const response = await fetch(`/api/test-checklists/${selectedChecklist}/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_completed: isCompleted }),
      })
      if (response.ok) {
        setChecklistItems((items) =>
          items.map((item) => (item.id === itemId ? { ...item, is_completed: isCompleted } : item)),
        )
        loadData()
      }
    } catch {
      toast({ title: "Fehler", description: "Status konnte nicht aktualisiert werden", variant: "destructive" })
    }
  }

  const handleUpdateNotes = async (itemId: string, notes: string) => {
    if (!selectedChecklist) return
    try {
      await fetch(`/api/test-checklists/${selectedChecklist}/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      })
    } catch (error) {
      console.error("Failed to update notes:", error)
    }
  }

  const handleGenerateSidebarTemplates = async (includeAdminOnly: boolean) => {
    try {
      const response = await fetch("/api/test-templates/generate-from-sidebar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ includeAdminOnly }),
      })
      const data = await response.json()
      if (response.ok) {
        toast({ title: "Erfolg", description: data.message })
        loadData()
        return true
      } else {
        throw new Error(data.error)
      }
    } catch {
      toast({ title: "Fehler", description: "Sidebar-Vorlagen konnten nicht generiert werden", variant: "destructive" })
      return false
    }
  }

  const handleAiSuggestItems = async (customPrompt?: string) => {
    try {
      const response = await fetch("/api/test-templates/ai-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          existingTemplates: templates.map((t) => t.title),
          categories: categories.map((c) => ({ id: c.id, name: c.name })),
          customPrompt: customPrompt?.trim() || undefined,
        }),
      })
      if (response.ok) {
        const data = await response.json()
        return data.suggestions
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`API returned ${response.status}: ${errorData.error || "Unknown error"}`)
      }
    } catch (error) {
      toast({ title: "Fehler", description: "KI-Vorschläge konnten nicht generiert werden", variant: "destructive" })
      return null
    }
  }

  const handleAddAiSuggestions = async (suggestions: any[]) => {
    try {
      for (const suggestion of suggestions) {
        await fetch("/api/test-templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(suggestion),
        })
      }
      toast({ title: "Erfolg", description: `${suggestions.length} Vorlage(n) wurden hinzugefügt` })
      loadData()
      return true
    } catch {
      toast({ title: "Fehler", description: "Vorlagen konnten nicht hinzugefügt werden", variant: "destructive" })
      return false
    }
  }

  return {
    categories,
    templates,
    checklists,
    isLoading,
    selectedChecklist,
    setSelectedChecklist,
    checklistItems,
    loadChecklistItems,
    handleSubmitTemplate,
    handleDeleteTemplate,
    handleGenerateChecklist,
    handleToggleItem,
    handleUpdateNotes,
    handleGenerateSidebarTemplates,
    handleAiSuggestItems,
    handleAddAiSuggestions,
  }
}
