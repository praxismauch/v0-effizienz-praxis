"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sparkles, Loader2, Plus, Trash2 } from "lucide-react"
import type { DevelopmentPlan, AISuggestions } from "../types"

interface DevelopmentTabProps {
  plans: DevelopmentPlan[]
  onUpdate: (plans: DevelopmentPlan[]) => void
  onAIGenerate: () => void
  aiLoading: boolean
  aiSuggestions?: AISuggestions["development"]
  onAcceptSuggestion: (suggestion: AISuggestions["development"][0]) => void
}

export function DevelopmentTab({
  plans,
  onUpdate,
  onAIGenerate,
  aiLoading,
  aiSuggestions,
  onAcceptSuggestion,
}: DevelopmentTabProps) {
  // Ensure plans is always an array
  const safePlans = Array.isArray(plans) ? plans : []

  const addPlan = () => {
    onUpdate([...safePlans, { title: "", description: "", type: "training", status: "planned" }])
  }

  const updatePlan = (index: number, field: keyof DevelopmentPlan, value: string) => {
    const newPlans = [...safePlans]
    newPlans[index] = { ...newPlans[index], [field]: value }
    onUpdate(newPlans)
  }

  const removePlan = (index: number) => {
    onUpdate(safePlans.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">Entwicklungsmaßnahmen</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onAIGenerate} disabled={aiLoading}>
            {aiLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            KI-Vorschläge
          </Button>
          <Button variant="outline" size="sm" onClick={addPlan}>
            <Plus className="w-4 h-4 mr-2" />
            Maßnahme hinzufügen
          </Button>
        </div>
      </div>

      {/* AI Suggestions */}
      {aiSuggestions && aiSuggestions.length > 0 && (
        <Card className="bg-purple-50 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              KI-Vorschläge
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {aiSuggestions.map((suggestion, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 bg-white rounded border cursor-pointer hover:border-purple-400"
                onClick={() => onAcceptSuggestion(suggestion)}
              >
                <div>
                  <p className="font-medium text-sm">{suggestion.title}</p>
                  <p className="text-xs text-muted-foreground">{suggestion.description}</p>
                </div>
                <Plus className="w-4 h-4 text-purple-600" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Development Plans List */}
      <div className="space-y-3">
        {safePlans.map((plan, index) => (
          <Card key={index}>
            <CardContent className="py-4">
              <div className="grid gap-3">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Label className="text-xs">Titel</Label>
                    <Input
                      value={plan.title}
                      onChange={(e) => updatePlan(index, "title", e.target.value)}
                      placeholder="Maßnahme"
                    />
                  </div>
                  <div className="w-40">
                    <Label className="text-xs">Art</Label>
                    <Select value={plan.type} onValueChange={(v) => updatePlan(index, "type", v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="training">Schulung</SelectItem>
                        <SelectItem value="certification">Zertifizierung</SelectItem>
                        <SelectItem value="mentoring">Mentoring</SelectItem>
                        <SelectItem value="project">Projekt</SelectItem>
                        <SelectItem value="other">Sonstiges</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="ghost" size="icon" className="mt-5" onClick={() => removePlan(index)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
                <div>
                  <Label className="text-xs">Beschreibung</Label>
                  <Textarea
                    value={plan.description}
                    onChange={(e) => updatePlan(index, "description", e.target.value)}
                    placeholder="Details zur Maßnahme"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Zeitrahmen</Label>
                    <Input
                      value={plan.timeline || ""}
                      onChange={(e) => updatePlan(index, "timeline", e.target.value)}
                      placeholder="z.B. Q1 2026"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Ressourcen</Label>
                    <Input
                      value={plan.resources || ""}
                      onChange={(e) => updatePlan(index, "resources", e.target.value)}
                      placeholder="Benötigte Ressourcen"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {safePlans.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Noch keine Entwicklungsmaßnahmen definiert.
          </div>
        )}
      </div>
    </div>
  )
}
