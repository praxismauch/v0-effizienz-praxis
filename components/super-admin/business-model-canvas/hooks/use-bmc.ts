"use client"

import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import type { BMCData, CanvasItem, CanvasSection } from "../types"
import { getInitialSections, getInitialBMCData } from "../initial-data"

export function useBMC() {
  const { toast } = useToast()
  const [data, setData] = useState<BMCData>(getInitialBMCData())
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("canvas")
  const [editingItem, setEditingItem] = useState<{ sectionId: string; item: CanvasItem } | null>(null)
  const [isAddingItem, setIsAddingItem] = useState<string | null>(null)
  const [newItemText, setNewItemText] = useState("")
  const [aiPrompt, setAiPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      const practiceId = 0
      try {
        const response = await fetch(`/api/super-admin/business-model-canvas?practiceId=${practiceId}`)
        if (response.ok) {
          const bmcData = await response.json()
          const initialSections = getInitialSections()
          const mappedData: BMCData = {
            keyPartners: bmcData.keyPartners || initialSections.find((s) => s.id === "key-partners")!,
            keyActivities: bmcData.keyActivities || initialSections.find((s) => s.id === "key-activities")!,
            keyResources: bmcData.keyResources || initialSections.find((s) => s.id === "key-resources")!,
            valuePropositions: bmcData.valuePropositions || initialSections.find((s) => s.id === "value-propositions")!,
            customerRelationships: bmcData.customerRelationships || initialSections.find((s) => s.id === "customer-relationships")!,
            channels: bmcData.channels || initialSections.find((s) => s.id === "channels")!,
            customerSegments: bmcData.customerSegments || initialSections.find((s) => s.id === "customer-segments")!,
            costStructure: bmcData.costStructure || initialSections.find((s) => s.id === "cost-structure")!,
            revenueStreams: bmcData.revenueStreams || initialSections.find((s) => s.id === "revenue-streams")!,
            lastModified: bmcData.lastModified,
          }
          setData(mappedData)
        } else {
          setData(getInitialBMCData())
        }
      } catch (error) {
        console.error("Failed to load BMC data:", error)
        setData(getInitialBMCData())
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const saveData = useCallback(async (newData: BMCData) => {
    const updated = { ...newData, lastModified: new Date().toISOString() }
    setData(updated)
    setIsSaving(true)
    try {
      const response = await fetch("/api/super-admin/business-model-canvas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ practiceId: 0, ...updated }),
      })
      if (!response.ok) {
        toast({ title: "Fehler beim Speichern", description: "Ihre Aenderungen konnten nicht gespeichert werden.", variant: "destructive" })
      } else {
        toast({ title: "Gespeichert", description: "Ihr Business Model Canvas wurde erfolgreich aktualisiert." })
      }
    } catch {
      toast({ title: "Fehler beim Speichern", description: "Ein Netzwerkfehler ist aufgetreten.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }, [toast])

  const getCurrentSections = useCallback(() => {
    return [
      data.keyPartners, data.keyActivities, data.valuePropositions,
      data.customerRelationships, data.customerSegments, data.channels,
      data.keyResources, data.costStructure, data.revenueStreams,
    ].filter(Boolean)
  }, [data])

  const updateSection = useCallback((sectionId: string, updatedItems: CanvasItem[]) => {
    const currentSection = data[sectionId as keyof BMCData] as CanvasSection
    if (!currentSection) return
    saveData({ ...data, [sectionId]: { ...currentSection, items: updatedItems } })
  }, [data, saveData])

  const addItem = useCallback((sectionId: string) => {
    if (!newItemText.trim()) return
    const currentSection = data[sectionId as keyof BMCData] as CanvasSection
    if (!currentSection) return
    const newItem: CanvasItem = {
      id: `${sectionId}-${Date.now()}`,
      text: newItemText.trim(),
      priority: "medium",
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    updateSection(sectionId, [...currentSection.items, newItem])
    setNewItemText("")
    setIsAddingItem(null)
    toast({ title: "Eintrag hinzugefuegt", description: "Der neue Eintrag wurde erfolgreich erstellt." })
  }, [newItemText, data, updateSection, toast])

  const deleteItem = useCallback((sectionId: string, itemId: string) => {
    const currentSection = data[sectionId as keyof BMCData] as CanvasSection
    if (!currentSection) return
    updateSection(sectionId, currentSection.items.filter((i) => i.id !== itemId))
    toast({ title: "Eintrag geloescht", description: "Der Eintrag wurde entfernt." })
  }, [data, updateSection, toast])

  const updateItem = useCallback((sectionId: string, itemId: string, updates: Partial<CanvasItem>) => {
    const currentSection = data[sectionId as keyof BMCData] as CanvasSection
    if (!currentSection) return
    updateSection(sectionId, currentSection.items.map((i) =>
      i.id === itemId ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i
    ))
  }, [data, updateSection])

  const exportCanvas = useCallback(() => {
    const exportData = {
      keyPartners: data.keyPartners, keyActivities: data.keyActivities,
      keyResources: data.keyResources, valuePropositions: data.valuePropositions,
      customerRelationships: data.customerRelationships, channels: data.channels,
      customerSegments: data.customerSegments, costStructure: data.costStructure,
      revenueStreams: data.revenueStreams,
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `business-model-canvas-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast({ title: "Export erfolgreich", description: "Das Canvas wurde als JSON exportiert." })
  }, [data, toast])

  const exportMarkdown = useCallback(() => {
    const sections = getCurrentSections()
    let md = "# Business Model Canvas - Effizienz Praxis\n\n"
    md += `*Exportiert am ${new Date().toLocaleDateString("de-DE")}*\n\n`
    sections.forEach((section) => {
      md += `## ${section.title} (${section.titleEn})\n\n${section.description}\n\n`
      section.items.forEach((item) => {
        const p = item.priority === "high" ? "high" : item.priority === "medium" ? "med" : "low"
        md += `- [${p}] ${item.text}\n`
      })
      md += "\n"
    })
    const blob = new Blob([md], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `business-model-canvas-${new Date().toISOString().split("T")[0]}.md`
    a.click()
    URL.revokeObjectURL(url)
    toast({ title: "Markdown Export", description: "Das Canvas wurde als Markdown exportiert." })
  }, [getCurrentSections, toast])

  const generateWithAI = useCallback(async () => {
    if (!aiPrompt.trim()) return
    setIsGenerating(true)
    try {
      const response = await fetch("/api/ai/business-model-canvas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt,
          currentCanvas: getCurrentSections().reduce((acc, section) => {
            acc[section.id] = section
            return acc
          }, {} as Record<string, CanvasSection>),
        }),
      })
      if (response.ok) {
        const result = await response.json()
        if (result.suggestions) {
          toast({ title: "KI-Vorschlaege generiert", description: "Die Vorschlaege wurden dem Canvas hinzugefuegt." })
        }
      } else {
        toast({ title: "Fehler bei der KI-Anfrage", description: "Die KI konnte keine Vorschlaege generieren.", variant: "destructive" })
      }
    } catch {
      toast({ title: "Fehler", description: "KI-Generierung fehlgeschlagen.", variant: "destructive" })
    } finally {
      setIsGenerating(false)
      setAiPrompt("")
    }
  }, [aiPrompt, getCurrentSections, toast])

  const resetToDefault = useCallback(() => {
    const defaultData = getInitialBMCData()
    saveData(defaultData)
    toast({ title: "Zurueckgesetzt", description: "Das Canvas wurde auf die Standardwerte zurueckgesetzt." })
  }, [saveData, toast])

  const getSectionById = useCallback((id: string) => {
    return getCurrentSections().find((s) => s.id === id)
  }, [getCurrentSections])

  // Metrics
  const sections = getCurrentSections()
  const totalItems = sections.reduce((acc, s) => acc + s.items.length, 0)
  const highPriorityItems = sections.reduce((acc, s) => acc + s.items.filter((i) => i.priority === "high").length, 0)
  const activeItems = sections.reduce((acc, s) => acc + s.items.filter((i) => i.status === "active").length, 0)
  const definedSectionsCount = Object.values(data).filter(
    (section) => section && typeof section === "object" && "items" in section && Array.isArray(section.items) && section.items.length > 0
  ).length
  const completeness = Math.round((definedSectionsCount / 9) * 100)

  return {
    data, isLoading, isSaving, activeTab, setActiveTab,
    editingItem, setEditingItem, isAddingItem, setIsAddingItem,
    newItemText, setNewItemText, aiPrompt, setAiPrompt, isGenerating,
    saveData, addItem, deleteItem, updateItem,
    exportCanvas, exportMarkdown, generateWithAI, resetToDefault,
    getSectionById, sections,
    totalItems, highPriorityItems, activeItems, completeness,
  }
}
