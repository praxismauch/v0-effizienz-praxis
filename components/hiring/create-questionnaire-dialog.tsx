"use client"

import type React from "react"

import { useState } from "react"
import { usePractice } from "@/contexts/practice-context"
import { useUser } from "@/contexts/user-context"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CreateQuestionnaireDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface Question {
  id: string
  question: string
  type: "text" | "textarea" | "radio" | "checkbox" | "number"
  options?: string[]
  required: boolean
}

function CreateQuestionnaireDialog({ open, onOpenChange, onSuccess }: CreateQuestionnaireDialogProps) {
  const { currentPractice } = usePractice()
  const { user } = useUser()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [questions, setQuestions] = useState<Question[]>([])

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: crypto.randomUUID(),
        question: "",
        type: "text",
        required: false,
      },
    ])
  }

  const handleRemoveQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id))
  }

  const handleQuestionChange = (id: string, field: keyof Question, value: any) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, [field]: value } : q)))
  }

  const handleAddOption = (questionId: string) => {
    setQuestions(questions.map((q) => (q.id === questionId ? { ...q, options: [...(q.options || []), ""] } : q)))
  }

  const handleOptionChange = (questionId: string, optionIndex: number, value: string) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId && q.options) {
          const newOptions = [...q.options]
          newOptions[optionIndex] = value
          return { ...q, options: newOptions }
        }
        return q
      }),
    )
  }

  const handleRemoveOption = (questionId: string, optionIndex: number) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId && q.options) {
          return { ...q, options: q.options.filter((_, i) => i !== optionIndex) }
        }
        return q
      }),
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/hiring/questionnaires", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          practice_id: currentPractice?.id,
          title,
          description,
          questions,
          created_by: user?.id,
        }),
      })

      if (!response.ok) throw new Error("Failed to create questionnaire")

      toast({
        title: "Fragebogen erstellt",
        description: "Der Fragebogen wurde erfolgreich erstellt.",
      })

      onSuccess()
      onOpenChange(false)
      resetForm()
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Der Fragebogen konnte nicht erstellt werden.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setQuestions([])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Neuer Fragebogen</DialogTitle>
          <DialogDescription>Erstellen Sie einen Fragebogen für Kandidaten</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titel *</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base">Fragen</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddQuestion}>
                <Plus className="h-4 w-4 mr-2" />
                Frage hinzufügen
              </Button>
            </div>

            {questions.map((question, index) => (
              <div key={question.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <Label className="text-sm font-medium">Frage {index + 1}</Label>
                  <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveQuestion(question.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <Input
                  placeholder="Frage eingeben..."
                  value={question.question}
                  onChange={(e) => handleQuestionChange(question.id, "question", e.target.value)}
                  required
                />

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Typ</Label>
                    <Select
                      value={question.type}
                      onValueChange={(value) => handleQuestionChange(question.id, "type", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Kurzer Text</SelectItem>
                        <SelectItem value="textarea">Langer Text</SelectItem>
                        <SelectItem value="number">Zahl</SelectItem>
                        <SelectItem value="radio">Auswahl (einfach)</SelectItem>
                        <SelectItem value="checkbox">Auswahl (mehrfach)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Pflichtfeld</Label>
                    <Select
                      value={question.required ? "yes" : "no"}
                      onValueChange={(value) => handleQuestionChange(question.id, "required", value === "yes")}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Ja</SelectItem>
                        <SelectItem value="no">Nein</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {(question.type === "radio" || question.type === "checkbox") && (
                  <div className="space-y-2">
                    <Label className="text-xs">Optionen</Label>
                    {question.options?.map((option, optIndex) => (
                      <div key={optIndex} className="flex gap-2">
                        <Input
                          placeholder={`Option ${optIndex + 1}`}
                          value={option}
                          onChange={(e) => handleOptionChange(question.id, optIndex, e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveOption(question.id, optIndex)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => handleAddOption(question.id)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Option hinzufügen
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading || questions.length === 0}>
              {loading ? "Wird erstellt..." : "Erstellen"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { CreateQuestionnaireDialog }
export default CreateQuestionnaireDialog
