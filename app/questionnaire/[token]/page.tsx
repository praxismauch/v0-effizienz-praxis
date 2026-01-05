"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle2 } from 'lucide-react'

interface Question {
  id: string
  question: string
  type: "text" | "textarea" | "radio" | "checkbox" | "number"
  options?: string[]
  required?: boolean
}

interface QuestionnaireData {
  id: string
  questionnaire: {
    title: string
    description: string
    questions: Question[]
  }
  candidate: {
    first_name: string
    last_name: string
  }
  status: string
}

export default function QuestionnairePage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [questionnaireData, setQuestionnaireData] = useState<QuestionnaireData | null>(null)
  const [responses, setResponses] = useState<Record<string, any>>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadQuestionnaire()
  }, [params.token])

  const loadQuestionnaire = async () => {
    try {
      const response = await fetch(`/api/questionnaire/${params.token}`)

      if (!response.ok) {
        const error = await response.json()
        setError(error.error || "Fragebogen konnte nicht geladen werden")
        return
      }

      const data = await response.json()
      setQuestionnaireData(data)
    } catch (err) {
      setError("Ein Fehler ist aufgetreten")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch(`/api/questionnaire/${params.token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responses }),
      })

      if (!response.ok) {
        throw new Error("Fehler beim Absenden")
      }

      setSubmitted(true)
      toast({
        title: "Vielen Dank!",
        description: "Ihre Antworten wurden erfolgreich übermittelt.",
      })
    } catch (err) {
      toast({
        title: "Fehler",
        description: "Ihre Antworten konnten nicht übermittelt werden.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleResponseChange = (questionId: string, value: any) => {
    setResponses((prev) => ({ ...prev, [questionId]: value }))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">Laden...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Fragebogen nicht verfügbar</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle>Vielen Dank!</CardTitle>
            <CardDescription>Ihre Antworten wurden erfolgreich übermittelt. Wir werden uns in Kürze bei Ihnen melden.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (!questionnaireData) return null

  const { questionnaire, candidate } = questionnaireData

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{questionnaire.title}</CardTitle>
            <CardDescription>
              {questionnaire.description && <p className="mb-2">{questionnaire.description}</p>}
              <p>
                Für: {candidate.first_name} {candidate.last_name}
              </p>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {questionnaire.questions.map((question: Question, index: number) => (
                <div key={question.id} className="space-y-2">
                  <Label className="text-base">
                    {index + 1}. {question.question}
                    {question.required && <span className="text-destructive ml-1">*</span>}
                  </Label>

                  {question.type === "text" && (
                    <Input
                      required={question.required}
                      value={responses[question.id] || ""}
                      onChange={(e) => handleResponseChange(question.id, e.target.value)}
                    />
                  )}

                  {question.type === "textarea" && (
                    <Textarea
                      required={question.required}
                      value={responses[question.id] || ""}
                      onChange={(e) => handleResponseChange(question.id, e.target.value)}
                      rows={4}
                    />
                  )}

                  {question.type === "number" && (
                    <Input
                      type="number"
                      required={question.required}
                      value={responses[question.id] || ""}
                      onChange={(e) => handleResponseChange(question.id, e.target.value)}
                    />
                  )}

                  {question.type === "radio" && question.options && (
                    <RadioGroup
                      required={question.required}
                      value={responses[question.id]}
                      onValueChange={(value) => handleResponseChange(question.id, value)}
                    >
                      {question.options.map((option, optIndex) => (
                        <div key={optIndex} className="flex items-center space-x-2">
                          <RadioGroupItem value={option} id={`${question.id}-${optIndex}`} />
                          <Label htmlFor={`${question.id}-${optIndex}`} className="font-normal">
                            {option}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}

                  {question.type === "checkbox" && question.options && (
                    <div className="space-y-2">
                      {question.options.map((option, optIndex) => (
                        <div key={optIndex} className="flex items-center space-x-2">
                          <Checkbox
                            id={`${question.id}-${optIndex}`}
                            checked={responses[question.id]?.[option] || false}
                            onCheckedChange={(checked) => {
                              const current = responses[question.id] || {}
                              handleResponseChange(question.id, { ...current, [option]: checked })
                            }}
                          />
                          <Label htmlFor={`${question.id}-${optIndex}`} className="font-normal">
                            {option}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Wird gesendet..." : "Absenden"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
