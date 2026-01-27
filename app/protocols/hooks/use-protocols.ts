"use client"

import { useState, useEffect, useCallback } from "react"
import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"
import { useToast } from "@/hooks/use-toast"
import type { Protocol, TeamMember, ProtocolFormData, ProtocolItem } from "../types"
import { format } from "date-fns"
import { de } from "date-fns/locale"

const initialFormData: ProtocolFormData = {
  title: "",
  description: "",
  category: "general",
  content: "",
  protocolDate: new Date(),
  actionItems: [],
}

export function useProtocols() {
  const { currentUser: user, loading: authLoading } = useUser()
  const { currentPractice, isLoading: practiceLoading } = usePractice()
  const { toast } = useToast()
  
  const [protocols, setProtocols] = useState<Protocol[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [activeTab, setActiveTab] = useState<string>("all")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [recordingDialogOpen, setRecordingDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null)
  const [formData, setFormData] = useState<ProtocolFormData>(initialFormData)
  const [isSaving, setIsSaving] = useState(false)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [generatingTodos, setGeneratingTodos] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [protocolToDelete, setProtocolToDelete] = useState<Protocol | null>(null)

  const fetchProtocols = useCallback(async () => {
    if (!currentPractice?.id) return
    try {
      setLoading(true)
      const response = await fetch(`/api/practices/${currentPractice.id}/protocols`)
      if (response.ok) {
        const data = await response.json()
        setProtocols(data.protocols || [])
      }
    } catch (error) {
      console.error("Error fetching protocols:", error)
      setProtocols([])
    } finally {
      setLoading(false)
    }
  }, [currentPractice?.id])

  const fetchTeamMembers = useCallback(async () => {
    if (!currentPractice?.id) return
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/team-members`)
      if (response.ok) {
        const data = await response.json()
        setTeamMembers(data || [])
      }
    } catch (error) {
      console.error("Error fetching team members:", error)
    }
  }, [currentPractice?.id])

  useEffect(() => {
    if (currentPractice?.id) {
      fetchProtocols()
      fetchTeamMembers()
    }
  }, [currentPractice?.id, fetchProtocols, fetchTeamMembers])

  const categories = [...new Set(protocols.map((p) => p.category).filter(Boolean))]

  const filteredProtocols = protocols.filter((protocol) => {
    const matchesSearch =
      protocol.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      protocol.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === "all" || protocol.category === categoryFilter
    const matchesTab = activeTab === "all" || protocol.status === activeTab
    return matchesSearch && matchesCategory && matchesTab
  })

  const addActionItem = () => {
    const newItem: ProtocolItem = {
      id: crypto.randomUUID(),
      title: "",
      responsibleId: null,
      responsibleName: "",
      dueDate: null,
    }
    setFormData((prev) => ({
      ...prev,
      actionItems: [...prev.actionItems, newItem],
    }))
  }

  const updateActionItem = (id: string, updates: Partial<ProtocolItem>) => {
    setFormData((prev) => ({
      ...prev,
      actionItems: prev.actionItems.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    }))
  }

  const removeActionItem = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      actionItems: prev.actionItems.filter((item) => item.id !== id),
    }))
  }

  const generateTodosFromItems = async (protocolId?: string) => {
    if (!currentPractice?.id || formData.actionItems.length === 0) {
      toast({
        title: "Keine Aktionspunkte",
        description: "Fügen Sie mindestens einen Aktionspunkt hinzu.",
        variant: "destructive",
      })
      return
    }

    const itemsWithTitle = formData.actionItems.filter((item) => item.title.trim())
    if (itemsWithTitle.length === 0) {
      toast({
        title: "Keine gültigen Aktionspunkte",
        description: "Mindestens ein Aktionspunkt benötigt einen Titel.",
        variant: "destructive",
      })
      return
    }

    setGeneratingTodos(true)
    try {
      let successCount = 0
      for (const item of itemsWithTitle) {
        const response = await fetch(`/api/practices/${currentPractice.id}/todos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: item.title,
            description: `Aus Protokoll: ${formData.title || "Neues Protokoll"}`,
            due_date: item.dueDate ? item.dueDate.toISOString() : null,
            assigned_to: item.responsibleId,
            created_by: user?.id,
            priority: "medium",
            status: "pending",
            source_protocol_id: protocolId,
          }),
        })
        if (response.ok) successCount++
      }

      toast({
        title: "Todos erstellt",
        description: `${successCount} Todo(s) wurden erfolgreich aus dem Protokoll erstellt.`,
      })
    } catch (error) {
      console.error("Error creating todos:", error)
      toast({
        title: "Fehler",
        description: "Fehler beim Erstellen der Todos.",
        variant: "destructive",
      })
    } finally {
      setGeneratingTodos(false)
    }
  }

  const handleCreate = async () => {
    if (!currentPractice?.id || !formData.title.trim()) return
    setIsSaving(true)
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/protocols`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          content: formData.content,
          protocol_date: formData.protocolDate.toISOString(),
          action_items: formData.actionItems,
          status: "draft",
        }),
      })
      if (response.ok) {
        const data = await response.json()
        if (formData.actionItems.length > 0) {
          await generateTodosFromItems(data.id)
        }
        toast({ title: "Protokoll erstellt", description: "Das Protokoll wurde erfolgreich erstellt." })
        setCreateDialogOpen(false)
        setFormData(initialFormData)
        fetchProtocols()
      } else {
        throw new Error("Failed to create protocol")
      }
    } catch (error) {
      toast({ title: "Fehler", description: "Protokoll konnte nicht erstellt werden.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdate = async () => {
    if (!currentPractice?.id || !selectedProtocol?.id) return
    setIsSaving(true)
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/protocols/${selectedProtocol.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      })
      if (response.ok) {
        toast({ title: "Protokoll aktualisiert", description: "Das Protokoll wurde erfolgreich aktualisiert." })
        setEditDialogOpen(false)
        setSelectedProtocol(null)
        fetchProtocols()
      } else {
        throw new Error("Failed to update protocol")
      }
    } catch (error) {
      toast({ title: "Fehler", description: "Das Protokoll konnte nicht aktualisiert werden.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteClick = (protocol: Protocol) => {
    setProtocolToDelete(protocol)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!currentPractice?.id || !protocolToDelete) return
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/protocols/${protocolToDelete.id}`, {
        method: "DELETE",
        credentials: "include",
      })
      if (response.ok) {
        toast({ title: "Protokoll gelöscht", description: "Das Protokoll wurde erfolgreich gelöscht." })
        fetchProtocols()
      }
    } catch (error) {
      toast({ title: "Fehler", description: "Das Protokoll konnte nicht gelöscht werden.", variant: "destructive" })
    } finally {
      setDeleteDialogOpen(false)
      setProtocolToDelete(null)
    }
  }

  const openEditDialog = (protocol: Protocol) => {
    setSelectedProtocol(protocol)
    setFormData({
      title: protocol.title || "",
      description: protocol.description || "",
      category: protocol.category || "general",
      content: protocol.content || "",
      protocolDate: new Date(protocol.protocol_date || Date.now()),
      actionItems: protocol.action_items || [],
    })
    setEditDialogOpen(true)
  }

  const handleTranscriptComplete = (transcript: string, title?: string) => {
    setFormData((prev) => ({
      ...prev,
      title: title || prev.title || "Transkription vom " + format(new Date(), "dd.MM.yyyy HH:mm", { locale: de }),
      content: transcript,
      protocolDate: new Date(),
      actionItems: [],
    }))
    setCreateDialogOpen(true)
  }

  const stats = {
    total: protocols.length,
    published: protocols.filter((p) => p.status === "published").length,
    draft: protocols.filter((p) => p.status === "draft").length,
  }

  return {
    // State
    user,
    authLoading,
    practiceLoading,
    protocols,
    loading,
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    categoryFilter,
    setCategoryFilter,
    activeTab,
    setActiveTab,
    createDialogOpen,
    setCreateDialogOpen,
    recordingDialogOpen,
    setRecordingDialogOpen,
    editDialogOpen,
    setEditDialogOpen,
    selectedProtocol,
    formData,
    setFormData,
    isSaving,
    teamMembers,
    generatingTodos,
    deleteDialogOpen,
    setDeleteDialogOpen,
    protocolToDelete,
    
    // Computed
    categories,
    filteredProtocols,
    stats,
    
    // Actions
    addActionItem,
    updateActionItem,
    removeActionItem,
    handleCreate,
    handleUpdate,
    handleDeleteClick,
    handleDeleteConfirm,
    openEditDialog,
    handleTranscriptComplete,
  }
}
