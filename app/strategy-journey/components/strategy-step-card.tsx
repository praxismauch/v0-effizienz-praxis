"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Clock, Circle, PlayCircle, ArrowRight, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export interface StrategyStep {
  key: string
  number: number
  name: string
  description: string
  detailedDescription?: string
  keyQuestions?: string[]
  actionItems?: string[]
  tips?: string[]
  estimatedDuration?: string
  difficulty?: string
  status?: string
}

interface StrategyStepCardProps {
  step: StrategyStep
  onViewDetails: () => void
  onStartStep: () => void
  onMarkComplete: () => void
  compact?: boolean
}

export function StrategyStepCard({
  step,
  onViewDetails,
  onStartStep,
  onMarkComplete,
  compact = false,
}: StrategyStepCardProps) {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case "completed":
        return "text-emerald-600 bg-emerald-50 border-emerald-200"
      case "in_progress":
        return "text-blue-600 bg-blue-50 border-blue-200"
      default:
        return "text-slate-400 bg-slate-50 border-slate-200"
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-emerald-600" />
      case "in_progress":
        return <Clock className="h-5 w-5 text-blue-600 animate-pulse" />
      default:
        return <Circle className="h-5 w-5 text-slate-400" />
    }
  }

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case "Leicht":
        return "bg-emerald-100 text-emerald-800"
      case "Mittel":
        return "bg-amber-100 text-amber-800"
      case "Schwer":
        return "bg-red-100 text-red-800"
      default:
        return "bg-slate-100 text-slate-800"
    }
  }

  if (compact) {
    return (
      <Card className={cn("group hover:shadow-lg transition-all duration-200", getStatusColor(step.status))}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">{getStatusIcon(step.status)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-muted-foreground">Schritt {step.number}</span>
                {step.difficulty && (
                  <Badge variant="secondary" className={cn("text-xs", getDifficultyColor(step.difficulty))}>
                    {step.difficulty}
                  </Badge>
                )}
              </div>
              <h3 className="font-semibold text-sm leading-tight mb-1">{step.name}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2">{step.description}</p>
              {step.estimatedDuration && (
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {step.estimatedDuration}
                </div>
              )}
            </div>
            <Button size="sm" variant="ghost" onClick={onViewDetails} className="flex-shrink-0">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className={cn(
        "group hover:shadow-xl transition-all duration-300 border-2",
        step.status === "completed" && "border-emerald-200 bg-emerald-50/30",
        step.status === "in_progress" && "border-blue-200 bg-blue-50/30",
        !step.status || step.status === "not_started" && "border-slate-200 hover:border-slate-300",
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold",
                step.status === "completed" && "bg-emerald-600 text-white",
                step.status === "in_progress" && "bg-blue-600 text-white",
                (!step.status || step.status === "not_started") && "bg-slate-200 text-slate-600",
              )}
            >
              {step.number}
            </div>
            {step.status === "completed" && (
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Abgeschlossen
              </Badge>
            )}
            {step.status === "in_progress" && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                <Clock className="h-3 w-3 mr-1 animate-pulse" />
                In Arbeit
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {step.difficulty && (
              <Badge variant="secondary" className={getDifficultyColor(step.difficulty)}>
                {step.difficulty}
              </Badge>
            )}
          </div>
        </div>
        <CardTitle className="text-xl leading-tight">{step.name}</CardTitle>
        <CardDescription className="text-base leading-relaxed pt-1">{step.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {step.estimatedDuration && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Geschätzte Dauer: {step.estimatedDuration}</span>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Button onClick={onViewDetails} variant="outline" className="flex-1">
            Details anzeigen
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          {step.status !== "completed" && (
            <Button onClick={step.status === "in_progress" ? onMarkComplete : onStartStep} className="flex-1">
              {step.status === "in_progress" ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Als erledigt markieren
                </>
              ) : (
                <>
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Schritt starten
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
