"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { Plus, Sparkles, Loader2, Workflow, Search } from "lucide-react"
import { WorkflowFormDialog } from "@/components/workflows/workflow-form-dialog"
import { WorkflowTemplateCard } from "@/components/workflows/workflow-template-card"
import {
  useWorkflowTemplates,
  defaultFormData,
  type WorkflowFormData,
  type WorkflowTemplate,
} from "@/hooks/use-workflow-templates"

function WorkflowsPage() {
  const { templates, isLoading, isSaving, handleCreate, handleUpdate, handleDelete, handleAiGenerate, handleToggleActive } =
    useWorkflowTemplates()

  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isAiOpen, setIsAiOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<WorkflowTemplate | null>(null)
  const [formData, setFormData] = useState<WorkflowFormData>({ ...defaultFormData })
  const [aiDescription, setAiDescription] = useState("")
  const [aiCategory, setAiCategory] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const filteredTemplates = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

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

  const onCreateSubmit = async () => {
    const success = await handleCreate(formData)
    if (success) {
      setIsCreateOpen(false)
      setFormData({ ...defaultFormData })
    }
  }

  const onUpdateSubmit = async () => {
    if (!editingTemplate) return
    const success = await handleUpdate(editingTemplate.id, formData)
    if (success) {
      setIsEditOpen(false)
      setEditingTemplate(null)
      setFormData({ ...defaultFormData })
    }
  }

  const onDeleteConfirm = async () => {
    if (!deleteId) return
    await handleDelete(deleteId)
    setDeleteId(null)
  }

  const onAiGenerate = async () => {
    setIsGenerating(true)
    const result = await handleAiGenerate(aiDescription, aiCategory)
    setIsGenerating(false)
    if (result) {
      setFormData(result)
      setIsAiOpen(false)
      setIsCreateOpen(true)
      setAiDescription("")
      setAiCategory("")
    }
  }

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
          <Button
            onClick={() => setIsAiOpen(true)}
            className="gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white"
          >
            <Sparkles className="h-4 w-4" />
            Mit KI generieren
          </Button>
          <Button onClick={() => { setFormData({ ...defaultFormData }); setIsCreateOpen(true) }}>
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
          {filteredTemplates.map((template) => (
            <WorkflowTemplateCard
              key={template.id}
              template={template}
              isExpanded={expandedIds.has(template.id)}
              onToggleExpand={() => toggleExpanded(template.id)}
              onEdit={() => openEdit(template)}
              onDelete={() => setDeleteId(template.id)}
              onToggleActive={() => handleToggleActive(template)}
            />
          ))}
        </div>
      )}

      {/* Create dialog */}
      <WorkflowFormDialog
        open={isCreateOpen}
        onOpenChange={(open) => { setIsCreateOpen(open); if (!open) setFormData({ ...defaultFormData }) }}
        title="Neue Workflow-Vorlage"
        description="Erstellen Sie eine neue Workflow-Vorlage mit Schritten."
        formData={formData}
        onFormChange={setFormData}
        onSubmit={onCreateSubmit}
        isSaving={isSaving}
        submitLabel="Erstellen"
        savingLabel="Erstelle..."
      />

      {/* Edit dialog */}
      <WorkflowFormDialog
        open={isEditOpen}
        onOpenChange={(open) => { setIsEditOpen(open); if (!open) { setEditingTemplate(null); setFormData({ ...defaultFormData }) } }}
        title="Workflow-Vorlage bearbeiten"
        description="Bearbeiten Sie die Details der Workflow-Vorlage."
        formData={formData}
        onFormChange={setFormData}
        onSubmit={onUpdateSubmit}
        isSaving={isSaving}
        submitLabel="Speichern"
        savingLabel="Speichere..."
      />

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
                placeholder="Beispiel: Erstelle einen Workflow für die Patientenaufnahme..."
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
            <Button onClick={onAiGenerate} disabled={isGenerating || aiDescription.trim().length < 10}>
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
              onClick={onDeleteConfirm}
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
