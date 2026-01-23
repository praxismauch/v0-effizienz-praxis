"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sparkles, Loader2, Plus, Trash2 } from "lucide-react"
import type { NewGoal, AISuggestions } from "../types"

interface GoalsTabProps {
  goals: NewGoal[]
  onUpdate: (goals: NewGoal[]) => void
  onAIGenerate: () => void
  aiLoading: boolean
  aiSuggestions?: AISuggestions["goals"]
  onAcceptSuggestion: (suggestion: AISuggestions["goals"][0]) => void
}

export function GoalsTab({
  goals,
  onUpdate,
  onAIGenerate,
  aiLoading,
  aiSuggestions,
  onAcceptSuggestion,
}: GoalsTabProps) {
  const addGoal = () => {
    onUpdate([...goals, { title: "", description: "", priority: "medium", status: "open" }])
  }

  const updateGoal = (index: number, field: keyof NewGoal, value: string) => {
    const newGoals = [...goals]
    newGoals[index] = { ...newGoals[index], [field]: value }
    onUpdate(newGoals)
  }

  const removeGoal = (index: number) => {
    onUpdate(goals.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">Neue Ziele</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onAIGenerate} disabled={aiLoading}>
            {aiLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            KI-Vorschläge
          </Button>
          <Button variant="outline" size="sm" onClick={addGoal}>
            <Plus className="w-4 h-4 mr-2" />
            Ziel hinzufügen
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

      {/* Goals List */}
      <div className="space-y-3">
        {goals.map((goal, index) => (
          <Card key={index}>
            <CardContent className="py-4">
              <div className="grid gap-3">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Label className="text-xs">Titel</Label>
                    <Input
                      value={goal.title}
                      onChange={(e) => updateGoal(index, "title", e.target.value)}
                      placeholder="Ziel-Titel"
                    />
                  </div>
                  <div className="w-32">
                    <Label className="text-xs">Priorität</Label>
                    <Select value={goal.priority} onValueChange={(v) => updateGoal(index, "priority", v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Niedrig</SelectItem>
                        <SelectItem value="medium">Mittel</SelectItem>
                        <SelectItem value="high">Hoch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="ghost" size="icon" className="mt-5" onClick={() => removeGoal(index)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
                <div>
                  <Label className="text-xs">Beschreibung</Label>
                  <Textarea
                    value={goal.description}
                    onChange={(e) => updateGoal(index, "description", e.target.value)}
                    placeholder="Beschreibung des Ziels"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Messbar durch</Label>
                    <Input
                      value={goal.measurable || ""}
                      onChange={(e) => updateGoal(index, "measurable", e.target.value)}
                      placeholder="Wie wird Erfolg gemessen?"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Deadline</Label>
                    <Input
                      type="date"
                      value={goal.deadline || ""}
                      onChange={(e) => updateGoal(index, "deadline", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {goals.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Noch keine Ziele definiert. Klicken Sie auf "Ziel hinzufügen" oder nutzen Sie die KI-Vorschläge.
          </div>
        )}
      </div>
    </div>
  )
}
