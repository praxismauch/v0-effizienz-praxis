"use client"

import { useRouter } from "next/navigation"
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard"
import { usePractice } from "@/contexts/practice-context"
import { useUser } from "@/contexts/user-context"
import { useEffect } from "react"

export default function OnboardingPage() {
  const router = useRouter()
  const { currentPractice, isLoading: practiceLoading } = usePractice()
  const { currentUser, loading: userLoading } = useUser()

  useEffect(() => {
    if (!userLoading && !currentUser) {
      router.push("/auth/login")
    }
  }, [currentUser, userLoading, router])

  const handleComplete = async () => {
    // Mark onboarding as completed
    if (currentPractice?.id) {
      try {
        await fetch(`/api/practices/${currentPractice.id}/settings`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            onboarding_completed: true,
            onboarding_completed_at: new Date().toISOString(),
          }),
        })
      } catch (error) {
        console.error("Error marking onboarding complete:", error)
      }
    }
    router.push("/dashboard")
  }

  const handleSkip = () => {
    if (currentPractice?.id) {
      localStorage.setItem(`onboarding_skipped_${currentPractice.id}`, "true")
    }
    router.push("/dashboard")
  }

  if (userLoading || practiceLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return <OnboardingWizard onComplete={handleComplete} onSkip={handleSkip} />
}
