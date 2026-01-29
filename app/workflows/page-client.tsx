"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
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
import { AppLayout } from "@/components/app-layout"
import { usePractice } from "@/contexts/practice-context"
import { useUser } from "@/contexts/user-context"
import { useAiEnabled } from "@/lib/hooks/use-ai-enabled"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Plus,
  Search,
  GitBranch,
  Edit,
  Trash2,
  MoreHorizontal,
  Play,
  Pause,
  CheckCircle,
  Clock,
  Sparkles,
  List,
  Grid,
  Eye,
} from "lucide-react"
import { WorkflowDetailDialog } from "@/components/workflow-detail-dialog"

interface Workflow {
  id: string
  name: string
  description: string
  category: string
  status: "active" | "draft" | "archived" | "completed" | "paused"
  steps_count: number
  steps?: any[]
  created_at: string
  updated_at: string
  priority?: "low" | "medium" | "high" | "urgent"
  team_ids?: string[]
  estimated_duration?: number
}

const categoryLabels: Record<string, string> = {
  patient: "Patientenmanagement",
  team: "Teamorganisation",
  admin: "Administration",
  quality: "Qualitätsmanagement",
  finance: "Finanzen",
  other: "Sonstiges",
}

const statusConfig = {
  active: { label: "Aktiv", color: "bg-green-100 text-green-800", icon: CheckCircle },
  draft: { label: "Entwurf", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  archived: { label: "Archiviert", color: "bg-gray-100 text-gray-800", icon: Clock },
  completed: { label: "Abgeschlossen", color: "bg-blue-100 text-blue-800", icon: CheckCircle },
  paused: { label: "Pausiert", color: "bg-orange-100 text-orange-800", icon: Pause },
}

const priorityConfig = {
  low: { label: "Niedrig", color: "bg-green-100 text-green-800" },
  medium: { label: "Mittel", color: "bg-yellow-100 text-yellow-800" },
  high: { label: "Hoch", color: "bg-orange-100 text-orange-800" },
  urgent: { label: "Dringend", color: "bg-red-100 text-red-800" },
}

export default function WorkflowsPageClient() {
  const { currentPractice, isLoading: practiceLoading } = usePractice()
  const { currentUser: user, loading: authLoading } = useUser()
  const { isAiEnabled } = useAiEnabled()
  const { toast } = useToast()

  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedWorkflowForDetail, setSelectedWorkflowForDetail] = useState<Workflow | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "other",
    status: "draft" as const,
    priority: "medium" as const,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)

  useEffect(() => {
    if (currentPractice?.id) {
      loadWorkflows()
    }
  }, [currentPractice?.id])

  const loadWorkflows = async () => {
    if (!currentPractice?.id) {
      toast({
        title: "Keine Praxis ausgewählt",
        description: "Workflows können nicht ohne Praxis-ID geladen werden.",
        variant: "destructive",
      })
      return
    }
    try {
      setIsLoading(true)
      const response = await fetch(`/api/practices/${currentPractice.id}/workflows`)
      if (response.ok) {
        const data = await response.json()
        setWorkflows(data.workflows || [])
      }
    } catch (error) {
      console.error("Error loading workflows:", error)
      toast({ title: "Fehler", description: "Workflows konnten nicht geladen werden.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  // ... existing handlers ...

  const handleCreate = async () => {
    if (!currentPractice?.id) {
      toast({
        title: "Keine Praxis ausgewählt",
        description: "Workflows können nicht ohne Praxis-ID erstellt werden.",
        variant: "destructive",
      })
      return
    }
    if (!formData.name.trim()) {
      toast({
        title: "Name fehlt",
        description: "Bitte geben Sie einen Namen für den Workflow ein.",
        variant: "destructive",
      })
      return
    }
    setIsSaving(true)
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/workflows`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (response.ok) {
        toast({ title: "Workflow erstellt", description: "Der Workflow wurde erfolgreich erstellt." })
        setIsCreateDialogOpen(false)
        setFormData({ name: "", description: "", category: "other", status: "draft", priority: "medium" })
        loadWorkflows()
      } else {
        throw new Error("Failed to create workflow")
      }
    } catch (error) {
      toast({ title: "Fehler", description: "Der Workflow konnte nicht erstellt werden.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdate = async () => {
    if (!currentPractice?.id) {
      toast({
        title: "Keine Praxis ausgewählt",
        description: "Workflows können nicht ohne Praxis-ID aktualisiert werden.",
        variant: "destructive",
      })
      return
    }
    if (!selectedWorkflow?.id) {
      toast({
        title: "Kein Workflow ausgewählt",
        description: "Bitte wählen Sie einen Workflow zum Bearbeiten aus.",
        variant: "destructive",
      })
      return
    }
    setIsSaving(true)
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/workflows/${selectedWorkflow.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (response.ok) {
        toast({ title: "Workflow aktualisiert", description: "Der Workflow wurde erfolgreich aktualisiert." })
        setIsEditDialogOpen(false)
        setSelectedWorkflow(null)
        setFormData({ name: "", description: "", category: "other", status: "draft", priority: "medium" })
        loadWorkflows()
      } else {
        throw new Error("Failed to update workflow")
      }
    } catch (error) {
      toast({ title: "Fehler", description: "Der Workflow konnte nicht aktualisiert werden.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (workflow: Workflow) => {
    if (!currentPractice?.id) {
      toast({
        title: "Keine Praxis ausgewählt",
        description: "Workflows können nicht ohne Praxis-ID gelöscht werden.",
        variant: "destructive",
      })
      return
    }
    if (!confirm("Sind Sie sicher, dass Sie diesen Workflow löschen möchten?")) return
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/workflows/${workflow.id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        setWorkflows((prev) => prev.filter((w) => w.id !== workflow.id))
        toast({ title: "Workflow gelöscht", description: "Der Workflow wurde erfolgreich gelöscht." })
      }
    } catch (error) {
      toast({ title: "Fehler", description: "Der Workflow konnte nicht gelöscht werden.", variant: "destructive" })
    }
  }

  const handleToggleStatus = async (workflow: Workflow) => {
    if (!currentPractice?.id) {
      toast({
        title: "Keine Praxis ausgewählt",
        description: "Workflow-Status kann nicht ohne Praxis-ID geändert werden.",
        variant: "destructive",
      })
      return
    }
    const newStatus = workflow.status === "active" ? "paused" : "active"
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/workflows/${workflow.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (response.ok) {
        setWorkflows((prev) => prev.map((w) => (w.id === workflow.id ? { ...w, status: newStatus } : w)))
        toast({ title: "Status geändert", description: `Workflow ist jetzt ${statusConfig[newStatus].label}.` })
      }
    } catch (error) {
      toast({ title: "Fehler", description: "Status konnte nicht geändert werden.", variant: "destructive" })
    }
  }

  const handleGenerateAI = async () => {
    if (!currentPractice?.id) {
      toast({
        title: "Keine Praxis ausgewählt",
        description: "KI-Generierung benötigt eine gültige Praxis-ID.",
        variant: "destructive",
      })
      return
    }
    setIsGeneratingAI(true)
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/workflows/ai-generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: formData.category }),
      })
      if (response.ok) {
        const data = await response.json()
        setFormData((prev) => ({
          ...prev,
          name: data.name || prev.name,
          description: data.description || prev.description,
        }))
        toast({ title: "KI-Vorschlag", description: "Workflow-Vorschlag wurde generiert." })
      }
    } catch (error) {
      toast({ title: "Fehler", description: "KI-Generierung fehlgeschlagen.", variant: "destructive" })
    } finally {
      setIsGeneratingAI(false)
    }
  }

  const openEditDialog = (workflow: Workflow) => {
    setSelectedWorkflow(workflow)
    setFormData({
      name: workflow.name,
      description: workflow.description || "",
      category: workflow.category,
      status: workflow.status,
      priority: workflow.priority || "medium",
    })
    setIsEditDialogOpen(true)
  }

  const openDetailDialog = (workflow: Workflow) => {
    setSelectedWorkflowForDetail(workflow)
    setDetailDialogOpen(true)
  }

  const filteredWorkflows = workflows.filter((workflow) => {
    const matchesSearch =
      workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workflow.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTab = activeTab === "all" || workflow.status === activeTab
    return matchesSearch && matchesTab
  })

  const stats = {
    total: workflows.length,
    active: workflows.filter((w) => w.status === "active").length,
    draft: workflows.filter((w) => w.status === "draft").length,
    completed: workflows.filter((w) => w.status === "completed").length,
  }

  if (!user || !currentPractice) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Workflows</h1>
            <p className="text-muted-foreground">Verwalten Sie Ihre Praxis-Arbeitsabläufe</p>
          </div>
          <div className="flex items-center gap-2">
            {isAiEnabled && (
              <Button
                variant="outline"
                onClick={() => {
                  setFormData({ name: "", description: "", category: "other", status: "draft", priority: "medium" })
                  setIsCreateDialogOpen(true)
                }}
                className="gap-2 bg-gradient-to-r from-purple-500/90 to-indigo-500/90 hover:from-purple-600 hover:to-indigo-600 text-white border-0"
              >
                <Sparkles className="h-4 w-4" />
                Mit KI generieren
              </Button>
            )}
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Neuer Workflow
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Gesamt</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Aktiv</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Entwürfe</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.draft}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Abgeschlossen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.completed}</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Workflows durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">Alle</TabsTrigger>
                <TabsTrigger value="active">Aktiv</TabsTrigger>
                <TabsTrigger value="draft">Entwürfe</TabsTrigger>
                <TabsTrigger value="completed">Abgeschlossen</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1.5 p-1 bg-muted rounded-lg">
            <Button variant={viewMode === "list" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("list")}>
              <List className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === "grid" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("grid")}>
              <Grid className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Workflows */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : filteredWorkflows.length === 0 ? (
          <Card className="p-12 text-center">
            <GitBranch className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">Keine Workflows gefunden</h3>
            <p className="mt-2 text-muted-foreground">
              {searchTerm ? "Versuchen Sie eine andere Suche." : "Erstellen Sie Ihren ersten Workflow."}
            </p>
            {!searchTerm && (
              <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Workflow erstellen
              </Button>
            )}
          </Card>
        ) : viewMode === "list" ? (
          /* List View */
          <div className="space-y-4">
            {filteredWorkflows.map((workflow) => {
              const StatusIcon = statusConfig[workflow.status]?.icon || Clock
              const completedSteps = workflow.steps?.filter((s: any) => s.status === "completed").length || 0
              const totalSteps = workflow.steps_count || workflow.steps?.length || 0
              const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0

              return (
                <Card key={workflow.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <GitBranch className="h-5 w-5 text-primary" />
                        <div>
                          <CardTitle className="text-lg">{workflow.name}</CardTitle>
                          <CardDescription className="line-clamp-1">
                            {workflow.description || "Keine Beschreibung"}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{categoryLabels[workflow.category] || workflow.category}</Badge>
                        <Badge className={statusConfig[workflow.status]?.color}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {statusConfig[workflow.status]?.label}
                        </Badge>
                        {workflow.priority && (
                          <Badge className={priorityConfig[workflow.priority]?.color}>
                            {priorityConfig[workflow.priority]?.label}
                          </Badge>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openDetailDialog(workflow)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Details & Schritte
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditDialog(workflow)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Bearbeiten
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(workflow)}>
                              {workflow.status === "active" ? (
                                <>
                                  <Pause className="mr-2 h-4 w-4" />
                                  Pausieren
                                </>
                              ) : (
                                <>
                                  <Play className="mr-2 h-4 w-4" />
                                  Aktivieren
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(workflow)} className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Löschen
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6">
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Fortschritt</span>
                          <span className="font-medium">
                            {completedSteps} / {totalSteps} Schritte
                          </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                      {workflow.estimated_duration && (
                        <div className="text-sm text-muted-foreground">
                          <Clock className="inline h-3 w-3 mr-1" />
                          {workflow.estimated_duration} Min.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          /* Grid View */
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredWorkflows.map((workflow) => {
              const StatusIcon = statusConfig[workflow.status]?.icon || Clock
              const completedSteps = workflow.steps?.filter((s: any) => s.status === "completed").length || 0
              const totalSteps = workflow.steps_count || workflow.steps?.length || 0
              const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0

              return (
                <Card key={workflow.id} className="relative hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <GitBranch className="h-5 w-5 text-primary" />
                        <CardTitle className="text-base">{workflow.name}</CardTitle>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openDetailDialog(workflow)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Details & Schritte
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(workflow)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Bearbeiten
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(workflow)}>
                            {workflow.status === "active" ? (
                              <>
                                <Pause className="mr-2 h-4 w-4" />
                                Pausieren
                              </>
                            ) : (
                              <>
                                <Play className="mr-2 h-4 w-4" />
                                Aktivieren
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(workflow)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Löschen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {workflow.description || "Keine Beschreibung"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <Badge variant="outline">{categoryLabels[workflow.category] || workflow.category}</Badge>
                      <Badge className={statusConfig[workflow.status]?.color}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {statusConfig[workflow.status]?.label}
                      </Badge>
                      {totalSteps > 0 && <Badge variant="secondary">{totalSteps} Schritte</Badge>}
                    </div>
                    {totalSteps > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Fortschritt</span>
                          <span>
                            {completedSteps} / {totalSteps}
                          </span>
                        </div>
                        <Progress value={progress} className="h-1.5" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Create Dialog */}
        <Dialog
          open={isCreateDialogOpen}
          onOpenChange={(open) => {
            setIsCreateDialogOpen(open)
            if (!open) {
              setFormData({ name: "", description: "", category: "other", status: "draft", priority: "medium" })
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neuen Workflow erstellen</DialogTitle>
              <DialogDescription>Erstellen Sie einen neuen Arbeitsablauf für Ihre Praxis.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="z.B. Patientenaufnahme"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Beschreiben Sie den Workflow..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                      {Object.entries(categoryLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priorität</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: "low" | "medium" | "high" | "urgent") =>
                      setFormData((prev) => ({ ...prev, priority: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(priorityConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {isAiEnabled && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGenerateAI}
                  disabled={isGeneratingAI}
                  className="w-full bg-transparent"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  {isGeneratingAI ? "Generiere..." : "Mit KI generieren"}
                </Button>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleCreate} disabled={isSaving || !formData.name.trim()}>
                {isSaving ? "Erstelle..." : "Erstellen"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog
          open={isEditDialogOpen}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open)
            if (!open) {
              setSelectedWorkflow(null)
              setFormData({ name: "", description: "", category: "other", status: "draft", priority: "medium" })
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Workflow bearbeiten</DialogTitle>
              <DialogDescription>Bearbeiten Sie die Details des Workflows.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Beschreibung</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                      {Object.entries(categoryLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "active" | "draft" | "archived") =>
                      setFormData((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Entwurf</SelectItem>
                      <SelectItem value="active">Aktiv</SelectItem>
                      <SelectItem value="archived">Archiviert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleUpdate} disabled={isSaving || !formData.name.trim()}>
                {isSaving ? "Speichere..." : "Speichern"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {selectedWorkflowForDetail && (
          <WorkflowDetailDialog
            workflow={{
              id: selectedWorkflowForDetail.id,
              title: selectedWorkflowForDetail.name,
              description: selectedWorkflowForDetail.description,
              category: selectedWorkflowForDetail.category,
              priority: selectedWorkflowForDetail.priority || "medium",
              status: selectedWorkflowForDetail.status === "archived" ? "draft" : selectedWorkflowForDetail.status,
              createdBy: "",
              createdAt: selectedWorkflowForDetail.created_at,
              updatedAt: selectedWorkflowForDetail.updated_at,
              practiceId: currentPractice?.id || "",
              teamIds: selectedWorkflowForDetail.team_ids || [],
              steps: selectedWorkflowForDetail.steps || [],
              isTemplate: false,
            }}
            open={detailDialogOpen}
            onOpenChange={(open) => {
              setDetailDialogOpen(open)
              if (!open) {
                setSelectedWorkflowForDetail(null)
                loadWorkflows() // Refresh after closing
              }
            }}
          />
        )}
      </div>
    </AppLayout>
  )
}
