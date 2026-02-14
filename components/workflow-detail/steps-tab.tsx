"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { Workflow, WorkflowStep } from "@/contexts/workflow-context"
import { ListTodo } from "lucide-react"
import { StepCard } from "./step-card"

interface StepsTabProps {
  workflow: Workflow
  getTeamMemberName: (memberId: string) => string
  onStepStatusChange: (stepId: string, status: WorkflowStep["status"]) => void
  onCompleteClick: (stepId: string, notes: string) => void
}

export function StepsTab({ workflow, getTeamMemberName, onStepStatusChange, onCompleteClick }: StepsTabProps) {
  const completedSteps = workflow.steps.filter((s) => s.status === "completed").length
  const progress = workflow.steps.length > 0 ? (completedSteps / workflow.steps.length) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Fortschritt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Abgeschlossene Schritte</span>
            <span className="font-medium">
              {completedSteps} / {workflow.steps.length}
            </span>
          </div>
          <Progress value={progress} className="h-3" />
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">{completedSteps}</div>
              <div className="text-xs text-muted-foreground">Abgeschlossen</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {workflow.steps.filter((s) => s.status === "in-progress").length}
              </div>
              <div className="text-xs text-muted-foreground">In Bearbeitung</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-600">
                {workflow.steps.filter((s) => s.status === "pending").length}
              </div>
              <div className="text-xs text-muted-foreground">Ausstehend</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Arbeitsschritte</CardTitle>
          <CardDescription>Verwalten Sie die einzelnen Schritte dieses Workflows</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workflow.steps.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ListTodo className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Noch keine Arbeitsschritte definiert.</p>
              </div>
            ) : (
              workflow.steps.map((step, index) => (
                <StepCard
                  key={step.id}
                  step={step}
                  index={index}
                  workflow={workflow}
                  getTeamMemberName={getTeamMemberName}
                  onStatusChange={onStepStatusChange}
                  onCompleteClick={onCompleteClick}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
