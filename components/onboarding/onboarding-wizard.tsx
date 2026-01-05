"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { usePractice } from "@/contexts/practice-context"
import { useUser } from "@/contexts/user-context"
import {
  Building2,
  Users,
  Target,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Shield,
  BarChart3,
  Calendar,
  FileText,
  Workflow,
  GraduationCap,
  Star,
  Zap,
  Clock,
  TrendingUp,
  Heart,
  Lightbulb,
  Play,
  X,
  HeadphonesIcon,
  Mail,
  MessageSquare,
  Bug,
  ExternalLink,
} from "lucide-react"
import { Logo } from "@/components/logo"

interface OnboardingWizardProps {
  onComplete: () => void
  onSkip: () => void
}

interface PracticeSettings {
  practiceName: string
  practiceType: string
  address: string
  phone: string
  email: string
  website: string
  teamSize: string
  mainGoals: string[]
}

const PRACTICE_TYPES = [
  "Allgemeinmedizin",
  "Innere Medizin",
  "Pädiatrie",
  "Kardiologie",
  "Dermatologie",
  "Orthopädie",
  "Psychiatrie",
  "Radiologie",
  "Gynäkologie",
  "HNO",
  "Augenheilkunde",
  "Neurologie",
  "Urologie",
  "Chirurgie",
  "Sonstige",
]

const TEAM_SIZES = [
  { value: "1-3", label: "1-3 Mitarbeiter (Kleinpraxis)" },
  { value: "4-10", label: "4-10 Mitarbeiter (Mittlere Praxis)" },
  { value: "11-25", label: "11-25 Mitarbeiter (Große Praxis)" },
  { value: "26+", label: "26+ Mitarbeiter (MVZ / Großpraxis)" },
]

const PRACTICE_GOALS = [
  { id: "efficiency", label: "Effizienz steigern", icon: Zap },
  { id: "team", label: "Team entwickeln", icon: Users },
  { id: "quality", label: "Qualität verbessern", icon: Star },
  { id: "growth", label: "Praxis wachsen lassen", icon: TrendingUp },
  { id: "documentation", label: "Dokumentation optimieren", icon: FileText },
  { id: "analytics", label: "Kennzahlen tracken", icon: BarChart3 },
]

const FEATURES = [
  {
    id: "dashboard",
    title: "Dashboard",
    description: "Übersichtliche Darstellung aller wichtigen Kennzahlen und Aufgaben auf einen Blick.",
    icon: BarChart3,
    color: "bg-blue-500",
  },
  {
    id: "team",
    title: "Team-Verwaltung",
    description: "Verwalten Sie Ihr Team, Arbeitszeiten, Urlaube und Qualifikationen zentral.",
    icon: Users,
    color: "bg-emerald-500",
  },
  {
    id: "workflows",
    title: "Workflows",
    description: "Automatisieren Sie wiederkehrende Abläufe und standardisieren Sie Prozesse.",
    icon: Workflow,
    color: "bg-purple-500",
  },
  {
    id: "goals",
    title: "Ziele",
    description: "Setzen und verfolgen Sie Praxis- und Teamziele mit messbaren Ergebnissen.",
    icon: Target,
    color: "bg-amber-500",
  },
  {
    id: "knowledge",
    title: "Praxis-Handbuch",
    description: "Zentrales Wissensmanagement für Ihr gesamtes Team.",
    icon: BookOpen,
    color: "bg-cyan-500",
  },
  {
    id: "academy",
    title: "Academy",
    description: "Weiterbildung und Schulungen für Ihr Team mit Lernfortschritt-Tracking.",
    icon: GraduationCap,
    color: "bg-pink-500",
  },
  {
    id: "support",
    title: "Support & Feedback",
    description: "Wir sind für Sie da – Hilfe erhalten und das System gemeinsam verbessern.",
    icon: HeadphonesIcon,
    color: "bg-indigo-500",
  },
]

const STEPS = [
  { id: "welcome", title: "Willkommen", icon: Sparkles },
  { id: "practice", title: "Praxis-Info", icon: Building2 },
  { id: "goals", title: "Ihre Ziele", icon: Target },
  { id: "features", title: "Funktionen", icon: Lightbulb },
  { id: "support", title: "Support", icon: HeadphonesIcon },
  { id: "complete", title: "Fertig", icon: CheckCircle2 },
]

export function OnboardingWizard({ onComplete, onSkip }: OnboardingWizardProps) {
  const { currentPractice, updatePractice } = usePractice()
  const { currentUser } = useUser()
  const [currentStep, setCurrentStep] = useState(0)
  const [settings, setSettings] = useState<PracticeSettings>({
    practiceName: currentPractice?.name || "",
    practiceType: currentPractice?.type || "",
    address: currentPractice?.address || "",
    phone: currentPractice?.phone || "",
    email: currentPractice?.email || "",
    website: currentPractice?.website || "",
    teamSize: "",
    mainGoals: [],
  })
  const [activeFeature, setActiveFeature] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Auto-rotate features
  useEffect(() => {
    if (currentStep === 3) {
      const interval = setInterval(() => {
        setActiveFeature((prev) => (prev + 1) % FEATURES.length)
      }, 4000)
      return () => clearInterval(interval)
    }
  }, [currentStep])

  const progress = ((currentStep + 1) / STEPS.length) * 100

  const handleNext = useCallback(async () => {
    if (currentStep === STEPS.length - 2) {
      // Before going to "complete" step, save settings
      setIsSubmitting(true)
      try {
        if (currentPractice?.id) {
          await updatePractice(currentPractice.id, {
            name: settings.practiceName,
            type: settings.practiceType,
            address: settings.address,
            phone: settings.phone,
            email: settings.email,
            website: settings.website,
          })

          // Mark onboarding as complete
          await fetch(`/api/practices/${currentPractice.id}/settings`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              onboarding_completed: true,
              onboarding_completed_at: new Date().toISOString(),
              team_size: settings.teamSize,
              practice_goals: settings.mainGoals,
            }),
          })
        }
      } catch (error) {
        console.error("Error saving onboarding settings:", error)
      } finally {
        setIsSubmitting(false)
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1))
  }, [currentStep, currentPractice, settings, updatePractice])

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  const toggleGoal = (goalId: string) => {
    setSettings((prev) => ({
      ...prev,
      mainGoals: prev.mainGoals.includes(goalId)
        ? prev.mainGoals.filter((g) => g !== goalId)
        : [...prev.mainGoals, goalId],
    }))
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeStep userName={currentUser?.name || "Praxisleiter"} />
      case 1:
        return (
          <PracticeInfoStep
            settings={settings}
            setSettings={setSettings}
            practiceTypes={PRACTICE_TYPES}
            teamSizes={TEAM_SIZES}
          />
        )
      case 2:
        return <GoalsStep settings={settings} toggleGoal={toggleGoal} goals={PRACTICE_GOALS} />
      case 3:
        return <FeaturesStep features={FEATURES} activeFeature={activeFeature} setActiveFeature={setActiveFeature} />
      case 4:
        return <SupportStep />
      case 5:
        return <CompleteStep settings={settings} onComplete={onComplete} />
      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-background via-background to-primary/5">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMjIiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />

      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Logo className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-semibold text-lg">Effizienz Praxis</h1>
              <p className="text-xs text-muted-foreground">Einrichtungs-Assistent</p>
            </div>
          </div>

          <Button variant="ghost" size="sm" onClick={onSkip} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4 mr-1" />
            Überspringen
          </Button>
        </header>

        {/* Progress bar */}
        <div className="px-6 py-3 bg-background/60 backdrop-blur-sm border-b">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              {STEPS.map((step, index) => {
                const StepIcon = step.icon
                const isActive = index === currentStep
                const isCompleted = index < currentStep

                return (
                  <div key={step.id} className="flex items-center">
                    <div
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : isCompleted
                            ? "bg-primary/20 text-primary"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <StepIcon className="h-4 w-4" />
                      <span className="text-sm font-medium hidden sm:inline">{step.title}</span>
                    </div>
                    {index < STEPS.length - 1 && (
                      <div
                        className={`w-8 lg:w-16 h-0.5 mx-2 transition-colors duration-300 ${
                          index < currentStep ? "bg-primary" : "bg-border"
                        }`}
                      />
                    )}
                  </div>
                )
              })}
            </div>
            <Progress value={progress} className="h-1" />
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* Footer navigation */}
        <footer className="px-6 py-4 border-t bg-background/80 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="gap-2 bg-transparent"
            >
              <ArrowLeft className="h-4 w-4" />
              Zurück
            </Button>

            <div className="flex items-center gap-2">
              {STEPS.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentStep ? "bg-primary" : index < currentStep ? "bg-primary/50" : "bg-border"
                  }`}
                />
              ))}
            </div>

            {currentStep < STEPS.length - 1 ? (
              <Button onClick={handleNext} disabled={isSubmitting} className="gap-2">
                {isSubmitting ? "Speichern..." : "Weiter"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={onComplete} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                <Play className="h-4 w-4" />
                Loslegen
              </Button>
            )}
          </div>
        </footer>
      </div>
    </div>
  )
}

// Step 1: Welcome
function WelcomeStep({ userName }: { userName: string }) {
  return (
    <div className="text-center space-y-8">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-lg shadow-primary/30"
      >
        <Sparkles className="h-12 w-12" />
      </motion.div>

      <div className="space-y-4">
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-4xl font-bold text-balance"
        >
          Willkommen, {userName.split(" ")[0]}!
        </motion.h2>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty"
        >
          Lassen Sie uns Ihre Praxis in wenigen Minuten einrichten. Wir führen Sie durch die wichtigsten Schritte, um
          das Beste aus Effizienz Praxis herauszuholen.
        </motion.p>
      </div>

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto pt-4"
      >
        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardContent className="pt-6 text-center">
            <Clock className="h-8 w-8 mx-auto mb-3 text-primary" />
            <h3 className="font-semibold mb-1">5 Minuten</h3>
            <p className="text-sm text-muted-foreground">Schnelle Einrichtung</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="pt-6 text-center">
            <Shield className="h-8 w-8 mx-auto mb-3 text-emerald-500" />
            <h3 className="font-semibold mb-1">Sicher</h3>
            <p className="text-sm text-muted-foreground">DSGVO-konform</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-amber-500/20 bg-amber-500/5">
          <CardContent className="pt-6 text-center">
            <Heart className="h-8 w-8 mx-auto mb-3 text-amber-500" />
            <h3 className="font-semibold mb-1">Support</h3>
            <p className="text-sm text-muted-foreground">Immer für Sie da</p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

// Step 2: Practice Info
function PracticeInfoStep({
  settings,
  setSettings,
  practiceTypes,
  teamSizes,
}: {
  settings: PracticeSettings
  setSettings: React.Dispatch<React.SetStateAction<PracticeSettings>>
  practiceTypes: string[]
  teamSizes: { value: string; label: string }[]
}) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
          <Building2 className="h-8 w-8" />
        </div>
        <h2 className="text-3xl font-bold mb-2">Ihre Praxis-Informationen</h2>
        <p className="text-muted-foreground">
          Geben Sie die grundlegenden Informationen Ihrer Praxis ein. Sie können diese später jederzeit ändern.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="practiceName">Praxisname *</Label>
          <Input
            id="practiceName"
            value={settings.practiceName}
            onChange={(e) => setSettings((prev) => ({ ...prev, practiceName: e.target.value }))}
            placeholder="z.B. Praxis Dr. Müller"
            className="h-12"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="practiceType">Fachrichtung *</Label>
          <Select
            value={settings.practiceType}
            onValueChange={(value) => setSettings((prev) => ({ ...prev, practiceType: value }))}
          >
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Fachrichtung wählen" />
            </SelectTrigger>
            <SelectContent>
              {practiceTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="teamSize">Teamgröße</Label>
          <Select
            value={settings.teamSize}
            onValueChange={(value) => setSettings((prev) => ({ ...prev, teamSize: value }))}
          >
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Teamgröße wählen" />
            </SelectTrigger>
            <SelectContent>
              {teamSizes.map((size) => (
                <SelectItem key={size.value} value={size.value}>
                  {size.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Telefon</Label>
          <Input
            id="phone"
            type="tel"
            value={settings.phone}
            onChange={(e) => setSettings((prev) => ({ ...prev, phone: e.target.value }))}
            placeholder="030 12345678"
            className="h-12"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">E-Mail</Label>
          <Input
            id="email"
            type="email"
            value={settings.email}
            onChange={(e) => setSettings((prev) => ({ ...prev, email: e.target.value }))}
            placeholder="kontakt@praxis.de"
            className="h-12"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            type="url"
            value={settings.website}
            onChange={(e) => setSettings((prev) => ({ ...prev, website: e.target.value }))}
            placeholder="https://www.praxis.de"
            className="h-12"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">Adresse</Label>
          <Textarea
            id="address"
            value={settings.address}
            onChange={(e) => setSettings((prev) => ({ ...prev, address: e.target.value }))}
            placeholder="Musterstraße 1, 12345 Musterstadt"
            className="resize-none"
            rows={2}
          />
        </div>
      </div>
    </div>
  )
}

// Step 3: Goals
function GoalsStep({
  settings,
  toggleGoal,
  goals,
}: {
  settings: PracticeSettings
  toggleGoal: (goalId: string) => void
  goals: { id: string; label: string; icon: typeof Zap }[]
}) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 text-amber-500 mb-4">
          <Target className="h-8 w-8" />
        </div>
        <h2 className="text-3xl font-bold mb-2">Was sind Ihre Hauptziele?</h2>
        <p className="text-muted-foreground">
          Wählen Sie aus, worauf Sie sich konzentrieren möchten. Wir passen die Empfehlungen entsprechend an.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {goals.map((goal) => {
          const Icon = goal.icon
          const isSelected = settings.mainGoals.includes(goal.id)

          return (
            <motion.button
              key={goal.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => toggleGoal(goal.id)}
              className={`relative p-6 rounded-xl border-2 text-left transition-all duration-200 ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                  : "border-border bg-card hover:border-primary/50 hover:bg-accent/50"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-lg ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{goal.label}</h3>
                </div>
              </div>

              {isSelected && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-3 right-3">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </motion.div>
              )}
            </motion.button>
          )
        })}
      </div>

      <p className="text-center text-sm text-muted-foreground mt-4">
        Ausgewählt: {settings.mainGoals.length} von {goals.length}
      </p>
    </div>
  )
}

// Step 4: Features Tour
function FeaturesStep({
  features,
  activeFeature,
  setActiveFeature,
}: {
  features: { id: string; title: string; description: string; icon: typeof BarChart3; color: string }[]
  activeFeature: number
  setActiveFeature: (index: number) => void
}) {
  const currentFeature = features[activeFeature]
  const Icon = currentFeature.icon

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/10 text-purple-500 mb-4">
          <Lightbulb className="h-8 w-8" />
        </div>
        <h2 className="text-3xl font-bold mb-2">Entdecken Sie Ihre Möglichkeiten</h2>
        <p className="text-muted-foreground">
          Effizienz Praxis bietet Ihnen viele Funktionen, um Ihre Praxis optimal zu führen.
        </p>
      </div>

      {/* Feature showcase */}
      <Card className="overflow-hidden border-2">
        <div className="grid md:grid-cols-2">
          <div className={`p-8 ${currentFeature.color} text-white`}>
            <motion.div
              key={currentFeature.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full flex flex-col justify-center"
            >
              <Icon className="h-16 w-16 mb-6" />
              <h3 className="text-3xl font-bold mb-4">{currentFeature.title}</h3>
              <p className="text-lg text-white/90">{currentFeature.description}</p>
            </motion.div>
          </div>

          <div className="p-6 bg-card">
            <div className="space-y-2">
              {features.map((feature, index) => {
                const FeatureIcon = feature.icon
                const isActive = index === activeFeature

                return (
                  <button
                    key={feature.id}
                    onClick={() => setActiveFeature(index)}
                    className={`w-full flex items-center gap-4 p-4 rounded-lg transition-all duration-200 text-left ${
                      isActive ? "bg-primary/10 border-2 border-primary" : "hover:bg-accent border-2 border-transparent"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${feature.color} text-white`}>
                      <FeatureIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-medium ${isActive ? "text-primary" : ""}`}>{feature.title}</h4>
                    </div>
                    {isActive && <ArrowRight className="h-5 w-5 text-primary" />}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* Progress dots */}
      <div className="flex justify-center gap-2">
        {features.map((_, index) => (
          <button
            key={index}
            onClick={() => setActiveFeature(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === activeFeature ? "w-8 bg-primary" : "w-2 bg-border hover:bg-primary/50"
            }`}
          />
        ))}
      </div>
    </div>
  )
}

// Step 5: Support & Contact
function SupportStep() {
  const [feedbackSent, setFeedbackSent] = useState(false)

  const supportOptions = [
    {
      icon: Mail,
      title: "E-Mail Support",
      description: "Schreiben Sie uns direkt bei Fragen oder Problemen",
      action: "support@effizienz-praxis.de",
      actionType: "email" as const,
      color: "bg-blue-500",
    },
    {
      icon: Bug,
      title: "Fehler melden",
      description: "Helfen Sie uns, das System zu verbessern",
      action: "/feedback",
      actionType: "link" as const,
      color: "bg-red-500",
    },
    {
      icon: MessageSquare,
      title: "Feature-Wünsche",
      description: "Teilen Sie uns Ihre Ideen für neue Funktionen mit",
      action: "/feedback?type=feature",
      actionType: "link" as const,
      color: "bg-purple-500",
    },
    {
      icon: BookOpen,
      title: "Dokumentation",
      description: "Ausführliche Anleitungen und Hilfe-Artikel",
      action: "/help",
      actionType: "link" as const,
      color: "bg-emerald-500",
    },
  ]

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white mb-6 shadow-lg shadow-indigo-500/30"
        >
          <HeadphonesIcon className="h-10 w-10" />
        </motion.div>
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-3xl font-bold mb-3"
        >
          Wir sind für Sie da
        </motion.h2>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-muted-foreground text-lg max-w-2xl mx-auto"
        >
          Ihr Feedback ist uns wichtig! Gemeinsam machen wir Effizienz Praxis noch besser für Sie und Ihr Team.
        </motion.p>
      </div>

      {/* Support Options Grid */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto"
      >
        {supportOptions.map((option, index) => {
          const Icon = option.icon
          return (
            <motion.div
              key={option.title}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <Card
                className="group cursor-pointer border-2 hover:border-primary/50 hover:shadow-lg transition-all duration-300 h-full"
                onClick={() => {
                  if (option.actionType === "email") {
                    window.location.href = `mailto:${option.action}?subject=Support-Anfrage%20Effizienz%20Praxis`
                  } else {
                    window.open(option.action, "_blank")
                  }
                }}
              >
                <CardContent className="pt-6 pb-6">
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 rounded-xl ${option.color} text-white group-hover:scale-110 transition-transform duration-300`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                        {option.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Quick Feedback Section */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="max-w-2xl mx-auto"
      >
        <Card className="border-2 border-dashed border-primary/30 bg-primary/5">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-primary">
                <Heart className="h-5 w-5" />
                <span className="font-medium">Helfen Sie uns, besser zu werden</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Jedes Feedback – ob Lob, Kritik oder Verbesserungsvorschlag – hilft uns, Effizienz Praxis kontinuierlich
                zu verbessern. Wir lesen und beantworten jede Nachricht persönlich.
              </p>
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <Badge variant="secondary" className="px-3 py-1.5">
                  <Clock className="h-3 w-3 mr-1.5" />
                  Antwort innerhalb 24h
                </Badge>
                <Badge variant="secondary" className="px-3 py-1.5">
                  <Shield className="h-3 w-3 mr-1.5" />
                  Datenschutz garantiert
                </Badge>
                <Badge variant="secondary" className="px-3 py-1.5">
                  <Star className="h-3 w-3 mr-1.5" />
                  Persönlicher Support
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Contact Info Footer */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="text-center pt-4"
      >
        <p className="text-sm text-muted-foreground">
          Direkter Kontakt:{" "}
          <a href="mailto:support@effizienz-praxis.de" className="text-primary hover:underline font-medium">
            support@effizienz-praxis.de
          </a>
        </p>
      </motion.div>
    </div>
  )
}

// Step 6: Complete (previously Step 5)
function CompleteStep({ settings, onComplete }: { settings: PracticeSettings; onComplete: () => void }) {
  return (
    <div className="text-center space-y-8">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", duration: 0.6 }}
        className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30"
      >
        <CheckCircle2 className="h-12 w-12" />
      </motion.div>

      <div className="space-y-4">
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-4xl font-bold"
        >
          Alles eingerichtet!
        </motion.h2>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-xl text-muted-foreground max-w-2xl mx-auto"
        >
          {settings.practiceName || "Ihre Praxis"} ist bereit. Starten Sie jetzt und entdecken Sie, wie Effizienz Praxis
          Ihren Arbeitsalltag verbessern kann.
        </motion.p>
      </div>

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto"
      >
        <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer group">
          <CardContent className="pt-6">
            <Users className="h-10 w-10 mx-auto mb-4 text-primary group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold mb-2">Team einladen</h3>
            <p className="text-sm text-muted-foreground">Laden Sie Ihre Mitarbeiter ein, um gemeinsam zu arbeiten.</p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer group">
          <CardContent className="pt-6">
            <Calendar className="h-10 w-10 mx-auto mb-4 text-primary group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold mb-2">Kalender einrichten</h3>
            <p className="text-sm text-muted-foreground">Verwalten Sie Termine und Arbeitszeiten zentral.</p>
          </CardContent>
        </Card>
      </motion.div>

      {settings.mainGoals.length > 0 && (
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="pt-4"
        >
          <p className="text-sm text-muted-foreground mb-3">Ihre ausgewählten Ziele:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {settings.mainGoals.map((goalId) => {
              const goal = PRACTICE_GOALS.find((g) => g.id === goalId)
              if (!goal) return null
              return (
                <Badge key={goalId} variant="secondary" className="px-3 py-1.5">
                  {goal.label}
                </Badge>
              )
            })}
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default OnboardingWizard
