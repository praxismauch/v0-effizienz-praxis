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
  "/auth/login",
  "/auth/register",
  "/auth/sign-up",
  "/auth/reset-password",
  "/auth/callback",
  "/auth/pending-approval",
  "/auth/sign-up-success",
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
        console.debug("[UserProvider] Using initialUser from server")
      }
      return initialUser
    }

    if (typeof window === "undefined") return null
    try {
      const stored = localStorage.getItem("effizienz_current_user") || sessionStorage.getItem("effizienz_current_user")
      if (stored) {
        if (IS_DEBUG) {
          console.debug("[UserProvider] Using stored user from localStorage/sessionStorage")
        }
        return JSON.parse(stored) as User
      }
    } catch (e) {
      if (IS_DEBUG) {
        console.debug("[UserProvider] Error parsing stored user:", e)
      }
    }
    return null
  })

  const [loading, setLoading] = useState(!initialUser && !currentUser)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [superAdmins, setSuperAdmins] = useState<User[]>([])

  const router = useRouter()
  const pathname = usePathname()
  const hasFetchedUser = useRef(false)
  const hasFetchedSuperAdmins = useRef(false)

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
    if (hasFetchedUser.current) return
    if (currentUser || initialUser) {
      setLoading(false)
      return
    }
    if (isPublicRoute(pathname)) {
      setLoading(false)
      return
    }

    const fetchUser = async () => {
      hasFetchedUser.current = true
      setLoading(true)

      try {
        const response = await fetch("/api/user/me", {
          credentials: "include",
        })

        if (response.ok) {
          const data = await response.json()
          if (data.user) {
            setCurrentUser(data.user)
            persistUserToStorage(data.user)
          }
        } else if (response.status === 401) {
          // Not authenticated - redirect to login
          if (!isPublicRoute(pathname)) {
            router.push("/auth/login")
          }
        }
      } catch (error) {
        console.error("Error fetching user:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [pathname, currentUser, initialUser, router, persistUserToStorage])

  useEffect(() => {
    if (!currentUser) return
    if (!isSuperAdminRole(currentUser.role)) return
    if (hasFetchedSuperAdmins.current) return

    const fetchSuperAdmins = async () => {
      hasFetchedSuperAdmins.current = true

      try {
        const response = await fetch("/api/super-admin/users", {
          credentials: "include",
        })

        if (response.ok) {
          const data = await response.json()
          if (data.users) {
            const admins = data.users
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
            setSuperAdmins(admins)
          }
        }
      } catch (error) {
        console.error("Error fetching super admins:", error)
      }
    }

    // Small delay to not block initial render
    const timer = setTimeout(fetchSuperAdmins, 100)
    return () => clearTimeout(timer)
  }, [currentUser])

  useEffect(() => {
    if (currentUser) {
      persistUserToStorage(currentUser)
    }
  }, [currentUser, persistUserToStorage])

  // Navigation effect - redirect logic
  useEffect(() => {
    if (loading) return

    const isPublic = isPublicRoute(pathname)

    if (isPublic && currentUser && pathname === "/") {
      router.push("/dashboard")
      return
    }

    if (!isPublic && !currentUser && !loading) {
      router.push("/auth/login")
    }
  }, [currentUser, loading, pathname, router])

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

      const data = await res.json()
      const newAdmin: User = {
        id: data.user?.id || `temp-${Date.now()}`,
        name: userData.name,
        email: userData.email,
        role: "superadmin",
        isActive: true,
        practiceId: userData.practiceId || null,
        joinedAt: new Date().toISOString(),
        preferred_language: userData.preferred_language,
      }
      setSuperAdmins((prev) => [...prev, newAdmin])
    } catch (error) {
      console.error("Error creating super admin:", error)
      throw error
    }
  }, [])

  const updateSuperAdmin = useCallback(async (id: string, userData: Partial<User>) => {
    // Update local state immediately
    setSuperAdmins((prev) => prev.map((admin) => (admin.id === id ? { ...admin, ...userData } : admin)))

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
    } catch (error) {
      console.error("Error updating super admin:", error)
      // Revert on error - refetch
      hasFetchedSuperAdmins.current = false
      throw error
    }
  }, [])

  const deleteSuperAdmin = useCallback((id: string) => {
    setSuperAdmins((prev) => prev.filter((admin) => admin.id !== id))

    fetch(`/api/super-admin/users/${id}`, {
      method: "DELETE",
      credentials: "include",
    }).catch((error) => {
      console.error("Error deleting super admin:", error)
    })

    return { success: true }
  }, [])

  const toggleSuperAdminStatus = useCallback(
    (id: string) => {
      setSuperAdmins((prev) => prev.map((admin) => (admin.id === id ? { ...admin, isActive: !admin.isActive } : admin)))

      const admin = superAdmins.find((a) => a.id === id)
      if (admin) {
        fetch(`/api/super-admin/users/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ isActive: !admin.isActive }),
        }).catch((error) => {
          console.error("Error toggling super admin status:", error)
        })
      }
    },
    [superAdmins],
  )

  const signOut = useCallback(async () => {
    setIsLoggingOut(true)
    try {
      const supabase = getSupabase()
      if (supabase) {
        await supabase.auth.signOut()
      }

      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })

      setCurrentUser(null)
      persistUserToStorage(null)
      hasFetchedUser.current = false
      hasFetchedSuperAdmins.current = false

      router.push("/auth/login")
    } catch (error) {
      console.error("Error signing out:", error)
    } finally {
      setIsLoggingOut(false)
    }
  }, [getSupabase, router, persistUserToStorage])

  const contextValue = useMemo(
    () => ({
      currentUser,
      setCurrentUser,
      isAdmin: isPracticeAdminRole(normalizedRole) || isSuperAdminRole(normalizedRole),
      isSuperAdmin: isSuperAdminRole(normalizedRole),
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
      normalizedRole,
      loading,
      isLoggingOut,
      superAdmins,
      createSuperAdmin,
      updateSuperAdmin,
      deleteSuperAdmin,
      toggleSuperAdminStatus,
      signOut,
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
