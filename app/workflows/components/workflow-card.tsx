"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { GitBranch, Edit, Trash2, MoreHorizontal, Play, Pause, Clock, Eye } from "lucide-react"
import type { Workflow } from "../workflow-types"
import { statusConfig, priorityConfig, categoryLabels } from "../workflow-types"

interface WorkflowCardProps {
  workflow: Workflow
  viewMode: "list" | "grid"
  onEdit: (workflow: Workflow) => void
  onDelete: (workflow: Workflow) => void
  onToggleStatus: (workflow: Workflow) => void
  onViewDetails: (workflow: Workflow) => void
}

export function WorkflowCard({ workflow, viewMode, onEdit, onDelete, onToggleStatus, onViewDetails }: WorkflowCardProps) {
  const StatusIcon = statusConfig[workflow.status]?.icon || Clock
  const completedSteps = workflow.steps?.filter((s: any) => s.status === "completed").length || 0
  const totalSteps = workflow.steps_count || workflow.steps?.length || 0
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0

  const actionMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onViewDetails(workflow)}>
          <Eye className="mr-2 h-4 w-4" />
          Details & Schritte
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(workflow)}>
          <Edit className="mr-2 h-4 w-4" />
          Bearbeiten
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onToggleStatus(workflow)}>
          {workflow.status === "active" ? (
            <><Pause className="mr-2 h-4 w-4" />Pausieren</>
          ) : (
            <><Play className="mr-2 h-4 w-4" />Aktivieren</>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDelete(workflow)} className="text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Löschen
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  if (viewMode === "list") {
    return (
      <Card className="hover:shadow-md transition-shadow">
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
              {actionMenu}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">Fortschritt</span>
                <span className="font-medium">{completedSteps} / {totalSteps} Schritte</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            {(workflow.estimated_duration || workflow.estimated_minutes) && (
              <div className="text-sm text-muted-foreground">
                <Clock className="inline h-3 w-3 mr-1" />
                {workflow.estimated_duration || workflow.estimated_minutes} Min.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="relative hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">{workflow.name}</CardTitle>
          </div>
          {actionMenu}
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
              <span>{completedSteps} / {totalSteps}</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
