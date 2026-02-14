"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { Workflow, WorkflowStep } from "@/contexts/workflow-context"
import {
  CheckCircle2,
  Clock,
  Play,
  MoreHorizontal,
  User,
  Calendar,
  AlertTriangle,
  MessageSquare,
} from "lucide-react"
import { formatDateTimeDE } from "@/lib/utils"
import { getStepStatusColor, getStepStatusLabel, getStepBgColor } from "./constants"

interface StepCardProps {
  step: WorkflowStep
  index: number
  workflow: Workflow
  getTeamMemberName: (memberId: string) => string
  onStatusChange: (stepId: string, status: WorkflowStep["status"]) => void
  onCompleteClick: (stepId: string, notes: string) => void
}

export function StepCard({ step, index, workflow, getTeamMemberName, onStatusChange, onCompleteClick }: StepCardProps) {
  const canStart = step.dependencies.every(
    (depId) => workflow.steps.find((s) => s.id === depId)?.status === "completed",
  )

  return (
    <div className={`border rounded-lg p-4 ${getStepBgColor(step.status)}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 border-current text-sm font-medium">
            {step.status === "completed" ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : index + 1}
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">{step.title}</h4>
              <Badge variant="outline" className={getStepStatusColor(step.status)}>
                {getStepStatusLabel(step.status)}
              </Badge>
              {!canStart && step.status === "pending" && (
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  Abhängigkeiten
                </Badge>
              )}
            </div>
            {step.description && <p className="text-sm text-muted-foreground">{step.description}</p>}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {step.assignedTo && (
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>{getTeamMemberName(step.assignedTo)}</span>
                </div>
              )}
              {step.estimatedDuration && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{step.estimatedDuration} Min.</span>
                </div>
              )}
              {step.completedAt && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>Abgeschlossen: {formatDateTimeDE(step.completedAt)}</span>
                </div>
              )}
            </div>
            {step.notes && (
              <div className="bg-white rounded p-2 border">
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <MessageSquare className="h-3 w-3" />
                  <span>Notizen:</span>
                </div>
                <p className="text-sm">{step.notes}</p>
              </div>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {step.status === "pending" && canStart && (
              <DropdownMenuItem onClick={() => onStatusChange(step.id, "in-progress")}>
                <Play className="mr-2 h-4 w-4" />
                Starten
              </DropdownMenuItem>
            )}
            {step.status === "in-progress" && (
              <>
                <DropdownMenuItem onClick={() => onCompleteClick(step.id, step.notes || "")}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Als abgeschlossen markieren
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange(step.id, "blocked")}>
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Als blockiert markieren
                </DropdownMenuItem>
              </>
            )}
            {step.status === "completed" && (
              <DropdownMenuItem onClick={() => onStatusChange(step.id, "in-progress")}>
                <Clock className="mr-2 h-4 w-4" />
                {'Zurück zu "In Bearbeitung"'}
              </DropdownMenuItem>
            )}
            {step.status === "blocked" && (
              <DropdownMenuItem onClick={() => onStatusChange(step.id, "in-progress")}>
                <Play className="mr-2 h-4 w-4" />
                Blockierung aufheben
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
