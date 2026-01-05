"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Slider } from "@/components/ui/slider"
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2, ClipboardCheck, AlertCircle, Lock } from "lucide-react"
import { format, parseISO, isBefore, isAfter } from "date-fns"
import { de } from "date-fns/locale"

interface SurveyQuestion {
  id: string
  question_text: string
  question_type: string
  is_required: boolean
  display_order: number
  options: string[]
  min_value?: number
  max_value?: number
  scale_labels?: Record<string, string>
  placeholder?: string
  help_text?: string
}

interface Survey {
  id: string
  title: string
  description: string | null
  is_anonymous: boolean
  show_progress: boolean
  require_all_questions: boolean
  thank_you_message: string
  start_date: string | null
  end_date: string | null
  status: string
  questions: SurveyQuestion[]
}

export default function PublicSurveyPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const token = params.token as string

  const [survey, setSurvey] = useState<Survey | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [completed, setCompleted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [respondentInfo, setRespondentInfo] = useState({ name: "", email: "" })

  const fetchSurvey = useCallback(async () => {
    try {
      const response = await fetch(`/api/survey/${token}`)
      if (response.ok) {
        const data = await response.json()
        setSurvey(data.survey)

        // Check date restrictions
        const now = new Date()
        if (data.survey.start_date && isBefore(now, parseISO(data.survey.start_date))) {
          setError(
            `Diese Umfrage ist erst ab ${format(parseISO(data.survey.start_date), "dd.MM.yyyy", { locale: de })} verfügbar.`,
          )
        } else if (data.survey.end_date && isAfter(now, parseISO(data.survey.end_date))) {
          setError(
            `Diese Umfrage ist seit ${format(parseISO(data.survey.end_date), "dd.MM.yyyy", { locale: de })} beendet.`,
          )
        } else if (data.survey.status !== "active") {
          setError("Diese Umfrage ist derzeit nicht aktiv.")
        }
      } else if (response.status === 404) {
        setError("Diese Umfrage wurde nicht gefunden.")
      } else {
        setError("Fehler beim Laden der Umfrage.")
      }
    } catch (err) {
      setError("Fehler beim Laden der Umfrage.")
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchSurvey()
  }, [fetchSurvey])

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleSubmit = async () => {
    if (!survey) return

    // Validate required questions
    const unanswered = survey.questions.filter((q) => q.is_required && !answers[q.id])
    if (unanswered.length > 0 && survey.require_all_questions) {
      toast({
        title: "Fehlende Antworten",
        description: "Bitte beantworten Sie alle Pflichtfragen.",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/survey/${token}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          respondent_name: survey.is_anonymous ? null : respondentInfo.name,
          respondent_email: survey.is_anonymous ? null : respondentInfo.email,
        }),
      })

      if (response.ok) {
        setCompleted(true)
      } else {
        throw new Error("Failed to submit")
      }
    } catch (err) {
      toast({
        title: "Fehler",
        description: "Die Umfrage konnte nicht abgesendet werden.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const currentQuestion = survey?.questions[currentQuestionIndex]
  const progress = survey ? ((currentQuestionIndex + 1) / survey.questions.length) * 100 : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Umfrage nicht verfügbar</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Vielen Dank!</h2>
            <p className="text-muted-foreground">
              {survey?.thank_you_message || "Ihre Antworten wurden erfolgreich übermittelt."}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!survey) return null

  const renderQuestion = (question: SurveyQuestion) => {
    const value = answers[question.id]

    switch (question.question_type) {
      case "single_choice":
        return (
          <RadioGroup value={value || ""} onValueChange={(v) => handleAnswerChange(question.id, v)}>
            <div className="space-y-3">
              {question.options.map((option, i) => (
                <label
                  key={i}
                  className="flex items-center space-x-3 p-4 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <RadioGroupItem value={option} />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </RadioGroup>
        )

      case "multiple_choice":
        return (
          <div className="space-y-3">
            {question.options.map((option, i) => (
              <label
                key={i}
                className="flex items-center space-x-3 p-4 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  checked={(value || []).includes(option)}
                  onCheckedChange={(checked) => {
                    const current = value || []
                    const updated = checked ? [...current, option] : current.filter((v: string) => v !== option)
                    handleAnswerChange(question.id, updated)
                  }}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        )

      case "text":
        return (
          <Textarea
            value={value || ""}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder={question.placeholder || "Ihre Antwort..."}
            rows={4}
          />
        )

      case "scale":
        const min = question.min_value ?? 1
        const max = question.max_value ?? 10
        return (
          <div className="space-y-4">
            <Slider
              value={[value ?? min]}
              onValueChange={([v]) => handleAnswerChange(question.id, v)}
              min={min}
              max={max}
              step={1}
              className="py-4"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{question.scale_labels?.[String(min)] || min}</span>
              <span className="text-2xl font-bold text-violet-600">{value ?? "-"}</span>
              <span>{question.scale_labels?.[String(max)] || max}</span>
            </div>
          </div>
        )

      case "yes_no":
        return (
          <div className="flex gap-4">
            <Button
              variant={value === true ? "default" : "outline"}
              className="flex-1 h-16"
              onClick={() => handleAnswerChange(question.id, true)}
            >
              Ja
            </Button>
            <Button
              variant={value === false ? "default" : "outline"}
              className="flex-1 h-16"
              onClick={() => handleAnswerChange(question.id, false)}
            >
              Nein
            </Button>
          </div>
        )

      case "number":
        return (
          <Input
            type="number"
            value={value || ""}
            onChange={(e) => handleAnswerChange(question.id, Number.parseFloat(e.target.value))}
            placeholder={question.placeholder || "Zahl eingeben..."}
          />
        )

      case "date":
        return (
          <Input type="date" value={value || ""} onChange={(e) => handleAnswerChange(question.id, e.target.value)} />
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white mb-4">
            <ClipboardCheck className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">{survey.title}</h1>
          {survey.description && <p className="text-muted-foreground">{survey.description}</p>}
          {survey.is_anonymous && (
            <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full bg-violet-100 text-violet-700 text-sm">
              <Lock className="h-4 w-4" />
              Ihre Antworten bleiben anonym
            </div>
          )}
        </div>

        {/* Progress */}
        {survey.show_progress && (
          <div className="mb-6">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>
                Frage {currentQuestionIndex + 1} von {survey.questions.length}
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Question Card */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-xl">
              {currentQuestion?.question_text}
              {currentQuestion?.is_required && <span className="text-red-500 ml-1">*</span>}
            </CardTitle>
            {currentQuestion?.help_text && <CardDescription>{currentQuestion.help_text}</CardDescription>}
          </CardHeader>
          <CardContent className="space-y-6">
            {currentQuestion && renderQuestion(currentQuestion)}

            {/* Navigation */}
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                disabled={currentQuestionIndex === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Zurück
              </Button>

              {currentQuestionIndex < survey.questions.length - 1 ? (
                <Button
                  onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                  disabled={currentQuestion?.is_required && !answers[currentQuestion.id]}
                >
                  Weiter
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || (currentQuestion?.is_required && !answers[currentQuestion.id])}
                  className="bg-gradient-to-r from-violet-600 to-purple-600"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Wird gesendet...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Absenden
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Question dots */}
        <div className="flex justify-center gap-2 mt-6">
          {survey.questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentQuestionIndex(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                i === currentQuestionIndex
                  ? "bg-violet-600 w-6"
                  : answers[survey.questions[i].id]
                    ? "bg-violet-300"
                    : "bg-gray-300"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
