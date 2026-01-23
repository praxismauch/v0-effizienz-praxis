"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sparkles, Loader2, Plus, Trash2 } from "lucide-react"
import type { FollowUpAction, AISuggestions } from "../types"

interface SummaryTabProps {
  overallRating: number | null
  summary: string
  careerAspirations: string
  promotionReadiness: string
  nextReviewDate: string
  followUpActions: FollowUpAction[]
  onUpdate: (field: string, value: any) => void
  onAIGenerate: () => void
  aiLoading: boolean
  aiSummary?: string
}

export function SummaryTab({
  overallRating,
  summary,
  careerAspirations,
  promotionReadiness,
  nextReviewDate,
  followUpActions,
  onUpdate,
  onAIGenerate,
  aiLoading,
  aiSummary,
}: SummaryTabProps) {
  const addAction = () => {
    onUpdate("follow_up_actions", [...followUpActions, { action: "", responsible: "", status: "open" }])
  }

  const updateAction = (index: number, field: keyof FollowUpAction, value: string) => {
    const newActions = [...followUpActions]
    newActions[index] = { ...newActions[index], [field]: value }
    onUpdate("follow_up_actions", newActions)
  }

  const removeAction = (index: number) => {
    onUpdate("follow_up_actions", followUpActions.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      {/* Overall Rating */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Gesamtbewertung (1-5)</Label>
          <Select
            value={overallRating?.toString() || ""}
            onValueChange={(v) => onUpdate("overall_rating", parseInt(v))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Bewertung wählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 - Entwicklungsbedarf</SelectItem>
              <SelectItem value="2">2 - Unterdurchschnittlich</SelectItem>
              <SelectItem value="3">3 - Entspricht Erwartungen</SelectItem>
              <SelectItem value="4">4 - Übertrifft Erwartungen</SelectItem>
              <SelectItem value="5">5 - Herausragend</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Nächster Review</Label>
          <Input
            type="date"
            value={nextReviewDate}
            onChange={(e) => onUpdate("next_review_date", e.target.value)}
          />
        </div>
      </div>

      {/* Summary */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Zusammenfassung</Label>
          <Button variant="outline" size="sm" onClick={onAIGenerate} disabled={aiLoading}>
            {aiLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            KI-Zusammenfassung
          </Button>
        </div>
        {aiSummary && (
          <Card className="bg-purple-50 border-purple-200 mb-2">
            <CardContent className="py-3">
              <p className="text-sm">{aiSummary}</p>
              <Button
                size="sm"
                variant="outline"
                className="mt-2 bg-transparent"
                onClick={() => onUpdate("summary", aiSummary)}
              >
                Übernehmen
              </Button>
            </CardContent>
          </Card>
        )}
        <Textarea
          value={summary}
          onChange={(e) => onUpdate("summary", e.target.value)}
          placeholder="Gesamtzusammenfassung des Gesprächs"
          rows={4}
        />
      </div>

      {/* Career */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Karriereziele</Label>
          <Textarea
            value={careerAspirations}
            onChange={(e) => onUpdate("career_aspirations", e.target.value)}
            placeholder="Langfristige Karriereziele des Mitarbeiters"
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label>Beförderungsbereitschaft</Label>
          <Select value={promotionReadiness} onValueChange={(v) => onUpdate("promotion_readiness", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Status wählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="not_ready">Noch nicht bereit</SelectItem>
              <SelectItem value="developing">In Entwicklung</SelectItem>
              <SelectItem value="ready_soon">Bald bereit</SelectItem>
              <SelectItem value="ready_now">Jetzt bereit</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Follow-up Actions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Follow-up Maßnahmen</Label>
          <Button variant="outline" size="sm" onClick={addAction}>
            <Plus className="w-4 h-4 mr-2" />
            Maßnahme hinzufügen
          </Button>
        </div>
        {followUpActions.map((action, index) => (
          <Card key={index}>
            <CardContent className="py-3">
              <div className="flex gap-3 items-start">
                <div className="flex-1 space-y-2">
                  <Input
                    value={action.action}
                    onChange={(e) => updateAction(index, "action", e.target.value)}
                    placeholder="Beschreibung der Maßnahme"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      value={action.responsible}
                      onChange={(e) => updateAction(index, "responsible", e.target.value)}
                      placeholder="Verantwortlich"
                    />
                    <Input
                      type="date"
                      value={action.deadline || ""}
                      onChange={(e) => updateAction(index, "deadline", e.target.value)}
                    />
                    <Select value={action.status} onValueChange={(v) => updateAction(index, "status", v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Offen</SelectItem>
                        <SelectItem value="in_progress">In Bearbeitung</SelectItem>
                        <SelectItem value="done">Erledigt</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeAction(index)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
