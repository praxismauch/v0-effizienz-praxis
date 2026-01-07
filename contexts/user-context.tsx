"use client"

import { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { SupabaseClient } from "@supabase/supabase-js"
import { isSuperAdminRole, isPracticeAdminRole, normalizeRole } from "@/lib/auth-utils"

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
  "/team",
  "/info",
  "/wunschpatient",
  "/whats-new",
  "/updates",
  "/blog",
  // Legal pages
  "/impressum",
  "/datenschutz",
  "/agb",
  "/sicherheit",
  "/cookies",
]

const PUBLIC_ROUTE_PREFIXES = ["/features/", "/blog/", "/auth/"]

const isPublicRoute = (path: string): boolean => {
  // Check exact matches
  if (PUBLIC_ROUTES.some((route) => path === route)) return true

  // Check prefix matches for dynamic routes
  for (const prefix of PUBLIC_ROUTE_PREFIXES) {
    if (path.startsWith(prefix)) return true
  }

  return false
}

export function UserProvider({
  children,
  initialUser,
}: {
  children: ReactNode
  initialUser?: User | null
}) {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    // If we have an initial user from the server, use it
    if (initialUser) {
      if (IS_DEBUG) {
        console.debug("[v0] UserProvider: Using initialUser from server")
      }
      return initialUser
    }

    // Otherwise fall back to storage (for client-side navigation)
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

  const [superAdmins, setSuperAdmins] = useState<User[]>([])

  const [isAuthInitialized, setIsAuthInitialized] = useState(() => {
    // If we have initialUser from server, we're already initialized
    if (initialUser) return true

    // If we have a user in storage, we're initialized
    if (typeof window !== "undefined") {
      try {
        const stored =
          localStorage.getItem("effizienz_current_user") || sessionStorage.getItem("effizienz_current_user")
        if (stored) return true
      } catch {
        // Ignore
      }
    }
    return false
  })

  const [isLoading, setIsLoading] = useState(() => {
    if (initialUser) return false

    if (typeof window === "undefined") return true
    try {
      const stored = localStorage.getItem("effizienz_current_user") || sessionStorage.getItem("effizienz_current_user")
      return !stored
    } catch {
      return true
    }
  })

  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const router = useRouter()
  const pathname = usePathname()

  const hasAttemptedLoad = useRef(false)

  const supabaseRef = useRef<SupabaseClient | null>(null)
  const getSupabase = useCallback(() => {
    if (typeof window === "undefined") return null
    if (!supabaseRef.current) {
      supabaseRef.current = createClient()
    }
    return supabaseRef.current
  }, [])

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

  useEffect(() => {
    if (typeof window === "undefined") return

    if (currentUser) {
      setIsLoading(false)
      setIsAuthInitialized(true)
      return
    }

    if (hasAttemptedLoad.current) {
      setIsLoading(false)
      setIsAuthInitialized(true)
      return
    }

    const loadUser = async (retryCount = 0) => {
      hasAttemptedLoad.current = true

      try {
        const res = await fetch("/api/user/me", { credentials: "include" })

        if (res.status === 429 && retryCount < 3) {
          const delay = Math.pow(2, retryCount) * 5000 // 5s, 10s, 20s
          console.warn(`[user-context] Rate limited, retrying in ${delay}ms...`)
          setTimeout(() => loadUser(retryCount + 1), delay)
          return
        }

        const text = await res.text()
        let data: any

        try {
          data = JSON.parse(text)
        } catch (parseError) {
          if (text.includes("Too Many") || text.includes("rate")) {
            if (retryCount < 3) {
              const delay = Math.pow(2, retryCount) * 5000
              console.warn(`[user-context] Rate limited (text), retrying in ${delay}ms...`)
              setTimeout(() => loadUser(retryCount + 1), delay)
              return
            }
          }
          setIsLoading(false)
          setIsAuthInitialized(true)
          return
        }

        if (!res.ok) {
          setIsLoading(false)
          setIsAuthInitialized(true)
          return
        }

        if (data.user) {
          setCurrentUser(data.user)
          persistUserToStorage(data.user)
        }
      } catch (e) {
        console.error("[user-context] Failed to load current user", e)
      } finally {
        setIsLoading(false)
        setIsAuthInitialized(true)
      }
    }

    loadUser()
  }, [currentUser, persistUserToStorage])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (!currentUser) return
    if (!isSuperAdminRole(currentUser.role)) return

    const loadSuperAdmins = async (retryCount = 0) => {
      try {
        const res = await fetch("/api/super-admin/users", { credentials: "include" })

        // Handle rate limiting with retry
        if (res.status === 429 && retryCount < 3) {
          const delay = Math.pow(2, retryCount) * 5000 // 5s, 10s, 20s
          console.warn(`[v0] Rate limited fetching super admins, retrying in ${delay}ms...`)
          setTimeout(() => loadSuperAdmins(retryCount + 1), delay)
          return
        }

        if (res.status === 401 || res.status === 403) {
          // Not authorized - don't retry, just return empty
          return
        }

        if (!res.ok) {
          console.error(`[v0] Failed to load super admins: ${res.status}`)
          return
        }

        // Safely parse JSON - check content type first
        const contentType = res.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          console.error("[v0] Non-JSON response from super-admin/users")
          return
        }

        const text = await res.text()
        let data: any
        try {
          data = JSON.parse(text)
        } catch (parseError) {
          // Check if it's a rate limit text response
          if (text.includes("Too Many") || text.includes("rate")) {
            if (retryCount < 3) {
              const delay = Math.pow(2, retryCount) * 5000
              console.warn(`[v0] Rate limited (text response), retrying in ${delay}ms...`)
              setTimeout(() => loadSuperAdmins(retryCount + 1), delay)
              return
            }
          }
          console.error("[v0] Error parsing super admins response:", parseError)
          return
        }

        if (data.users && Array.isArray(data.users)) {
          const superAdminUsers = data.users
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
          setSuperAdmins(superAdminUsers)
        }
      } catch (e) {
        console.error("[v0] Failed to load super admins", e)
      }
    }

    loadSuperAdmins()
  }, [currentUser])

  useEffect(() => {
    if (currentUser) {
      persistUserToStorage(currentUser)
    }
  }, [currentUser, persistUserToStorage])

  useEffect(() => {
    if (!isAuthInitialized || isLoading) {
      return
    }

    const isPublic = isPublicRoute(pathname)

    if (isPublic && currentUser && pathname === "/") {
      router.push("/dashboard")
      return
    }

    if (!isPublic && !currentUser) {
      router.push("/auth/login")
    }
  }, [currentUser, isAuthInitialized, isLoading, pathname, router])

  const normalizedRole = useMemo(() => {
    const role = currentUser?.role
    return normalizeRole(role)
  }, [currentUser?.role])

  const createSuperAdmin = useCallback(async (userData: Omit<User, "id" | "joinedAt">) => {
    try {
      const res = await fetch("/api/super-admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: userData.email,
          password: "ChangeMe123!", // Temporary password
          name: userData.name,
          practiceId: userData.practiceId || null,
          preferred_language: userData.preferred_language || "de",
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to create super admin")
      }

      const data = await res.json()
      if (data.user) {
        setSuperAdmins((prev) => [...prev, data.user])
      }
    } catch (error) {
      console.error("Error creating super admin:", error)
      throw error
    }
  }, [])

  const updateSuperAdmin = useCallback(async (id: string, userData: Partial<User>) => {
    try {
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

      const data = await res.json()
      if (data.user) {
        setSuperAdmins((prev) => prev.map((admin) => (admin.id === id ? { ...admin, ...data.user } : admin)))
      }
    } catch (error) {
      console.error("Error updating super admin:", error)
      throw error
    }
  }, [])

  const deleteSuperAdmin = useCallback(
    async (id: string) => {
      if (currentUser?.id === id) {
        return { success: false, error: "Cannot delete the currently logged in super admin" }
      }

      if (superAdmins.length <= 1) {
        return { success: false, error: "Cannot delete the last super admin. At least one super admin must remain." }
      }

      try {
        const res = await fetch(`/api/super-admin/users/${id}`, {
          method: "DELETE",
          credentials: "include",
        })

        if (!res.ok) {
          const error = await res.json()
          return { success: false, error: error.error || "Failed to delete super admin" }
        }

        setSuperAdmins((prev) => prev.filter((admin) => admin.id !== id))
        return { success: true }
      } catch (error) {
        console.error("Error deleting super admin:", error)
        return { success: false, error: "Failed to delete super admin. Please try again." }
      }
    },
    [currentUser?.id, superAdmins.length],
  )

  const toggleSuperAdminStatus = useCallback(
    async (id: string) => {
      try {
        const admin = superAdmins.find((a) => a.id === id)
        if (!admin) return

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

        setSuperAdmins((prev) => prev.map((a) => (a.id === id ? { ...a, isActive: !a.isActive } : a)))
      } catch (error) {
        console.error("Error toggling super admin status:", error)
      }
    },
    [superAdmins],
  )

  const signOut = useCallback(async () => {
    if (isLoggingOut) return // Prevent double-clicks

    setIsLoggingOut(true)

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include", // Ensure cookies are sent
      })

      if (!response.ok) {
        console.error("[user-context] Logout API returned error:", response.status)
      }
    } catch (error) {
      console.error("[user-context] Logout error:", error)
    } finally {
      // Always clear client state after backend call attempt
      persistUserToStorage(null)
      setCurrentUser(null)
      setIsLoggingOut(false)

      if (typeof window !== "undefined") {
        window.location.href = "/auth/login"
      }
    }
  }, [persistUserToStorage, isLoggingOut])

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

  useEffect(() => {
    const supabase = getSupabase()
    if (!supabase) return

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        persistUserToStorage(null)
        setCurrentUser(null)
        setIsAuthInitialized(true)

        if (!isPublicRoute(pathname)) {
          router.push("/auth/login")
        }
      } else if (event === "SIGNED_IN" && session?.user) {
        const fetchUserWithRetry = async (retryCount = 0) => {
          try {
            const res = await fetch("/api/user/me", { credentials: "include" })

            // Handle rate limiting with retry
            if (res.status === 429 && retryCount < 3) {
              const delay = Math.pow(2, retryCount) * 5000
              console.warn(`[user-context] Rate limited on sign in, retrying in ${delay}ms...`)
              setTimeout(() => fetchUserWithRetry(retryCount + 1), delay)
              return
            }

            const text = await res.text()

            let data: any
            try {
              data = JSON.parse(text)
            } catch (parseError) {
              if (text.includes("Too Many") && retryCount < 3) {
                const delay = Math.pow(2, retryCount) * 5000
                setTimeout(() => fetchUserWithRetry(retryCount + 1), delay)
                return
              }
              return
            }

            if (res.ok && data.user) {
              setCurrentUser(data.user)
              persistUserToStorage(data.user)
              setIsAuthInitialized(true)
            }
          } catch (e) {
            console.error("Failed to fetch user profile after sign in:", e)
          }
        }

        fetchUserWithRetry()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [pathname, router, getSupabase, persistUserToStorage])

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
