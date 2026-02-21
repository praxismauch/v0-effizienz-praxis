"use client"

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react"
import { useUser } from "./user-context"
import { usePractice } from "./practice-context"
import type { OnboardingStep, PainPoint, OnboardingContextType } from "./onboarding-types"
import { ONBOARDING_STEPS, DEFAULT_PAIN_POINTS } from "./onboarding-types"
import {
  loadProgressFromApi,
  saveProgressToApi,
  loadPainPointsFromApi,
  savePainPointsToApi,
  awardWelcomeBadge,
  saveToLocalStorage,
  loadFromLocalStorage,
} from "./onboarding-api"

export type { OnboardingStep, PainPoint, OnboardingContextType } from "./onboarding-types"

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

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
  const [painPoints, setPainPoints] = useState<PainPoint[]>(DEFAULT_PAIN_POINTS)
  const [teamSize, setTeamSize] = useState<number | undefined>(undefined)
  const [practiceGoals, setPracticeGoals] = useState<string[]>([])
  const [practiceType, setPracticeType] = useState<string | undefined>(undefined)

  const hasLoadedFromDb = useRef(false)
  const practiceId = currentPractice?.id || "1"

  // Check if practice is within 7 days
  useEffect(() => {
    if (currentPractice?.createdAt) {
      const diffDays = Math.floor((Date.now() - new Date(currentPractice.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      setIsNewPractice(diffDays <= 7)
      setDaysRemaining(Math.max(0, 7 - diffDays))
    }
  }, [currentPractice?.createdAt])

  // Load progress from DB
  const loadProgressFromDb = useCallback(async () => {
    if (!currentUser?.id || hasLoadedFromDb.current) return
    setIsLoading(true)
    try {
      const result = await loadProgressFromApi(practiceId)
      if (result) {
        hasLoadedFromDb.current = true
        setCurrentStep(result.currentStep)
        setSteps(result.steps)
        setHasCompletedOnboarding(result.isCompleted)
        setTeamSize(result.teamSize)
        setPracticeGoals(result.practiceGoals)
        setPracticeType(result.practiceType)
        if (result.painPoints.length > 0) setPainPoints(result.painPoints)
      } else {
        // Try localStorage migration
        const localData = loadFromLocalStorage(practiceId)
        if (localData) {
          setHasCompletedOnboarding(localData.completed || false)
          setSteps(localData.steps || ONBOARDING_STEPS)
          setCurrentStep(localData.currentStep || 0)
          if (localData.painPoints) setPainPoints(localData.painPoints)
          hasLoadedFromDb.current = true
          await saveProgressToApi(practiceId, {
            currentStep: localData.currentStep || 0,
            steps: localData.steps || ONBOARDING_STEPS,
            isCompleted: localData.completed || false,
            painPoints: localData.painPoints || [],
          })
        }
      }
    } finally {
      setIsLoading(false)
    }
  }, [practiceId, currentUser?.id])

  const saveProgressToDb = useCallback(async () => {
    const payload = {
      currentStep,
      steps,
      isCompleted: hasCompletedOnboarding,
      teamSize,
      practiceGoals,
      practiceType,
      painPoints: painPoints.filter((p) => p.title.trim()),
    }
    await saveProgressToApi(practiceId, payload)
    saveToLocalStorage(practiceId, {
      completed: hasCompletedOnboarding,
      steps,
      currentStep,
      painPoints,
      teamSize,
      practiceGoals,
      practiceType,
    })
  }, [practiceId, currentStep, steps, hasCompletedOnboarding, teamSize, practiceGoals, practiceType, painPoints])

  const completeStep = useCallback((stepId: string) => {
    setSteps((prev) => prev.map((step) => (step.id === stepId ? { ...step, completed: true } : step)))
  }, [])

  const saveProgress = useCallback(async () => {
    await saveProgressToDb()
  }, [saveProgressToDb])

  // Auto-save on state changes
  useEffect(() => {
    if (hasLoadedFromDb.current) saveProgress()
  }, [currentStep, steps, hasCompletedOnboarding, teamSize, practiceGoals, practiceType, saveProgress, practiceId])

  const loadPainPoints = useCallback(async () => {
    const result = await loadPainPointsFromApi(practiceId)
    if (result) setPainPoints(result)
  }, [practiceId])

  const savePainPoints = useCallback(
    async (createGoals = true) => {
      const result = await savePainPointsToApi(practiceId, painPoints, createGoals)
      if (result) await saveProgressToApi(practiceId, { painPoints: painPoints.filter((p) => p.title.trim()) })
      return result
    },
    [practiceId, painPoints],
  )

  const markOnboardingComplete = useCallback(async () => {
    setHasCompletedOnboarding(true)
    setIsOnboardingOpen(false)
    const completedSteps = steps.map((s) => ({ ...s, completed: true }))
    setSteps(completedSteps)
    await saveProgressToApi(practiceId, { isCompleted: true, steps: completedSteps })
    if (currentUser?.id) await awardWelcomeBadge(currentUser.id, practiceId)
  }, [steps, currentUser?.id, practiceId])

  const resetOnboarding = useCallback(async () => {
    setHasCompletedOnboarding(false)
    setSteps(ONBOARDING_STEPS)
    setCurrentStep(0)
    setIsOnboardingOpen(true)
    hasLoadedFromDb.current = false
    await saveProgressToApi(practiceId, { currentStep: 0, steps: ONBOARDING_STEPS, isCompleted: false })
  }, [practiceId])

  return (
    <OnboardingContext.Provider
      value={{
        isOnboardingOpen, setIsOnboardingOpen, currentStep, setCurrentStep, steps, completeStep,
        isNewPractice, daysRemaining, hasCompletedOnboarding, markOnboardingComplete, resetOnboarding,
        shouldShowOnboarding: isNewPractice || !hasCompletedOnboarding,
        painPoints, setPainPoints, savePainPoints, loadPainPoints,
        teamSize, setTeamSize, practiceGoals, setPracticeGoals, practiceType, setPracticeType,
        saveProgress, isLoading,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (context === undefined) {
    if (typeof window === "undefined") return null
    throw new Error("useOnboarding must be used within an OnboardingProvider")
  }
  return context
}

export default OnboardingProvider
