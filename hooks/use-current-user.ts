"use client"

import { useUser } from "@/contexts/user-context"

export function useCurrentUser() {
  const { currentUser, loading, currentPractice } = useUser()
  
  return {
    user: currentUser,
    currentUser,
    currentPractice,
    isLoading: loading,
    isAuthenticated: !!currentUser,
  }
}
