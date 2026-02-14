"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { BookTemplate as FileTemplate } from "lucide-react"
import type { WorkflowTemplate } from "@/contexts/workflow-context"

interface TemplateSelectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  templates: WorkflowTemplate[]
  getCategoryLabel: (category: string) => string
  onSelectTemplate: (templateId: string) => void
}

export function TemplateSelectionDialog({
  open,
  onOpenChange,
  templates,
  getCategoryLabel,
  onSelectTemplate,
}: TemplateSelectionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Workflow aus Vorlage erstellen</DialogTitle>
          <DialogDescription>Wählen Sie eine Vorlage als Grundlage für einen neuen Workflow</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {templates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileTemplate className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Keine Vorlagen verfügbar. Erstellen Sie zuerst eine Vorlage.</p>
            </div>
          ) : (
            templates.map((template) => (
              <Card
                key={template.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onSelectTemplate(template.id)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{template.title}</CardTitle>
                  {template.description && (
                    <CardDescription className="text-sm">{template.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{template.steps?.length || 0} Schritte</span>
                    <span>-</span>
                    <span>{getCategoryLabel(template.category)}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
