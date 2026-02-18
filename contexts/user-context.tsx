"use client"

import { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { SupabaseClient } from "@supabase/supabase-js"
import { isSuperAdminRole, isPracticeAdminRole } from "@/lib/auth-utils"
import Logger from "@/lib/logger"
import { encryptStorage, decryptStorage, isStorageExpired } from "@/lib/storage-utils"
import { retryWithBackoff, isAuthError } from "@/lib/retry-utils"
import { 
  type User, 
  mapProfileToUser, 
  isPublicRoute, 
  dispatchAuthRecovered 
} from "@/lib/user-utils"
import { fetchUserProfile, onProfileFetched, fetchSuperAdminUsers } from "@/lib/user-fetch-profile"

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
  const [currentUser, setCurrentUser] = useState<User | null>(initialUser || null)
  const [loading, setLoading] = useState(!initialUser)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [superAdmins, setSuperAdmins] = useState<User[]>([])
  const [mounted, setMounted] = useState(false)
  const [sessionVerified, setSessionVerified] = useState(false)

  const router = useRouter()
  const pathname = usePathname()
  const hasFetchedUser = useRef(false)
  const hasFetchedSuperAdmins = useRef(false)
  const fetchAttempts = useRef(0)
  const lastFetchTime = useRef(0)
  const MAX_FETCH_ATTEMPTS = 3
  const FETCH_COOLDOWN_MS = 2000

  const supabaseRef = useRef<SupabaseClient | null>(null)
  const getSupabase = useCallback(() => {
    if (typeof window === "undefined") return null
    if (!supabaseRef.current) {
      try {
        supabaseRef.current = createClient()
      } catch {
        return null
      }
    }
    return supabaseRef.current
  }, [])

  // Removed debug logging

  const persistUserToStorage = useCallback(async (user: User | null) => {
    if (typeof window === "undefined") return

    if (user) {
      try {
        const encrypted = await encryptStorage(user, 86400)
        sessionStorage.setItem("effizienz_current_user", encrypted)
      } catch (error) {
        Logger.error("context", "Error persisting user", error)
      }
    } else {
      try {
        sessionStorage.removeItem("effizienz_current_user")
      } catch (error) {
        Logger.error("context", "Error clearing storage", error)
      }
    }
  }, [])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Restore user from storage - runs only once on mount
  useEffect(() => {
    if (!mounted) return
    if (hasFetchedUser.current) return
    if (initialUser) {
      hasFetchedUser.current = true
      setLoading(false)
      return
    }

    const restoreUser = async () => {
      try {
        const stored = sessionStorage.getItem("effizienz_current_user")
        if (stored) {
          if (isStorageExpired(stored)) {
            sessionStorage.removeItem("effizienz_current_user")
            return
          }

          const parsedUser = await decryptStorage(stored)
          if (parsedUser) {
            setCurrentUser(parsedUser as User)
            hasFetchedUser.current = true
            setLoading(false)
            return
          } else {
            sessionStorage.removeItem("effizienz_current_user")
          }
        }
      } catch (e) {
        sessionStorage.removeItem("effizienz_current_user")
      }
    }

    restoreUser()
  }, [mounted, initialUser])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (!mounted) return
    if (hasFetchedUser.current) {
      return
    }
    if (currentUser || initialUser) {
      hasFetchedUser.current = true
      setLoading(false)
      return
    }
    if (isPublicRoute(pathname)) {
      setLoading(false)
      return
    }

    const fetchUser = async () => {
      // Loop prevention: check if we're fetching too frequently
      const now = Date.now()
      if (now - lastFetchTime.current < FETCH_COOLDOWN_MS) {
        setLoading(false)
        return
      }
      
      // Loop prevention: check max attempts
      fetchAttempts.current += 1
      if (fetchAttempts.current > MAX_FETCH_ATTEMPTS) {
        hasFetchedUser.current = true
        setLoading(false)
        return
      }
      
      lastFetchTime.current = now
      
      try {
        await retryWithBackoff(
          async () => {
            const DEV_USER_EMAIL = process.env.NEXT_PUBLIC_DEV_USER_EMAIL
            const IS_DEV_MODE =
              process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN === "true" && process.env.NODE_ENV !== "production"

            if (IS_DEV_MODE) {
              if (!DEV_USER_EMAIL) {
                throw new Error("Dev mode enabled but NEXT_PUBLIC_DEV_USER_EMAIL not set")
              }

              const response = await fetch("/api/auth/dev-user", {
                credentials: "include",
              })

              if (!response.ok) {
                throw new Error(`Dev user fetch failed: ${response.status}`)
              }

              const data = await response.json()
              if (!data.user) {
                throw new Error("No user data in dev response")
              }

              const user = mapProfileToUser(data.user, DEV_USER_EMAIL)
              setCurrentUser(user)
              await persistUserToStorage(user)
              hasFetchedUser.current = true
              dispatchAuthRecovered()
              return
            }

            const supabase = getSupabase()
            if (!supabase) {
              throw new Error("Supabase client not available")
            }

            let authUser = null
            let authError = null
            
            try {
              const result = await supabase.auth.getUser()
              authUser = result.data?.user
              authError = result.error
            } catch (fetchError: unknown) {
              // Handle network errors gracefully - user is not logged in
              const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError)
              if (errorMessage.includes("fetch") || errorMessage.includes("Failed") || errorMessage.includes("network")) {
                throw new Error("Network error - no session available")
              }
              throw fetchError
            }

            if (authError || !authUser) {
              // No session is a normal state, not an error - user is not logged in
              setLoading(false)
              return
            }

            const user = await fetchUserProfile(
              supabase,
              authUser.id,
              authUser.email,
              authUser.user_metadata,
            )
            if (user) {
              setCurrentUser(user)
              await persistUserToStorage(user)
              hasFetchedUser.current = true
              onProfileFetched()
            }
          },
          {
            maxAttempts: 3,
            initialDelay: 1000,
          },
        )
      } catch (error) {
        Logger.error("context", "Error fetching user after retries", error)
        if (isAuthError(error)) {
          hasFetchedUser.current = true
        }
        setCurrentUser(null)
        await persistUserToStorage(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [pathname, initialUser, router, persistUserToStorage, getSupabase, mounted])

  // Use a ref to track if we already have a subscription to prevent duplicates
  const authSubscriptionRef = useRef<{ unsubscribe: () => void } | null>(null)
  // Use a ref for currentUser in the auth callback to avoid re-subscribing
  const currentUserRef = useRef<User | null>(currentUser)
  
  // Keep the ref in sync with state
  useEffect(() => {
    currentUserRef.current = currentUser
  }, [currentUser])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (!mounted) return
    const IS_DEV_MODE = process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN === "true" && process.env.NODE_ENV !== "production"

    if (IS_DEV_MODE) return

    // Prevent duplicate subscriptions
    if (authSubscriptionRef.current) return

    const supabase = getSupabase()
    if (!supabase) return

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Loop prevention for auth state changes
      const now = Date.now()
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (now - lastFetchTime.current < FETCH_COOLDOWN_MS) {
          return
        }
        // Use ref instead of state to avoid re-subscribing
        if (hasFetchedUser.current && currentUserRef.current) {
          return
        }
        lastFetchTime.current = now
      }

      if (event === "SIGNED_OUT") {
        setCurrentUser(null)
        await persistUserToStorage(null)
        hasFetchedUser.current = false
        fetchAttempts.current = 0
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (session?.user) {
          try {
            const user = await fetchUserProfile(
              supabase,
              session.user.id,
              session.user.email,
              session.user.user_metadata,
            )
            if (user) {
              setCurrentUser(user)
              await persistUserToStorage(user)
              hasFetchedUser.current = true
              onProfileFetched()
            }
          } catch (error) {
            Logger.error("context", "Error fetching user profile in auth state change", error)
          }
        }
      }
    })

    authSubscriptionRef.current = subscription

    return () => {
      subscription.unsubscribe()
      authSubscriptionRef.current = null
    }
  }, [mounted, getSupabase, persistUserToStorage])

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
      if (supabase) {
        await supabase.auth.signOut()
      }
      setCurrentUser(null)
      await persistUserToStorage(null)
      hasFetchedUser.current = false
      setSessionVerified(false)
      router.push("/auth/login")
    } catch (error) {
      Logger.error("context", "Error signing out", error)
    } finally {
      setIsLoggingOut(false)
    }
  }, [getSupabase, persistUserToStorage, router])

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
      if (currentUser?.id === id) {
        return { success: false, error: "Cannot delete your own account" }
      }
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
      setCurrentUser: (user: User) => {
        setCurrentUser(user)
        persistUserToStorage(user).catch((error) => {
          Logger.error("context", "Error persisting user in setCurrentUser", error)
        })
      },
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
      currentUser,
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
      persistUserToStorage,
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
