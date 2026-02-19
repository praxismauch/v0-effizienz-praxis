"use client"

import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"

export interface WorkflowStep {
  title: string
  description?: string
  assignedTo?: string
  estimatedDuration?: number
  dependencies: string[]
}

export interface WorkflowTemplate {
  id: string
  name: string
  description?: string
  category?: string
  steps: WorkflowStep[]
  is_active: boolean
  hide_items_from_other_users: boolean
  created_at: string
  updated_at: string
  workflow_template_specialties?: any[]
}

export interface WorkflowFormData {
  name: string
  description: string
  category: string
  steps: WorkflowStep[]
  is_active: boolean
  hide_items_from_other_users: boolean
}

export const defaultFormData: WorkflowFormData = {
  name: "",
  description: "",
  category: "",
  steps: [],
  is_active: true,
  hide_items_from_other_users: false,
}

export function useWorkflowTemplates() {
  const { toast } = useToast()
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const loadTemplates = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/super-admin/templates/workflows")
      if (!response.ok) throw new Error("Failed to load templates")
      const data = await response.json()
      setTemplates(data.templates || [])
    } catch (error) {
      console.error("Error loading workflow templates:", error)
      toast({ title: "Fehler", description: "Workflow-Vorlagen konnten nicht geladen werden", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadTemplates()
  }, [loadTemplates])

  const handleCreate = useCallback(async (formData: WorkflowFormData) => {
    if (!formData.name.trim()) return false
    setIsSaving(true)
    try {
      const response = await fetch("/api/super-admin/templates/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || "Fehler beim Erstellen")
      }
      toast({ title: "Erfolg", description: "Workflow-Vorlage wurde erstellt" })
      loadTemplates()
      return true
    } catch (error) {
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Vorlage konnte nicht erstellt werden",
        variant: "destructive",
      })
      return false
    } finally {
      setIsSaving(false)
    }
  }, [toast, loadTemplates])

  const handleUpdate = useCallback(async (id: string, formData: WorkflowFormData) => {
    if (!formData.name.trim()) return false
    setIsSaving(true)
    try {
      const response = await fetch(`/api/super-admin/templates/workflows/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (!response.ok) throw new Error("Failed to update")
      toast({ title: "Erfolg", description: "Workflow-Vorlage wurde aktualisiert" })
      loadTemplates()
      return true
    } catch {
      toast({ title: "Fehler", description: "Vorlage konnte nicht aktualisiert werden", variant: "destructive" })
      return false
    } finally {
      setIsSaving(false)
    }
  }, [toast, loadTemplates])

  const handleDelete = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/super-admin/templates/workflows/${id}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to delete")
      toast({ title: "Erfolg", description: "Workflow-Vorlage wurde gelöscht" })
      loadTemplates()
      return true
    } catch {
      toast({ title: "Fehler", description: "Vorlage konnte nicht gelöscht werden", variant: "destructive" })
      return false
    }
  }, [toast, loadTemplates])

  const handleAiGenerate = useCallback(async (description: string, category: string): Promise<WorkflowFormData | null> => {
    if (!description.trim() || description.trim().length < 10) {
      toast({
        title: "Beschreibung zu kurz",
        description: "Bitte geben Sie eine detailliertere Beschreibung ein (mindestens 10 Zeichen).",
        variant: "destructive",
      })
      return null
    }

    try {
      const response = await fetch("/api/super-admin/templates/workflows/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, category }),
      })
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || "Fehler bei der KI-Generierung")
      }
      const { workflow } = await response.json()

      return {
        name: workflow.name || "",
        description: workflow.description || "",
        category: category || workflow.category || "",
        steps: (workflow.steps || []).map((step: any) => ({
          title: step.title || "",
          description: step.description || "",
          assignedTo: step.assignedTo || "",
          estimatedDuration: step.estimatedDuration || 5,
          dependencies: step.dependencies || [],
        })),
        is_active: true,
        hide_items_from_other_users: false,
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "KI-Generierung fehlgeschlagen",
        variant: "destructive",
      })
      return null
    }
  }, [toast])

  return {
    templates,
    isLoading,
    isSaving,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleAiGenerate,
  }
}
