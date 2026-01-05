"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  Heart,
  ShieldCheck,
  Award,
  Users,
  TrendingUp,
  CheckCircle2,
  Clock,
  Target,
  Zap,
  BarChart3,
  Brain,
  Lightbulb,
  RefreshCcw,
  Sparkles,
  MessageSquare,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { LandingPageFooter } from "@/components/landing-page-footer"
import { LandingPageHeader } from "@/components/landing-page-header"
import { ScrollReveal } from "@/components/scroll-reveal"
import { cn } from "@/lib/utils"

const quizQuestions = [
  {
    id: 1,
    question: "Wie oft suchen Sie oder Ihr Team nach Dokumenten oder Informationen?",
    options: [
      { text: "Mehrmals täglich - wir verlieren viel Zeit damit", score: 1 },
      { text: "Einmal täglich - es dauert manchmal etwas", score: 2 },
      { text: "Selten - wir finden meist schnell alles", score: 3 },
      { text: "Fast nie - wir haben ein perfektes System", score: 4 },
    ],
  },
  {
    id: 2,
    question: "Wie werden Aufgaben und Verantwortlichkeiten in Ihrer Praxis kommuniziert?",
    options: [
      { text: "Mündlich oder per Zettel - oft geht etwas unter", score: 1 },
      { text: "E-Mail/Chat - aber nicht immer strukturiert", score: 2 },
      { text: "Digitale Tools - meistens klappt es gut", score: 3 },
      { text: "Klares System mit Tracking und Bestätigung", score: 4 },
    ],
  },
  {
    id: 3,
    question: "Wie häufig treten wiederkehrende Fehler oder Missverständnisse auf?",
    options: [
      { text: "Regelmäßig - wir machen oft die gleichen Fehler", score: 1 },
      { text: "Manchmal - einige Prozesse sind fehleranfällig", score: 2 },
      { text: "Selten - wir haben die meisten Prozesse im Griff", score: 3 },
      { text: "Kaum - wir haben standardisierte Abläufe", score: 4 },
    ],
  },
  {
    id: 4,
    question: "Wie gut kennen Ihre Mitarbeitenden ihre Aufgaben und Verantwortlichkeiten?",
    options: [
      { text: "Unklar - es gibt häufig Fragen und Unsicherheiten", score: 1 },
      { text: "Teilweise - manche Bereiche sind nicht definiert", score: 2 },
      { text: "Gut - die meisten wissen, was zu tun ist", score: 3 },
      { text: "Exzellent - klare Rollen und Stellenbeschreibungen", score: 4 },
    ],
  },
  {
    id: 5,
    question: "Wie zufrieden sind Ihre Mitarbeitenden mit den Arbeitsabläufen?",
    options: [
      { text: "Unzufrieden - es gibt viel Frust über Ineffizienzen", score: 1 },
      { text: "Neutral - es könnte besser sein", score: 2 },
      { text: "Zufrieden - die meisten Abläufe funktionieren", score: 3 },
      { text: "Sehr zufrieden - wir haben optimierte Prozesse", score: 4 },
    ],
  },
  {
    id: 6,
    question: "Wie werden Verbesserungsvorschläge in Ihrer Praxis behandelt?",
    options: [
      { text: "Selten besprochen - keine Zeit dafür", score: 1 },
      { text: "Gelegentlich - wenn jemand aktiv darauf hinweist", score: 2 },
      { text: "Regelmäßig - wir haben Teambesprechungen", score: 3 },
      { text: "Systematisch - mit Feedback-System und Umsetzungstracking", score: 4 },
    ],
  },
  {
    id: 7,
    question: "Wie gut können Sie Ihre Praxiskennzahlen (Auslastung, Umsatz, etc.) einsehen?",
    options: [
      { text: "Kaum - wir haben keinen Überblick", score: 1 },
      { text: "Eingeschränkt - nur mit viel manuellem Aufwand", score: 2 },
      { text: "Gut - wir haben einige Auswertungen", score: 3 },
      { text: "Exzellent - Echtzeit-Dashboard mit allen wichtigen KPIs", score: 4 },
    ],
  },
  {
    id: 8,
    question: "Wie viel Zeit verbringen Sie mit administrativen Aufgaben statt mit Patienten?",
    options: [
      { text: "Sehr viel - Administration frisst die meiste Zeit", score: 1 },
      { text: "Viel - ich wünschte, es wäre weniger", score: 2 },
      { text: "Moderat - ein guter Mix", score: 3 },
      { text: "Wenig - die meiste Zeit gehört den Patienten", score: 4 },
    ],
  },
]

const getResultCategory = (score: number) => {
  const percentage = (score / (quizQuestions.length * 4)) * 100
  if (percentage >= 85) {
    return {
      title: "Effizienz-Champion",
      description:
        "Herzlichen Glückwunsch! Ihre Praxis ist bereits sehr effizient aufgestellt. Mit Effizienz Praxis können Sie Ihre Spitzenposition weiter ausbauen und neue Optimierungspotenziale entdecken.",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      icon: Award,
    }
  } else if (percentage >= 65) {
    return {
      title: "Auf gutem Weg",
      description:
        "Ihre Praxis hat bereits gute Strukturen, aber es gibt noch Luft nach oben. Mit den richtigen Tools können Sie Ihre Effizienz um 20-30% steigern.",
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-200",
      icon: TrendingUp,
    }
  } else if (percentage >= 45) {
    return {
      title: "Entwicklungspotenzial",
      description:
        "Es gibt deutliches Optimierungspotenzial in Ihrer Praxis. Strukturierte Prozesse und digitale Tools können Ihnen helfen, Zeit zu sparen und Fehler zu reduzieren.",
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-200",
      icon: Lightbulb,
    }
  } else {
    return {
      title: "Handlungsbedarf",
      description:
        "Ihre Praxis hat erhebliches Verbesserungspotenzial. Die gute Nachricht: Mit den richtigen Maßnahmen können Sie schnell große Fortschritte erzielen.",
      color: "text-rose-600",
      bg: "bg-rose-50",
      border: "border-rose-200",
      icon: RefreshCcw,
    }
  }
}

export function EffizienzPageClient() {
  const [quizStarted, setQuizStarted] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [showResults, setShowResults] = useState(false)

  const handleAnswer = (score: number) => {
    const newAnswers = [...answers, score]
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

  const efficiencyBenefits = [
    {
      icon: Heart,
      title: "Weniger Stress",
      description:
        "Klare Prozesse und Strukturen reduzieren Hektik und schaffen Ruhe im Praxisalltag. Ihr Team kann entspannter arbeiten.",
      color: "text-rose-500",
      bg: "bg-rose-50",
      iconBg: "bg-rose-100",
      border: "border-rose-200",
    },
    {
      icon: ShieldCheck,
      title: "Weniger Fehler",
      description:
        "Standardisierte Abläufe und Checklisten minimieren Fehlerquellen und sorgen für konsistent hohe Qualität.",
      color: "text-emerald-500",
      bg: "bg-emerald-50",
      iconBg: "bg-emerald-100",
      border: "border-emerald-200",
    },
    {
      icon: Award,
      title: "Höhere Qualität",
      description: "Mehr Zeit für das Wesentliche bedeutet bessere Patientenversorgung und höhere Behandlungsqualität.",
      color: "text-amber-500",
      bg: "bg-amber-50",
      iconBg: "bg-amber-100",
      border: "border-amber-200",
    },
    {
      icon: Users,
      title: "Zufriedenere Mitarbeitende",
      description:
        "Effiziente Prozesse reduzieren Frustration und steigern die Arbeitszufriedenheit Ihres gesamten Teams.",
      color: "text-violet-500",
      bg: "bg-violet-50",
      iconBg: "bg-violet-100",
      border: "border-violet-200",
    },
    {
      icon: TrendingUp,
      title: "Höhere Gewinne",
      description:
        "Zeitersparnis, weniger Fehler und optimierte Abläufe führen direkt zu besseren wirtschaftlichen Ergebnissen.",
      color: "text-sky-500",
      bg: "bg-sky-50",
      iconBg: "bg-sky-100",
      border: "border-sky-200",
    },
  ]

  const efficiencyPillars = [
    {
      icon: Clock,
      title: "Zeit",
      description: "Jede eingesparte Minute ist mehr Zeit für Patienten und wichtige Aufgaben.",
    },
    {
      icon: Target,
      title: "Fokus",
      description: "Klare Prioritäten helfen, sich auf das Wesentliche zu konzentrieren.",
    },
    {
      icon: Zap,
      title: "Energie",
      description: "Effiziente Prozesse schonen Ressourcen und verhindern Erschöpfung.",
    },
    {
      icon: BarChart3,
      title: "Kontrolle",
      description: "Transparenz über alle Abläufe ermöglicht fundierte Entscheidungen.",
    },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-white">
      <LandingPageHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-28 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-cyan-500/5" />
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <ScrollReveal variant="fadeUp">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Zurück zur Startseite
              </Link>
            </ScrollReveal>

            <ScrollReveal variant="fadeUp" delay={100}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Brain className="h-4 w-4" />
                Warum Effizienz entscheidend ist
              </div>
            </ScrollReveal>

            <ScrollReveal variant="fadeUp" delay={200}>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-balance">
                <span className="text-foreground">Effiziente Praxis</span>
                <span className="mx-3 text-muted-foreground">=</span>
                <span className="bg-gradient-to-r from-primary via-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  wirtschaftlich starke Praxis
                </span>
              </h1>
            </ScrollReveal>

            <ScrollReveal variant="fadeUp" delay={300}>
              <p className="text-xl text-muted-foreground max-w-3xl mb-8 text-balance">
                Effizienz ist kein Luxus, sondern die Grundlage für nachhaltigen Praxiserfolg. Entdecken Sie, wie Sie
                mit den richtigen Systemen mehr erreichen - mit weniger Aufwand.
              </p>
            </ScrollReveal>

            <ScrollReveal variant="fadeUp" delay={400}>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="gap-2"
                  onClick={() => {
                    const testSection = document.getElementById("effizienz-test")
                    testSection?.scrollIntoView({ behavior: "smooth" })
                  }}
                >
                  Zum Effizienz-Test
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/features">Alle Funktionen entdecken</Link>
                </Button>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Quote Section */}
        <section className="py-16 bg-muted/30">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal variant="fadeUp">
              <blockquote className="relative">
                <svg
                  className="absolute -top-4 -left-4 h-16 w-16 text-primary/10"
                  fill="currentColor"
                  viewBox="0 0 32 32"
                >
                  <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
                </svg>
                <p className="text-2xl md:text-3xl font-medium text-center italic text-foreground relative z-10">
                  „Exzellente Praxen entstehen nicht durch mehr Einsatz,
                  <br />
                  <span className="text-primary">sondern durch bessere Systeme.</span>"
                </p>
              </blockquote>
            </ScrollReveal>
          </div>
        </section>

        {/* New "Warum Effizienz unverzichtbar ist" Section */}
        <section className="py-20 md:py-28 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/[0.02] to-background" />
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />

          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <ScrollReveal variant="fadeUp">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                  <Heart className="h-4 w-4" />
                  Für eine menschlichere Medizin
                </div>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-balance">
                  Warum Effizienz in der Arztpraxis{" "}
                  <span className="bg-gradient-to-r from-primary via-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    unverzichtbar
                  </span>{" "}
                  ist
                </h2>
              </div>
            </ScrollReveal>

            <div className="relative">
              <ScrollReveal variant="fadeUp" delay={100}>
                <div className="bg-background/80 backdrop-blur-sm border rounded-3xl p-8 md:p-12 shadow-xl">
                  <div className="text-center mb-10">
                    <p className="text-xl md:text-2xl text-foreground font-medium leading-relaxed">
                      Eine Arztpraxis ist kein Fließband – sie ist ein{" "}
                      <span className="text-primary font-semibold">Ort für Menschen</span>.
                    </p>
                  </div>

                  <ScrollReveal variant="fadeUp" delay={200}>
                    <div className="bg-muted/50 rounded-2xl p-6 md:p-8 mb-8 border-l-4 border-amber-500">
                      <p className="text-lg text-muted-foreground leading-relaxed">
                        Doch ohne klare Abläufe raubt der Alltag genau das, was Medizin braucht:{" "}
                        <span className="text-foreground font-medium">Zeit, Ruhe und Aufmerksamkeit</span>.
                      </p>
                    </div>
                  </ScrollReveal>

                  <ScrollReveal variant="fadeUp" delay={300}>
                    <div className="mb-10">
                      <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-6 flex items-center gap-3">
                        <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Sparkles className="h-5 w-5 text-primary" />
                        </span>
                        Effizienz schafft Raum für das Wesentliche:
                      </h3>

                      <div className="grid md:grid-cols-3 gap-4 mb-8">
                        <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center flex-shrink-0">
                            <MessageSquare className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <span className="font-medium text-emerald-700 dark:text-emerald-300">Echte Gespräche</span>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800">
                          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                            <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <span className="font-medium text-blue-700 dark:text-blue-300">Sichere Entscheidungen</span>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-violet-50 dark:bg-violet-950/30 rounded-xl border border-violet-200 dark:border-violet-800">
                          <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900 flex items-center justify-center flex-shrink-0">
                            <Users className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                          </div>
                          <span className="font-medium text-violet-700 dark:text-violet-300">
                            Ein Team, das gerne arbeitet
                          </span>
                        </div>
                      </div>

                      <p className="text-lg text-muted-foreground leading-relaxed">
                        Sie nimmt Druck aus dem System, schützt vor Überlastung und macht{" "}
                        <span className="text-foreground font-medium">Qualität wieder möglich</span>.
                      </p>
                    </div>
                  </ScrollReveal>

                  <ScrollReveal variant="fadeUp" delay={400}>
                    <div className="relative bg-gradient-to-r from-primary/10 via-blue-500/10 to-cyan-500/10 rounded-2xl p-8 mb-10 overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
                      <p className="text-xl md:text-2xl font-medium text-center text-foreground relative z-10 leading-relaxed">
                        Effizienz bedeutet nicht schneller zu arbeiten –
                        <br />
                        <span className="text-primary">sondern mit mehr Klarheit, weniger Stress</span>
                        <br />
                        und <span className="text-primary">mehr Menschlichkeit</span>.
                      </p>
                    </div>
                  </ScrollReveal>

                  <ScrollReveal variant="fadeUp" delay={500}>
                    <div className="text-center">
                      <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-6">
                        Denn gute Medizin beginnt dort,{" "}
                        <span className="text-foreground font-semibold">wo Organisation nicht im Weg steht</span>.
                      </p>

                      <div className="flex justify-center">
                        <Button
                          size="lg"
                          className="gap-2"
                          onClick={() => {
                            const testSection = document.getElementById("effizienz-test")
                            testSection?.scrollIntoView({ behavior: "smooth" })
                          }}
                        >
                          Jetzt Effizienz-Test starten
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </ScrollReveal>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal variant="fadeUp">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Was Effizienz für Ihre Praxis bedeutet</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Effizienz ist mehr als Zeitersparnis - sie transformiert jeden Aspekt Ihrer Praxis
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {efficiencyBenefits.map((benefit, index) => (
                <ScrollReveal key={benefit.title} variant="fadeUp" delay={100 + index * 100}>
                  <Card
                    className={cn(
                      "h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
                      benefit.bg,
                      benefit.border,
                    )}
                  >
                    <CardHeader>
                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-2", benefit.iconBg)}>
                        <benefit.icon className={cn("h-6 w-6", benefit.color)} />
                      </div>
                      <CardTitle className="text-xl">{benefit.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{benefit.description}</p>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Pillars Section */}
        <section className="py-20 bg-muted/30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal variant="fadeUp">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Die vier Säulen der Praxiseffizienz</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Diese Grundpfeiler bestimmen, wie effizient Ihre Praxis wirklich arbeitet
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {efficiencyPillars.map((pillar, index) => (
                <ScrollReveal key={pillar.title} variant="fadeUp" delay={100 + index * 100}>
                  <div className="text-center p-6 bg-background rounded-2xl border shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <pillar.icon className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{pillar.title}</h3>
                    <p className="text-muted-foreground text-sm">{pillar.description}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Quiz Section */}
        <section id="effizienz-test" className="py-20 scroll-mt-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal variant="fadeUp">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                  <CheckCircle2 className="h-4 w-4" />
                  Interaktiver Selbst-Test
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Wie effizient ist Ihre Praxis?</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Machen Sie unseren kostenlosen Test und entdecken Sie Ihr Optimierungspotenzial in nur 2 Minuten.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal variant="fadeUp" delay={200}>
              <Card className="shadow-xl border-2">
                <CardContent className="p-8">
                  {!quizStarted && !showResults && (
                    <div className="text-center py-8">
                      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                        <Brain className="h-10 w-10 text-primary" />
                      </div>
                      <h3 className="text-2xl font-bold mb-4">Effizienz-Check</h3>
                      <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                        8 Fragen zu Ihrer Praxisorganisation. Erhalten Sie eine individuelle Einschätzung und konkrete
                        Tipps zur Verbesserung.
                      </p>
                      <Button size="lg" onClick={() => setQuizStarted(true)} className="gap-2">
                        Test starten
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {quizStarted && !showResults && (
                    <div>
                      <div className="mb-8">
                        <div className="flex justify-between text-sm text-muted-foreground mb-2">
                          <span>
                            Frage {currentQuestion + 1} von {quizQuestions.length}
                          </span>
                          <span>{Math.round(((currentQuestion + 1) / quizQuestions.length) * 100)}%</span>
                        </div>
                        <Progress value={((currentQuestion + 1) / quizQuestions.length) * 100} className="h-2" />
                      </div>

                      <h3 className="text-xl font-semibold mb-6">{quizQuestions[currentQuestion].question}</h3>

                      <div className="space-y-3">
                        {quizQuestions[currentQuestion].options.map((option, index) => (
                          <button
                            key={index}
                            onClick={() => handleAnswer(option.score)}
                            className="w-full text-left p-4 rounded-xl border-2 hover:border-primary hover:bg-primary/5 transition-all duration-200 group"
                          >
                            <span className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-full border-2 border-muted-foreground/30 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center text-sm font-medium transition-all duration-200">
                                {String.fromCharCode(65 + index)}
                              </span>
                              <span className="flex-1">{option.text}</span>
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {showResults && (
                    <div className="text-center py-4">
                      <div
                        className={cn(
                          "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6",
                          result.bg,
                        )}
                      >
                        <ResultIcon className={cn("h-10 w-10", result.color)} />
                      </div>

                      <h3 className={cn("text-2xl font-bold mb-2", result.color)}>{result.title}</h3>

                      <div className="mb-6">
                        <div className="text-5xl font-bold text-foreground mb-1">
                          {Math.round((totalScore / (quizQuestions.length * 4)) * 100)}%
                        </div>
                        <p className="text-muted-foreground">Effizienz-Score</p>
                      </div>

                      <p className="text-muted-foreground mb-8 max-w-md mx-auto">{result.description}</p>

                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button asChild size="lg" variant="secondary">
                          <Link href="/coming-soon">Effizienz Praxis testen</Link>
                        </Button>
                        <Button size="lg" variant="outline" onClick={resetQuiz} className="gap-2 bg-transparent">
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

        {/* CTA Section */}
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <ScrollReveal variant="fadeUp">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Bereit für mehr Effizienz?</h2>
              <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
                Entdecken Sie, wie Effizienz Praxis Ihre Praxis transformieren kann. Starten Sie noch heute mit besseren
                Systemen.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" variant="secondary">
                  <Link href="/coming-soon">Kostenlos testen</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
                >
                  <Link href="/contact">Beratung vereinbaren</Link>
                </Button>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>

      <LandingPageFooter />
    </div>
  )
}

export default EffizienzPageClient
