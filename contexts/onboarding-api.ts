import Logger from "@/lib/logger"
import type { OnboardingStep, OnboardingProgress, PainPoint } from "./onboarding-types"
import { ONBOARDING_STEPS } from "./onboarding-types"

interface LoadProgressResult {
  currentStep: number
  steps: OnboardingStep[]
  isCompleted: boolean
  teamSize?: number
  practiceGoals: string[]
  practiceType?: string
  painPoints: PainPoint[]
}

function ensureThreePainPoints(points: PainPoint[]): PainPoint[] {
  const result = points.slice(0, 3)
  while (result.length < 3) {
    result.push({ id: String(result.length + 1), title: "", description: "" })
  }
  return result
}

export async function loadProgressFromApi(practiceId: string): Promise<LoadProgressResult | null> {
  try {
    const response = await fetch(`/api/practices/${practiceId}/onboarding-progress`, { credentials: "include" })
    if (!response.ok) return null

    const data = await response.json()
    if (!data.progress) return null

    return {
      currentStep: data.progress.current_step || 0,
      steps: data.progress.steps || ONBOARDING_STEPS,
      isCompleted: data.progress.is_completed || false,
      teamSize: data.progress.team_size,
      practiceGoals: data.progress.practice_goals || [],
      practiceType: data.progress.practice_type,
      painPoints: data.progress.pain_points?.length > 0 ? ensureThreePainPoints(data.progress.pain_points) : [],
    }
  } catch (error) {
    Logger.warn("context", "Error loading onboarding progress", { error })
    return null
  }
}

export async function saveProgressToApi(
  practiceId: string,
  progress: Partial<OnboardingProgress>,
): Promise<void> {
  try {
    await fetch(`/api/practices/${practiceId}/onboarding-progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(progress),
      credentials: "include",
    })
  } catch (error) {
    Logger.warn("context", "Error saving onboarding progress", { error })
  }
}

export async function loadPainPointsFromApi(practiceId: string): Promise<PainPoint[] | null> {
  try {
    const response = await fetch(`/api/practices/${practiceId}/pain-points`, { credentials: "include" })
    if (!response.ok) return null

    const data = await response.json()
    if (data.painPoints && data.painPoints.length > 0) {
      return ensureThreePainPoints(data.painPoints)
    }
    return null
  } catch (error) {
    Logger.warn("context", "Error loading pain points", { error })
    return null
  }
}

export async function savePainPointsToApi(
  practiceId: string,
  painPoints: PainPoint[],
  createGoals: boolean,
): Promise<{ goalsCreated: number } | null> {
  try {
    const filtered = painPoints.filter((p) => p.title.trim())
    const response = await fetch(`/api/practices/${practiceId}/pain-points`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ painPoints: filtered, createGoals }),
      credentials: "include",
    })
    if (!response.ok) throw new Error("Failed to save pain points")
    const result = await response.json()
    return { goalsCreated: result.goalsCreated || 0 }
  } catch (error) {
    Logger.error("context", "Error saving pain points", error)
    return null
  }
}

export async function awardWelcomeBadge(userId: string, practiceId: string): Promise<void> {
  try {
    const response = await fetch("/api/badges/award", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, practiceId, badgeId: "welcome_tour" }),
    })
    if (response.ok) {
      const data = await response.json()
      if (data.success && !data.alreadyEarned) {
        Logger.info("onboarding", "Welcome Tour badge awarded", { userId })
      }
    } else {
      Logger.warn("onboarding", "Badge award failed", { status: response.status })
    }
  } catch (error) {
    Logger.warn("onboarding", "Badge award request failed", { error })
  }
}

export function saveToLocalStorage(practiceId: string, data: Record<string, unknown>): void {
  try {
    localStorage.setItem(`onboarding_${practiceId}`, JSON.stringify(data))
  } catch {
    // localStorage may not be available
  }
}

export function loadFromLocalStorage(practiceId: string): Record<string, any> | null {
  try {
    const stored = localStorage.getItem(`onboarding_${practiceId}`)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}
