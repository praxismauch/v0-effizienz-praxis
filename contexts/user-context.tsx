"use client"

import { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { isSuperAdminRole, isPracticeAdminRole } from "@/lib/auth-utils"
import Logger from "@/lib/logger"
import { useAuthSession } from "@/hooks/use-auth-session"
import { fetchSuperAdminUsers } from "@/lib/user-fetch-profile"
import type { User } from "@/lib/user-utils"

// Re-export User type for consumers
export type { User }

interface Practice {
  id: string
  name?: string
}

interface UserContextType {
  currentUser: User | null
  setCurrentUser: (user: User) => void
  currentPractice: Practice | null
  isAdmin: boolean
  isSuperAdmin: boolean
  loading: boolean
  isLoggingOut: boolean
  superAdmins: User[]
  createSuperAdmin: (userData: Omit<User, "id" | "joinedAt">) => void
  updateSuperAdmin: (id: string, userData: Partial<User>) => void
  deleteSuperAdmin: (id: string) => { success: boolean; error?: string }
  toggleSuperAdminStatus: (id: string) => void
  signOut: () => Promise<void>
}

export const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({
  children,
  initialUser,
}: {
  children: ReactNode
  initialUser?: User | null
}) {
  const { currentUser, setCurrentUser, loading, getSupabase, clearUser } = useAuthSession(initialUser)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [superAdmins, setSuperAdmins] = useState<User[]>([])
  const [sessionVerified, setSessionVerified] = useState(false)
  const hasFetchedSuperAdmins = useRef(false)
  const router = useRouter()

  // Fetch super admins
  useEffect(() => {
    if (!currentUser) return
    if (!isSuperAdminRole(currentUser.role)) return
    if (hasFetchedSuperAdmins.current) return
    hasFetchedSuperAdmins.current = true
    fetchSuperAdminUsers().then(setSuperAdmins)
  }, [currentUser])

  const isAdmin = useMemo(() => {
    if (!currentUser) return false
    return isPracticeAdminRole(currentUser.role) || isSuperAdminRole(currentUser.role)
  }, [currentUser])

  const isSuperAdmin = useMemo(() => {
    if (!currentUser) return false
    return isSuperAdminRole(currentUser.role)
  }, [currentUser])

  const signOut = useCallback(async () => {
    setIsLoggingOut(true)
    try {
      const supabase = getSupabase()
      if (supabase) await supabase.auth.signOut()
      await clearUser()
      setSessionVerified(false)
      router.push("/auth/login")
    } catch (error) {
      Logger.error("context", "Error signing out", error)
    } finally {
      setIsLoggingOut(false)
    }
  }, [getSupabase, clearUser, router])

  const createSuperAdmin = useCallback((userData: Omit<User, "id" | "joinedAt">) => {
    const newAdmin: User = {
      ...userData,
      id: crypto.randomUUID(),
      joinedAt: new Date().toISOString(),
      practiceId: userData.practiceId || null,
    }
    setSuperAdmins((prev) => [...prev, newAdmin])
  }, [])

  const updateSuperAdmin = useCallback((id: string, userData: Partial<User>) => {
    setSuperAdmins((prev) => prev.map((admin) => (admin.id === id ? { ...admin, ...userData } : admin)))
  }, [])

  const deleteSuperAdmin = useCallback(
    (id: string) => {
      if (currentUser?.id === id) return { success: false, error: "Cannot delete your own account" }
      setSuperAdmins((prev) => prev.filter((admin) => admin.id !== id))
      return { success: true }
    },
    [currentUser?.id],
  )

  const toggleSuperAdminStatus = useCallback((id: string) => {
    setSuperAdmins((prev) => prev.map((admin) => (admin.id === id ? { ...admin, isActive: !admin.isActive } : admin)))
  }, [])

  const currentPractice = useMemo(() => {
    if (!currentUser || !currentUser.practiceId) return null
    return {
      id: currentUser.practiceId || currentUser.practice_id || "1",
      name: undefined,
    }
  }, [currentUser])

  const contextValue = useMemo(
    () => ({
      currentUser,
      setCurrentUser,
      currentPractice,
      isAdmin,
      isSuperAdmin,
      loading,
      isLoggingOut,
      superAdmins,
      createSuperAdmin,
      updateSuperAdmin,
      deleteSuperAdmin,
      toggleSuperAdminStatus,
      signOut,
    }),
    [
      currentUser, setCurrentUser, currentPractice, isAdmin, isSuperAdmin,
      loading, isLoggingOut, superAdmins, createSuperAdmin, updateSuperAdmin,
      deleteSuperAdmin, toggleSuperAdminStatus, signOut,
    ],
  )

  return <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}

export default UserProvider
