"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Sparkles, Check, Circle } from "lucide-react"
import { questions, type QuestionnaireResponses } from "./types"

interface WizardViewProps {
  currentStep: number
  setCurrentStep: (step: number) => void
  responses: QuestionnaireResponses
  onResponseChange: (value: string) => void
  onBack: () => void
  onNext: () => void
  onGenerate: () => void
  onClose: () => void
  isGenerating: boolean
}

export function WizardView({
  currentStep,
  setCurrentStep,
  responses,
  onResponseChange,
  onBack,
  onNext,
  onGenerate,
  onClose,
  isGenerating,
}: WizardViewProps) {
  const progressPercent = ((currentStep + 1) / questions.length) * 100
  const currentQuestion = questions[currentStep]
  const currentResponseValue = responses[currentQuestion.id as keyof QuestionnaireResponses]
  const isLastStep = currentStep === questions.length - 1

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header Badge */}
        <div className="flex justify-center mb-6">
          <Badge variant="secondary" className="px-4 py-2 text-sm font-medium bg-primary/10 text-primary border-0">
            <Sparkles className="mr-2 h-4 w-4" />
            KI-gestutztes Leitbild
          </Badge>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-3">Leitbild erstellen</h1>
          <p className="text-muted-foreground text-lg">
            Beantworten Sie einige Fragen zu Ihrer Praxis. Unsere KI hilft Ihnen dann, ein professionelles Leitbild
            zu erstellen.
          </p>
        </div>

        {/* Progress indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Frage {currentStep + 1} von {questions.length}
            </span>
            <span className="text-sm font-medium text-primary">{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className="mb-6 shadow-sm">
          <CardContent className="p-8">
            <h2 className="text-xl font-semibold mb-6">{currentQuestion.question}</h2>
            <Textarea
              value={currentResponseValue}
              onChange={(e) => onResponseChange(e.target.value)}
              placeholder={currentQuestion.placeholder}
              rows={4}
              className="resize-none text-base"
            />
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between mb-8">
          <Button
            variant="outline"
            onClick={currentStep === 0 ? onClose : onBack}
            className="px-6"
          >
            Zuruck
          </Button>

          {isLastStep ? (
            <Button onClick={onGenerate} disabled={isGenerating} className="px-6 bg-primary">
              {isGenerating ? (
                <>
                  <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                  Generiere...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Leitbild generieren
                </>
              )}
            </Button>
          ) : (
            <Button onClick={onNext} className="px-6 bg-primary">
              Weiter
            </Button>
          )}
        </div>

        {/* Progress Overview */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Fortschritt</h3>
            <div className="space-y-3">
              {questions.map((q, index) => {
                const responseValue = responses[q.id as keyof QuestionnaireResponses]
                const isAnswered = responseValue && responseValue.trim() !== ""
                const isCurrent = index === currentStep

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentStep(index)}
                    className={`flex items-center gap-3 w-full text-left p-2 rounded-lg transition-colors ${
                      isCurrent ? "bg-primary/5" : "hover:bg-muted/50"
                    }`}
                  >
                    {isAnswered ? (
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    )}
                    <span className={`text-sm ${isCurrent ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                      {q.question}
                    </span>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
