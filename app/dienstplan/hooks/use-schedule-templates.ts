"use client"

import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import type { ScheduleTemplate, ScheduleTemplateShift, ShiftType } from "../types"

export function useScheduleTemplates(
  practiceId: string,
  shiftTypes: ShiftType[],
  open: boolean
) {
  const { toast } = useToast()
  const [templates, setTemplates] = useState<ScheduleTemplate[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("templates")

  // Edit form state
  const [editingTemplate, setEditingTemplate] = useState<ScheduleTemplate | null>(null)
  const [templateName, setTemplateName] = useState("")
  const [templateDescription, setTemplateDescription] = useState("")
  const [templateShifts, setTemplateShifts] = useState<ScheduleTemplateShift[]>([])

  const loadTemplates = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/practices/${practiceId}/schedule-templates`)
      if (res.ok) {
        const data = await res.json()
        setTemplates(data.templates || [])
      } else {
        console.error("Failed to load templates, status:", res.status)
        setTemplates([])
      }
    } catch (error) {
      console.error("Error loading templates:", error)
      toast({
        title: "Fehler",
        description: "Vorlagen konnten nicht geladen werden.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [practiceId, toast])

  useEffect(() => {
    if (open) {
      loadTemplates()
    }
  }, [open, loadTemplates])

  const handleNewTemplate = useCallback(() => {
    setEditingTemplate(null)
    setTemplateName("")
    setTemplateDescription("")
    setTemplateShifts([])
    setActiveTab("edit")
  }, [])

  const handleEditTemplate = useCallback((template: ScheduleTemplate) => {
    setEditingTemplate(template)
    setTemplateName(template.name)
    setTemplateDescription(template.description || "")
    setTemplateShifts(template.shifts || [])
    setActiveTab("edit")
  }, [])

  const handleAddShift = useCallback(() => {
    const newShift: ScheduleTemplateShift = {
      day_of_week: 0,
      shift_type_id: shiftTypes?.[0]?.id || "",
      role_filter: undefined,
    }
    setTemplateShifts((prev) => [...prev, newShift])
  }, [shiftTypes])

  const handleRemoveShift = useCallback((index: number) => {
    setTemplateShifts((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleShiftChange = useCallback(
    (index: number, field: keyof ScheduleTemplateShift, value: any) => {
      setTemplateShifts((prev) => {
        const updated = [...prev]
        updated[index] = { ...updated[index], [field]: value === "all" ? undefined : value }
        return updated
      })
    },
    []
  )

  const handleSaveTemplate = useCallback(async () => {
    if (!templateName.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie einen Namen für die Vorlage ein.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      const templateData = {
        name: templateName,
        description: templateDescription,
        shifts: templateShifts,
        is_default: false,
      }

      const url = editingTemplate
        ? `/api/practices/${practiceId}/schedule-templates/${editingTemplate.id}`
        : `/api/practices/${practiceId}/schedule-templates`

      const res = await fetch(url, {
        method: editingTemplate ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(templateData),
      })

      if (res.ok) {
        toast({
          title: "Erfolg",
          description: editingTemplate ? "Vorlage aktualisiert" : "Vorlage erstellt",
        })
        await loadTemplates()
        setActiveTab("templates")
      } else {
        throw new Error("Failed to save template")
      }
    } catch {
      toast({
        title: "Fehler",
        description: "Vorlage konnte nicht gespeichert werden.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }, [templateName, templateDescription, templateShifts, editingTemplate, practiceId, loadTemplates, toast])

  const handleDeleteTemplate = useCallback(
    async (templateId: string) => {
      try {
        const res = await fetch(
          `/api/practices/${practiceId}/schedule-templates/${templateId}`,
          { method: "DELETE" }
        )
        if (res.ok) {
          toast({ title: "Erfolg", description: "Vorlage gelöscht" })
          await loadTemplates()
        } else {
          throw new Error("Failed to delete template")
        }
      } catch {
        toast({
          title: "Fehler",
          description: "Vorlage konnte nicht gelöscht werden.",
          variant: "destructive",
        })
      }
    },
    [practiceId, loadTemplates, toast]
  )

  const getShiftTypeName = useCallback(
    (id: string) => shiftTypes.find((st) => st.id === id)?.name || "Unbekannt",
    [shiftTypes]
  )

  const getShiftTypeColor = useCallback(
    (id: string) => shiftTypes.find((st) => st.id === id)?.color || "#6b7280",
    [shiftTypes]
  )

  return {
    templates,
    isLoading,
    isSaving,
    activeTab,
    setActiveTab,
    editingTemplate,
    templateName,
    setTemplateName,
    templateDescription,
    setTemplateDescription,
    templateShifts,
    handleNewTemplate,
    handleEditTemplate,
    handleAddShift,
    handleRemoveShift,
    handleShiftChange,
    handleSaveTemplate,
    handleDeleteTemplate,
    getShiftTypeName,
    getShiftTypeColor,
  }
}
