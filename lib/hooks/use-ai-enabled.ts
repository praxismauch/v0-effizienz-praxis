"use client"

import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"
import { useState, useEffect } from "react"

/**
 * Hook to check if AI functions are enabled for the current practice.
 * Super admins always have AI functions enabled.
 * Returns { isAiEnabled: boolean, isLoading: boolean }
 */
export function useAiEnabled() {
  const { currentUser } = useUser()
  const { currentPractice } = usePractice()
  const [isAiEnabled, setIsAiEnabled] = useState(true) // Default to enabled
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAiEnabled = async () => {
      if (currentUser?.role === "superadmin") {
        setIsAiEnabled(true)
        setIsLoading(false)
        return
      }

      if (
        !currentPractice?.id ||
        currentPractice.id === "0" ||
        currentPractice.id === "null" ||
        currentPractice.id === "undefined"
      ) {
        setIsAiEnabled(false)
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/practices/${currentPractice.id}/settings`)
        if (response.ok) {
          const data = await response.json()
          const aiEnabled = data.settings?.system_settings?.aiEnabled !== false // Default to true if not set
          setIsAiEnabled(aiEnabled)
        } else {
          // If settings can't be loaded, default to enabled
          setIsAiEnabled(true)
        }
      } catch (error) {
        console.error("Error checking AI enabled status:", error)
        // On error, default to enabled
        setIsAiEnabled(true)
      } finally {
        setIsLoading(false)
      }
    }

    checkAiEnabled()
  }, [currentUser, currentPractice])

  return { isAiEnabled, isLoading }
}

export default useAiEnabled
