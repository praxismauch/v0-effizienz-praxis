"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { usePractice } from "@/contexts/practice-context"
import { useUser } from "@/contexts/user-context"
import { OnboardingWizard } from "./onboarding-wizard"

interface OnboardingWrapperProps {
  children: React.ReactNode
}

export function OnboardingWrapper({ children }: OnboardingWrapperProps) {
  const { currentPractice, isLoading: practiceLoading } = usePractice()
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
