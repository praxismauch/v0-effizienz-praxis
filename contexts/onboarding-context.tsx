"use client"

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react"
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

interface OnboardingProgress {
  id?: string
  currentStep: number
  steps: OnboardingStep[]
  isCompleted: boolean
  completedAt?: string
  teamSize?: number
  practiceGoals?: string[]
  practiceType?: string
  painPoints: PainPoint[]
  skippedSteps?: string[]
  timeSpentSeconds?: number
  interactionsCount?: number
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
  savePainPoints: (createGoals?: boolean) => Promise<{ goalsCreated: number } | null>
  loadPainPoints: () => Promise<void>
  teamSize: number | undefined
  setTeamSize: (size: number) => void
  practiceGoals: string[]
  setPracticeGoals: (goals: string[]) => void
  practiceType: string | undefined
  setPracticeType: (type: string) => void
  saveProgress: () => Promise<void>
  isLoading: boolean
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
  const [isLoading, setIsLoading] = useState(true)
  const [painPoints, setPainPoints] = useState<PainPoint[]>([
    { id: "1", title: "", description: "" },
    { id: "2", title: "", description: "" },
    { id: "3", title: "", description: "" },
  ])
  const [teamSize, setTeamSize] = useState<number | undefined>(undefined)
  const [practiceGoals, setPracticeGoals] = useState<string[]>([])
  const [practiceType, setPracticeType] = useState<string | undefined>(undefined)

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasLoadedFromDb = useRef(false)

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

  const HARDCODED_PRACTICE_ID = "1"

  const practiceId = currentPractice?.id || HARDCODED_PRACTICE_ID

  const loadProgressFromDb = useCallback(async () => {
    if (!currentUser?.id || hasLoadedFromDb.current) return

    try {
      setIsLoading(true)
      const response = await fetch(`/api/practices/${practiceId}/onboarding-progress`, {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        if (data.progress) {
          hasLoadedFromDb.current = true
          setCurrentStep(data.progress.current_step || 0)
          setSteps(data.progress.steps || ONBOARDING_STEPS)
          setHasCompletedOnboarding(data.progress.is_completed || false)
          setTeamSize(data.progress.team_size)
          setPracticeGoals(data.progress.practice_goals || [])
          setPracticeType(data.progress.practice_type)
          if (data.progress.pain_points && data.progress.pain_points.length > 0) {
            const loadedPoints = data.progress.pain_points.slice(0, 3)
            while (loadedPoints.length < 3) {
              loadedPoints.push({ id: String(loadedPoints.length + 1), title: "", description: "" })
            }
            setPainPoints(loadedPoints)
          }
        } else {
          // No progress found - check localStorage for migration
          const storageKey = `onboarding_${practiceId}`
          const stored = localStorage.getItem(storageKey)
          if (stored) {
            try {
              const localData = JSON.parse(stored)
              setHasCompletedOnboarding(localData.completed || false)
              setSteps(localData.steps || ONBOARDING_STEPS)
              setCurrentStep(localData.currentStep || 0)
              if (localData.painPoints) {
                setPainPoints(localData.painPoints)
              }
              // Migrate to database
              hasLoadedFromDb.current = true
              await saveProgressToDb({
                currentStep: localData.currentStep || 0,
                steps: localData.steps || ONBOARDING_STEPS,
                isCompleted: localData.completed || false,
                painPoints: localData.painPoints || [],
              })
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      console.error("Error loading onboarding progress:", error)
    } finally {
      setIsLoading(false)
    }
  }, [practiceId, currentUser?.id])

  const saveProgressToDb = useCallback(
    async (progress?: Partial<OnboardingProgress>) => {
      try {
        const payload = progress || {
          currentStep,
          steps,
          isCompleted: hasCompletedOnboarding,
          teamSize,
          practiceGoals,
          practiceType,
          painPoints: painPoints.filter((p) => p.title.trim()),
        }

        await fetch(`/api/practices/${practiceId}/onboarding-progress`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "include",
        })

        // Also save to localStorage as backup
        const storageKey = `onboarding_${practiceId}`
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            completed: hasCompletedOnboarding,
            steps,
            currentStep,
            painPoints,
            teamSize,
            practiceGoals,
            practiceType,
          }),
        )
      } catch (error) {
        console.error("Error saving onboarding progress:", error)
      }
    },
    [practiceId, currentStep, steps, hasCompletedOnboarding, teamSize, practiceGoals, practiceType, painPoints],
  )

  const completeStep = useCallback((stepId: string) => {
    setSteps((prev) => prev.map((step) => (step.id === stepId ? { ...step, completed: true } : step)))
  }, [])

  const saveProgress = useCallback(async () => {
    await saveProgressToDb()
  }, [saveProgressToDb])

  // Auto-save when state changes
  useEffect(() => {
    if (hasLoadedFromDb.current) {
      saveProgress()
    }
  }, [currentStep, steps, hasCompletedOnboarding, teamSize, practiceGoals, practiceType, saveProgress, practiceId])

  const loadPainPoints = useCallback(async () => {
    try {
      const response = await fetch(`/api/practices/${practiceId}/pain-points`, {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        if (data.painPoints && data.painPoints.length > 0) {
          const loadedPoints = data.painPoints.slice(0, 3)
          while (loadedPoints.length < 3) {
            loadedPoints.push({ id: String(loadedPoints.length + 1), title: "", description: "" })
          }
          setPainPoints(loadedPoints)
        }
      }
    } catch (error) {
      console.error("Error loading pain points:", error)
    }
  }, [practiceId])

  const savePainPoints = useCallback(
    async (createGoals = true): Promise<{ goalsCreated: number } | null> => {
      try {
        const response = await fetch(`/api/practices/${practiceId}/pain-points`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            painPoints: painPoints.filter((p) => p.title.trim()),
            createGoals,
          }),
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error("Failed to save pain points")
        }

        const result = await response.json()

        await saveProgressToDb({ painPoints: painPoints.filter((p) => p.title.trim()) })

        return { goalsCreated: result.goalsCreated || 0 }
      } catch (error) {
        console.error("Error saving pain points:", error)
        return null
      }
    },
    [practiceId, painPoints, saveProgressToDb],
  )

  const markOnboardingComplete = useCallback(async () => {
    setHasCompletedOnboarding(true)
    setIsOnboardingOpen(false)
    setSteps((prev) => prev.map((step) => ({ ...step, completed: true })))

    await saveProgressToDb({
      isCompleted: true,
      steps: steps.map((s) => ({ ...s, completed: true })),
    })
  }, [saveProgressToDb, steps])

  const resetOnboarding = useCallback(async () => {
    setHasCompletedOnboarding(false)
    setSteps(ONBOARDING_STEPS)
    setCurrentStep(0)
    setIsOnboardingOpen(true)
    hasLoadedFromDb.current = false

    await saveProgressToDb({
      currentStep: 0,
      steps: ONBOARDING_STEPS,
      isCompleted: false,
    })
  }, [saveProgressToDb])

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
        loadPainPoints,
        teamSize,
        setTeamSize,
        practiceGoals,
        setPracticeGoals,
        practiceType,
        setPracticeType,
        saveProgress,
        isLoading,
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
