"use client"

import { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import type { SupabaseClient } from "@supabase/supabase-js"
import { isSuperAdminRole, isPracticeAdminRole, normalizeRole } from "@/lib/auth-utils"
import { swrFetcher } from "@/lib/swr-fetcher"

const IS_DEBUG = process.env.NEXT_PUBLIC_VERCEL_ENV !== "production"

export interface User {
  id: string
  name: string
  email: string
  role: "superadmin" | "admin" | "doctor" | "nurse" | "receptionist"
  avatar?: string
  practiceId: string | null
  isActive: boolean
  joinedAt: string
  preferred_language?: string
  practice_id?: string
  defaultPracticeId?: string | null
  firstName?: string
}

interface UserContextType {
  currentUser: User | null
  setCurrentUser: (user: User) => void
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

const PUBLIC_ROUTES = [
  "/",
  // Auth routes
  "/auth/login",
  "/auth/register",
  "/auth/sign-up",
  "/auth/reset-password",
  "/auth/callback",
  "/auth/pending-approval",
  "/auth/sign-up-success",
  // Landing pages
  "/features",
  "/effizienz",
  "/about",
  "/contact",
  "/kontakt",
  "/preise",
  "/coming-soon",
  "/demo",
  "/help",
  "/careers",
  "/karriere",
  "/ueber-uns",
  // Legal pages
  "/impressum",
  "/datenschutz",
  "/agb",
  "/sicherheit",
  "/cookies",
]

const PUBLIC_ROUTE_PREFIXES = ["/features/", "/blog/", "/auth/"]

const isPublicRoute = (path: string): boolean => {
  if (PUBLIC_ROUTES.some((route) => path === route)) return true
  for (const prefix of PUBLIC_ROUTE_PREFIXES) {
    if (path.startsWith(prefix)) return true
  }
  return false
}

const USER_SWR_CONFIG = {
  revalidateOnFocus: false,
  dedupingInterval: 300,
  errorRetryCount: 2,
  shouldRetryOnError: (error: { status?: number }) => {
    return error?.status !== 401 && error?.status !== 403
  },
}

export function UserProvider({
  children,
  initialUser,
}: {
  children: ReactNode
  initialUser?: User | null
}) {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    if (initialUser) {
      if (IS_DEBUG) {
        console.debug("[v0] UserProvider: Using initialUser from server")
      }
      return initialUser
    }

    if (typeof window === "undefined") return null
    try {
      const stored = localStorage.getItem("effizienz_current_user") || sessionStorage.getItem("effizienz_current_user")
      if (stored) {
        if (IS_DEBUG) {
          console.debug("[v0] UserProvider: Using stored user from localStorage/sessionStorage")
        }
        return JSON.parse(stored) as User
      }
    } catch (e) {
      if (IS_DEBUG) {
        console.debug("[v0] UserProvider: Error parsing stored user:", e)
      }
    }
    return null
  })

  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const supabaseRef = useRef<SupabaseClient | null>(null)
  const getSupabase = useCallback(() => {
    if (typeof window === "undefined") return null
    if (!supabaseRef.current) {
      supabaseRef.current = createClient()
    }
    return supabaseRef.current
  }, [])

  const shouldFetchUser = typeof window !== "undefined" && !isPublicRoute(pathname) && !currentUser && !initialUser

  const {
    data: userData,
    isLoading: userLoading,
    mutate: mutateUser,
  } = useSWR<{ user: User }>(shouldFetchUser ? "/api/user/me" : null, swrFetcher, USER_SWR_CONFIG)

  useEffect(() => {
    if (userData?.user && !currentUser) {
      console.log("[v0] UserContext: User loaded via SWR:", userData.user.id)
      setCurrentUser(userData.user)
      persistUserToStorage(userData.user)
    }
  }, [userData, currentUser])

  const shouldFetchSuperAdmins = currentUser && isSuperAdminRole(currentUser.role)

  const { data: superAdminsData, mutate: mutateSuperAdmins } = useSWR<{ users: any[] }>(
    shouldFetchSuperAdmins ? "/api/super-admin/users" : null,
    swrFetcher,
    { ...USER_SWR_CONFIG, revalidateOnFocus: false },
  )

  const superAdmins = useMemo(() => {
    if (!superAdminsData?.users) return []
    return superAdminsData.users
      .filter((u: any) => isSuperAdminRole(u.role))
      .map((u: any) => ({
        id: u.id,
        name: u.name || `${u.first_name || ""} ${u.last_name || ""}`.trim() || "Unknown",
        email: u.email,
        role: u.role,
        isActive: u.is_active ?? true,
        practiceId: u.practice_id?.toString() || null,
        joinedAt: u.created_at || new Date().toISOString(),
        avatar: u.avatar,
        preferred_language: u.preferred_language,
      }))
  }, [superAdminsData])

  const persistUserToStorage = useCallback((user: User | null) => {
    if (typeof window === "undefined") return

    if (user) {
      try {
        const userToStore = JSON.stringify(user)
        localStorage.setItem("effizienz_current_user", userToStore)
        sessionStorage.setItem("effizienz_current_user", userToStore)
      } catch (error) {
        console.error("Error persisting user:", error)
      }
    } else {
      try {
        localStorage.removeItem("effizienz_current_user")
        sessionStorage.removeItem("effizienz_current_user")
      } catch (error) {
        console.error("Error clearing storage:", error)
      }
    }
  }, [])

  const isLoading = shouldFetchUser ? userLoading : false

  useEffect(() => {
    if (currentUser) {
      persistUserToStorage(currentUser)
    }
  }, [currentUser, persistUserToStorage])

  // Navigation effect - redirect logic
  useEffect(() => {
    if (isLoading || userLoading) return

    const isPublic = isPublicRoute(pathname)

    if (isPublic && currentUser && pathname === "/") {
      router.push("/dashboard")
      return
    }

    if (!isPublic && !currentUser && !shouldFetchUser) {
      router.push("/auth/login")
    }
  }, [currentUser, isLoading, userLoading, pathname, router, shouldFetchUser])

  const normalizedRole = useMemo(() => {
    const role = currentUser?.role
    return normalizeRole(role)
  }, [currentUser?.role])

  const createSuperAdmin = useCallback(
    async (userData: Omit<User, "id" | "joinedAt">) => {
      try {
        const res = await fetch("/api/super-admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            email: userData.email,
            password: "ChangeMe123!",
            name: userData.name,
            practiceId: userData.practiceId || null,
            preferred_language: userData.preferred_language || "de",
          }),
        })

        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.error || "Failed to create super admin")
        }

        // Revalidate SWR cache
        await mutateSuperAdmins()
      } catch (error) {
        console.error("Error creating super admin:", error)
        throw error
      }
    },
    [mutateSuperAdmins],
  )

  const updateSuperAdmin = useCallback(
    async (id: string, userData: Partial<User>) => {
      // Optimistic update
      const optimisticData = superAdminsData
        ? {
            users: superAdminsData.users.map((admin: any) => (admin.id === id ? { ...admin, ...userData } : admin)),
          }
        : undefined

      try {
        await mutateSuperAdmins(
          async () => {
            const res = await fetch(`/api/super-admin/users/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                name: userData.name,
                email: userData.email,
                isActive: userData.isActive,
                practiceId: userData.practiceId,
                preferred_language: userData.preferred_language,
              }),
            })

            if (!res.ok) {
              const error = await res.json()
              throw new Error(error.error || "Failed to update super admin")
            }

            return superAdminsData
          },
          { optimisticData, rollbackOnError: true },
        )
      } catch (error) {
        console.error("Error updating super admin:", error)
        throw error
      }
    },
    [mutateSuperAdmins, superAdminsData],
  )

  const deleteSuperAdmin = useCallback(
    async (id: string) => {
      if (currentUser?.id === id) {
        return { success: false, error: "Cannot delete the currently logged in super admin" }
      }

      if (superAdmins.length <= 1) {
        return { success: false, error: "Cannot delete the last super admin. At least one super admin must remain." }
      }

      // Optimistic update
      const optimisticData = superAdminsData
        ? {
            users: superAdminsData.users.filter((admin: any) => admin.id !== id),
          }
        : undefined

      try {
        await mutateSuperAdmins(
          async () => {
            const res = await fetch(`/api/super-admin/users/${id}`, {
              method: "DELETE",
              credentials: "include",
            })

            if (!res.ok) {
              const error = await res.json()
              throw new Error(error.error || "Failed to delete super admin")
            }

            return optimisticData
          },
          { optimisticData, rollbackOnError: true },
        )
        return { success: true }
      } catch (error) {
        console.error("Error deleting super admin:", error)
        return { success: false, error: "Failed to delete super admin. Please try again." }
      }
    },
    [currentUser?.id, superAdmins.length, mutateSuperAdmins, superAdminsData],
  )

  const toggleSuperAdminStatus = useCallback(
    async (id: string) => {
      const admin = superAdmins.find((a) => a.id === id)
      if (!admin) return

      // Optimistic update
      const optimisticData = superAdminsData
        ? {
            users: superAdminsData.users.map((a: any) => (a.id === id ? { ...a, is_active: !a.is_active } : a)),
          }
        : undefined

      try {
        await mutateSuperAdmins(
          async () => {
            const res = await fetch(`/api/super-admin/users/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                isActive: !admin.isActive,
              }),
            })

            if (!res.ok) {
              throw new Error("Failed to toggle status")
            }

            return optimisticData
          },
          { optimisticData, rollbackOnError: true },
        )
      } catch (error) {
        console.error("Error toggling super admin status:", error)
      }
    },
    [superAdmins, mutateSuperAdmins, superAdminsData],
  )

  const signOut = useCallback(async () => {
    if (isLoggingOut) return

    setIsLoggingOut(true)

    try {
      persistUserToStorage(null)
      setCurrentUser(null)

      const supabase = getSupabase()
      if (supabase) {
        await supabase.auth.signOut({ scope: "global" })
      }

      supabaseRef.current = null

      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })

      if (!response.ok) {
        console.error("[user-context] Logout API returned error:", response.status)
      }

      // Clear SWR caches
      mutateUser(undefined, { revalidate: false })
      mutateSuperAdmins(undefined, { revalidate: false })
    } catch (error) {
      console.error("[user-context] Logout error:", error)
    } finally {
      setIsLoggingOut(false)

      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("effizienz_current_user")
          sessionStorage.removeItem("effizienz_current_user")
          Object.keys(localStorage).forEach((key) => {
            if (key.startsWith("sb-") || key.includes("supabase")) {
              localStorage.removeItem(key)
            }
          })
        } catch (e) {
          console.error("[user-context] Error clearing storage:", e)
        }

        window.location.replace("/auth/login")
      }
    }
  }, [persistUserToStorage, isLoggingOut, getSupabase, mutateUser, mutateSuperAdmins])

  const contextValue = useMemo(
    () => ({
      currentUser,
      setCurrentUser,
      isAdmin: isPracticeAdminRole(normalizedRole) || normalizedRole === "admin",
      isSuperAdmin: isSuperAdminRole(normalizedRole),
      loading: isLoading,
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
      normalizedRole,
      isLoading,
      isLoggingOut,
      superAdmins,
      createSuperAdmin,
      updateSuperAdmin,
      deleteSuperAdmin,
      toggleSuperAdminStatus,
      signOut,
    ],
  )

  // Auth state change listener
  useEffect(() => {
    const supabase = getSupabase()
    if (!supabase) return

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        persistUserToStorage(null)
        setCurrentUser(null)
        mutateUser(undefined, { revalidate: false })

        if (!isPublicRoute(pathname)) {
          router.push("/auth/login")
        }
      } else if (event === "SIGNED_IN" && session?.user) {
        // Revalidate user data via SWR
        mutateUser()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [pathname, router, getSupabase, persistUserToStorage, mutateUser])

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
