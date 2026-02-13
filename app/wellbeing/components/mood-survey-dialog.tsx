"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Activity, RefreshCw, Send, Shield } from "lucide-react"
import type { MoodResponse } from "../types"

const MOOD_SLIDERS: { key: keyof MoodResponse; label: string }[] = [
  { key: "energy_level", label: "Energie-Level" },
  { key: "stress_level", label: "Stress-Level" },
  { key: "work_satisfaction", label: "Arbeitszufriedenheit" },
  { key: "team_harmony", label: "Team-Harmonie" },
  { key: "work_life_balance", label: "Work-Life-Balance" },
  { key: "leadership_support", label: "Führungsunterstützung" },
  { key: "growth_opportunities", label: "Wachstumschancen" },
  { key: "workload_fairness", label: "Arbeitsbelastung (Fairness)" },
]

interface MoodSurveyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  moodResponse: MoodResponse
  onMoodResponseChange: (response: MoodResponse) => void
  positiveFeedback: string
  onPositiveFeedbackChange: (value: string) => void
  improvementSuggestions: string
  onImprovementSuggestionsChange: (value: string) => void
  concerns: string
  onConcernsChange: (value: string) => void
  isSubmitting: boolean
  hasSubmittedToday: boolean
  onSubmit: () => void
}

export function MoodSurveyDialog({
  open, onOpenChange, moodResponse, onMoodResponseChange,
  positiveFeedback, onPositiveFeedbackChange,
  improvementSuggestions, onImprovementSuggestionsChange,
  concerns, onConcernsChange,
  isSubmitting, hasSubmittedToday, onSubmit,
}: MoodSurveyDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            Stimmungsumfrage
          </DialogTitle>
          <DialogDescription>
            {"Teilen Sie anonym Ihre Stimmung und Ihr Feedback. Ihre Antworten helfen uns, ein besseres Arbeitsumfeld zu schaffen."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <div className="space-y-4">
            {MOOD_SLIDERS.map(({ key, label }) => (
              <div key={key}>
                <Label className="flex items-center justify-between">
                  <span>{label}</span>
                  <span className="text-sm text-muted-foreground">{moodResponse[key]}/5</span>
                </Label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={moodResponse[key]}
                  onChange={(e) => onMoodResponseChange({ ...moodResponse, [key]: parseInt(e.target.value) })}
                  className="w-full mt-2"
                />
              </div>
            ))}
          </div>

          <div>
            <Label>{"Was läuft gut? (Optional)"}</Label>
            <Textarea
              placeholder="Teilen Sie positive Aspekte..."
              value={positiveFeedback}
              onChange={(e) => onPositiveFeedbackChange(e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>

          <div>
            <Label>{"Verbesserungsvorschläge (Optional)"}</Label>
            <Textarea
              placeholder={"Was könnte besser sein?"}
              value={improvementSuggestions}
              onChange={(e) => onImprovementSuggestionsChange(e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>

          <div>
            <Label>{"Anliegen/Sorgen (Optional & Vertraulich)"}</Label>
            <Textarea
              placeholder={"Gibt es etwas, das Sie beschäftigt?"}
              value={concerns}
              onChange={(e) => onConcernsChange(e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertTitle>{"100% Anonym & Vertraulich"}</AlertTitle>
            <AlertDescription>
              {"Ihre Antworten werden vollständig anonym erfasst und helfen uns, das Wohlbefinden im Team zu verbessern."}
            </AlertDescription>
          </Alert>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button onClick={onSubmit} disabled={isSubmitting || hasSubmittedToday}>
            {isSubmitting ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {hasSubmittedToday ? "Bereits eingereicht" : "Feedback senden"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
