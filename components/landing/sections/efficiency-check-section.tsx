"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Brain, ArrowRight, RefreshCcw } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { cn } from "@/lib/utils"
import { quizQuestions, getResultCategory } from "../quiz-data"

export function EfficiencyCheckSection() {
  const [quizStarted, setQuizStarted] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [showResults, setShowResults] = useState(false)

  const handleAnswer = (selectedScore: number) => {
    const newAnswers = [...answers, selectedScore]
    setAnswers(newAnswers)

    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      setShowResults(true)
    }
  }

  const resetQuiz = () => {
    setQuizStarted(false)
    setCurrentQuestion(0)
    setAnswers([])
    setShowResults(false)
  }

  const totalScore = answers.reduce((sum, score) => sum + score, 0)
  const result = getResultCategory(totalScore)
  const ResultIcon = result.icon
  const progress = ((currentQuestion + 1) / quizQuestions.length) * 100

  return (
    <section className="w-full py-16 md:py-24 bg-gradient-to-b from-background via-muted/20 to-background">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-12">
          <ScrollReveal variant="fadeUp" delay={100}>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-muted-foreground/70">
              Wie effizient ist Ihre Praxis?
            </h2>
          </ScrollReveal>
          <ScrollReveal variant="fadeUp" delay={200}>
            <p className="text-lg text-muted-foreground mx-auto">
              Finden Sie in 2 Minuten heraus, wo Ihre Praxis steht
            </p>
          </ScrollReveal>
        </div>

        <ScrollReveal variant="fadeUp" delay={300}>
          <Card className="bg-slate-900 border-slate-800 overflow-hidden">
            <CardContent className="p-8 md:p-12">
              {/* Quiz Start State */}
              {!quizStarted && !showResults && (
                <div className="text-center py-8">
                  <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                    <Brain className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-white">Effizienz-Check</h3>
                  <p className="text-slate-400 mb-8 mx-auto leading-relaxed">
                    Beantworten Sie 8 kurze Fragen und erhalten Sie eine individuelle Einschätzung des
                    Effizienz-Potenzials Ihrer Praxis.
                  </p>
                  <Button size="lg" onClick={() => setQuizStarted(true)} className="gap-2">
                    Test starten
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Quiz Questions State */}
              {quizStarted && !showResults && (
                <div className="text-white">
                  <div className="mb-8">
                    <div className="flex justify-between text-sm text-slate-400 mb-2">
                      <span>
                        Frage {currentQuestion + 1} von {quizQuestions.length}
                      </span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  <h3 className="text-xl font-semibold mb-6">{quizQuestions[currentQuestion].question}</h3>

                  <div className="space-y-3">
                    {quizQuestions[currentQuestion].options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleAnswer(option.score)}
                        className="w-full text-left p-4 rounded-xl border-2 border-slate-700 hover:border-primary hover:bg-primary/10 transition-all duration-200 group"
                      >
                        <span className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full border-2 border-slate-600 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center text-sm font-medium transition-all duration-200">
                            {String.fromCharCode(65 + index)}
                          </span>
                          <span className="flex-1 text-slate-300 group-hover:text-white">{option.text}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Results State */}
              {showResults && (
                <div className="text-center py-4">
                  <div
                    className={cn("w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6", result.bg)}
                  >
                    <ResultIcon className={cn("h-10 w-10", result.color)} />
                  </div>

                  <h3 className={cn("text-2xl font-bold mb-2", result.color)}>{result.title}</h3>

                  <div className="mb-6">
                    <div className="text-5xl font-bold text-white mb-1">
                      {Math.round((totalScore / (quizQuestions.length * 4)) * 100)}%
                    </div>
                    <p className="text-slate-400">Effizienz-Score</p>
                  </div>

                  <p className="text-slate-400 mb-8 max-w-md mx-auto">{result.description}</p>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild size="lg">
                      <Link href="/coming-soon">Effizienz Praxis testen</Link>
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={resetQuiz}
                      className="gap-2 bg-transparent border-slate-600 text-white hover:bg-slate-800"
                    >
                      <RefreshCcw className="h-4 w-4" />
                      Test wiederholen
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </ScrollReveal>
      </div>
    </section>
  )
}
