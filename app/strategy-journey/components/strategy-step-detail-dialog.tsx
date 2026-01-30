"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  CheckCircle2,
  Clock,
  Lightbulb,
  HelpCircle,
  ListChecks,
  PlayCircle,
  FileText,
  Sparkles,
} from "lucide-react"
import { useState } from "react"
import type { StrategyStep } from "./strategy-step-card"

interface StrategyStepDetailDialogProps {
  step: StrategyStep | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onStartStep: () => void
  onMarkComplete: () => void
  onSaveNotes: (notes: string) => void
}

export function StrategyStepDetailDialog({
  step,
  open,
  onOpenChange,
  onStartStep,
  onMarkComplete,
  onSaveNotes,
}: StrategyStepDetailDialogProps) {
  const [notes, setNotes] = useState("")

  if (!step) return null

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

  const handleSaveNotes = () => {
    onSaveNotes(notes)
    setNotes("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold ${
                step.status === "completed"
                  ? "bg-emerald-600 text-white"
                  : step.status === "in_progress"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-200 text-slate-600"
              }`}
            >
              {step.number}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {step.status === "completed" && (
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Abgeschlossen
                </Badge>
              )}
              {step.status === "in_progress" && (
                <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                  <Clock className="h-3 w-3 mr-1" />
                  In Arbeit
                </Badge>
              )}
              {step.difficulty && (
                <Badge className={getDifficultyColor(step.difficulty)}>{step.difficulty}</Badge>
              )}
              {step.estimatedDuration && (
                <Badge variant="outline">
                  <Clock className="h-3 w-3 mr-1" />
                  {step.estimatedDuration}
                </Badge>
              )}
            </div>
          </div>
          <DialogTitle className="text-2xl">{step.name}</DialogTitle>
          <DialogDescription className="text-base leading-relaxed">{step.detailedDescription}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Übersicht</TabsTrigger>
            <TabsTrigger value="questions">Leitfragen</TabsTrigger>
            <TabsTrigger value="actions">Maßnahmen</TabsTrigger>
            <TabsTrigger value="tips">Tipps</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-6">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-2">Zielsetzung</h4>
                    <p className="text-sm text-blue-800 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {step.keyQuestions && step.keyQuestions.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <HelpCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold mb-3">Zentrale Fragen</h4>
                      <ul className="space-y-2">
                        {step.keyQuestions.slice(0, 3).map((question, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-primary mt-0.5">•</span>
                            <span>{question}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-3">
              <Label htmlFor="notes">Notizen & Erkenntnisse</Label>
              <Textarea
                id="notes"
                placeholder="Halten Sie Ihre Gedanken, Erkenntnisse und nächste Schritte fest..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[120px]"
              />
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={handleSaveNotes} disabled={!notes.trim()}>
                  <FileText className="h-4 w-4 mr-2" />
                  Notizen speichern
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="questions" className="space-y-4 mt-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3 mb-4">
                  <HelpCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Leitfragen zur Reflexion</h4>
                    <p className="text-sm text-muted-foreground">
                      Diese Fragen helfen Ihnen, das Thema systematisch zu durchdenken
                    </p>
                  </div>
                </div>
                {step.keyQuestions && step.keyQuestions.length > 0 ? (
                  <ul className="space-y-4">
                    {step.keyQuestions.map((question, idx) => (
                      <li key={idx} className="pl-4 border-l-2 border-primary/30">
                        <p className="font-medium text-sm mb-1">Frage {idx + 1}</p>
                        <p className="text-sm text-muted-foreground">{question}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">Keine Leitfragen definiert.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="actions" className="space-y-4 mt-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3 mb-4">
                  <ListChecks className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Konkrete Handlungsschritte</h4>
                    <p className="text-sm text-muted-foreground">
                      Empfohlene Maßnahmen zur Umsetzung dieses Strategieschritts
                    </p>
                  </div>
                </div>
                {step.actionItems && step.actionItems.length > 0 ? (
                  <ul className="space-y-3">
                    {step.actionItems.map((action, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold mt-0.5">
                          {idx + 1}
                        </div>
                        <p className="text-sm flex-1">{action}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">Keine Handlungsschritte definiert.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tips" className="space-y-4 mt-6">
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3 mb-4">
                  <Lightbulb className="h-5 w-5 text-amber-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-amber-900 mb-1">Praxis-Tipps</h4>
                    <p className="text-sm text-amber-800">Bewährte Praktiken aus unserer Erfahrung</p>
                  </div>
                </div>
                {step.tips && step.tips.length > 0 ? (
                  <ul className="space-y-3">
                    {step.tips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center mt-0.5">
                          <span className="text-amber-600 text-xs">💡</span>
                        </div>
                        <p className="text-sm text-amber-900">{tip}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-amber-800">Keine Tipps verfügbar.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Schließen
          </Button>
          {step.status !== "completed" && (
            <Button onClick={step.status === "in_progress" ? onMarkComplete : onStartStep}>
              {step.status === "in_progress" ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Als erledigt markieren
                </>
              ) : (
                <>
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Jetzt starten
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
