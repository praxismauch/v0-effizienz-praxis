"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { usePathname } from "next/navigation"
import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"
import { useTranslation } from "@/contexts/translation-context"
import Logger from "@/lib/logger"
import {
  getNavigationGroups,
  DEFAULT_EXPANDED_GROUPS,
  DEFAULT_BADGE_COUNTS,
  DEFAULT_BADGE_VISIBILITY,
  type BadgeKey,
} from "@/lib/sidebar-navigation"

export function useSidebarPreferences() {
  const pathname = usePathname()
  const { currentUser } = useUser()
  const { currentPractice } = usePractice()
  const { t } = useTranslation()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const hasRestoredScroll = useRef(false)
  const initialLoadDone = useRef(false)

  // ── Expanded groups ─────────────────────────────────────────────────────────
  const [expandedGroups, setExpandedGroupsRaw] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("sidebar_expanded_groups")
        if (saved) {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed)) return parsed
        }
      } catch {}
    }
    return DEFAULT_EXPANDED_GROUPS
  })

  const setExpandedGroups = useCallback((updater: string[] | ((prev: string[]) => string[])) => {
    setExpandedGroupsRaw((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater
      try { localStorage.setItem("sidebar_expanded_groups", JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  // ── State ───────────────────────────────────────────────────────────────────
  const [lastActivePath, setLastActivePath] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<string[]>([])
  const [badgeCounts, setBadgeCounts] = useState<Record<BadgeKey, number>>(DEFAULT_BADGE_COUNTS)
  const [badgeVisibility, setBadgeVisibility] = useState<Record<string, boolean>>(DEFAULT_BADGE_VISIBILITY)
  const [preferencesLoaded, setPreferencesLoaded] = useState(false)

  // ── Badge counts ────────────────────────────────────────────────────────────
  useEffect(() => {
    const practiceId = currentPractice?.id
    if (!practiceId) return

    const loadBadgeCounts = async () => {
      try {
        const response = await fetch(`/api/practices/${practiceId}/sidebar-badges`)
        if (response.ok) {
          const data = await response.json()
          setBadgeCounts((prev) => ({ ...prev, ...data }))
        }
      } catch (error) {
        Logger.warn("sidebar", "Error loading badge counts", { error })
      }
    }

    loadBadgeCounts()
    const interval = setInterval(loadBadgeCounts, 120000)
    return () => clearInterval(interval)
  }, [currentPractice?.id])

  // ── Badge visibility + event listeners ──────────────────────────────────────
  useEffect(() => {
    if (!currentUser?.id) return

    const loadBadgeVisibility = async () => {
      try {
        const response = await fetch(`/api/user/preferences?userId=${currentUser.id}`)
        if (response.ok) {
          const data = await response.json()
          if (data.preferences?.badge_visibility) {
            setBadgeVisibility((prev) => ({ ...prev, ...data.preferences.badge_visibility }))
          }
        }
      } catch (error) {
        Logger.warn("sidebar", "Error loading badge visibility preferences", { error })
      }
    }

    loadBadgeVisibility()

    const handleBadgeVisibilityChange = (event: CustomEvent<Record<string, boolean>>) => {
      setBadgeVisibility((prev) => ({ ...prev, ...event.detail }))
    }
    const handleFavoritesUpdated = (event: CustomEvent<string[]>) => {
      setFavorites(event.detail)
    }

    window.addEventListener("badge-visibility-changed", handleBadgeVisibilityChange as EventListener)
    window.addEventListener("favorites-updated", handleFavoritesUpdated as EventListener)

    return () => {
      window.removeEventListener("badge-visibility-changed", handleBadgeVisibilityChange as EventListener)
      window.removeEventListener("favorites-updated", handleFavoritesUpdated as EventListener)
    }
  }, [currentUser?.id])

  // ── Load full sidebar preferences ───────────────────────────────────────────
  useEffect(() => {
    const practiceId = currentPractice?.id
    if (!currentUser?.id) return
    if (initialLoadDone.current) return

    // Instant restore from localStorage
    try {
      const localFavorites = localStorage.getItem(`sidebar_favorites_${currentUser.id}`)
      if (localFavorites) {
        const parsed = JSON.parse(localFavorites)
        if (Array.isArray(parsed) && parsed.length > 0) setFavorites(parsed)
      }
    } catch {}

    const load = async () => {
      try {
        const response = await fetch(`/api/users/${currentUser.id}/sidebar-preferences?practice_id=${practiceId}`)
        if (!response.ok) {
          setExpandedGroups(DEFAULT_EXPANDED_GROUPS)
          return
        }

        const data = await response.json()
        if (!data.preferences) {
          setExpandedGroups(DEFAULT_EXPANDED_GROUPS)
          return
        }

        // Expanded groups
        if (data.preferences.expanded_groups && Array.isArray(data.preferences.expanded_groups)) {
          // Auto-expand the group containing the current page
          const navGroups = getNavigationGroups(t)
          const activeGroup = navGroups.find((g) =>
            g.items.some((item) => pathname.startsWith(item.href)),
          )
          if (activeGroup && !data.preferences.expanded_groups.includes(activeGroup.id)) {
            setExpandedGroups([...data.preferences.expanded_groups, activeGroup.id])
          } else {
            setExpandedGroups(data.preferences.expanded_groups)
          }
        } else {
          setExpandedGroups(DEFAULT_EXPANDED_GROUPS)
        }

        // Favorites from DB
        try {
          const favRes = await fetch(`/api/users/${currentUser.id}/favorites?practice_id=${practiceId}`)
          if (favRes.ok) {
            const favData = await favRes.json()
            if (favData.favorites && Array.isArray(favData.favorites) && favData.favorites.length > 0) {
              setFavorites(favData.favorites)
              try { localStorage.setItem(`sidebar_favorites_${currentUser.id}`, JSON.stringify(favData.favorites)) } catch {}
            } else {
              // Fallback to localStorage
              try {
                const local = localStorage.getItem(`sidebar_favorites_${currentUser.id}`)
                if (local) setFavorites(JSON.parse(local))
              } catch {}
            }
          }
        } catch (error) {
          Logger.warn("sidebar", "Error loading favorites", { error })
          try {
            const local = localStorage.getItem(`sidebar_favorites_${currentUser?.id || "guest"}`)
            if (local) setFavorites(JSON.parse(local))
          } catch {}
        }

        // Scroll / last path restoration
        if (data.preferences.expanded_items) {
          if (data.preferences.expanded_items.lastPath) {
            setLastActivePath(data.preferences.expanded_items.lastPath)
            const navGroups = getNavigationGroups(t)
            const activeGroup = navGroups.find((g) =>
              g.items.some((item) => item.href === data.preferences.expanded_items.lastPath),
            )
            if (activeGroup && !expandedGroups.includes(activeGroup.id)) {
              setExpandedGroups((prev) => (Array.isArray(prev) ? [...prev, activeGroup.id] : [activeGroup.id]))
            }
          }

          if (data.preferences.expanded_items.scrollPosition !== undefined && !hasRestoredScroll.current) {
            hasRestoredScroll.current = true
            const targetPosition = data.preferences.expanded_items.scrollPosition

            const restoreScrollWhenReady = () => {
              const container = scrollContainerRef.current
              if (!container) { requestAnimationFrame(restoreScrollWhenReady); return }

              const observer = new MutationObserver(() => {
                const canScroll = container.scrollHeight > container.clientHeight
                const positionValid = targetPosition <= container.scrollHeight - container.clientHeight
                if (canScroll && positionValid) { container.scrollTop = targetPosition; observer.disconnect() }
                else if (canScroll) { container.scrollTop = Math.max(0, container.scrollHeight - container.clientHeight); observer.disconnect() }
              })
              observer.observe(container, { childList: true, subtree: true })
              setTimeout(() => {
                observer.disconnect()
                if (container.scrollHeight > container.clientHeight) {
                  container.scrollTop = Math.min(targetPosition, container.scrollHeight - container.clientHeight)
                }
              }, 2000)
            }
            requestAnimationFrame(() => requestAnimationFrame(restoreScrollWhenReady))
          }
        }
      } catch (error) {
        console.error("Error loading sidebar preferences:", error)
        setExpandedGroups(DEFAULT_EXPANDED_GROUPS)
      } finally {
        initialLoadDone.current = true
        setPreferencesLoaded(true)
      }
    }

    load()
  }, [currentUser?.id, currentPractice?.id])

  // ── Save expanded groups on change ──────────────────────────────────────────
  useEffect(() => {
    const practiceId = currentPractice?.id
    if (!currentUser?.id || !preferencesLoaded) return

    const timeout = setTimeout(async () => {
      try {
        await fetch(`/api/users/${currentUser.id}/sidebar-preferences`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ practice_id: practiceId, expanded_groups: expandedGroups, favorites }),
        })
      } catch {}
    }, 500)
    return () => clearTimeout(timeout)
  }, [expandedGroups, currentUser?.id, currentPractice?.id, preferencesLoaded, favorites])

  // ── Persist scroll position ─────────────────────────────────────────────────
  useEffect(() => {
    const practiceId = currentPractice?.id
    if (!currentUser?.id || !scrollContainerRef.current) return

    let scrollTimeout: NodeJS.Timeout
    const handleScroll = () => {
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(async () => {
        if (!scrollContainerRef.current) return
        try {
          await fetch(`/api/users/${currentUser.id}/sidebar-preferences`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              practice_id: practiceId,
              expanded_items: { lastPath: pathname, scrollPosition: scrollContainerRef.current.scrollTop, selectedItem: pathname },
              favorites,
            }),
          })
        } catch {}
      }, 500)
    }

    const container = scrollContainerRef.current
    container.addEventListener("scroll", handleScroll, { passive: true })
    return () => { clearTimeout(scrollTimeout); container.removeEventListener("scroll", handleScroll) }
  }, [currentUser?.id, currentPractice?.id, pathname, favorites])

  // ── Persist selected path ───────────────────────────────────────────────────
  useEffect(() => {
    const practiceId = currentPractice?.id
    if (!currentUser?.id || !pathname || !preferencesLoaded) return

    const timeout = setTimeout(async () => {
      try {
        await fetch(`/api/users/${currentUser.id}/sidebar-preferences`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            practice_id: practiceId,
            expanded_items: { lastPath: pathname, scrollPosition: scrollContainerRef.current?.scrollTop || 0, selectedItem: pathname },
            favorites,
          }),
        })
      } catch {}
    }, 300)
    return () => clearTimeout(timeout)
  }, [pathname, currentUser?.id, currentPractice?.id, preferencesLoaded, favorites])

  // ── Toggle favorite ─────────────────────────────────────────────────────────
  const toggleFavorite = useCallback(async (href: string, e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation() }

    const isAdding = !favorites.includes(href)
    const newFavorites = isAdding ? [...favorites, href] : favorites.filter((f) => f !== href)
    const prevFavorites = favorites

    setFavorites(newFavorites)
    try { localStorage.setItem(`sidebar_favorites_${currentUser?.id || "guest"}`, JSON.stringify(newFavorites)) } catch {}

    if (currentUser?.id) {
      try {
        const response = await fetch(`/api/users/${currentUser.id}/favorites`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ item_path: href, action: isAdding ? "add" : "remove", practice_id: currentPractice?.id }),
        })
        if (!response.ok) {
          Logger.warn("sidebar", "Failed to save favorite", { status: response.status })
          setFavorites(prevFavorites)
        }
      } catch (error) {
        Logger.warn("sidebar", "Error saving favorite", { error })
        setFavorites(prevFavorites)
      }
    }
  }, [favorites, currentUser?.id, currentPractice?.id])

  return {
    expandedGroups,
    setExpandedGroups,
    favorites,
    badgeCounts,
    badgeVisibility,
    scrollContainerRef,
    toggleFavorite,
    preferencesLoaded,
    lastActivePath,
  }
}
