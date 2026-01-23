"use client"

import React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  ArrowRight,
  Briefcase,
  Calendar,
  Star,
  Search,
  Workflow,
  Brain,
  Users,
  TrendingUp,
  CheckSquare,
  Target,
  BookOpen,
  Mic,
  Map,
  Lightbulb,
  Package,
  Phone,
  ClipboardList,
  BarChart3,
  FolderOpen,
  DoorOpen,
  GraduationCap,
  Pin,
  Layers,
  Settings,
  Network,
  MonitorCheck,
  ShieldCheck,
  Award,
  Heart,
  UserPlus,
  RefreshCcw,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Logo } from "@/components/logo"
import { LandingPageFooter } from "@/components/landing-page-footer"
import { LandingPageChatbot } from "@/components/landing-page-chatbot"
import { LandingAIQuestionBox } from "@/components/landing-ai-question-box"
import { useState, useEffect } from "react"
import { ScrollReveal, StaggeredReveal } from "@/components/scroll-reveal"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

// Animated text component with gradient shimmer
function AnimatedGradientText({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span 
      className={cn(
        "relative inline-block bg-gradient-to-r from-primary via-blue-500 to-cyan-500 bg-clip-text text-transparent",
        "animate-gradient-x bg-[length:200%_auto]",
        className
      )}
      style={{
        animation: "gradient-shift 3s ease infinite",
      }}
    >
      {children}
      <style jsx>{`
        @keyframes gradient-shift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
      `}</style>
    </span>
  )
}

// Typewriter effect for hero text
function TypewriterText({ text, className }: { text: string; className?: string }) {
  const [displayedText, setDisplayedText] = useState("")
  const [isComplete, setIsComplete] = useState(false)
  
  useEffect(() => {
    let index = 0
    const timer = setInterval(() => {
      if (index <= text.length) {
        setDisplayedText(text.slice(0, index))
        index++
      } else {
        clearInterval(timer)
        setIsComplete(true)
      }
    }, 50)
    
    return () => clearInterval(timer)
  }, [text])
  
  return (
    <span className={cn("relative", className)}>
      <span 
        className={cn(
          "bg-gradient-to-r from-primary via-blue-500 to-cyan-500 bg-clip-text text-transparent",
          isComplete && "animate-pulse-subtle"
        )}
        style={isComplete ? {
          animation: "gradient-shift 3s ease infinite",
          backgroundSize: "200% auto",
        } : undefined}
      >
        {displayedText}
      </span>
      {!isComplete && (
        <span className="inline-block w-[3px] h-[1em] bg-primary animate-blink ml-1 align-middle" />
      )}
      <style jsx>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        .animate-blink {
          animation: blink 0.8s step-end infinite;
        }
      `}</style>
    </span>
  )
}

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

const features = [
  // Übersicht & Analyse
  {
    icon: Brain,
    title: "KI-Praxisanalyse",
    description: "Intelligente Stärken-Schwächen-Analyse mit Optimierungsvorschlägen",
    color: "bg-blue-500/10 text-blue-600",
    image: "/ai-brain-analysis-medical-dashboard-blue-modern.jpg",
    category: "analyse",
    link: "/features/ai-praxisanalyse",
  },
  {
    icon: TrendingUp,
    title: "Praxis-Auswertung",
    description: "Analytics mit KV-Abrechnung und KPI-Dashboards",
    color: "bg-emerald-500/10 text-emerald-600",
    image: "/analytics-charts-dashboard-green-medical-practice.jpg",
    category: "analyse",
    link: "/features/praxis-auswertung",
  },
  {
    icon: BarChart3,
    title: "Praxis-Journal",
    description: "Tägliche Dokumentation und Auswertungen",
    color: "bg-teal-500/10 text-teal-600",
    image: "/medical-journal-documentation-teal-modern-dashboar.jpg",
    category: "analyse",
    link: "/features/praxis-journal",
  },
  // Team & Personal
  {
    icon: Users,
    title: "Team-Management",
    description: "Mitarbeiter, Urlaub, Krankmeldungen & Organigramm",
    color: "bg-cyan-500/10 text-cyan-600",
    image: "/team-management-organization-chart-people-cyan.jpg",
    category: "team",
    link: "/features/team-management",
  },
  {
    icon: Layers,
    title: "Skills-Management",
    description: "Kompetenzen erfassen, bewerten und Entwicklungsziele setzen",
    color: "bg-violet-500/10 text-violet-600",
    image: "/skills-competency-matrix-violet-modern-dashboard.jpg",
    category: "team",
    link: "/features/skills-management",
  },
  {
    icon: GraduationCap,
    title: "Fortbildung",
    description: "Zertifikate, Schulungen, Budget und Kalender verwalten",
    color: "bg-rose-500/10 text-rose-600",
    image: "/training-education-certificate-rose-modern-dashboa.jpg",
    category: "team",
    link: "/features/fortbildung",
  },
  {
    icon: Briefcase,
    title: "Recruiting-System",
    description: "Hiring-Pipeline mit Bewerbermanagement und KI",
    color: "bg-orange-500/10 text-orange-600",
    image: "/recruiting-hiring-job-candidates-orange-profession.jpg",
    category: "team",
    link: "/features/recruiting",
  },
  {
    icon: Network,
    title: "Organigramm",
    description: "Visuelle Darstellung der Praxisstruktur",
    color: "bg-sky-500/10 text-sky-600",
    image: "/organization-structure-chart-sky-blue-modern.jpg",
    category: "team",
    link: "/features/organigramm",
  },
  // Planung & Organisation
  {
    icon: Calendar,
    title: "Kalender",
    description: "Termine, Urlaub und Abwesenheiten planen",
    color: "bg-blue-500/10 text-blue-600",
    image: "/calendar-scheduling-planning-blue-modern-dashboard.jpg",
    category: "planung",
    link: "/features/kalender",
  },
  {
    icon: CheckSquare,
    title: "Aufgaben",
    description: "To-Do Listen mit Prioritäten und Fristen",
    color: "bg-green-500/10 text-green-600",
    image: "/tasks-todo-checklist-green-modern-dashboard.jpg",
    category: "planung",
    link: "/features/aufgaben",
  },
  {
    icon: Target,
    title: "Ziele",
    description: "OKRs und Zielverfolgung für die Praxis",
    color: "bg-amber-500/10 text-amber-600",
    image: "/goals-dashboard-with-progress-bars-and-okr-trackin.jpg",
    category: "planung",
    link: "/features/ziele",
  },
  {
    icon: Workflow,
    title: "Workflows",
    description: "Automatisierte Abläufe mit Vorlagen und Aufgaben",
    color: "bg-purple-500/10 text-purple-600",
    image: "/workflow-automation-checklist-tasks-purple-modern.jpg",
    category: "planung",
    link: "/features/workflows-checklisten",
  },
  {
    icon: ClipboardList,
    title: "Zuständigkeiten",
    description: "Verantwortlichkeiten klar definieren und verteilen",
    color: "bg-indigo-500/10 text-indigo-600",
    image: "/responsibilities-assignments-indigo-modern-dashboa.jpg",
    category: "planung",
    link: "/features/zustaendigkeiten",
  },
  // Wissen & Dokumente
  {
    icon: BookOpen,
    title: "Wissen & QM",
    description: "Wissensdatenbank für QM und SOPs mit KI-Suche",
    color: "bg-pink-500/10 text-pink-600",
    image: "/knowledge-management-documents-library-pink-modern.jpg",
    category: "wissen",
    link: "/features/wissen-qm",
  },
  {
    icon: FolderOpen,
    title: "Dokumente",
    description: "Dokumentenmanagement mit Versionierung",
    color: "bg-slate-500/10 text-slate-600",
    image: "/documents-files-folder-slate-modern-dashboard.jpg",
    category: "wissen",
    link: "/features/dokumente",
  },
  {
    icon: Mic,
    title: "Gesprächsprotokoll",
    description: "Meetings dokumentieren mit KI-Zusammenfassung",
    color: "bg-red-500/10 text-red-600",
    image: "/meeting-protocol-recording-red-modern-dashboard.jpg",
    category: "wissen",
    link: "/features/gesprächsprotokoll",
  },
  {
    icon: Phone,
    title: "Kontakte",
    description: "Lieferanten, Partner und wichtige Kontakte",
    color: "bg-gray-500/10 text-gray-600",
    image: "/contacts-address-book-gray-modern-dashboard.jpg",
    category: "wissen",
    link: "/features/kontakte",
  },
  // Strategie
  {
    icon: Map,
    title: "Strategiepfad",
    description: "Praxisentwicklung strategisch planen",
    color: "bg-emerald-500/10 text-emerald-600",
    image: "/strategy-roadmap-planning-emerald-green-modern-das.jpg",
    category: "strategie",
    link: "/features/strategiepfad",
  },
  {
    icon: Heart,
    title: "Leitbild",
    description: "Vision, Mission und Werte definieren",
    color: "bg-rose-500/10 text-rose-600",
    image: "/mission-vision-values-rose-pink-modern-dashboard.jpg",
    category: "strategie",
    link: "/features/leitbild",
  },
  {
    icon: Lightbulb,
    title: "IGeL & ROI-Analyse",
    description: "Wirtschaftlichkeitsanalysen mit Szenarien",
    color: "bg-amber-500/10 text-amber-600",
    image: "/roi-analysis-financial-charts-amber-business.jpg",
    category: "strategie",
    link: "/features/igel-roi-analyse",
  },
  {
    icon: Search,
    title: "Konkurrenzanalyse",
    description: "SWOT-Analyse und strategische Positionierung",
    color: "bg-indigo-500/10 text-indigo-600",
    image: "/competitor-analysis-swot-strategy-indigo-business.jpg",
    category: "strategie",
    link: "/features/konkurrenzanalyse",
  },
  {
    icon: UserPlus,
    title: "Wunschpatient",
    description: "Ideale Patientenprofile definieren und erreichen",
    color: "bg-cyan-500/10 text-cyan-600",
    image: "/ideal-patient-profile-cyan-modern-dashboard.jpg",
    category: "strategie",
    link: "/features/wunschpatient",
  },
  // Marketing & Bewertungen
  {
    icon: Star,
    title: "Bewertungsmanagement",
    description: "Google, Jameda & andere Bewertungen verwalten",
    color: "bg-yellow-500/10 text-yellow-600",
    image: "/reviews-ratings-stars-yellow-modern-dashboard.jpg",
    category: "marketing",
    link: "/features/bewertungsmanagement",
  },
  // Praxis & Infrastruktur
  {
    icon: DoorOpen,
    title: "Räume",
    description: "Raumplanung und -verwaltung",
    color: "bg-stone-500/10 text-stone-600",
    image: "/rooms-office-space-stone-modern-dashboard.jpg",
    category: "praxis",
    link: "/features/räume",
  },
  {
    icon: Package,
    title: "Arbeitsmittel",
    description: "Inventar und Ausstattung verwalten",
    color: "bg-orange-500/10 text-orange-600",
    image: "/placeholder.svg?height=200&width=400",
    category: "praxis",
    link: "/features/arbeitsmittel",
  },
  {
    icon: MonitorCheck,
    title: "Arbeitsplätze",
    description: "Arbeitsplätze und Stationen konfigurieren",
    color: "bg-blue-500/10 text-blue-600",
    image: "/placeholder.svg?height=200&width=400",
    category: "praxis",
    link: "/features/arbeitsplätze",
  },
  // System & Sicherheit
  {
    icon: Pin,
    title: "Favoriten",
    description: "Meistgenutzte Funktionen schnell erreichen",
    color: "bg-amber-500/10 text-amber-600",
    image: "/placeholder.svg?height=200&width=400",
    category: "system",
    link: "/features/favoriten",
  },
  {
    icon: Settings,
    title: "Einstellungen",
    description: "Praxis- und Benutzereinstellungen anpassen",
    color: "bg-gray-500/10 text-gray-600",
    image: "/placeholder.svg?height=200&width=400",
    category: "system",
    link: "/features/einstellungen",
  },
]

export default function LandingPageClient() {
  // Initialize quiz state
  const [quizStarted, setQuizStarted] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [quizCompleted, setQuizCompleted] = useState(false)

  const currentQuestion = quizQuestions[currentQuestionIndex]
  const totalQuestions = quizQuestions.length
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100

  const handleAnswerSelect = (selectedScore: number) => {
    setScore(score + selectedScore)
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      setQuizCompleted(true)
    }
  }

  // Quiz logic for the "Effizienz-Check" section
  const [quizStartedCheck, setQuizStartedCheck] = useState(false)
  const [currentQuestionCheck, setCurrentQuestionCheck] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [showResults, setShowResults] = useState(false)

  const handleAnswerCheck = (selectedScore: number) => {
    const newAnswers = [...answers, selectedScore]
    setAnswers(newAnswers)

    if (currentQuestionCheck < quizQuestions.length - 1) {
      setCurrentQuestionCheck(currentQuestionCheck + 1)
    } else {
      setShowResults(true)
    }
  }

  const resetQuizCheck = () => {
    setQuizStartedCheck(false)
    setCurrentQuestionCheck(0)
    setAnswers([])
    setShowResults(false)
  }

  const totalScore = answers.reduce((sum, score) => sum + score, 0)
  const result = getResultCategory(totalScore)
  const ResultIcon = result.icon

  const progressCheck = ((currentQuestionCheck + 1) / quizQuestions.length) * 100

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between mx-auto px-4">
          <div className="flex items-center gap-2">
            <Logo width={32} height={32} />
            <span className="text-xl font-bold">Effizienz Praxis</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a
              href="#features"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Features
            </a>
            <a
              href="#benefits"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Vorteile
            </a>
            <Link
              href="/preise"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Preise
            </Link>
            <Link
              href="/effizienz"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Effizienz
            </Link>
            <Link
              href="/academy"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Academy
            </Link>
            <Link href="/auth/login">
              <Button>
                Zum Login
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="w-full py-12 md:py-20 bg-gradient-to-b from-background to-muted/20 flex-grow">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6">
            <ScrollReveal variant="fadeDown" delay={100}>
              <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary">
                Für medizinische Praxen, MVZ und Gesundheitszentren
              </div>
            </ScrollReveal>
            <ScrollReveal variant="fadeUp" delay={200}>
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl text-balance leading-tight">
                Die Plattform für
                <br />
                <TypewriterText 
                  text="effizientes Praxismanagement" 
                  className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl"
                />
              </h1>
            </ScrollReveal>
            <ScrollReveal variant="fadeUp" delay={300}>
              <p className="text-lg text-muted-foreground text-pretty mx-auto">
                Revolutionieren Sie Ihre Praxisverwaltung mit{" "}
                <span className="relative inline-block">
                  <span className="relative z-10 font-semibold bg-gradient-to-r from-primary via-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    künstlicher Intelligenz
                  </span>
                  <span className="absolute inset-x-0 bottom-0 h-3 bg-gradient-to-r from-primary/20 via-blue-600/20 to-cyan-600/20 -z-0 rounded" />
                </span>
                . Komplette Lösung für Team-Management, Workflows, Recruiting, Wissen, Analytics und mehr. Alles in
                einer intelligenten, DSGVO-konformen Plattform.
              </p>
            </ScrollReveal>
            <ScrollReveal variant="fadeUp" delay={400}>
              <div className="flex flex-col sm:flex-row gap-4 pt-2 justify-center">
                <Link href="/coming-soon">
                  <Button size="lg" className="w-full sm:w-auto">
                    Jetzt vorregistrieren
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </ScrollReveal>

            {/* Hero Image/Demo Section */}
            <ScrollReveal variant="scaleUp" delay={500} duration={900}>
              <div className="relative mt-12 mx-auto">
                <div className="relative aspect-video w-full overflow-hidden rounded-xl border bg-muted shadow-2xl">
                  <Image
                    src="/modern-medical-practice-dashboard-with-analytics-a.jpg"
                    alt="Effizienz Praxis Dashboard mit KI-Analyse und Analytics"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Efficiency Value Proposition Section */}
      <section className="w-full py-16 md:py-24 bg-gradient-to-br from-primary/5 via-background to-cyan-500/5 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        </div>

        {/* Removed max-w-6xl to make section full width */}
        <div className="mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center space-y-8">
            <ScrollReveal variant="fadeUp" delay={100}>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-2 text-sm font-medium text-primary">
                <ArrowRight className="h-4 w-4" />
                Warum Effizienz entscheidend ist
              </div>
            </ScrollReveal>

            <ScrollReveal variant="fadeUp" delay={200}>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                <span className="text-foreground">Effiziente Praxis</span>
                <span className="mx-3 text-muted-foreground">=</span>
                <span className="bg-gradient-to-r from-primary via-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  wirtschaftlich starke Praxis
                </span>
              </h2>
            </ScrollReveal>

            <ScrollReveal variant="fadeUp" delay={300}>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Effizienz bedeutet nicht nur Zeit sparen – es transformiert Ihre gesamte Praxis
              </p>
            </ScrollReveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-8">
              {[
                {
                  icon: Heart,
                  label: "Weniger Stress",
                  color: "text-rose-500 dark:text-rose-400",
                  bg: "bg-rose-50 dark:bg-rose-500/10",
                  iconBg: "bg-rose-100 dark:bg-rose-500/20",
                  border: "border-rose-200 dark:border-rose-500/30",
                },
                {
                  icon: ShieldCheck,
                  label: "Weniger Fehler",
                  color: "text-emerald-500 dark:text-emerald-400",
                  bg: "bg-emerald-50 dark:bg-emerald-500/10",
                  iconBg: "bg-emerald-100 dark:bg-emerald-500/20",
                  border: "border-emerald-200 dark:border-emerald-500/30",
                },
                {
                  icon: Award,
                  label: "Höhere Qualität",
                  color: "text-amber-500 dark:text-amber-400",
                  bg: "bg-amber-50 dark:bg-amber-500/10",
                  iconBg: "bg-amber-100 dark:bg-amber-500/20",
                  border: "border-amber-200 dark:border-amber-500/30",
                },
                {
                  icon: Users,
                  label: "Zufriedenere Mitarbeitende",
                  color: "text-violet-500 dark:text-violet-400",
                  bg: "bg-violet-50 dark:bg-violet-500/10",
                  iconBg: "bg-violet-100 dark:bg-violet-500/20",
                  border: "border-violet-200 dark:border-violet-500/30",
                },
                {
                  icon: TrendingUp,
                  label: "Höhere Gewinne",
                  color: "text-sky-500 dark:text-sky-400",
                  bg: "bg-sky-50 dark:bg-sky-500/10",
                  iconBg: "bg-sky-100 dark:bg-sky-500/20",
                  border: "border-sky-200 dark:border-sky-500/30",
                },
              ].map((item, index) => (
                <ScrollReveal key={index} variant="fadeUp" delay={400 + index * 100}>
                  <div
                    className={`group relative p-6 rounded-2xl ${item.bg} border ${item.border} backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-lg h-full min-h-[160px] flex flex-col items-center justify-center`}
                  >
                    <div
                      className={`mb-4 w-14 h-14 rounded-xl ${item.iconBg} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}
                    >
                      <item.icon className={`h-7 w-7 ${item.color}`} />
                    </div>
                    <p className="font-semibold text-foreground text-center">{item.label}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>

            <ScrollReveal variant="fadeUp" delay={900}>
              <div className="text-center mt-8">
                <Link
                  href="/effizienz"
                  className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors group"
                >
                  <span>Mehr über Effizienz erfahren</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="w-full py-16 md:py-24 bg-background">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center space-y-4 mb-12">
            <ScrollReveal variant="fadeDown" delay={100}>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Alle Funktionen für Ihre Praxis
              </h2>
            </ScrollReveal>
            <ScrollReveal variant="fadeUp" delay={200}>
              <p className="text-xl text-muted-foreground mx-auto">
                Eine Komplettlösung, die alle Bereiche Ihrer Praxis abdeckt
              </p>
            </ScrollReveal>
          </div>
          <StaggeredReveal
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
            variant="scaleUp"
            staggerDelay={50}
            duration={500}
          >
            {features.map((feature, index) => (
              <Link href={feature.link} key={index}>
                <Card
                  className="group cursor-pointer border-border/50 bg-card/50 backdrop-blur-sm
                    hover:shadow-lg hover:shadow-primary/5 hover:border-primary/40 hover:-translate-y-1
                    transition-all duration-300 ease-out"
                >
                  <CardContent className="p-5 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div
                        className={`flex items-center justify-center w-16 h-16 rounded-xl
                        ${feature.color.split(" ")[0]}
                        group-hover:scale-110 group-hover:rotate-3
                        transition-all duration-300 ease-out`}
                      >
                        <feature.icon
                          className={`h-9 w-9 ${feature.color.split(" ")[1]} group-hover:scale-110 transition-transform duration-300`}
                        />
                      </div>
                      <h3 className="font-semibold text-base group-hover:text-primary transition-colors duration-300">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{feature.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </StaggeredReveal>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="w-full py-16 md:py-24 bg-muted/30">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <ScrollReveal variant="fadeRight" className="mx-auto">
              <Image
                src="/medical-practice-team-collaboration-meeting.jpg"
                alt="Medizinisches Praxisteam bei der erfolgreichen Zusammenarbeit"
                width={500}
                height={400}
                className="rounded-xl border shadow-lg"
              />
            </ScrollReveal>
            <div className="space-y-6">
              <ScrollReveal variant="fadeLeft" delay={100}>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Optimieren Sie Ihre Praxisführung nachhaltig
                </h2>
              </ScrollReveal>
              <ScrollReveal variant="fadeLeft" delay={200}>
                <p className="text-lg text-muted-foreground">
                  Mit Effizienz Praxis steigern Sie die Produktivität Ihres Teams, verbessern die Patientenversorgung
                  und treffen bessere Entscheidungen durch datenbasierte Insights.
                </p>
              </ScrollReveal>
              <ul className="space-y-4">
                {[
                  "KI-gestützte Analysen und priorisierte Optimierungsvorschläge",
                  "Zentrale Verwaltung von Team, Workflows und Dokumenten",
                  "Datenbasierte Entscheidungen durch Echtzeit-Analytics und KPIs",
                  "Nahtlose Zusammenarbeit mit granularen Rollen und Berechtigungen",
                  "Komplettes Recruiting-System reduziert Time-to-Hire",
                  "DSGVO-konforme Datenhaltung mit höchsten Sicherheitsstandards",
                  "Intuitiv bedienbar ohne aufwändige Schulungen",
                ].map((benefit, index) => (
                  <ScrollReveal key={index} variant="fadeLeft" delay={300 + index * 80}>
                    <li className="flex items-start gap-3">
                      <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 shrink-0">
                        <Star className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-lg">{benefit}</span>
                    </li>
                  </ScrollReveal>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Effizienz-Check Section */}
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
                {!quizStartedCheck && !showResults && (
                  <div className="text-center py-8">
                    <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                      <Brain className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-white">Effizienz-Check</h3>
                    <p className="text-slate-400 mb-8 mx-auto leading-relaxed">
                      Beantworten Sie 8 kurze Fragen und erhalten Sie eine individuelle Einschätzung des
                      Effizienz-Potenzials Ihrer Praxis.
                    </p>
                    <Button size="lg" onClick={() => setQuizStartedCheck(true)} className="gap-2">
                      Test starten
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Quiz Questions State */}
                {quizStartedCheck && !showResults && (
                  <div className="text-white">
                    <div className="mb-8">
                      <div className="flex justify-between text-sm text-slate-400 mb-2">
                        <span>
                          Frage {currentQuestionCheck + 1} von {quizQuestions.length}
                        </span>
                        <span>{Math.round(((currentQuestionCheck + 1) / quizQuestions.length) * 100)}%</span>
                      </div>
                      <Progress value={progressCheck} className="h-2" />
                    </div>

                    <h3 className="text-xl font-semibold mb-6">{quizQuestions[currentQuestionCheck].question}</h3>

                    <div className="space-y-3">
                      {quizQuestions[currentQuestionCheck].options.map((option, index) => (
                        <button
                          key={index}
                          onClick={() => handleAnswerCheck(option.score)}
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
                        onClick={resetQuizCheck}
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

      {/* Social Proof Section */}

      {/* Testimonials */}
      {/* <section className="w-full py-16 md:py-24 bg-background">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16 max-w-2xl mx-auto">
            <ScrollReveal variant="fadeUp" delay={100}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Award className="h-4 w-4" />
                Was Praxen sagen
              </div>
            </ScrollReveal>
            <ScrollReveal variant="fadeUp" delay={200}>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Erfolgsgeschichten von unseren Nutzern
              </h2>
            </ScrollReveal>
            <ScrollReveal variant="fadeUp" delay={300}>
              <p className="text-xl text-muted-foreground">
                Sehen Sie, wie andere Praxen von Effizienz Praxis profitiert haben.
              </p>
            </ScrollReveal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: "Dr. med. Anna Müller",
                role: "Praxisinhaberin, Allgemeinmedizin",
                text: "Seit wir Effizienz Praxis nutzen, hat sich die Organisation unserer Praxis spürbar verbessert. Die KI-Analyse deckt Engpässe auf, die wir vorher nicht gesehen haben. Klare Empfehlung!",
                imageUrl: "/images/testimonials/anna-mueller.jpg",
              },
              {
                name: "Dr. med. Max Mustermann",
                role: "MVZ Leiter, Kardiologie",
                text: "Die zentrale Plattform für unser gesamtes Teammanagement und die Workflow-Optimierung ist Gold wert. Endlich haben wir den Überblick und können uns auf das Wesentliche konzentrieren: die Patienten.",
                imageUrl: "/images/testimonials/max-mustermann.jpg",
              },
              {
                name: "Susanne Schmidt",
                role: "Praxismanagerin, Orthopädie",
                text: "Besonders beeindruckt bin ich vom Recruiting-System. Wir haben schneller passende Mitarbeiter gefunden und die Einarbeitung ist dank der klaren Strukturen viel reibungsloser verlaufen.",
                imageUrl: "/images/testimonials/susanne-schmidt.jpg",
              },
            ].map((testimonial, index) => (
              <ScrollReveal key={index} variant="fadeUp" delay={100 + index * 100}>
                <Card className="h-full bg-card/50 backdrop-blur-sm border-border/50">
                  <CardContent className="p-6 flex flex-col justify-between h-full">
                    <blockquote className="relative mb-6">
                      <svg
                        className="absolute -top-3 -left-3 w-8 h-8 text-primary/20"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                      </svg>
                      <p className="text-lg md:text-xl lg:text-2xl font-medium text-foreground leading-relaxed mx-auto">
                        {testimonial.text}
                      </p>
                    </blockquote>
                    <div className="flex items-center mt-auto">
                      <Image
                        src={testimonial.imageUrl || "/placeholder.svg"}
                        alt={testimonial.name}
                        width={56}
                        height={56}
                        className="rounded-full mr-4 border-2 border-primary/20"
                      />
                      <div>
                        <p className="font-semibold text-foreground">{testimonial.name}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section> */}

      {/* Use Cases Section */}
      <section className="w-full py-16 md:py-24 bg-gradient-to-b from-muted/30 to-background">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16 max-w-2xl mx-auto">
            <ScrollReveal variant="fadeUp" delay={100}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Target className="h-4 w-4" />
                Anwendungsfälle
              </div>
            </ScrollReveal>
            <ScrollReveal variant="fadeUp" delay={200}>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Ideal für jede Praxisgröße und Fachrichtung
              </h2>
            </ScrollReveal>
            <ScrollReveal variant="fadeUp" delay={300}>
              <p className="text-xl text-muted-foreground">
                Entdecken Sie, wie Effizienz Praxis Ihre spezifischen Herausforderungen lösen kann.
              </p>
            </ScrollReveal>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: "Praxismanagement", description: "Effiziente Verwaltung aller Praxisabläufe.", icon: Settings },
              {
                title: "Teamkoordination",
                description: "Optimale Organisation und Kommunikation im Team.",
                icon: Users,
              },
              {
                title: "Patientenmanagement",
                description: "Fokus auf Patienten durch weniger Administration.",
                icon: Heart,
              },
              {
                title: "Qualitätsmanagement",
                description: "SOPs, QM-Dokumente und Weiterbildung im Griff.",
                icon: BookOpen,
              },
              {
                title: "Finanz- & Leistungscontrolling",
                description: "KPIs und Analysen für wirtschaftlichen Erfolg.",
                icon: TrendingUp,
              },
              {
                title: "Recruiting & Personal",
                description: "Schneller und gezielter neue Mitarbeiter finden.",
                icon: Briefcase,
              },
            ].map((item, index) => (
              <ScrollReveal key={index} variant="fadeUp" delay={100 + index * 50}>
                <Card className="h-full bg-card/50 backdrop-blur-sm border-border/50">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-primary/10 mb-4">
                      <item.icon className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Moved LandingAIQuestionBox here */}
      <LandingAIQuestionBox />

      {/* Academy Coming Soon Section */}
      <section className="w-full py-16 md:py-24 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-yellow-950/30">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <ScrollReveal variant="fadeUp" delay={100}>
              <div className="text-center space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 dark:bg-amber-900/50 px-4 py-2 text-sm font-medium text-amber-800 dark:text-amber-200">
                  <GraduationCap className="h-4 w-4" />
                  Coming Soon
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Effizienz-Academy</h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Lernen Sie, wie Sie Ihre Praxis auf das nächste Level bringen. Praxisnahe Kurse, Zertifizierungen und
                  Weiterbildungen für Ihr gesamtes Team.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal variant="fadeUp" delay={200}>
              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white/80 dark:bg-card/80 backdrop-blur-sm border-amber-200/50 dark:border-amber-800/30">
                  <CardContent className="p-6 text-center">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/50 mx-auto mb-4">
                      <BookOpen className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h3 className="font-semibold mb-2">Praxis-Kurse</h3>
                    <p className="text-sm text-muted-foreground">
                      Von QM bis Teamführung - praxisnahe Inhalte für den Alltag
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-white/80 dark:bg-card/80 backdrop-blur-sm border-amber-200/50 dark:border-amber-800/30">
                  <CardContent className="p-6 text-center">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/50 mx-auto mb-4">
                      <Award className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h3 className="font-semibold mb-2">Zertifizierungen</h3>
                    <p className="text-sm text-muted-foreground">Offizielle Nachweise für Ihre Qualifikationen</p>
                  </CardContent>
                </Card>
                <Card className="bg-white/80 dark:bg-card/80 backdrop-blur-sm border-amber-200/50 dark:border-amber-800/30">
                  <CardContent className="p-6 text-center">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/50 mx-auto mb-4">
                      <Users className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h3 className="font-semibold mb-2">Team-Schulungen</h3>
                    <p className="text-sm text-muted-foreground">Gemeinsam lernen und die Praxis verbessern</p>
                  </CardContent>
                </Card>
              </div>
            </ScrollReveal>

            <ScrollReveal variant="fadeUp" delay={300}>
              <div className="mt-10 text-center">
                <Link href="/academy">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/50 bg-transparent"
                  >
                    <GraduationCap className="mr-2 h-5 w-5" />
                    Mehr erfahren
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-16 md:py-24 bg-blue-600">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal variant="scaleIn" className="text-center space-y-6 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-white">
              Bereit zu starten?
            </h2>
            <p className="text-xl text-white/90">
              Registrieren Sie sich jetzt kostenlos für die Warteliste und erhalten Sie frühzeitigen Zugang zu Effizienz
              Praxis.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/coming-soon">
                <Button
                  size="lg"
                  variant="secondary"
                  className="w-full sm:w-auto bg-white text-blue-600 hover:bg-white/90"
                >
                  Jetzt vorregistrieren
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto bg-transparent border-white/50 text-white hover:bg-white/10"
                >
                  Zum Login
                </Button>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <LandingPageFooter />

      {/* Chatbot */}
      <LandingPageChatbot />
    </div>
  )
}
