"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, FileText, Clock, Mic, List, Grid, Filter } from "lucide-react"
import { PageHeader } from "@/components/page-layout"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { StatCard, statCardColors } from "@/components/ui/stat-card"
import { CreateProtocolRecordingDialog } from "@/components/create-protocol-recording-dialog"
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
import { ProtocolFormDialog, type ProtocolFormData } from "./components/protocol-form-dialog"
import { ProtocolList } from "./components/protocol-list"

interface ProtocolItem {
  id: string
  title: string
  responsibleId: string | null
  responsibleName: string
  dueDate: Date | null
}

interface Protocol {
  id: string
  title: string
  description?: string
  content?: string
  category: string
  status: "draft" | "published" | "archived"
  steps?: any[]
  action_items?: ProtocolItem[]
  protocol_date?: string
  created_at: string
  updated_at: string
  created_by?: string
}

interface TeamMember {
  id: string
  name: string
  role?: string
  avatar_url?: string
}

const defaultFormData: ProtocolFormData = {
  title: "",
  description: "",
  category: "general",
  content: "",
  protocolDate: new Date(),
  actionItems: [],
  attendees: [],
}

type PageClientProps = {}

export default function PageClient(_props: PageClientProps) {
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
  const [formData, setFormData] = useState<ProtocolFormData>(defaultFormData)
  const [isSaving, setIsSaving] = useState(false)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [protocolToDelete, setProtocolToDelete] = useState<Protocol | null>(null)

  useEffect(() => {
    if (currentPractice?.id) {
      fetchProtocols()
      fetchTeamMembers()
    }
  }, [currentPractice?.id])

  const fetchProtocols = async () => {
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
  }

  const fetchTeamMembers = async () => {
    if (!currentPractice?.id) return
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/team-members`)
      if (response.ok) {
        const data = await response.json()
        setTeamMembers(data.teamMembers || [])
      }
    } catch (error) {
      console.error("Error fetching team members:", error)
    }
  }

  const categories = [...new Set(protocols.map((p) => p.category).filter(Boolean))]

  const filteredProtocols = protocols.filter((protocol) => {
    const matchesSearch =
      protocol.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      protocol.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === "all" || protocol.category === categoryFilter
    const matchesTab = activeTab === "all" || protocol.status === activeTab
    return matchesSearch && matchesCategory && matchesTab
  })

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
          attendees: formData.attendees,
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
        setFormData({ ...defaultFormData, protocolDate: new Date() })
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
      attendees: (protocol as any).attendees || [],
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
      attendees: [],
    }))
    setCreateDialogOpen(true)
  }

  const stats = {
    total: protocols.length,
    published: protocols.filter((p) => p.status === "published").length,
    draft: protocols.filter((p) => p.status === "draft").length,
  }

  if (authLoading || practiceLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-48">
            <p className="text-muted-foreground">Bitte melden Sie sich an, um Protokolle zu sehen.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const publishedCount = stats.published
  const draftCount = stats.draft

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <PageHeader
        title="Gesprächsprotokolle"
        subtitle="Nehmen Sie Meetings auf und erstellen Sie automatisch Protokolle"
        actions={
          <>
            <Button
              onClick={() => setRecordingDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200"
            >
              <Mic className="mr-2 h-4 w-4 animate-pulse" />
              Neue Aufnahme
            </Button>
            <Button variant="outline" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Manuell erstellen
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Gesamt" value={stats.total} icon={FileText} {...statCardColors.primary} />
        <StatCard label="Veröffentlicht" value={publishedCount} icon={FileText} {...statCardColors.success} />
        <StatCard label="Entwürfe" value={draftCount} icon={Clock} {...statCardColors.warning} />
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto gap-1">
            <TabsTrigger value="all">Alle ({protocols.length})</TabsTrigger>
            <TabsTrigger value="published">Veröffentlicht ({publishedCount})</TabsTrigger>
            <TabsTrigger value="draft">Entwürfe ({draftCount})</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
            <Button variant={viewMode === "list" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("list")}>
              <List className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === "grid" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("grid")}>
              <Grid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Filter Row */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Protokolle durchsuchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
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

      {/* Protocols List/Grid */}
      <ProtocolList
        protocols={filteredProtocols}
        loading={loading}
        viewMode={viewMode}
        searchQuery={searchQuery}
        categoryFilter={categoryFilter}
        onEdit={openEditDialog}
        onDelete={handleDeleteClick}
      />

      {/* Create Protocol Dialog */}
      <ProtocolFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        formData={formData}
        onFormDataChange={setFormData}
        onSubmit={handleCreate}
        isSaving={isSaving}
        mode="create"
        teamMembers={teamMembers}
      />

      {/* Edit Protocol Dialog */}
      <ProtocolFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        formData={formData}
        onFormDataChange={setFormData}
        onSubmit={handleUpdate}
        isSaving={isSaving}
        mode="edit"
        teamMembers={teamMembers}
      />

      {/* Recording Dialog */}
      <CreateProtocolRecordingDialog
        open={recordingDialogOpen}
        onOpenChange={setRecordingDialogOpen}
        onTranscriptComplete={handleTranscriptComplete}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Protokoll löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Sind Sie sicher, dass Sie das Protokoll &quot;{protocolToDelete?.title}&quot; löschen möchten? Diese Aktion kann
              nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
