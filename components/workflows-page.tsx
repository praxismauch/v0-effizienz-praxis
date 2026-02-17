"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Plus,
  Sparkles,
  Loader2,
  Pencil,
  Trash2,
  GripVertical,
  Workflow,
  Search,
  ChevronDown,
  ChevronUp,
  Clock,
  Users,
  X,
} from "lucide-react"

interface WorkflowStep {
  title: string
  description?: string
  assignedTo?: string
  estimatedDuration?: number
  dependencies: string[]
}

interface WorkflowTemplate {
  id: string
  name: string
  description?: string
  category?: string
  steps: WorkflowStep[]
  is_active: boolean
  hide_items_from_other_users: boolean
  created_at: string
  updated_at: string
  workflow_template_specialties?: any[]
}

interface FormData {
  name: string
  description: string
  category: string
  steps: WorkflowStep[]
  is_active: boolean
  hide_items_from_other_users: boolean
}

const defaultFormData: FormData = {
  name: "",
  description: "",
  category: "",
  steps: [],
  is_active: true,
  hide_items_from_other_users: false,
}

const defaultStep: WorkflowStep = {
  title: "",
  description: "",
  assignedTo: "",
  estimatedDuration: 5,
  dependencies: [],
}

function WorkflowsPage() {
  const { toast } = useToast()
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  // Dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isAiOpen, setIsAiOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<WorkflowTemplate | null>(null)

  // Form state
  const [formData, setFormData] = useState<FormData>({ ...defaultFormData })
  const [isSaving, setIsSaving] = useState(false)

  // AI state
  const [aiDescription, setAiDescription] = useState("")
  const [aiCategory, setAiCategory] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  // Expanded templates
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const loadTemplates = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/super-admin/templates/workflows")
      if (!response.ok) throw new Error("Failed to load templates")
      const data = await response.json()
      setTemplates(data.templates || [])
    } catch (error) {
      console.error("Error loading workflow templates:", error)
      toast({ title: "Fehler", description: "Workflow-Vorlagen konnten nicht geladen werden", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadTemplates()
  }, [loadTemplates])

  const handleCreate = async () => {
    if (!formData.name.trim()) return
    setIsSaving(true)
    try {
      const response = await fetch("/api/super-admin/templates/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || "Fehler beim Erstellen")
      }
      toast({ title: "Erfolg", description: "Workflow-Vorlage wurde erstellt" })
      setIsCreateOpen(false)
      setFormData({ ...defaultFormData })
      loadTemplates()
    } catch (error) {
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Vorlage konnte nicht erstellt werden",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdate = async () => {
    if (!editingTemplate || !formData.name.trim()) return
    setIsSaving(true)
    try {
      const response = await fetch(`/api/super-admin/templates/workflows/${editingTemplate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (!response.ok) throw new Error("Failed to update")
      toast({ title: "Erfolg", description: "Workflow-Vorlage wurde aktualisiert" })
      setIsEditOpen(false)
      setEditingTemplate(null)
      setFormData({ ...defaultFormData })
      loadTemplates()
    } catch {
      toast({ title: "Fehler", description: "Vorlage konnte nicht aktualisiert werden", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const response = await fetch(`/api/super-admin/templates/workflows/${deleteId}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to delete")
      toast({ title: "Erfolg", description: "Workflow-Vorlage wurde gelöscht" })
      setDeleteId(null)
      loadTemplates()
    } catch {
      toast({ title: "Fehler", description: "Vorlage konnte nicht gelöscht werden", variant: "destructive" })
    }
  }

  const handleAiGenerate = async () => {
    if (!aiDescription.trim() || aiDescription.trim().length < 10) {
      toast({
        title: "Beschreibung zu kurz",
        description: "Bitte geben Sie eine detailliertere Beschreibung ein (mindestens 10 Zeichen).",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch("/api/super-admin/templates/workflows/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: aiDescription, category: aiCategory }),
      })
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || "Fehler bei der KI-Generierung")
      }
      const { workflow } = await response.json()

      // Pre-fill the create dialog with generated data
      setFormData({
        name: workflow.name || "",
        description: workflow.description || "",
        category: aiCategory || workflow.category || "",
        steps: (workflow.steps || []).map((step: any) => ({
          title: step.title || "",
          description: step.description || "",
          assignedTo: step.assignedTo || "",
          estimatedDuration: step.estimatedDuration || 5,
          dependencies: step.dependencies || [],
        })),
        is_active: true,
        hide_items_from_other_users: false,
      })

      setIsAiOpen(false)
      setIsCreateOpen(true)
      setAiDescription("")
      setAiCategory("")

      toast({
        title: "Workflow generiert",
        description: `"${workflow.name}" mit ${workflow.steps?.length || 0} Schritten wurde generiert. Sie können die Vorlage nun anpassen und speichern.`,
      })
    } catch (error) {
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "KI-Generierung fehlgeschlagen",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const openEdit = (template: WorkflowTemplate) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      description: template.description || "",
      category: template.category || "",
      steps: template.steps || [],
      is_active: template.is_active,
      hide_items_from_other_users: template.hide_items_from_other_users,
    })
    setIsEditOpen(true)
  }

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const addStep = () => {
    setFormData((prev) => ({
      ...prev,
      steps: [...prev.steps, { ...defaultStep }],
    }))
  }

  const removeStep = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index),
    }))
  }

  const updateStep = (index: number, field: keyof WorkflowStep, value: any) => {
    setFormData((prev) => ({
      ...prev,
      steps: prev.steps.map((step, i) => (i === index ? { ...step, [field]: value } : step)),
    }))
  }

  const filteredTemplates = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalStepsCount = (steps: WorkflowStep[]) => steps?.length || 0
  const totalDuration = (steps: WorkflowStep[]) =>
    steps?.reduce((sum, s) => sum + (s.estimatedDuration || 0), 0) || 0

  const renderStepsEditor = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Schritte ({formData.steps.length})</Label>
        <Button type="button" variant="outline" size="sm" onClick={addStep}>
          <Plus className="h-3 w-3 mr-1" />
          Schritt
        </Button>
      </div>
      {formData.steps.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Noch keine Schritte. Klicken Sie auf &quot;+ Schritt&quot; oder nutzen Sie die KI-Generierung.
        </p>
      )}
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {formData.steps.map((step, index) => (
          <div key={index} className="border rounded-lg p-3 space-y-2 bg-muted/30">
            <div className="flex items-start gap-2">
              <span className="text-xs text-muted-foreground font-mono mt-2.5 w-5 shrink-0">{index + 1}.</span>
              <div className="flex-1 space-y-2">
                <Input
                  value={step.title}
                  onChange={(e) => updateStep(index, "title", e.target.value)}
                  placeholder="Schritt-Titel"
                  className="text-sm"
                />
                <Textarea
                  value={step.description || ""}
                  onChange={(e) => updateStep(index, "description", e.target.value)}
                  placeholder="Beschreibung (optional)"
                  rows={2}
                  className="text-sm resize-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={step.assignedTo || ""}
                    onChange={(e) => updateStep(index, "assignedTo", e.target.value)}
                    placeholder="Zuständig (z.B. MFA)"
                    className="text-sm"
                  />
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={step.estimatedDuration || ""}
                      onChange={(e) => updateStep(index, "estimatedDuration", parseInt(e.target.value) || 0)}
                      placeholder="Min."
                      className="text-sm"
                      min={0}
                    />
                    <span className="text-xs text-muted-foreground shrink-0">Min.</span>
                  </div>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeStep(index)}
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header actions */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Workflows durchsuchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Button onClick={() => setIsAiOpen(true)} className="gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white">
            <Sparkles className="h-4 w-4" />
            Mit KI generieren
          </Button>
          <Button
            onClick={() => {
              setFormData({ ...defaultFormData })
              setIsCreateOpen(true)
            }}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Neue Vorlage
          </Button>
        </div>
      </div>

      {/* Templates list */}
      {filteredTemplates.length === 0 ? (
        <Card className="p-12 text-center">
          <Workflow className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">
            {searchTerm ? "Keine Ergebnisse" : "Keine Workflow-Vorlagen"}
          </h3>
          <p className="mt-2 text-muted-foreground">
            {searchTerm
              ? "Versuchen Sie eine andere Suche."
              : "Erstellen Sie Ihre erste Workflow-Vorlage manuell oder mit KI."}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTemplates.map((template) => {
            const isExpanded = expandedIds.has(template.id)
            const stepsCount = totalStepsCount(template.steps)
            const duration = totalDuration(template.steps)

            return (
              <Card key={template.id} className="overflow-hidden">
                <div className="flex items-center gap-4 p-4">
                  <button
                    onClick={() => toggleExpanded(template.id)}
                    className="text-muted-foreground hover:text-foreground shrink-0"
                  >
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium truncate">{template.name}</h3>
                      <Badge variant={template.is_active ? "default" : "secondary"} className="shrink-0">
                        {template.is_active ? "Aktiv" : "Inaktiv"}
                      </Badge>
                    </div>
                    {template.description && (
                      <p className="text-sm text-muted-foreground truncate mt-0.5">{template.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Workflow className="h-3 w-3" />
                        {stepsCount} Schritte
                      </span>
                      {duration > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {duration} Min.
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(template)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteId(template.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {isExpanded && template.steps && template.steps.length > 0 && (
                  <div className="border-t px-4 py-3 bg-muted/30">
                    <div className="space-y-2">
                      {template.steps.map((step, i) => (
                        <div key={i} className="flex items-start gap-3 text-sm">
                          <span className="text-muted-foreground font-mono text-xs mt-0.5 w-5 shrink-0 text-right">
                            {i + 1}.
                          </span>
                          <div className="flex-1 min-w-0">
                            <span className="font-medium">{step.title}</span>
                            {step.description && (
                              <p className="text-muted-foreground text-xs mt-0.5">{step.description}</p>
                            )}
                          </div>
                          {step.assignedTo && (
                            <Badge variant="outline" className="shrink-0 text-xs">
                              <Users className="h-3 w-3 mr-1" />
                              {step.assignedTo}
                            </Badge>
                          )}
                          {step.estimatedDuration && (
                            <span className="text-xs text-muted-foreground shrink-0">{step.estimatedDuration} Min.</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) setFormData({ ...defaultFormData }) }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Neue Workflow-Vorlage</DialogTitle>
            <DialogDescription>
              Erstellen Sie eine neue Workflow-Vorlage mit Schritten.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(90vh-200px)]">
            <div className="space-y-4 py-2 pr-4">
              <div className="space-y-2">
                <Label htmlFor="create-name">Name *</Label>
                <Input
                  id="create-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="z.B. Patientenaufnahme"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-desc">Beschreibung</Label>
                <Textarea
                  id="create-desc"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Beschreibung des Workflows..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-cat">Kategorie</Label>
                <Input
                  id="create-cat"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="z.B. Patientenmanagement"
                />
              </div>
              {renderStepsEditor()}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleCreate} disabled={isSaving || !formData.name.trim()}>
              {isSaving ? "Erstelle..." : "Erstellen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={isEditOpen} onOpenChange={(open) => { setIsEditOpen(open); if (!open) { setEditingTemplate(null); setFormData({ ...defaultFormData }) } }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Workflow-Vorlage bearbeiten</DialogTitle>
            <DialogDescription>Bearbeiten Sie die Details der Workflow-Vorlage.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(90vh-200px)]">
            <div className="space-y-4 py-2 pr-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-desc">Beschreibung</Label>
                <Textarea
                  id="edit-desc"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-cat">Kategorie</Label>
                <Input
                  id="edit-cat"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>
              {renderStepsEditor()}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleUpdate} disabled={isSaving || !formData.name.trim()}>
              {isSaving ? "Speichere..." : "Speichern"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Generator dialog */}
      <Dialog open={isAiOpen} onOpenChange={setIsAiOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Workflow mit KI generieren
            </DialogTitle>
            <DialogDescription>
              Beschreiben Sie den gewünschten Workflow und die KI erstellt eine strukturierte Vorlage mit Schritten.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="ai-desc">Beschreibung *</Label>
              <Textarea
                id="ai-desc"
                placeholder="Beispiel: Erstelle einen Workflow für die Patientenaufnahme, der die Anmeldung, Datenerfassung, Versicherungsprüfung und Terminvergabe umfasst..."
                value={aiDescription}
                onChange={(e) => setAiDescription(e.target.value)}
                rows={5}
                disabled={isGenerating}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Je detaillierter Ihre Beschreibung, desto besser wird der generierte Workflow.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ai-cat">Kategorie (optional)</Label>
              <Input
                id="ai-cat"
                value={aiCategory}
                onChange={(e) => setAiCategory(e.target.value)}
                placeholder="z.B. Patientenmanagement"
                disabled={isGenerating}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAiOpen(false)} disabled={isGenerating}>
              Abbrechen
            </Button>
            <Button onClick={handleAiGenerate} disabled={isGenerating || aiDescription.trim().length < 10}>
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generiere...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Mit KI generieren
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Workflow-Vorlage löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Sind Sie sicher, dass Sie diese Vorlage löschen möchten? Diese Aktion kann nicht rückgängig gemacht
              werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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

export { WorkflowsPage }
export default WorkflowsPage
