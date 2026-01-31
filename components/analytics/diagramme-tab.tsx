"use client"

import { useState, useEffect } from "react"
import { WidgetLibrary, type WidgetItem } from "@/components/analytics/widget-library"
import { CreateWidgetDialog } from "@/components/analytics/create-widget-dialog"
import { toast } from "sonner"
import { usePractice } from "@/contexts/practice-context"

export function DiagrammeTab() {
  const { currentPractice } = usePractice()
  const [widgets, setWidgets] = useState<WidgetItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingWidget, setEditingWidget] = useState<WidgetItem | null>(null)

  // Load widgets on mount
  useEffect(() => {
    loadWidgets()
  }, [currentPractice?.id])

  const loadWidgets = async () => {
    if (!currentPractice?.id) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/widgets`)
      if (response.ok) {
        const data = await response.json()
        setWidgets(data.widgets || [])
      }
    } catch (error) {
      console.error("Error loading widgets:", error)
      // Load default widgets as fallback
      setWidgets(getDefaultWidgets())
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveWidget = async (widgetData: Partial<WidgetItem>) => {
    if (!currentPractice?.id) return

    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/widgets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(widgetData),
      })

      if (response.ok) {
        const data = await response.json()
        if (editingWidget) {
          setWidgets(widgets.map((w) => (w.id === editingWidget.id ? data.widget : w)))
          toast.success("Widget aktualisiert")
        } else {
          setWidgets([...widgets, data.widget])
          toast.success("Widget erstellt")
        }
        setEditingWidget(null)
      }
    } catch (error) {
      console.error("Error saving widget:", error)
      toast.error("Fehler beim Speichern")
    }
  }

  const handleEditWidget = (widget: WidgetItem) => {
    setEditingWidget(widget)
    setIsCreateDialogOpen(true)
  }

  const handleDeleteWidget = async (widgetId: string) => {
    if (!currentPractice?.id) return

    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/widgets/${widgetId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setWidgets(widgets.filter((w) => w.id !== widgetId))
        toast.success("Widget gelöscht")
      }
    } catch (error) {
      console.error("Error deleting widget:", error)
      toast.error("Fehler beim Löschen")
    }
  }

  const handleDuplicateWidget = async (widget: WidgetItem) => {
    const duplicated = {
      ...widget,
      id: `widget-${Date.now()}`,
      title: `${widget.title} (Kopie)`,
    }
    await handleSaveWidget(duplicated)
  }

  const handleToggleEnabled = async (widgetId: string) => {
    const widget = widgets.find((w) => w.id === widgetId)
    if (!widget || !currentPractice?.id) return

    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/widgets/${widgetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !widget.enabled }),
      })

      if (response.ok) {
        setWidgets(widgets.map((w) => (w.id === widgetId ? { ...w, enabled: !w.enabled } : w)))
        toast.success(widget.enabled ? "Widget deaktiviert" : "Widget aktiviert")
      }
    } catch (error) {
      console.error("Error toggling widget:", error)
      toast.error("Fehler beim Aktualisieren")
    }
  }

  const handleCreateNew = () => {
    setEditingWidget(null)
    setIsCreateDialogOpen(true)
  }

  if (isLoading) {
    return <div className="flex items-center justify-center py-12">Laden...</div>
  }

  return (
    <>
      <WidgetLibrary
        widgets={widgets}
        onEdit={handleEditWidget}
        onDelete={handleDeleteWidget}
        onDuplicate={handleDuplicateWidget}
        onToggleEnabled={handleToggleEnabled}
        onCreateNew={handleCreateNew}
      />

      <CreateWidgetDialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open)
          if (!open) setEditingWidget(null)
        }}
        editingWidget={editingWidget}
        onSave={handleSaveWidget}
      />
    </>
  )
}

// Default widgets for fallback
function getDefaultWidgets(): WidgetItem[] {
  return [
    {
      id: "widget-patients",
      title: "Patientenzahlen",
      description: "Übersicht über monatliche Patientenbesuche",
      type: "chart",
      chartType: "line",
      category: "patients",
      enabled: true,
    },
    {
      id: "widget-revenue",
      title: "Umsatzentwicklung",
      description: "Finanzielle Performance im Zeitverlauf",
      type: "chart",
      chartType: "bar",
      category: "financial",
      enabled: true,
    },
    {
      id: "widget-appointments",
      title: "Terminauslastung",
      description: "Auslastung nach Tageszeit",
      type: "chart",
      chartType: "area",
      category: "operations",
      enabled: true,
    },
    {
      id: "widget-team",
      title: "Team-Leistung",
      description: "Kennzahlen nach Mitarbeiter",
      type: "chart",
      chartType: "radar",
      category: "team",
      enabled: false,
    },
  ]
}
