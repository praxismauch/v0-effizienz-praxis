"use client"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AppLayout } from "@/components/app-layout"
import { PageHeader } from "@/components/page-header"
import { WorkflowDetailDialog } from "@/components/workflow-detail-dialog"
import { WorkflowTemplateDialog } from "@/components/workflow-template-dialog"
import { AIWorkflowGeneratorDialog } from "@/components/ai-workflow-generator-dialog"
import { useWorkflow, type Workflow, type WorkflowStep, type WorkflowTemplate } from "@/contexts/workflow-context"
import { useTeam } from "@/contexts/team-context"
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
  Play,
  Pause,
  Eye,
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

export const dynamic = "force-dynamic"

export default function WorkflowsPage() {
  const router = useRouter()
  const { currentPractice } = usePractice()
  const { teamMembers, teams } = useTeam()
  const {
    workflows,
    templates,
    categories,
    isLoading,
    error,
    createWorkflow,
    updateWorkflow,
    updateWorkflowStep,
    createWorkflowFromTemplate,
    deleteWorkflow,
    deleteTemplate,
  } = useWorkflow()

  const [selectedTab, setSelectedTab] = usePersistedTab("workflows-page", "active")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
  const [stepDialogOpen, setStepDialogOpen] = useState(false)
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null)
  const [selectedStep, setSelectedStep] = useState<string | null>(null)
  const [selectedWorkflowForDetail, setSelectedWorkflowForDetail] = useState<string | null>(null)

  const [templateFormOpen, setTemplateFormOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null)
  const [templateFormMode, setTemplateFormMode] = useState<"create" | "edit">("create")

  const [newWorkflow, setNewWorkflow] = useState({
    title: "",
    description: "",
    category: "",
    priority: "medium" as const,
    teamIds: [] as string[],
  })

  const [aiGeneratorOpen, setAiGeneratorOpen] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const [workflowToDelete, setWorkflowToDelete] = useState<string | null>(null)
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null)

  const practiceWorkflows = workflows.filter((w) => w.practiceId === currentPractice?.id)

  const workflowsByStatus = useMemo(() => {
    return {
      active: practiceWorkflows.filter((w) => w.status === "active"),
      draft: practiceWorkflows.filter((w) => w.status === "draft"),
      completed: practiceWorkflows.filter((w) => w.status === "completed"),
      all: practiceWorkflows,
    }
  }, [practiceWorkflows])

  useEffect(() => {
    // Categories state is now tracked silently
  }, [categories, currentPractice?.id])

  useEffect(() => {
    if (categories.length > 0 && !newWorkflow.category) {
      const firstActiveCategory = categories.find((cat) => cat.is_active)
      if (firstActiveCategory) {
        setNewWorkflow((prev) => ({ ...prev, category: firstActiveCategory.id }))
      }
    }
  }, [categories, newWorkflow.category])

  useEffect(() => {
    if (!createDialogOpen) {
      setCreateError(null)
    }
  }, [createDialogOpen])

  const getStepProgress = (workflow: Workflow) => {
    const completedSteps = workflow.steps.filter((step) => step.status === "completed").length
    return (completedSteps / workflow.steps.length) * 100
  }

  const getPriorityColor = (priority: Workflow["priority"]) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-200"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusColor = (status: Workflow["status"]) => {
    switch (status) {
      case "active":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "paused":
        return "bg-yellow-100 text-yellow-800"
      case "draft":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStepStatusColor = (status: WorkflowStep["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "in-progress":
        return "bg-blue-100 text-blue-800"
      case "blocked":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleCreateWorkflow = async () => {
    if (!currentPractice?.id || currentPractice.id === "0" || currentPractice.id === "null") {
      setCreateError("Bitte wählen Sie eine gültige Praxis aus, bevor Sie einen Workflow erstellen.")
      return
    }

    if (!newWorkflow.title.trim()) return

    if (categories.length === 0) {
      setCreateError("Bitte erstellen Sie zuerst Kategorien in den Einstellungen → Organisationskategorien.")
      return
    }

    if (!newWorkflow.category) {
      setCreateError("Bitte wählen Sie eine Kategorie aus.")
      return
    }

    setCreateError(null)

    try {
      const result = await createWorkflow({
        ...newWorkflow,
        status: "draft",
        createdBy: "Current User",
        isTemplate: false,
        steps: [],
      })

      setNewWorkflow({
        title: "",
        description: "",
        category: "",
        priority: "medium",
        teamIds: [],
      })
      setCreateDialogOpen(false)
      setSelectedTab("draft")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Fehler beim Erstellen des Workflows"
      setCreateError(errorMessage)
    }
  }

  const handleCreateFromTemplate = (templateId: string) => {
    createWorkflowFromTemplate(templateId, {
      teamIds: newWorkflow.teamIds,
      priority: newWorkflow.priority,
    })
    setTemplateDialogOpen(false)
  }

  const handleUpdateStepStatus = (workflowId: string, stepId: string, status: WorkflowStep["status"]) => {
    const updates: Partial<WorkflowStep> = { status }
    if (status === "completed") {
      updates.completedAt = new Date().toISOString()
      updates.completedBy = "Current User"
    }
    updateWorkflowStep(workflowId, stepId, updates)
  }

  const canStartStep = (workflow: Workflow, step: WorkflowStep) => {
    return step.dependencies.every((depId) => workflow.steps.find((s) => s.id === depId)?.status === "completed")
  }

  const getCategoryLabel = (category: string) => {
    const categoryData = categories.find((c) => c.id === category || c.name === category)
    return categoryData?.name || category
  }

  const getCategoryColor = (category: string) => {
    const categoryData = categories.find((c) => c.id === category || c.name === category)
    return categoryData?.color || "#6b7280"
  }

  const WorkflowCard = ({ workflow }: { workflow: Workflow }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{workflow.title}</CardTitle>
            {workflow.description && <CardDescription className="text-sm">{workflow.description}</CardDescription>}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggleWorkflowStatus(workflow)}
              title={workflow.status === "active" ? "Pausieren" : "Starten"}
            >
              {workflow.status === "active" ? (
                <Pause className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
              ) : (
                <Play className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedWorkflowForDetail(workflow.id)}
              title="Bearbeiten"
            >
              <Edit className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedWorkflowForDetail(workflow.id)}
              title="Details anzeigen"
            >
              <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setWorkflowToDelete(workflow.id)}
              title="Löschen"
              className="hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-600 transition-colors" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={getPriorityColor(workflow.priority)}>
            {workflow.priority === "urgent"
              ? "Dringend"
              : workflow.priority === "high"
                ? "Hoch"
                : workflow.priority === "medium"
                  ? "Mittel"
                  : "Niedrig"}
          </Badge>
          <Badge className={getStatusColor(workflow.status)}>
            {workflow.status === "active"
              ? "Aktiv"
              : workflow.status === "completed"
                ? "Abgeschlossen"
                : workflow.status === "paused"
                  ? "Pausiert"
                  : "Entwurf"}
          </Badge>
          <Badge
            variant="outline"
            style={{
              borderColor: getCategoryColor(workflow.category),
              color: getCategoryColor(workflow.category),
            }}
          >
            {getCategoryLabel(workflow.category)}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Fortschritt</span>
            <span className="font-medium">
              {workflow.steps.filter((s) => s.status === "completed").length} / {workflow.steps.length} Schritte
            </span>
          </div>
          <Progress value={getStepProgress(workflow)} className="h-2" />
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>{workflow.teamIds.length} Teams</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{workflow.estimatedTotalDuration || 0} Min.</span>
          </div>
        </div>

        {workflow.steps.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Nächste Schritte:</h4>
            {workflow.steps
              .filter((step) => step.status === "pending" || step.status === "in-progress")
              .slice(0, 2)
              .map((step) => (
                <div key={step.id} className="flex items-center gap-2 text-sm">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      step.status === "in-progress"
                        ? "bg-blue-500"
                        : canStartStep(workflow, step)
                          ? "bg-green-500"
                          : "bg-gray-300"
                    }`}
                  />
                  <span className={!canStartStep(workflow, step) ? "text-muted-foreground" : ""}>{step.title}</span>
                  {step.assignedTo && (
                    <Badge variant="outline" className="text-xs">
                      {step.assignedTo}
                    </Badge>
                  )}
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  )

  const handleCreateTemplate = () => {
    router.push("/workflows/new-template")
  }

  const handleEditTemplate = (template: WorkflowTemplate) => {
    router.push(`/workflows/edit-template/${template.id}`)
  }

  const confirmDeleteWorkflow = () => {
    if (workflowToDelete) {
      deleteWorkflow(workflowToDelete)
      setWorkflowToDelete(null)
    }
  }

  const confirmDeleteTemplate = () => {
    if (templateToDelete) {
      deleteTemplate(templateToDelete)
      setTemplateToDelete(null)
    }
  }

  const handleToggleWorkflowStatus = async (workflow: Workflow) => {
    const newStatus = workflow.status === "active" ? "paused" : "active"
    await updateWorkflow(workflow.id, { status: newStatus })

    if (newStatus === "active") {
      setSelectedTab("active")
    }
  }

  const handleDeleteWorkflow = (workflowId: string) => {
    setWorkflowToDelete(workflowId)
  }

  const handleDeleteTemplate = (templateId: string) => {
    setTemplateToDelete(templateId)
  }

  if (!currentPractice || !currentPractice.id || currentPractice.id === "0" || currentPractice.id === "null") {
    return (
      <AppLayout>
        <PageHeader title="Workflow Management" subtitle="Verwalten Sie strukturierte Arbeitsabläufe" />
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">Bitte wählen Sie eine gültige Praxis aus, um Workflows anzuzeigen.</p>
            <p className="text-sm text-muted-foreground">
              Sie können eine Praxis über das Dropdown-Menü in der Kopfzeile auswählen.
            </p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (isLoading) {
    return (
      <AppLayout>
        <PageHeader
          title="Workflow Management"
          subtitle={`Verwalten Sie strukturierte Arbeitsabläufe für ${currentPractice.name}`}
        />
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
        <PageHeader
          title="Workflow Management"
          subtitle={`Verwalten Sie strukturierte Arbeitsabläufe und Teamprozesse für ${currentPractice.name}`}
        />
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <p className="text-muted-foreground">Fehler beim Laden der Workflows</p>
            <p className="text-sm text-destructive">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Erneut versuchen
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <PageHeader
        title="Workflow Management"
        subtitle={`Verwalten Sie strukturierte Arbeitsabläufe und Teamprozesse für ${currentPractice.name}`}
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
            <Button variant="outline" onClick={handleCreateTemplate}>
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

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            label="Aktive Workflows"
            value={workflowsByStatus.active.length}
            icon={WorkflowIcon}
            {...statCardColors.primary}
          />
          <StatCard
            label="Entwürfe"
            value={workflowsByStatus.draft.length}
            icon={Clock}
            {...statCardColors.secondary}
          />
          <StatCard
            label="Abgeschlossen"
            value={workflowsByStatus.completed.length}
            icon={CheckCircle2}
            {...statCardColors.success}
          />
          <StatCard
            label="Teams beteiligt"
            value={new Set(practiceWorkflows.flatMap((w) => w.teamIds)).size}
            icon={Users}
            {...statCardColors.info}
          />
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
            {workflowsByStatus.active.length === 0 ? (
              <Card className="p-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <WorkflowIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Keine aktiven Workflows</h3>
                  <p className="text-muted-foreground mb-4">
                    Erstellen Sie einen neuen Workflow oder aktivieren Sie einen Entwurf
                  </p>
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Neuer Workflow
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {workflowsByStatus.active.map((workflow) => (
                  <WorkflowCard key={workflow.id} workflow={workflow} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="draft" className="space-y-4 mt-6">
            {workflowsByStatus.draft.length === 0 ? (
              <Card className="p-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <Clock className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Keine Entwürfe</h3>
                  <p className="text-muted-foreground">Neue Workflows werden hier als Entwürfe angezeigt</p>
                </div>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {workflowsByStatus.draft.map((workflow) => (
                  <WorkflowCard key={workflow.id} workflow={workflow} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4 mt-6">
            {workflowsByStatus.completed.length === 0 ? (
              <Card className="p-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <CheckCircle2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Keine abgeschlossenen Workflows</h3>
                  <p className="text-muted-foreground">Abgeschlossene Workflows werden hier angezeigt</p>
                </div>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {workflowsByStatus.completed.map((workflow) => (
                  <WorkflowCard key={workflow.id} workflow={workflow} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="templates" className="space-y-4 mt-6">
            {templates.length === 0 ? (
              <Card className="p-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <FileTemplate className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Keine Vorlagen</h3>
                  <p className="text-muted-foreground mb-4">Erstellen Sie Vorlagen für wiederkehrende Workflows</p>
                  <Button onClick={handleCreateTemplate}>
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
                          <Button variant="ghost" size="sm" onClick={() => handleEditTemplate(template)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setTemplateToDelete(template.id)}
                            className="hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{template.steps?.length || 0} Schritte</span>
                        <span>•</span>
                        <span>{getCategoryLabel(template.category)}</span>
                      </div>
                      <Button
                        className="w-full mt-4 bg-transparent"
                        variant="outline"
                        onClick={() => handleCreateFromTemplate(template.id)}
                      >
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

      {/* Create Workflow Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neuer Workflow</DialogTitle>
            <DialogDescription>Erstellen Sie einen neuen Workflow für Ihre Praxis</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {createError && (
              <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {createError}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="title">Titel</Label>
              <Input
                id="title"
                value={newWorkflow.title}
                onChange={(e) => setNewWorkflow({ ...newWorkflow, title: e.target.value })}
                placeholder="Workflow-Titel"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                value={newWorkflow.description}
                onChange={(e) => setNewWorkflow({ ...newWorkflow, description: e.target.value })}
                placeholder="Beschreiben Sie den Workflow..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Kategorie</Label>
              <Select
                value={newWorkflow.category}
                onValueChange={(value) => setNewWorkflow({ ...newWorkflow, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kategorie auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {categories
                    .filter((cat) => cat.is_active)
                    .map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priorität</Label>
              <Select
                value={newWorkflow.priority}
                onValueChange={(value: "low" | "medium" | "high" | "urgent") =>
                  setNewWorkflow({ ...newWorkflow, priority: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Niedrig</SelectItem>
                  <SelectItem value="medium">Mittel</SelectItem>
                  <SelectItem value="high">Hoch</SelectItem>
                  <SelectItem value="urgent">Dringend</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleCreateWorkflow}>Erstellen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Dialog */}
      <WorkflowTemplateDialog
        open={templateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
        templates={templates}
        onSelectTemplate={handleCreateFromTemplate}
      />

      {/* Workflow Detail Dialog */}
      {selectedWorkflowForDetail && (
        <WorkflowDetailDialog
          open={!!selectedWorkflowForDetail}
          onOpenChange={(open) => !open && setSelectedWorkflowForDetail(null)}
          workflowId={selectedWorkflowForDetail}
        />
      )}

      {/* AI Workflow Generator Dialog */}
      <AIWorkflowGeneratorDialog open={aiGeneratorOpen} onOpenChange={setAiGeneratorOpen} />

      <AlertDialog open={!!workflowToDelete} onOpenChange={(open) => !open && setWorkflowToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Workflow löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Sind Sie sicher, dass Sie diesen Workflow löschen möchten? Diese Aktion kann nicht rückgängig gemacht
              werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteWorkflow}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
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
              Sind Sie sicher, dass Sie diese Vorlage löschen möchten? Diese Aktion kann nicht rückgängig gemacht
              werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteTemplate}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  )
}
