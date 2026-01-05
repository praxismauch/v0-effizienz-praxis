"use client"
import { motion, AnimatePresence } from "framer-motion"
import { useOnboarding } from "@/contexts/onboarding-context"
import { usePractice } from "@/contexts/practice-context"
import { useUser } from "@/contexts/user-context"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  Users,
  Calendar,
  ClipboardList,
  FileText,
  Brain,
  Rocket,
  Building2,
  ChevronRight,
  X,
  Star,
  Target,
  Zap,
  Shield,
  Clock,
  BarChart3,
  Settings,
  BookOpen,
  MessageSquare,
  Lightbulb,
  AlertTriangle,
} from "lucide-react"
import Link from "next/link"
import { Logo } from "@/components/logo"
import { toast } from "sonner"

const stepIcons = {
  welcome: Sparkles,
  "pain-points": AlertTriangle,
  "practice-setup": Building2,
  team: Users,
  calendar: Calendar,
  tasks: ClipboardList,
  documents: FileText,
  "ai-features": Brain,
  complete: Rocket,
}

const stepContent = {
  welcome: {
    title: "Willkommen bei Effizienz Praxis",
    subtitle: "Ihr intelligenter Partner für moderne Praxisverwaltung",
    description:
      "Entdecken Sie, wie Sie Ihre Praxis effizienter gestalten, Zeit sparen und Ihr Team optimal unterstützen können.",
    features: [
      { icon: Zap, title: "Schneller Einstieg", description: "In wenigen Minuten einsatzbereit" },
      { icon: Shield, title: "DSGVO-konform", description: "Höchste Sicherheitsstandards" },
      { icon: Brain, title: "KI-gestützt", description: "Intelligente Analysen & Empfehlungen" },
      { icon: Clock, title: "Zeitersparnis", description: "Bis zu 40% weniger Verwaltungsaufwand" },
    ],
    image: "/modern-medical-practice-dashboard-illustration.jpg",
  },
  "pain-points": {
    title: "Ihre größten Herausforderungen",
    subtitle: "Teilen Sie uns mit, was Sie am meisten beschäftigt",
    description:
      "Nennen Sie uns Ihre 3 größten Probleme oder Herausforderungen in Ihrer Praxis. Unsere KI wird basierend darauf personalisierte Lösungsvorschläge und Maßnahmen für Sie erstellen.",
    features: [
      { icon: Target, title: "Personalisiert", description: "Maßgeschneiderte Lösungen für Ihre Praxis" },
      { icon: Brain, title: "KI-Analyse", description: "Intelligente Handlungsempfehlungen" },
      { icon: Lightbulb, title: "Praxisnah", description: "Umsetzbare Maßnahmen" },
      { icon: BarChart3, title: "Messbar", description: "Fortschritte verfolgen" },
    ],
  },
  "practice-setup": {
    title: "Praxis einrichten",
    subtitle: "Passen Sie Effizienz Praxis an Ihre Bedürfnisse an",
    description: "Richten Sie Ihre Praxisinformationen ein und konfigurieren Sie die grundlegenden Einstellungen.",
    features: [
      { icon: Building2, title: "Praxisdaten", description: "Name, Adresse, Kontaktdaten" },
      { icon: Settings, title: "Einstellungen", description: "Arbeitszeiten, Feiertage, Benachrichtigungen" },
      { icon: Star, title: "Branding", description: "Logo und Farben anpassen" },
      { icon: Users, title: "Benutzer", description: "Rollen und Berechtigungen definieren" },
    ],
    link: { href: "/settings", label: "Zu den Einstellungen" },
  },
  team: {
    title: "Team verwalten",
    subtitle: "Arbeiten Sie effektiv mit Ihrem Team zusammen",
    description: "Laden Sie Teammitglieder ein, weisen Sie Rollen zu und organisieren Sie die Zusammenarbeit.",
    features: [
      { icon: Users, title: "Teammitglieder", description: "Mitarbeiter einladen und verwalten" },
      { icon: Shield, title: "Rollen", description: "Ärzte, MFA, Verwaltung, etc." },
      { icon: Target, title: "Aufgabenverteilung", description: "Automatische Zuweisung" },
      { icon: MessageSquare, title: "Kommunikation", description: "Interne Nachrichten" },
    ],
    link: { href: "/team", label: "Team verwalten" },
  },
  calendar: {
    title: "Kalender & Termine",
    subtitle: "Behalten Sie den Überblick über alle Termine",
    description: "Nutzen Sie den integrierten Kalender für Termine, Besprechungen und wichtige Ereignisse.",
    features: [
      { icon: Calendar, title: "Terminplanung", description: "Übersichtliche Kalenderansicht" },
      { icon: Clock, title: "Erinnerungen", description: "Automatische Benachrichtigungen" },
      { icon: Users, title: "Teamkalender", description: "Verfügbarkeiten im Blick" },
      { icon: Zap, title: "Schnelle Erfassung", description: "Termine in Sekunden anlegen" },
    ],
    link: { href: "/calendar", label: "Zum Kalender" },
  },
  tasks: {
    title: "Aufgaben & Workflows",
    subtitle: "Organisieren Sie Ihre tägliche Arbeit",
    description: "Erstellen Sie Aufgaben, definieren Sie Workflows und behalten Sie den Fortschritt im Blick.",
    features: [
      { icon: ClipboardList, title: "Aufgabenlisten", description: "Übersichtliche To-Do-Listen" },
      { icon: Target, title: "Prioritäten", description: "Wichtiges zuerst erledigen" },
      { icon: Zap, title: "Automatisierung", description: "Wiederkehrende Aufgaben" },
      { icon: BarChart3, title: "Fortschritt", description: "Status auf einen Blick" },
    ],
    link: { href: "/todos", label: "Zu den Aufgaben" },
  },
  documents: {
    title: "Dokumente & Protokolle",
    subtitle: "Ihre digitale Praxisdokumentation",
    description: "Verwalten Sie Protokolle, Vorlagen und wichtige Dokumente an einem zentralen Ort.",
    features: [
      { icon: FileText, title: "Dokumentation", description: "Strukturierte Ablage" },
      { icon: BookOpen, title: "Praxishandbuch", description: "SOPs und Richtlinien" },
      { icon: ClipboardList, title: "Protokolle", description: "Besprechungsprotokolle" },
      { icon: Shield, title: "Versionierung", description: "Änderungen nachvollziehen" },
    ],
    link: { href: "/knowledge-base", label: "Zur Wissensdatenbank" },
  },
  "ai-features": {
    title: "KI-Funktionen",
    subtitle: "Intelligente Unterstützung für Ihren Praxisalltag",
    description: "Nutzen Sie KI-gestützte Analysen, Empfehlungen und Automatisierungen.",
    features: [
      { icon: Brain, title: "KI-Analyse", description: "Praxisoptimierung durch KI" },
      { icon: Lightbulb, title: "Empfehlungen", description: "Konkrete Verbesserungsvorschläge" },
      { icon: BarChart3, title: "Auswertungen", description: "Detaillierte Berichte" },
      { icon: Sparkles, title: "Automatisierung", description: "KI-gestützte Workflows" },
    ],
    link: { href: "/analysis", label: "Zur KI-Analyse" },
  },
  complete: {
    title: "Sie sind bereit!",
    subtitle: "Starten Sie jetzt mit Effizienz Praxis",
    description:
      "Herzlichen Glückwunsch! Sie haben die Einführung abgeschlossen und sind bereit, alle Funktionen zu nutzen.",
    features: [
      { icon: Rocket, title: "Loslegen", description: "Zum Dashboard" },
      { icon: BookOpen, title: "Hilfe", description: "Dokumentation & FAQ" },
      { icon: MessageSquare, title: "Support", description: "Wir sind für Sie da" },
      { icon: Star, title: "Feedback", description: "Ihre Meinung zählt" },
    ],
    link: { href: "/dashboard", label: "Zum Dashboard" },
  },
}

export function OnboardingWizard() {
  const {
    isOnboardingOpen,
    setIsOnboardingOpen,
    currentStep,
    setCurrentStep,
    steps,
    completeStep,
    markOnboardingComplete,
    painPoints,
    setPainPoints,
    savePainPoints,
  } = useOnboarding()

  const { currentPractice } = usePractice()
  const { currentUser } = useUser()

  const progress = ((currentStep + 1) / steps.length) * 100
  const currentStepData = steps[currentStep]
  const currentContent = stepContent[currentStepData?.id as keyof typeof stepContent]
  const StepIcon = stepIcons[currentStepData?.id as keyof typeof stepIcons] || Sparkles

  const handleNext = async () => {
    if (currentStepData?.id === "pain-points") {
      const filledPainPoints = painPoints.filter((p) => p.title.trim())
      if (filledPainPoints.length === 0) {
        toast.error("Bitte geben Sie mindestens ein Problem ein")
        return
      }
      await savePainPoints()
      toast.success("Ihre Herausforderungen wurden gespeichert")
    }

    completeStep(currentStepData.id)
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      markOnboardingComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    markOnboardingComplete()
  }

  const handleStepClick = (index: number) => {
    if (index <= currentStep || steps[index - 1]?.completed) {
      setCurrentStep(index)
    }
  }

  const handlePainPointChange = (index: number, field: "title" | "description", value: string) => {
    const newPainPoints = [...painPoints]
    newPainPoints[index] = { ...newPainPoints[index], [field]: value }
    setPainPoints(newPainPoints)
  }

  if (!currentContent) return null

  return (
    <Dialog open={isOnboardingOpen} onOpenChange={setIsOnboardingOpen}>
      <div className={cn("fixed inset-0 z-50 bg-black/80 backdrop-blur-sm", isOnboardingOpen ? "block" : "hidden")} />
      <DialogContent className="max-w-4xl p-0 bg-background border-border shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogDescription className="sr-only">
          Einrichtungsassistent für Effizienz Praxis - Schritt {currentStep + 1} von {steps.length}
        </DialogDescription>
        {/* Header */}
        <div className="relative px-8 pt-8 pb-4 bg-background sticky top-0 z-10 border-b border-border/50">
          <div className="absolute top-4 right-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOnboardingOpen(false)}
              className="h-8 w-8 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Logo className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Effizienz Praxis</h3>
              <p className="text-xs text-muted-foreground">Einrichtungsassistent</p>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Fortschritt</span>
              <span className="font-medium text-primary">
                {currentStep + 1} von {steps.length}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step indicators */}
          <div className="flex items-center justify-between mt-4 gap-1">
            {steps.map((step, index) => {
              const isActive = index === currentStep
              const isCompleted = step.completed || index < currentStep
              const isClickable = index <= currentStep || steps[index - 1]?.completed

              return (
                <button
                  key={step.id}
                  onClick={() => handleStepClick(index)}
                  disabled={!isClickable}
                  className={cn(
                    "flex-1 h-1.5 rounded-full transition-all duration-300",
                    isActive && "bg-primary",
                    isCompleted && !isActive && "bg-primary/60",
                    !isActive && !isCompleted && "bg-muted",
                    isClickable && "cursor-pointer hover:opacity-80",
                    !isClickable && "cursor-not-allowed opacity-50",
                  )}
                  title={step.title}
                />
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="px-8 pb-8 bg-background">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStepData.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Step Header */}
              <div className="flex items-start gap-4 mb-6">
                <div
                  className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-2xl shrink-0",
                    currentStepData.id === "pain-points"
                      ? "bg-gradient-to-br from-amber-500/20 to-orange-500/10"
                      : "bg-gradient-to-br from-primary/20 to-primary/5",
                  )}
                >
                  <StepIcon
                    className={cn("h-7 w-7", currentStepData.id === "pain-points" ? "text-amber-600" : "text-primary")}
                  />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-1">{currentContent.title}</h2>
                  <p className="text-muted-foreground">{currentContent.subtitle}</p>
                </div>
              </div>

              {/* Description */}
              <p className="text-muted-foreground mb-6 leading-relaxed">{currentContent.description}</p>

              {currentStepData.id === "pain-points" ? (
                <div className="space-y-6 mb-8">
                  {painPoints.map((painPoint, index) => (
                    <motion.div
                      key={painPoint.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative"
                    >
                      <div className="absolute -left-2 top-0 bottom-0 w-1 rounded-full bg-gradient-to-b from-amber-500 to-orange-500" />
                      <div className="pl-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 font-bold text-sm">
                            {index + 1}
                          </div>
                          <Label className="text-sm font-medium">
                            {index === 0 ? "Größtes Problem" : index === 1 ? "Zweitgrößtes Problem" : "Drittes Problem"}
                          </Label>
                        </div>
                        <Input
                          placeholder={`z.B. ${index === 0 ? "Zu viel Papierkram und manuelle Dokumentation" : index === 1 ? "Schwierige Terminkoordination im Team" : "Fehlende Übersicht über Praxiskennzahlen"}`}
                          value={painPoint.title}
                          onChange={(e) => handlePainPointChange(index, "title", e.target.value)}
                          className="bg-muted/50"
                        />
                        <Textarea
                          placeholder="Beschreiben Sie das Problem genauer (optional)..."
                          value={painPoint.description}
                          onChange={(e) => handlePainPointChange(index, "description", e.target.value)}
                          className="bg-muted/50 min-h-[80px] resize-none"
                        />
                      </div>
                    </motion.div>
                  ))}

                  <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                    <div className="flex items-start gap-3">
                      <Brain className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-foreground">KI-gestützte Lösungen</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Basierend auf Ihren Angaben erstellt unsere KI personalisierte Handlungsempfehlungen und
                          konkrete Maßnahmen, die Sie im Leadership-Dashboard finden werden.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Features Grid - for other steps */
                <div className="grid grid-cols-2 gap-4 mb-8">
                  {currentContent.features.map((feature, index) => {
                    const FeatureIcon = feature.icon
                    return (
                      <motion.div
                        key={feature.title}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={cn(
                          "flex items-start gap-3 p-4 rounded-xl",
                          "bg-muted/50 hover:bg-muted/70 transition-colors",
                          "border border-border/50",
                        )}
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                          <FeatureIcon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground text-sm mb-0.5">{feature.title}</h4>
                          <p className="text-xs text-muted-foreground">{feature.description}</p>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}

              {/* Quick Action Link */}
              {currentContent.link && currentStepData.id !== "complete" && currentStepData.id !== "pain-points" && (
                <Link
                  href={currentContent.link.href}
                  onClick={() => setIsOnboardingOpen(false)}
                  className={cn(
                    "inline-flex items-center gap-2 text-sm font-medium",
                    "text-primary hover:text-primary/80 transition-colors",
                  )}
                >
                  {currentContent.link.label}
                  <ChevronRight className="h-4 w-4" />
                </Link>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-muted border-t border-border flex items-center justify-between sticky bottom-0 z-10">
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <Button variant="ghost" onClick={handlePrevious} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Zurück
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={handleSkip} className="text-muted-foreground">
              Überspringen
            </Button>
            <Button onClick={handleNext} className="gap-2 min-w-[140px]">
              {currentStep === steps.length - 1 ? (
                <>
                  Fertig
                  <Check className="h-4 w-4" />
                </>
              ) : (
                <>
                  Weiter
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default OnboardingWizard
