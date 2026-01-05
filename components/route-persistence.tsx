"use client"

import { useEffect, useContext, useState } from "react"
import { usePathname } from "next/navigation"
import { UserContext } from "@/contexts/user-context"

/**
 * Component that persists the current route across hot reloads and code updates.
 * This ensures users stay on the same page (e.g., settings) after code changes.
 * Excludes auth routes to prevent conflicts with authentication middleware.
 * Only active when user is authenticated.
 */
export function RoutePersistence() {
  const pathname = usePathname()
  const userContext = useContext(UserContext)
  const user = userContext?.currentUser
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const shouldPersistRoute = (path: string | null): boolean => {
    if (!path || path === "/") return false
    if (path.startsWith("/auth")) return false
    return true
  }

  useEffect(() => {
    if (!mounted) return
    if (user && shouldPersistRoute(pathname)) {
      sessionStorage.setItem("lastPathname", pathname)
      localStorage.setItem("lastPathname", pathname)
    }
  }, [pathname, user, mounted])

  useEffect(() => {
    if (!mounted) return

    const handleBeforeUnload = () => {
      if (user && shouldPersistRoute(pathname)) {
        sessionStorage.setItem("lastPathname", pathname)
        localStorage.setItem("lastPathname", pathname)
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [pathname, user, mounted])

  return null
}

export default RoutePersistence
