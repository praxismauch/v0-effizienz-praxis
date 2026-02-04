"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Plus,
  Search,
  FileText,
  Clock,
  Mic,
  List,
  Grid,
  MoreHorizontal,
  Edit,
  Trash2,
  Filter,
  Calendar,
  User,
  CheckSquare,
  X,
} from "lucide-react"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { StatCard, statCardColors } from "@/components/ui/stat-card"
import { CreateProtocolRecordingDialog } from "@/components/create-protocol-recording-dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "general",
    content: "",
    protocolDate: new Date(),
    actionItems: [] as ProtocolItem[],
  })
  const [isSaving, setIsSaving] = useState(false)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [generatingTodos, setGeneratingTodos] = useState(false)
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

        // Generate todos if action items exist
        if (formData.actionItems.length > 0) {
          await generateTodosFromItems(data.id)
        }

        toast({ title: "Protokoll erstellt", description: "Das Protokoll wurde erfolgreich erstellt." })
        setCreateDialogOpen(false)
        setFormData({
          title: "",
          description: "",
          category: "general",
          content: "",
          protocolDate: new Date(),
          actionItems: [],
        })
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

  const publishedCount = protocols.filter((p) => p.status === "published").length
  const draftCount = protocols.filter((p) => p.status === "draft").length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gesprächsprotokolle</h1>
          <p className="text-muted-foreground">Nehmen Sie Meetings auf und erstellen Sie automatisch Protokolle</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setRecordingDialogOpen(true)}>
            <Mic className="mr-2 h-4 w-4" />
            Neue Aufnahme
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Manuell erstellen
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Gesamt" value={stats.total} icon={FileText} {...statCardColors.primary} />
        <StatCard label="Veröffentlicht" value={publishedCount} icon={FileText} {...statCardColors.success} />
        <StatCard label="Entwürfe" value={draftCount} icon={Clock} {...statCardColors.warning} />
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto gap-1">
            <TabsTrigger value="all">Alle ({protocols.length})</TabsTrigger>
            <TabsTrigger value="published">Veröffentlicht ({publishedCount})</TabsTrigger>
            <TabsTrigger value="draft">Entwürfe ({draftCount})</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
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
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : filteredProtocols.length > 0 ? (
        viewMode === "list" ? (
          <div className="space-y-4">
            {filteredProtocols.map((protocol) => (
              <Card key={protocol.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{protocol.title}</CardTitle>
                      <CardDescription>{protocol.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={protocol.status === "published" ? "default" : "secondary"}>
                        {protocol.status === "published" ? "Veröffentlicht" : "Entwurf"}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(protocol)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Bearbeiten
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteClick(protocol)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Löschen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <Badge variant="outline">{protocol.category}</Badge>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {format(new Date(protocol.created_at), "dd.MM.yyyy", { locale: de })}
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      {protocol.steps?.length || 0} Schritte
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProtocols.map((protocol) => (
              <Card
                key={protocol.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => openEditDialog(protocol)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{protocol.title}</CardTitle>
                      <CardDescription>{protocol.description}</CardDescription>
                    </div>
                    <Badge variant={protocol.status === "published" ? "default" : "secondary"}>
                      {protocol.status === "published" ? "Live" : "Entwurf"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {format(new Date(protocol.created_at), "dd.MM.yyyy", { locale: de })}
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      {protocol.steps?.length || 0} Schritte
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Keine Protokolle gefunden</h3>
            <p className="text-muted-foreground text-center mt-2">
              {searchQuery || categoryFilter !== "all"
                ? "Passen Sie Ihre Suchkriterien an"
                : "Erstellen Sie Ihr erstes Protokoll"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Create Protocol Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Neues Protokoll erstellen</DialogTitle>
            <DialogDescription>Erstellen Sie ein neues Gesprächsprotokoll</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titel *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="z.B. Teambesprechung KW 48"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Kategorie</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Allgemein</SelectItem>
                    <SelectItem value="team">Teambesprechung</SelectItem>
                    <SelectItem value="patient">Patientenbesprechung</SelectItem>
                    <SelectItem value="management">Management</SelectItem>
                    <SelectItem value="training">Schulung</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="protocolDate">Datum</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.protocolDate && "text-muted-foreground",
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {formData.protocolDate
                      ? format(formData.protocolDate, "dd.MM.yyyy", { locale: de })
                      : "Datum auswählen"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={formData.protocolDate}
                    onSelect={(date) => date && setFormData((prev) => ({ ...prev, protocolDate: date }))}
                    locale={de}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Kurze Beschreibung des Meetings"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Inhalt / Notizen</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                placeholder="Protokollinhalt, Notizen, Beschlüsse..."
                rows={6}
              />
            </div>

            {/* Action Items Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" />
                  Aktionspunkte / Todos
                </Label>
                <Button type="button" variant="outline" size="sm" onClick={addActionItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Hinzufügen
                </Button>
              </div>

              {formData.actionItems.length > 0 && (
                <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
                  {formData.actionItems.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 p-3 bg-background rounded-md border">
                      <div className="flex-1 space-y-2">
                        <Input
                          value={item.title}
                          onChange={(e) => updateActionItem(item.id, { title: e.target.value })}
                          placeholder="Aufgabe beschreiben..."
                          className="font-medium"
                        />
                        <div className="flex items-center gap-2">
                          <Select
                            value={item.responsibleId || "unassigned"}
                            onValueChange={(value) => {
                              const member = teamMembers.find((m) => m.id === value)
                              updateActionItem(item.id, {
                                responsibleId: value === "unassigned" ? null : value,
                                responsibleName: member?.name || "",
                              })
                            }}
                          >
                            <SelectTrigger className="w-[200px]">
                              <User className="h-4 w-4 mr-2" />
                              <SelectValue placeholder="Verantwortlich" />
                            </SelectTrigger>
                            <SelectContent position="popper" className="max-h-[300px]">
                              <SelectItem value="unassigned">Nicht zugewiesen</SelectItem>
                              {teamMembers.map((member) => {
                                const memberId = member.user_id || member.id || member.team_member_id
                                if (!memberId) return null
                                return (
                                  <SelectItem key={memberId} value={memberId}>
                                    <div className="flex items-center gap-2">
                                      <Avatar className="h-5 w-5">
                                        <AvatarImage src={member.avatar_url || "/placeholder.svg"} />
                                        <AvatarFallback className="text-xs">
                                          {member.name?.charAt(0) || "?"}
                                        </AvatarFallback>
                                      </Avatar>
                                      {member.name}
                                    </div>
                                  </SelectItem>
                                )
                              })}
                            </SelectContent>
                          </Select>

                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="sm" className="w-[140px] bg-transparent">
                                <Calendar className="h-4 w-4 mr-2" />
                                {item.dueDate ? format(item.dueDate, "dd.MM.yy", { locale: de }) : "Fällig am"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={item.dueDate || undefined}
                                onSelect={(date) => updateActionItem(item.id, { dueDate: date || null })}
                                locale={de}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeActionItem(item.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleCreate} disabled={isSaving || !formData.title.trim()}>
              {isSaving ? "Wird erstellt..." : "Protokoll erstellen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Protocol Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Protokoll bearbeiten</DialogTitle>
            <DialogDescription>Bearbeiten Sie das Gesprächsprotokoll</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Titel *</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="z.B. Teambesprechung KW 48"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Kategorie</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Allgemein</SelectItem>
                    <SelectItem value="team">Teambesprechung</SelectItem>
                    <SelectItem value="patient">Patientenbesprechung</SelectItem>
                    <SelectItem value="management">Management</SelectItem>
                    <SelectItem value="training">Schulung</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Beschreibung</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Kurze Beschreibung des Meetings"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-content">Inhalt / Notizen</Label>
              <Textarea
                id="edit-content"
                value={formData.content}
                onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                placeholder="Protokollinhalt, Notizen, Beschlüsse..."
                rows={6}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleUpdate} disabled={isSaving || !formData.title.trim()}>
              {isSaving ? "Wird gespeichert..." : "Speichern"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              Sind Sie sicher, dass Sie das Protokoll "{protocolToDelete?.title}" löschen möchten? Diese Aktion kann
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
