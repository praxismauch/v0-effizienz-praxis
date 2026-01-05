"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { useUser } from "./user-context"
import { usePractice } from "./practice-context"

interface OnboardingStep {
  id: string
  title: string
  description: string
  completed: boolean
}

interface PainPoint {
  id: string
  title: string
  description: string
}

interface OnboardingContextType {
  isOnboardingOpen: boolean
  setIsOnboardingOpen: (open: boolean) => void
  currentStep: number
  setCurrentStep: (step: number) => void
  steps: OnboardingStep[]
  completeStep: (stepId: string) => void
  isNewPractice: boolean
  daysRemaining: number
  hasCompletedOnboarding: boolean
  markOnboardingComplete: () => void
  resetOnboarding: () => void
  shouldShowOnboarding: boolean
  painPoints: PainPoint[]
  setPainPoints: (points: PainPoint[]) => void
  savePainPoints: () => Promise<void>
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Willkommen bei Effizienz Praxis",
    description: "Ihr intelligenter Assistent für die Praxisverwaltung",
    completed: false,
  },
  {
    id: "pain-points",
    title: "Ihre größten Herausforderungen",
    description: "Teilen Sie uns Ihre 3 größten Probleme mit",
    completed: false,
  },
  {
    id: "practice-setup",
    title: "Praxis einrichten",
    description: "Grundlegende Informationen zu Ihrer Praxis",
    completed: false,
  },
  {
    id: "team",
    title: "Team verwalten",
    description: "Fügen Sie Teammitglieder hinzu und weisen Sie Rollen zu",
    completed: false,
  },
  {
    id: "calendar",
    title: "Kalender & Termine",
    description: "Planen und organisieren Sie Ihre Termine",
    completed: false,
  },
  {
    id: "tasks",
    title: "Aufgaben & Workflows",
    description: "Erstellen Sie Aufgaben und automatisieren Sie Abläufe",
    completed: false,
  },
  {
    id: "documents",
    title: "Dokumente & Protokolle",
    description: "Verwalten Sie Ihre Praxisdokumentation",
    completed: false,
  },
  {
    id: "ai-features",
    title: "KI-Funktionen",
    description: "Nutzen Sie intelligente Analysen und Empfehlungen",
    completed: false,
  },
  {
    id: "complete",
    title: "Los geht's!",
    description: "Sie sind bereit, Effizienz Praxis zu nutzen",
    completed: false,
  },
]

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useUser()
  const { currentPractice } = usePractice()

  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [steps, setSteps] = useState<OnboardingStep[]>(ONBOARDING_STEPS)
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false)
  const [isNewPractice, setIsNewPractice] = useState(false)
  const [daysRemaining, setDaysRemaining] = useState(0)
  const [painPoints, setPainPoints] = useState<PainPoint[]>([
    { id: "1", title: "", description: "" },
    { id: "2", title: "", description: "" },
    { id: "3", title: "", description: "" },
  ])

  // Check if practice is within 7 days of creation
  useEffect(() => {
    if (currentPractice?.createdAt) {
      const createdDate = new Date(currentPractice.createdAt)
      const now = new Date()
      const diffTime = now.getTime() - createdDate.getTime()
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

      setIsNewPractice(diffDays <= 7)
      setDaysRemaining(Math.max(0, 7 - diffDays))
    }
  }, [currentPractice?.createdAt])

  // Load onboarding state from localStorage
  useEffect(() => {
    if (typeof window === "undefined" || !currentPractice?.id) return

    const storageKey = `onboarding_${currentPractice.id}`
    const stored = localStorage.getItem(storageKey)

    if (stored) {
      try {
        const data = JSON.parse(stored)
        setHasCompletedOnboarding(data.completed || false)
        setSteps(data.steps || ONBOARDING_STEPS)
        setCurrentStep(data.currentStep || 0)
        if (data.painPoints) {
          setPainPoints(data.painPoints)
        }
      } catch {
        // Ignore parse errors
      }
    } else {
      // New practice - show onboarding automatically
      setHasCompletedOnboarding(false)
      setSteps(ONBOARDING_STEPS)
      setCurrentStep(0)

      // Auto-open for new practices
      if (isNewPractice) {
        setIsOnboardingOpen(true)
      }
    }
  }, [currentPractice?.id, isNewPractice])

  // Save onboarding state to localStorage
  const saveState = useCallback(() => {
    if (typeof window === "undefined" || !currentPractice?.id) return

    const storageKey = `onboarding_${currentPractice.id}`
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        completed: hasCompletedOnboarding,
        steps,
        currentStep,
        painPoints,
      }),
    )
  }, [currentPractice?.id, hasCompletedOnboarding, steps, currentStep, painPoints])

  useEffect(() => {
    saveState()
  }, [saveState])

  const savePainPoints = useCallback(async () => {
    if (!currentPractice?.id) return

    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/pain-points`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ painPoints: painPoints.filter((p) => p.title.trim()) }),
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to save pain points")
      }
    } catch (error) {
      console.error("Error saving pain points:", error)
    }
  }, [currentPractice?.id, painPoints])

  const completeStep = useCallback((stepId: string) => {
    setSteps((prev) => prev.map((step) => (step.id === stepId ? { ...step, completed: true } : step)))
  }, [])

  const markOnboardingComplete = useCallback(() => {
    setHasCompletedOnboarding(true)
    setIsOnboardingOpen(false)
    setSteps((prev) => prev.map((step) => ({ ...step, completed: true })))
  }, [])

  const resetOnboarding = useCallback(() => {
    setHasCompletedOnboarding(false)
    setSteps(ONBOARDING_STEPS)
    setCurrentStep(0)
    setIsOnboardingOpen(true)
  }, [])

  const shouldShowOnboarding = isNewPractice || !hasCompletedOnboarding

  return (
    <OnboardingContext.Provider
      value={{
        isOnboardingOpen,
        setIsOnboardingOpen,
        currentStep,
        setCurrentStep,
        steps,
        completeStep,
        isNewPractice,
        daysRemaining,
        hasCompletedOnboarding,
        markOnboardingComplete,
        resetOnboarding,
        shouldShowOnboarding,
        painPoints,
        setPainPoints,
        savePainPoints,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider")
  }
  return context
}

export default OnboardingProvider
