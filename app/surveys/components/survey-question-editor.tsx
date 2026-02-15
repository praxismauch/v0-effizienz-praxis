"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card } from "@/components/ui/card"
import { Plus, Trash2, GripVertical, X } from "lucide-react"
import type { SurveyQuestion } from "../types"

interface SurveyQuestionEditorProps {
  questions: SurveyQuestion[]
  onChange: (questions: SurveyQuestion[]) => void
}

const QUESTION_TYPE_LABELS: Record<string, string> = {
  scale: "Skala (1-10)",
  single_choice: "Einfachauswahl",
  multiple_choice: "Mehrfachauswahl",
  text: "Freitext",
  yes_no: "Ja / Nein",
  rating: "Bewertung (Sterne)",
}

function createEmptyQuestion(orderIndex: number): SurveyQuestion {
  return {
    question_text: "",
    question_type: "scale",
    options: [],
    is_required: true,
    order_index: orderIndex,
  }
}

export function SurveyQuestionEditor({ questions, onChange }: SurveyQuestionEditorProps) {
  const [newOptionTexts, setNewOptionTexts] = useState<Record<number, string>>({})

  const addQuestion = () => {
    onChange([...questions, createEmptyQuestion(questions.length + 1)])
  }

  const removeQuestion = (index: number) => {
    const updated = questions.filter((_, i) => i !== index).map((q, i) => ({ ...q, order_index: i + 1 }))
    onChange(updated)
  }

  const updateQuestion = (index: number, field: keyof SurveyQuestion, value: unknown) => {
    const updated = [...questions]
    updated[index] = { ...updated[index], [field]: value }
    if (field === "question_type" && !["single_choice", "multiple_choice"].includes(value as string)) {
      updated[index].options = []
    }
    onChange(updated)
  }

  const addOption = (questionIndex: number) => {
    const text = (newOptionTexts[questionIndex] || "").trim()
    if (!text) return
    const updated = [...questions]
    const currentOptions = updated[questionIndex].options || []
    updated[questionIndex] = { ...updated[questionIndex], options: [...currentOptions, text] }
    onChange(updated)
    setNewOptionTexts((prev) => ({ ...prev, [questionIndex]: "" }))
  }

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updated = [...questions]
    const currentOptions = [...(updated[questionIndex].options || [])]
    currentOptions.splice(optionIndex, 1)
    updated[questionIndex] = { ...updated[questionIndex], options: currentOptions }
    onChange(updated)
  }

  const moveQuestion = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= questions.length) return
    const updated = [...questions]
    const temp = updated[index]
    updated[index] = updated[newIndex]
    updated[newIndex] = temp
    onChange(updated.map((q, i) => ({ ...q, order_index: i + 1 })))
  }

  const needsOptions = (type: string) => ["single_choice", "multiple_choice"].includes(type)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Fragen ({questions.length})</Label>
        <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Frage hinzufuegen
        </Button>
      </div>

      {questions.length === 0 && (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          Noch keine Fragen. Klicken Sie auf &quot;Frage hinzufuegen&quot; um zu beginnen.
        </div>
      )}

      {questions.map((q, index) => (
        <Card key={index} className="p-3 space-y-3">
          <div className="flex items-start gap-2">
            <div className="flex flex-col gap-0.5 pt-1">
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                onClick={() => moveQuestion(index, "up")}
                disabled={index === 0}
                aria-label="Nach oben"
              >
                <GripVertical className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground min-w-[20px]">{index + 1}.</span>
                <Input
                  placeholder="Frage eingeben..."
                  value={q.question_text}
                  onChange={(e) => updateQuestion(index, "question_text", e.target.value)}
                  className="text-sm"
                />
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <Select
                  value={q.question_type}
                  onValueChange={(v) => updateQuestion(index, "question_type", v)}
                >
                  <SelectTrigger className="w-[180px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(QUESTION_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-1.5">
                  <Switch
                    id={`required-${index}`}
                    checked={q.is_required}
                    onCheckedChange={(v) => updateQuestion(index, "is_required", v)}
                    className="scale-75"
                  />
                  <Label htmlFor={`required-${index}`} className="text-xs text-muted-foreground cursor-pointer">
                    Pflicht
                  </Label>
                </div>
              </div>

              {needsOptions(q.question_type) && (
                <div className="space-y-1.5 pl-6">
                  {(q.options || []).map((opt, optIdx) => (
                    <div key={optIdx} className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground w-4">{optIdx + 1}.</span>
                      <span className="text-xs flex-1">{opt}</span>
                      <button
                        type="button"
                        onClick={() => removeOption(index, optIdx)}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="Option entfernen"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center gap-1.5">
                    <Input
                      placeholder="Neue Option..."
                      value={newOptionTexts[index] || ""}
                      onChange={(e) => setNewOptionTexts((prev) => ({ ...prev, [index]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          addOption(index)
                        }
                      }}
                      className="text-xs h-7 flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => addOption(index)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => removeQuestion(index)}
              aria-label="Frage entfernen"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </Card>
      ))}

      {questions.length > 0 && (
        <Button type="button" variant="outline" size="sm" className="w-full" onClick={addQuestion}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Weitere Frage
        </Button>
      )}
    </div>
  )
}
