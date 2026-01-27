"use client"

import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"

export function useCurrentUser() {
  const { currentUser, loading: userLoading } = useUser()
  const { currentPractice, isLoading: practiceLoading } = usePractice()
  
  return {
    user: currentUser,
    currentUser,
    currentPractice,
    isLoading: userLoading || practiceLoading,
    isAuthenticated: !!currentUser,
  }
}
