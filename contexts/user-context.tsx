"use client"

import { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { SupabaseClient } from "@supabase/supabase-js"
import { isSuperAdminRole, isPracticeAdminRole, normalizeRole } from "@/lib/auth-utils"
import Logger from "@/lib/logger"
import { encryptStorage, decryptStorage, isStorageExpired } from "@/lib/storage-utils"
import { retryWithBackoff, isAuthError } from "@/lib/retry-utils"

const dispatchAuthRecovered = () => {
  if (typeof window !== "undefined") {
    console.log("[v0] dispatchAuthRecovered called")
    window.dispatchEvent(new CustomEvent("auth-recovered"))
  }
}

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
  const [sessionVerified, setSessionVerified] = useState(false)

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

  console.log("[v0] UserProvider render", {
    currentUser: currentUser?.email,
    loading,
    mounted,
    pathname,
    hasFetchedUser: hasFetchedUser.current,
  })

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
    console.log("[v0] UserProvider mounted")
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    if (currentUser || initialUser) return

    const restoreUser = async () => {
      console.log("[v0] restoreUser called")
      try {
        const stored = sessionStorage.getItem("effizienz_current_user")
        if (stored) {
          if (isStorageExpired(stored)) {
            console.log("[v0] Stored user expired, clearing")
            sessionStorage.removeItem("effizienz_current_user")
            setLoading(false)
            return
          }

          const parsedUser = await decryptStorage(stored)
          if (parsedUser) {
            console.log("[v0] Restored user from storage:", (parsedUser as User).email)
            setCurrentUser(parsedUser as User)
            hasFetchedUser.current = true
            console.log("[v0] hasFetchedUser set to true (from storage)")
            setLoading(false)
          } else {
            console.log("[v0] Failed to decrypt stored user")
            sessionStorage.removeItem("effizienz_current_user")
            setLoading(false)
          }
        } else {
          console.log("[v0] No stored user found")
          setLoading(false)
        }
      } catch (e) {
        console.error("[v0] Error in restoreUser:", e)
        sessionStorage.removeItem("effizienz_current_user")
        setLoading(false)
      }
    }

    restoreUser()
  }, [mounted, currentUser, initialUser])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (!mounted) return
    if (hasFetchedUser.current) {
      console.log("[v0] fetchUser skipped - already fetched")
      return
    }
    if (currentUser || initialUser) {
      console.log("[v0] fetchUser skipped - user exists")
      hasFetchedUser.current = true
      console.log("[v0] hasFetchedUser set to true (user exists)")
      setLoading(false)
      return
    }
    if (isPublicRoute(pathname)) {
      console.log("[v0] fetchUser skipped - public route")
      setLoading(false)
      return
    }

    const fetchUser = async () => {
      console.log("[v0] fetchUser starting")
      try {
        await retryWithBackoff(
          async () => {
            const DEV_USER_EMAIL = process.env.NEXT_PUBLIC_DEV_USER_EMAIL
            const IS_DEV_MODE =
              process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN === "true" && process.env.NODE_ENV !== "production"

            if (IS_DEV_MODE) {
              console.log("[v0] Dev mode - fetching dev user")
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

              const user: User = {
                id: data.user.id,
                name:
                  data.user.name || `${data.user.first_name || ""} ${data.user.last_name || ""}`.trim() || "Dev User",
                email: data.user.email || DEV_USER_EMAIL,
                role: normalizeRole(data.user.role) as User["role"],
                avatar: data.user.avatar,
                practiceId: data.user.practice_id?.toString() || "1",
                practice_id: data.user.practice_id?.toString() || "1",
                isActive: data.user.is_active ?? true,
                joinedAt: data.user.created_at || new Date().toISOString(),
                preferred_language: data.user.preferred_language,
                firstName: data.user.first_name,
              }
              console.log("[v0] Dev user loaded:", user.email)
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

            console.log("[v0] Fetching Supabase user")
            const {
              data: { user: authUser },
              error: authError,
            } = await supabase.auth.getUser()

            if (authError || !authUser) {
              console.log("[v0] No Supabase user:", authError?.message)
              throw new Error(authError?.message || "No valid Supabase session")
            }

            console.log("[v0] Fetching user profile for:", authUser.id)
            const { data: profile, error: profileError } = await supabase
              .from("users")
              .select(
                "id, name, email, role, avatar, practice_id, is_active, created_at, preferred_language, first_name, last_name",
              )
              .eq("id", authUser.id)
              .single()

            if (profileError || !profile) {
              console.log("[v0] No profile found:", profileError?.message)
              throw new Error(profileError?.message || "No profile found")
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

            console.log("[v0] User loaded successfully:", user.email)
            setCurrentUser(user)
            await persistUserToStorage(user)
            hasFetchedUser.current = true
            dispatchAuthRecovered()
          },
          {
            maxAttempts: 3,
            initialDelay: 1000,
            onRetry: (attempt, error) => {
              console.log(`[v0] Retrying user fetch, attempt ${attempt}:`, error)
            },
          },
        )
      } catch (error) {
        console.error("[v0] Error fetching user after retries:", error)
        if (isAuthError(error)) {
          hasFetchedUser.current = true
        }
        setCurrentUser(null)
        await persistUserToStorage(null)
      } finally {
        console.log("[v0] fetchUser complete, setting loading=false")
        setLoading(false)
      }
    }

    fetchUser()
  }, [pathname, currentUser, initialUser, router, persistUserToStorage, getSupabase, mounted])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (!mounted) return
    const IS_DEV_MODE = process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN === "true" && process.env.NODE_ENV !== "production"

    if (IS_DEV_MODE) return

    const supabase = getSupabase()
    if (!supabase) return

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[v0] Auth state changed:", event)

      if (event === "SIGNED_OUT") {
        console.log("[v0] User signed out, clearing session")
        setCurrentUser(null)
        await persistUserToStorage(null)
        hasFetchedUser.current = false
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        console.log("[v0] User signed in or token refreshed")
        if (session?.user) {
          try {
            const { data: profile } = await supabase
              .from("users")
              .select(
                "id, name, email, role, avatar, practice_id, is_active, created_at, preferred_language, first_name, last_name",
              )
              .eq("id", session.user.id)
              .single()

            if (profile) {
              const user: User = {
                id: profile.id,
                name: profile.name || `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "User",
                email: profile.email || session.user.email || "",
                role: normalizeRole(profile.role) as User["role"],
                avatar: profile.avatar,
                practiceId: profile.practice_id?.toString() || "1",
                practice_id: profile.practice_id?.toString() || "1",
                isActive: profile.is_active ?? true,
                joinedAt: profile.created_at || new Date().toISOString(),
                preferred_language: profile.preferred_language,
                firstName: profile.first_name,
              }
              console.log("[v0] User profile updated:", user.email)
              setCurrentUser(user)
              await persistUserToStorage(user)
              hasFetchedUser.current = true // Fixed: was false, should be true
              console.log("[v0] hasFetchedUser set to true (after sign-in)")
              dispatchAuthRecovered()
            }
          } catch (error) {
            console.error("[v0] Error fetching user profile after sign in:", error)
          }
        }
        hasFetchedUser.current = false
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [mounted, getSupabase, persistUserToStorage])

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
        Logger.error("context", "Error fetching super admins", error)
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
        persistUserToStorage(user).catch((error) => {
          Logger.error("context", "Error persisting user in setCurrentUser", error)
        })
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
