"use client"

import { useAuth } from "@/contexts/auth-context"

export function useCurrentUser() {
  const { currentUser, isLoading } = useAuth()
  
  return {
    user: currentUser,
    isLoading,
    isAuthenticated: !!currentUser,
  }
}
