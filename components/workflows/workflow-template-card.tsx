"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Pencil, Trash2, Workflow, ChevronDown, ChevronUp, Clock, Users } from "lucide-react"
import type { WorkflowTemplate, WorkflowStep } from "@/hooks/use-workflow-templates"

interface WorkflowTemplateCardProps {
  template: WorkflowTemplate
  isExpanded: boolean
  onToggleExpand: () => void
  onEdit: () => void
  onDelete: () => void
  onToggleActive: () => void
}

export function WorkflowTemplateCard({
  template,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onToggleActive,
}: WorkflowTemplateCardProps) {
  const stepsCount = template.steps?.length || 0
  const duration = template.steps?.reduce((sum, s) => sum + (s.estimatedDuration || 0), 0) || 0

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-4 p-4">
        <button
          onClick={onToggleExpand}
          className="text-muted-foreground hover:text-foreground shrink-0"
        >
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium truncate">{template.name}</h3>
            <button
              onClick={(e) => { e.stopPropagation(); onToggleActive() }}
              className="flex items-center gap-1.5 shrink-0"
              title={template.is_active ? "Klicken zum Deaktivieren" : "Klicken zum Aktivieren"}
            >
              <Switch
                checked={template.is_active}
                className="scale-75"
                tabIndex={-1}
              />
              <span className={`text-xs font-medium ${template.is_active ? "text-primary" : "text-muted-foreground"}`}>
                {template.is_active ? "Aktiv" : "Inaktiv"}
              </span>
            </button>
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
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete}>
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
}
