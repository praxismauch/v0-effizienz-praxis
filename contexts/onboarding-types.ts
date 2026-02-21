export interface OnboardingStep {
  id: string
  title: string
  description: string
  completed: boolean
}

export interface PainPoint {
  id: string
  title: string
  description: string
}

export interface OnboardingProgress {
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

export interface OnboardingContextType {
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

export const ONBOARDING_STEPS: OnboardingStep[] = [
  { id: "welcome", title: "Willkommen bei Effizienz Praxis", description: "Ihr intelligenter Assistent für die Praxisverwaltung", completed: false },
  { id: "pain-points", title: "Ihre größten Herausforderungen", description: "Teilen Sie uns Ihre 3 größten Probleme mit", completed: false },
  { id: "practice-setup", title: "Praxis einrichten", description: "Grundlegende Informationen zu Ihrer Praxis", completed: false },
  { id: "team", title: "Team verwalten", description: "Fügen Sie Teammitglieder hinzu und weisen Sie Rollen zu", completed: false },
  { id: "calendar", title: "Kalender & Termine", description: "Planen und organisieren Sie Ihre Termine", completed: false },
  { id: "tasks", title: "Aufgaben & Workflows", description: "Erstellen Sie Aufgaben und automatisieren Sie Abläufe", completed: false },
  { id: "documents", title: "Dokumente & Protokolle", description: "Verwalten Sie Ihre Praxisdokumentation", completed: false },
  { id: "ai-features", title: "KI-Funktionen", description: "Nutzen Sie intelligente Analysen und Empfehlungen", completed: false },
  { id: "complete", title: "Los geht's!", description: "Sie sind bereit, Effizienz Praxis zu nutzen", completed: false },
]

export const DEFAULT_PAIN_POINTS: PainPoint[] = [
  { id: "1", title: "", description: "" },
  { id: "2", title: "", description: "" },
  { id: "3", title: "", description: "" },
]
