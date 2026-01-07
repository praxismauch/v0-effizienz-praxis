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
  isLoggingOut: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>
}

export function useAuth() {
  const { currentUser, loading, signOut, isLoggingOut } = useUser()

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
    isLoggingOut,
    signOut,
  }
}

export default AuthProvider
