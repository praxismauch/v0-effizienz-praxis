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
  const [currentUser, setCurrentUser] = useState<User | null>(initialUser || null)
  const [loading, setLoading] = useState(!initialUser)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [superAdmins, setSuperAdmins] = useState<User[]>([])
  const [mounted, setMounted] = useState(false)

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
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    if (currentUser || initialUser) return

    try {
      const stored = localStorage.getItem("effizienz_current_user") || sessionStorage.getItem("effizienz_current_user")
      if (stored) {
        const parsedUser = JSON.parse(stored) as User
        if (IS_DEBUG) {
          console.debug("[UserProvider] Restored user from storage after hydration")
        }
        setCurrentUser(parsedUser)
        setLoading(false)
      }
    } catch (e) {
      if (IS_DEBUG) {
        console.debug("[UserProvider] Error parsing stored user:", e)
      }
    }
  }, [mounted, currentUser, initialUser])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (!mounted) return
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
        const supabase = getSupabase()
        if (!supabase) {
          setLoading(false)
          return
        }

        const {
          data: { user: authUser },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError || !authUser) {
          if (IS_DEBUG) {
            console.debug("[UserProvider] No auth user found, redirecting to login")
          }
          if (!isPublicRoute(pathname)) {
            router.push("/auth/login")
          }
          setLoading(false)
          return
        }

        // Fetch user profile from database
        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("id", authUser.id)
          .single()

        if (profileError || !profile) {
          if (IS_DEBUG) {
            console.debug("[UserProvider] No profile found for user:", authUser.id)
          }
          setLoading(false)
          return
        }

        const user: User = {
          id: profile.id,
          name: profile.name || `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "User",
          email: profile.email || authUser.email || "",
          role: normalizeRole(profile.role) as User["role"],
          avatar: profile.avatar,
          practiceId: profile.practice_id?.toString() || "1",
          practice_id: profile.practice_id?.toString() || "1",
          isActive: profile.is_active ?? true,
          joinedAt: profile.created_at || new Date().toISOString(),
          preferred_language: profile.preferred_language,
          firstName: profile.first_name,
        }

        setCurrentUser(user)
        persistUserToStorage(user)
      } catch (error) {
        console.error("Error fetching user:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [pathname, currentUser, initialUser, router, persistUserToStorage, getSupabase, mounted])

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
                practiceId: u.practice_id?.toString() || "1",
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

    fetchSuperAdmins()
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
      persistUserToStorage(null)
      hasFetchedUser.current = false
      hasFetchedSuperAdmins.current = false
      router.push("/auth/login")
    } catch (error) {
      console.error("Error signing out:", error)
    } finally {
      setIsLoggingOut(false)
    }
  }, [getSupabase, persistUserToStorage, router])

  const createSuperAdmin = useCallback((userData: Omit<User, "id" | "joinedAt">) => {
    const newAdmin: User = {
      ...userData,
      id: crypto.randomUUID(),
      joinedAt: new Date().toISOString(),
      practiceId: userData.practiceId || "1",
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

  const contextValue = useMemo(
    () => ({
      currentUser,
      setCurrentUser: (user: User) => {
        setCurrentUser(user)
        persistUserToStorage(user)
      },
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
