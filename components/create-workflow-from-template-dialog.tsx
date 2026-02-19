"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { WorkflowTemplate } from "@/contexts/workflow-context"
import { Clock, ListChecks, EyeOff, Check } from "lucide-react"
import { useWorkflowForm } from "@/components/workflows/use-workflow-form"
import { StepAssignmentList } from "@/components/workflows/step-assignment-list"

interface CreateWorkflowFromTemplateDialogProps {
  template: WorkflowTemplate | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (workflow: any) => void
}

export function CreateWorkflowFromTemplateDialog({
  template,
  open,
  onOpenChange,
  onSuccess,
}: CreateWorkflowFromTemplateDialogProps) {
  const form = useWorkflowForm(template, open)

  if (!template) return null

  const totalSubitems = template.steps.reduce((total, step) => total + (step.subitems?.length || 0), 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Workflow aus Vorlage erstellen</DialogTitle>
          <DialogDescription>
            Erstellen Sie einen neuen Workflow basierend auf der Vorlage &quot;{template.title}&quot;.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {form.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {form.error}
            </div>
          )}

          {/* Template Info */}
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium">{template.title}</h4>
                  {template.description && (
                    <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                  )}
                </div>
                {template.hideItemsFromOtherUsers && (
                  <Badge variant="secondary" className="gap-1">
                    <EyeOff className="h-3 w-3" />
                    Eingeschränkte Sicht
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <ListChecks className="h-4 w-4" />
                  <span>
                    {template.steps.length} Schritte{totalSubitems > 0 && `, ${totalSubitems} Unterschritte`}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{template.estimatedDuration} Min. geschätzt</span>
                </div>
              </div>
              {template.hideItemsFromOtherUsers && (
                <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
                  <strong>Hinweis:</strong> Benutzer sehen nur die Aufgaben, die ihnen zugewiesen sind.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Workflow Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Workflow-Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="workflowName">Workflow-Name *</Label>
                <Input
                  id="workflowName"
                  value={form.workflowName}
                  onChange={(e) => form.setWorkflowName(e.target.value)}
                  placeholder="Name für diesen Workflow..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workflowDescription">Beschreibung</Label>
                <Textarea
                  id="workflowDescription"
                  value={form.workflowDescription}
                  onChange={(e) => form.setWorkflowDescription(e.target.value)}
                  placeholder="Optionale Beschreibung..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priorität</Label>
                <Select value={form.priority} onValueChange={(v: any) => form.setPriority(v)}>
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
            </CardContent>
          </Card>

          {/* Step Assignments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Verantwortliche zuweisen</CardTitle>
              <CardDescription>
                Weisen Sie den Schritten verantwortliche Teammitglieder zu.
                {template.hideItemsFromOtherUsers &&
                  " Diese Zuweisung bestimmt, wer welche Aufgaben sehen kann."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StepAssignmentList
                stepAssignments={form.stepAssignments}
                expandedSteps={form.expandedSteps}
                teamMembers={form.teamMembers}
                isLoadingMembers={form.isLoadingMembers}
                onUpdateStep={form.updateStepAssignment}
                onUpdateSubitem={form.updateSubitemAssignment}
                onToggleExpanded={form.toggleStepExpanded}
              />
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={form.isSubmitting}>
            Abbrechen
          </Button>
          <Button
            onClick={() => form.handleCreate(onSuccess, () => onOpenChange(false))}
            disabled={form.isSubmitting}
          >
            {form.isSubmitting ? (
              "Wird erstellt..."
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Workflow erstellen
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CreateWorkflowFromTemplateDialog
