"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { AppLayout } from "@/components/app-layout"
import { usePractice } from "@/contexts/practice-context"
import { useUser } from "@/contexts/user-context"
import { useAiEnabled } from "@/lib/hooks/use-ai-enabled"
import { useToast } from "@/hooks/use-toast"
import { Plus, Search, GitBranch, Sparkles, List, Grid } from "lucide-react"
import { WorkflowDetailDialog } from "@/components/workflow-detail-dialog"
import type { Workflow, WorkflowFormData } from "./workflow-types"
import { defaultFormData, statusConfig } from "./workflow-types"
import { WorkflowStats } from "./components/workflow-stats"
import { WorkflowCard } from "./components/workflow-card"
import { WorkflowFormDialog } from "./components/workflow-form-dialog"

export default function WorkflowsPageClient() {
  const { currentPractice } = usePractice()
  const { currentUser: user } = useUser()
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
  const [formData, setFormData] = useState<WorkflowFormData>({ ...defaultFormData })
  const [isSaving, setIsSaving] = useState(false)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)

  useEffect(() => {
    // Don't fetch workflows until user authentication is complete
    if (!user) return
    if (currentPractice?.id) loadWorkflows()
  }, [currentPractice?.id, user])

  const loadWorkflows = async () => {
    if (!currentPractice?.id) return
    try {
      setIsLoading(true)
      const response = await fetch(`/api/practices/${currentPractice.id}/workflows`)
      if (response.ok) {
        const data = await response.json()
        setWorkflows(data.workflows || [])
      } else if (response.status === 401) {
        console.log("[v0] Workflows: 401 unauthorized - session may not be ready")
        setWorkflows([])
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      console.error("[v0] Workflows fetch error:", error)
      toast({ title: "Fehler", description: "Workflows konnten nicht geladen werden.", variant: "destructive" })
      setWorkflows([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!currentPractice?.id || !formData.name.trim()) return
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
        setFormData({ ...defaultFormData })
        loadWorkflows()
      } else {
        throw new Error("Failed to create workflow")
      }
    } catch {
      toast({ title: "Fehler", description: "Der Workflow konnte nicht erstellt werden.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdate = async () => {
    if (!currentPractice?.id || !selectedWorkflow?.id) return
    setIsSaving(true)
    try {
      const response = await fetch(
        `/api/practices/${currentPractice.id}/workflows/${selectedWorkflow.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        },
      )
      if (response.ok) {
        toast({ title: "Workflow aktualisiert", description: "Der Workflow wurde erfolgreich aktualisiert." })
        setIsEditDialogOpen(false)
        setSelectedWorkflow(null)
        setFormData({ ...defaultFormData })
        loadWorkflows()
      } else {
        throw new Error("Failed to update workflow")
      }
    } catch {
      toast({ title: "Fehler", description: "Der Workflow konnte nicht aktualisiert werden.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (workflow: Workflow) => {
    if (!currentPractice?.id) return
    if (!confirm("Sind Sie sicher, dass Sie diesen Workflow löschen möchten?")) return
    try {
      const response = await fetch(
        `/api/practices/${currentPractice.id}/workflows/${workflow.id}`,
        { method: "DELETE" },
      )
      if (response.ok) {
        setWorkflows((prev) => prev.filter((w) => w.id !== workflow.id))
        toast({ title: "Workflow gelöscht", description: "Der Workflow wurde erfolgreich gelöscht." })
      }
    } catch {
      toast({ title: "Fehler", description: "Der Workflow konnte nicht gelöscht werden.", variant: "destructive" })
    }
  }

  const handleToggleStatus = async (workflow: Workflow) => {
    if (!currentPractice?.id) return
    const newStatus = workflow.status === "active" ? "paused" : "active"
    try {
      const response = await fetch(
        `/api/practices/${currentPractice.id}/workflows/${workflow.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        },
      )
      if (response.ok) {
        setWorkflows((prev) =>
          prev.map((w) => (w.id === workflow.id ? { ...w, status: newStatus } : w)),
        )
        toast({
          title: "Status geändert",
          description: `Workflow ist jetzt ${statusConfig[newStatus].label}.`,
        })
      }
    } catch {
      toast({ title: "Fehler", description: "Status konnte nicht geändert werden.", variant: "destructive" })
    }
  }

  const handleGenerateAI = async () => {
    if (!currentPractice?.id) return
    setIsGeneratingAI(true)
    try {
      const response = await fetch(
        `/api/practices/${currentPractice.id}/workflows/ai-generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category: formData.category }),
        },
      )
      if (response.ok) {
        const data = await response.json()
        setFormData((prev) => ({
          ...prev,
          name: data.name || prev.name,
          description: data.description || prev.description,
        }))
        toast({ title: "KI-Vorschlag", description: "Workflow-Vorschlag wurde generiert." })
      }
    } catch {
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

  const filteredWorkflows = workflows.filter((workflow) => {
    const matchesSearch =
      workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workflow.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTab = activeTab === "all" || workflow.status === activeTab
    return matchesSearch && matchesTab
  })

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Workflows</h1>
            <p className="text-muted-foreground">
              Verwalten Sie Ihre Praxis-Arbeitsabläufe
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isAiEnabled && (
              <Button
                variant="outline"
                onClick={() => {
                  setFormData({ ...defaultFormData })
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

        <WorkflowStats workflows={workflows} />

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
          <div className="flex items-center gap-1.5 p-1 bg-muted rounded-lg">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
          </div>
        </div>

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
              {searchTerm
                ? "Versuchen Sie eine andere Suche."
                : "Erstellen Sie Ihren ersten Workflow."}
            </p>
            {!searchTerm && (
              <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Workflow erstellen
              </Button>
            )}
          </Card>
        ) : (
          <div
            className={
              viewMode === "list"
                ? "space-y-4"
                : "grid gap-4 md:grid-cols-2 lg:grid-cols-3"
            }
          >
            {filteredWorkflows.map((workflow) => (
              <WorkflowCard
                key={workflow.id}
                workflow={workflow}
                viewMode={viewMode}
                onEdit={openEditDialog}
                onDelete={handleDelete}
                onToggleStatus={handleToggleStatus}
                onViewDetails={(w) => {
                  setSelectedWorkflowForDetail(w)
                  setDetailDialogOpen(true)
                }}
              />
            ))}
          </div>
        )}

        <WorkflowFormDialog
          open={isCreateDialogOpen}
          onOpenChange={(open) => {
            setIsCreateDialogOpen(open)
            if (!open) setFormData({ ...defaultFormData })
          }}
          formData={formData}
          onFormDataChange={setFormData}
          onSubmit={handleCreate}
          isSaving={isSaving}
          isAiEnabled={isAiEnabled}
          isGeneratingAI={isGeneratingAI}
          onGenerateAI={handleGenerateAI}
        />

        <WorkflowFormDialog
          open={isEditDialogOpen}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open)
            if (!open) {
              setSelectedWorkflow(null)
              setFormData({ ...defaultFormData })
            }
          }}
          formData={formData}
          onFormDataChange={setFormData}
          onSubmit={handleUpdate}
          isSaving={isSaving}
          isEdit
        />

        {selectedWorkflowForDetail && (
          <WorkflowDetailDialog
            workflow={{
              id: selectedWorkflowForDetail.id,
              title: selectedWorkflowForDetail.name,
              description: selectedWorkflowForDetail.description,
              category: selectedWorkflowForDetail.category,
              priority: selectedWorkflowForDetail.priority || "medium",
              status:
                selectedWorkflowForDetail.status === "archived"
                  ? "draft"
                  : selectedWorkflowForDetail.status,
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
                loadWorkflows()
              }
            }}
          />
        )}
      </div>
    </AppLayout>
  )
}
