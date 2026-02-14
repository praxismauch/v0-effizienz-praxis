"use client"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppLayout } from "@/components/app-layout"
import { PageHeader } from "@/components/page-header"
import { WorkflowDetailDialog } from "@/components/workflow-detail-dialog"
import { AIWorkflowGeneratorDialog } from "@/components/ai-workflow-generator-dialog"
import { useWorkflow, type Workflow, type WorkflowStep, type WorkflowTemplate } from "@/contexts/workflow-context"
import { usePractice } from "@/contexts/practice-context"
import { usePersistedTab } from "@/hooks/use-persisted-tab"
import { useRouter } from "next/navigation"
import { StatCard, statCardColors } from "@/components/ui/stat-card"
import {
  CheckCircle2,
  Clock,
  Users,
  Plus,
  BookTemplate as FileTemplate,
  WorkflowIcon,
  Edit,
  Trash2,
  Sparkles,
  Loader2,
  AlertCircle,
} from "lucide-react"
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
import { WorkflowCard } from "./workflow-card"
import { CreateWorkflowDialog } from "./create-workflow-dialog"
import { TemplateSelectionDialog } from "./template-selection-dialog"

export const dynamic = "force-dynamic"

export default function WorkflowsPage() {
  const router = useRouter()
  const { currentPractice } = usePractice()
  const {
    workflows,
    templates,
    categories,
    isLoading,
    error,
    createWorkflow,
    updateWorkflow,
    createWorkflowFromTemplate,
    deleteWorkflow,
    deleteTemplate,
  } = useWorkflow()

  const [selectedTab, setSelectedTab] = usePersistedTab("workflows-page", "active")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
  const [selectedWorkflowForDetail, setSelectedWorkflowForDetail] = useState<string | null>(null)
  const [openDetailInEditMode, setOpenDetailInEditMode] = useState(false)
  const [aiGeneratorOpen, setAiGeneratorOpen] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [workflowToDelete, setWorkflowToDelete] = useState<string | null>(null)
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null)

  const [newWorkflow, setNewWorkflow] = useState({
    title: "",
    description: "",
    category: "",
    priority: "medium" as const,
    teamIds: [] as string[],
  })

  const practiceWorkflows = workflows.filter((w) => w.practiceId === currentPractice?.id)

  const workflowsByStatus = useMemo(() => ({
    active: practiceWorkflows.filter((w) => w.status === "active"),
    draft: practiceWorkflows.filter((w) => w.status === "draft"),
    completed: practiceWorkflows.filter((w) => w.status === "completed"),
    all: practiceWorkflows,
  }), [practiceWorkflows])

  useEffect(() => {
    if (categories.length > 0 && !newWorkflow.category) {
      const firstActiveCategory = categories.find((cat) => cat.is_active)
      if (firstActiveCategory) {
        setNewWorkflow((prev) => ({ ...prev, category: firstActiveCategory.id }))
      }
    }
  }, [categories, newWorkflow.category])

  useEffect(() => {
    if (!createDialogOpen) setCreateError(null)
  }, [createDialogOpen])

  const getCategoryLabel = (category: string) => {
    const cat = categories.find((c) => c.id === category || c.name === category)
    return cat?.name || category
  }

  const getCategoryColor = (category: string) => {
    const cat = categories.find((c) => c.id === category || c.name === category)
    return cat?.color || "#6b7280"
  }

  const handleCreateWorkflow = async () => {
    if (!currentPractice?.id || currentPractice.id === "0" || currentPractice.id === "null") {
      setCreateError("Bitte wählen Sie eine gültige Praxis aus, bevor Sie einen Workflow erstellen.")
      return
    }
    if (!newWorkflow.title.trim()) return
    if (categories.length === 0) {
      setCreateError("Bitte erstellen Sie zuerst Kategorien in den Einstellungen.")
      return
    }
    if (!newWorkflow.category) {
      setCreateError("Bitte wählen Sie eine Kategorie aus.")
      return
    }
    setCreateError(null)
    try {
      await createWorkflow({ ...newWorkflow, status: "draft", createdBy: "Current User", isTemplate: false, steps: [] })
      setNewWorkflow({ title: "", description: "", category: "", priority: "medium", teamIds: [] })
      setCreateDialogOpen(false)
      setSelectedTab("draft")
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Fehler beim Erstellen des Workflows")
    }
  }

  const handleCreateFromTemplate = (templateId: string) => {
    createWorkflowFromTemplate(templateId, { teamIds: newWorkflow.teamIds, priority: newWorkflow.priority })
    setTemplateDialogOpen(false)
  }

  const handleToggleWorkflowStatus = async (workflow: Workflow) => {
    const newStatus = workflow.status === "active" ? "paused" : "active"
    await updateWorkflow(workflow.id, { status: newStatus })
    if (newStatus === "active") setSelectedTab("active")
  }

  // Guard: no practice
  if (!currentPractice || !currentPractice.id || currentPractice.id === "0" || currentPractice.id === "null") {
    return (
      <AppLayout>
        <PageHeader title="Workflow Management" subtitle="Verwalten Sie strukturierte Arbeitsabläufe" />
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">Bitte wählen Sie eine gültige Praxis aus, um Workflows anzuzeigen.</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (isLoading) {
    return (
      <AppLayout>
        <PageHeader title="Workflow Management" subtitle={`Arbeitsabläufe für ${currentPractice.name}`} />
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Workflows werden geladen...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout>
        <PageHeader title="Workflow Management" subtitle={`Arbeitsabläufe für ${currentPractice.name}`} />
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <p className="text-muted-foreground">Fehler beim Laden der Workflows</p>
            <p className="text-sm text-destructive">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">Erneut versuchen</Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  const renderWorkflowGrid = (items: Workflow[], emptyIcon: React.ElementType, emptyTitle: string, emptyText: string) => {
    const EmptyIcon = emptyIcon
    if (items.length === 0) {
      return (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <EmptyIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">{emptyTitle}</h3>
            <p className="text-muted-foreground">{emptyText}</p>
          </div>
        </Card>
      )
    }
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((workflow) => (
          <WorkflowCard
            key={workflow.id}
            workflow={workflow}
            getCategoryLabel={getCategoryLabel}
            getCategoryColor={getCategoryColor}
            onToggleStatus={handleToggleWorkflowStatus}
            onEdit={(id) => { setOpenDetailInEditMode(true); setSelectedWorkflowForDetail(id) }}
            onView={(id) => { setOpenDetailInEditMode(false); setSelectedWorkflowForDetail(id) }}
            onDelete={(id) => setWorkflowToDelete(id)}
          />
        ))}
      </div>
    )
  }

  return (
    <AppLayout>
      <PageHeader
        title="Workflow Management"
        subtitle={`Verwalten Sie strukturierte Arbeitsabläufe für ${currentPractice.name}`}
      />
      <div className="space-y-6">
        <div className="flex items-center justify-end">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setAiGeneratorOpen(true)}
              className="gap-2 bg-gradient-to-r from-purple-500/90 to-indigo-500/90 hover:from-purple-600 hover:to-indigo-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300"
            >
              <Sparkles className="h-4 w-4" />
              <span className="font-semibold">Mit KI generieren</span>
            </Button>
            <Button variant="outline" onClick={() => router.push("/workflows/new-template")}>
              <FileTemplate className="mr-2 h-4 w-4" />
              Neue Vorlage
            </Button>
            <Button variant="outline" onClick={() => setTemplateDialogOpen(true)}>
              <FileTemplate className="mr-2 h-4 w-4" />
              Aus Vorlage
            </Button>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Neuer Workflow
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Aktive Workflows" value={workflowsByStatus.active.length} icon={WorkflowIcon} {...statCardColors.primary} />
          <StatCard label="Entwürfe" value={workflowsByStatus.draft.length} icon={Clock} {...statCardColors.secondary} />
          <StatCard label="Abgeschlossen" value={workflowsByStatus.completed.length} icon={CheckCircle2} {...statCardColors.success} />
          <StatCard label="Teams beteiligt" value={new Set(practiceWorkflows.flatMap((w) => w.teamIds)).size} icon={Users} {...statCardColors.info} />
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="active">Aktiv ({workflowsByStatus.active.length})</TabsTrigger>
            <TabsTrigger value="draft">Entwürfe ({workflowsByStatus.draft.length})</TabsTrigger>
            <TabsTrigger value="completed">Abgeschlossen ({workflowsByStatus.completed.length})</TabsTrigger>
            <TabsTrigger value="templates">Vorlagen ({templates.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4 mt-6">
            {renderWorkflowGrid(workflowsByStatus.active, WorkflowIcon, "Keine aktiven Workflows", "Erstellen Sie einen neuen Workflow oder aktivieren Sie einen Entwurf")}
          </TabsContent>
          <TabsContent value="draft" className="space-y-4 mt-6">
            {renderWorkflowGrid(workflowsByStatus.draft, Clock, "Keine Entwürfe", "Neue Workflows werden hier als Entwürfe angezeigt")}
          </TabsContent>
          <TabsContent value="completed" className="space-y-4 mt-6">
            {renderWorkflowGrid(workflowsByStatus.completed, CheckCircle2, "Keine abgeschlossenen Workflows", "Abgeschlossene Workflows werden hier angezeigt")}
          </TabsContent>

          <TabsContent value="templates" className="space-y-4 mt-6">
            {templates.length === 0 ? (
              <Card className="p-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <FileTemplate className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Keine Vorlagen</h3>
                  <p className="text-muted-foreground mb-4">Erstellen Sie Vorlagen für wiederkehrende Workflows</p>
                  <Button onClick={() => router.push("/workflows/new-template")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Neue Vorlage
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {templates.map((template) => (
                  <Card key={template.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{template.title}</CardTitle>
                          {template.description && <CardDescription>{template.description}</CardDescription>}
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => router.push(`/workflows/edit-template/${template.id}`)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setTemplateToDelete(template.id)} className="hover:bg-red-50">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{template.steps?.length || 0} Schritte</span>
                        <span>{"•"}</span>
                        <span>{getCategoryLabel(template.category)}</span>
                      </div>
                      <Button className="w-full mt-4 bg-transparent" variant="outline" onClick={() => handleCreateFromTemplate(template.id)}>
                        Workflow erstellen
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <CreateWorkflowDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        newWorkflow={newWorkflow}
        onWorkflowChange={setNewWorkflow}
        categories={categories}
        createError={createError}
        onSubmit={handleCreateWorkflow}
      />

      <TemplateSelectionDialog
        open={templateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
        templates={templates}
        getCategoryLabel={getCategoryLabel}
        onSelectTemplate={handleCreateFromTemplate}
      />

      {selectedWorkflowForDetail && (
        <WorkflowDetailDialog
          open={!!selectedWorkflowForDetail}
          onOpenChange={(open) => { if (!open) { setSelectedWorkflowForDetail(null); setOpenDetailInEditMode(false) } }}
          workflow={practiceWorkflows.find((w) => w.id === selectedWorkflowForDetail) || null}
          initialEditing={openDetailInEditMode}
        />
      )}

      <AIWorkflowGeneratorDialog open={aiGeneratorOpen} onOpenChange={setAiGeneratorOpen} />

      <AlertDialog open={!!workflowToDelete} onOpenChange={(open) => !open && setWorkflowToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Workflow löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Sind Sie sicher, dass Sie diesen Workflow löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (workflowToDelete) { deleteWorkflow(workflowToDelete); setWorkflowToDelete(null) } }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!templateToDelete} onOpenChange={(open) => !open && setTemplateToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Vorlage löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Sind Sie sicher, dass Sie diese Vorlage löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (templateToDelete) { deleteTemplate(templateToDelete); setTemplateToDelete(null) } }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  )
}
