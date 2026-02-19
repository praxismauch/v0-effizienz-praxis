"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { SupabaseClient } from "@supabase/supabase-js"
import Logger from "@/lib/logger"
import { encryptStorage, decryptStorage, isStorageExpired } from "@/lib/storage-utils"
import { retryWithBackoff, isAuthError } from "@/lib/retry-utils"
import { type User, mapProfileToUser, isPublicRoute, dispatchAuthRecovered } from "@/lib/user-utils"
import { fetchUserProfile, onProfileFetched } from "@/lib/user-fetch-profile"

const MAX_FETCH_ATTEMPTS = 3
const FETCH_COOLDOWN_MS = 2000

export function useAuthSession(initialUser?: User | null) {
  const [currentUser, setCurrentUser] = useState<User | null>(initialUser || null)
  const [loading, setLoading] = useState(!initialUser)
  const [mounted, setMounted] = useState(false)

  const pathname = usePathname()
  const hasFetchedUser = useRef(false)
  const fetchAttempts = useRef(0)
  const lastFetchTime = useRef(0)
  const authSubscriptionRef = useRef<{ unsubscribe: () => void } | null>(null)
  const currentUserRef = useRef<User | null>(currentUser)

  const supabaseRef = useRef<SupabaseClient | null>(null)
  const getSupabase = useCallback(() => {
    if (typeof window === "undefined") return null
    if (!supabaseRef.current) {
      try { supabaseRef.current = createClient() } catch { return null }
    }
    return supabaseRef.current
  }, [])

  const persistUserToStorage = useCallback(async (user: User | null) => {
    if (typeof window === "undefined") return
    if (user) {
      try {
        const encrypted = await encryptStorage(user, 86400)
        sessionStorage.setItem("effizienz_current_user", encrypted)
      } catch (error) { Logger.error("context", "Error persisting user", error) }
    } else {
      try { sessionStorage.removeItem("effizienz_current_user") }
      catch (error) { Logger.error("context", "Error clearing storage", error) }
    }
  }, [])

  // Keep ref in sync
  useEffect(() => { currentUserRef.current = currentUser }, [currentUser])
  useEffect(() => { setMounted(true) }, [])

  // Restore from storage
  useEffect(() => {
    if (!mounted || hasFetchedUser.current) return
    if (initialUser) { hasFetchedUser.current = true; setLoading(false); return }

    const restoreUser = async () => {
      try {
        const stored = sessionStorage.getItem("effizienz_current_user")
        if (stored) {
          if (isStorageExpired(stored)) { sessionStorage.removeItem("effizienz_current_user"); return }
          const parsedUser = await decryptStorage(stored)
          if (parsedUser) {
            setCurrentUser(parsedUser as User)
            hasFetchedUser.current = true
            setLoading(false)
            return
          } else { sessionStorage.removeItem("effizienz_current_user") }
        }
      } catch { sessionStorage.removeItem("effizienz_current_user") }
    }
    restoreUser()
  }, [mounted, initialUser])

  // Fetch user from Supabase
  useEffect(() => {
    if (typeof window === "undefined" || !mounted) return
    if (hasFetchedUser.current) return
    if (currentUser || initialUser) { hasFetchedUser.current = true; setLoading(false); return }
    if (isPublicRoute(pathname)) { setLoading(false); return }

    const fetchUser = async () => {
      const now = Date.now()
      if (now - lastFetchTime.current < FETCH_COOLDOWN_MS) { setLoading(false); return }
      fetchAttempts.current += 1
      if (fetchAttempts.current > MAX_FETCH_ATTEMPTS) { hasFetchedUser.current = true; setLoading(false); return }
      lastFetchTime.current = now

      try {
        await retryWithBackoff(async () => {
          const DEV_USER_EMAIL = process.env.NEXT_PUBLIC_DEV_USER_EMAIL
          const IS_DEV_MODE = process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN === "true" && process.env.NODE_ENV !== "production"

          if (IS_DEV_MODE) {
            if (!DEV_USER_EMAIL) throw new Error("Dev mode enabled but NEXT_PUBLIC_DEV_USER_EMAIL not set")
            const response = await fetch("/api/auth/dev-user", { credentials: "include" })
            if (!response.ok) throw new Error(`Dev user fetch failed: ${response.status}`)
            const data = await response.json()
            if (!data.user) throw new Error("No user data in dev response")
            const user = mapProfileToUser(data.user, DEV_USER_EMAIL)
            setCurrentUser(user)
            await persistUserToStorage(user)
            hasFetchedUser.current = true
            dispatchAuthRecovered()
            return
          }

          const supabase = getSupabase()
          if (!supabase) throw new Error("Supabase client not available")

          let authUser = null
          let authError = null
          try {
            const result = await supabase.auth.getUser()
            authUser = result.data?.user
            authError = result.error
          } catch (fetchError: unknown) {
            const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError)
            if (errorMessage.includes("fetch") || errorMessage.includes("Failed") || errorMessage.includes("network")) {
              throw new Error("Network error - no session available")
            }
            throw fetchError
          }

          if (authError || !authUser) { setLoading(false); return }

          const user = await fetchUserProfile(supabase, authUser.id, authUser.email, authUser.user_metadata)
          if (user) {
            setCurrentUser(user)
            await persistUserToStorage(user)
            hasFetchedUser.current = true
            onProfileFetched()
          }
        }, { maxAttempts: 3, initialDelay: 1000 })
      } catch (error) {
        Logger.error("context", "Error fetching user after retries", error)
        if (isAuthError(error)) hasFetchedUser.current = true
        setCurrentUser(null)
        await persistUserToStorage(null)
      } finally { setLoading(false) }
    }

    fetchUser()
  }, [pathname, initialUser, persistUserToStorage, getSupabase, mounted, currentUser])

  // Auth state change subscription
  useEffect(() => {
    if (typeof window === "undefined" || !mounted) return
    const IS_DEV_MODE = process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN === "true" && process.env.NODE_ENV !== "production"
    if (IS_DEV_MODE) return
    if (authSubscriptionRef.current) return

    const supabase = getSupabase()
    if (!supabase) return

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const now = Date.now()
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (now - lastFetchTime.current < FETCH_COOLDOWN_MS) return
        if (hasFetchedUser.current && currentUserRef.current) return
        lastFetchTime.current = now
      }

      if (event === "SIGNED_OUT") {
        setCurrentUser(null)
        await persistUserToStorage(null)
        hasFetchedUser.current = false
        fetchAttempts.current = 0
      } else if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session?.user) {
        try {
          const user = await fetchUserProfile(supabase, session.user.id, session.user.email, session.user.user_metadata)
          if (user) {
            setCurrentUser(user)
            await persistUserToStorage(user)
            hasFetchedUser.current = true
            onProfileFetched()
          }
        } catch (error) { Logger.error("context", "Error fetching user profile in auth state change", error) }
      }
    })

    authSubscriptionRef.current = subscription
    return () => { subscription.unsubscribe(); authSubscriptionRef.current = null }
  }, [mounted, getSupabase, persistUserToStorage])

  const updateCurrentUser = useCallback((user: User) => {
    setCurrentUser(user)
    persistUserToStorage(user).catch((error) => { Logger.error("context", "Error persisting user in setCurrentUser", error) })
  }, [persistUserToStorage])

  const clearUser = useCallback(async () => {
    setCurrentUser(null)
    await persistUserToStorage(null)
    hasFetchedUser.current = false
  }, [persistUserToStorage])

  return { currentUser, setCurrentUser: updateCurrentUser, loading, mounted, getSupabase, clearUser }
}
