"use client"

import type React from "react"

import { useState, useEffect, useContext } from "react"
import { useUser } from "@/contexts/user-context"
import { OnboardingWizard } from "./onboarding-wizard"

// Import PracticeContext directly to do a safe check without throwing
import { PracticeContext } from "@/contexts/practice-context"

interface OnboardingWrapperProps {
  children: React.ReactNode
}

export function OnboardingWrapper({ children }: OnboardingWrapperProps) {
  const practiceContext = useContext(PracticeContext)

  // If PracticeProvider is not in the tree yet (e.g. during SSR), just render children
  if (!practiceContext) {
    return <>{children}</>
  }

  return <OnboardingWrapperInner practiceContext={practiceContext}>{children}</OnboardingWrapperInner>
}

function OnboardingWrapperInner({
  children,
  practiceContext,
}: {
  children: React.ReactNode
  practiceContext: NonNullable<ReturnType<typeof useContext<typeof PracticeContext>>>
}) {
  const { currentPractice, isLoading: practiceLoading } = practiceContext!
  const { currentUser, loading: userLoading } = useUser()
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [hasChecked, setHasChecked] = useState(false)

  useEffect(() => {
    // Don't check until loading is complete
    if (practiceLoading || userLoading || hasChecked) return

    const checkOnboardingStatus = async () => {
      try {
        // Check if onboarding was already completed or skipped
        const storageKey = `onboarding_skipped_${currentPractice?.id}`
        const wasSkipped = localStorage.getItem(storageKey)

        if (wasSkipped) {
          setHasChecked(true)
          return
        }

        // Check if practice has onboarding_completed in settings
        if (currentPractice?.id) {
          const response = await fetch(`/api/practices/${currentPractice.id}/settings`)
          if (response.ok) {
            const data = await response.json()
            if (data.settings?.onboarding_completed) {
              setHasChecked(true)
              return
            }
          }
        }

        // Check if this is a new practice (no team members, recently created)
        if (currentPractice?.id && currentUser) {
          const teamResponse = await fetch(`/api/practices/${currentPractice.id}/team-members`)
          if (teamResponse.ok) {
            const teamData = await teamResponse.json()
            const teamMembers = teamData.teamMembers || []

            // Show onboarding if:
            // 1. Practice was created within last 7 days AND
            // 2. Team has 1 or fewer members (just the creator)
            const practiceCreatedAt = new Date(currentPractice.createdAt || Date.now())
            const daysSinceCreation = (Date.now() - practiceCreatedAt.getTime()) / (1000 * 60 * 60 * 24)

            if (daysSinceCreation <= 7 && teamMembers.length <= 1) {
              setShowOnboarding(true)
            }
          }
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error)
      } finally {
        setHasChecked(true)
      }
    }

    checkOnboardingStatus()
  }, [currentPractice, currentUser, practiceLoading, userLoading, hasChecked])

  const handleComplete = () => {
    setShowOnboarding(false)
  }

  const handleSkip = () => {
    if (currentPractice?.id) {
      localStorage.setItem(`onboarding_skipped_${currentPractice.id}`, "true")
    }
    setShowOnboarding(false)
  }

  if (showOnboarding) {
    return <OnboardingWizard onComplete={handleComplete} onSkip={handleSkip} />
  }

  return <>{children}</>
}

export default OnboardingWrapper
