"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Edit, Trash2, Play, Pause, Eye, Users, Clock } from "lucide-react"
import type { Workflow } from "@/contexts/workflow-context"
import { getStepProgress, getPriorityColor, getStatusColor, canStartStep, getPriorityLabel, getStatusLabel } from "./workflow-helpers"

interface WorkflowCardProps {
  workflow: Workflow
  getCategoryLabel: (category: string) => string
  getCategoryColor: (category: string) => string
  onToggleStatus: (workflow: Workflow) => void
  onEdit: (workflowId: string) => void
  onView: (workflowId: string) => void
  onDelete: (workflowId: string) => void
}

export function WorkflowCard({
  workflow,
  getCategoryLabel,
  getCategoryColor,
  onToggleStatus,
  onEdit,
  onView,
  onDelete,
}: WorkflowCardProps) {
  return (
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
              onClick={() => onToggleStatus(workflow)}
              title={workflow.status === "active" ? "Pausieren" : "Starten"}
            >
              {workflow.status === "active" ? (
                <Pause className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
              ) : (
                <Play className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
              )}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onEdit(workflow.id)} title="Bearbeiten">
              <Edit className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onView(workflow.id)} title="Details anzeigen">
              <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(workflow.id)}
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
            {getPriorityLabel(workflow.priority)}
          </Badge>
          <Badge className={getStatusColor(workflow.status)}>
            {getStatusLabel(workflow.status)}
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
            <h4 className="text-sm font-medium">{"Nächste Schritte:"}</h4>
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
}
