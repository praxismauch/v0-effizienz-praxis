"use client"

import { createContext, type ReactNode } from "react"
import { useUser } from "./user-context"

// Removed all Supabase imports and logic - this now only reads from UserProvider
interface AuthContextType {
  user: {
    id: string
    email: string
    name?: string
  } | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>
}

export function useAuth() {
  const { currentUser, loading } = useUser()

  // Simple logout helper that redirects to login
  const signOut = async () => {
    try {
      // Call the logout API route
      await fetch("/api/auth/logout", { method: "POST" })

      // Clear user from context
      if (typeof window !== "undefined") {
        localStorage.removeItem("effizienz_current_user")
        sessionStorage.removeItem("effizienz_current_user")
        window.location.href = "/auth/login"
      }
    } catch (error) {
      console.error("Logout error:", error)
      // Force redirect even on error
      if (typeof window !== "undefined") {
        window.location.href = "/auth/login"
      }
    }
  }

  // Map UserProvider data to AuthProvider interface for backward compatibility
  const authUser = currentUser
    ? {
        id: currentUser.id,
        email: currentUser.email,
        name: currentUser.name,
      }
    : null

  return {
    user: authUser,
    loading,
    signOut,
  }
}

export default AuthProvider
