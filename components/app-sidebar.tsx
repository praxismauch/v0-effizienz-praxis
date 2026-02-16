"use client"
/**
 * AppSidebar - Main application sidebar navigation
 * Last updated: 2026-02-03 - Removed Dialog, simplified favorites editing
 */
import { Sidebar } from "@/components/ui/sidebar"
import { useSidebar } from "@/components/ui/sidebar"
import { useState, useEffect, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useUser } from "@/contexts/user-context"
import { useTranslation } from "@/contexts/translation-context"
import { usePractice } from "@/contexts/practice-context"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Star } from "lucide-react"
import { isSuperAdminRole, isPracticeAdminRole } from "@/lib/auth-utils"
import { useSidebarSettings } from "@/contexts/sidebar-settings-context"
import Logger from "@/lib/logger"
import { useFeatureBetaFlags } from "@/hooks/use-feature-beta-flags"
import { usePermissions } from "@/hooks/use-permissions"

// Extracted components
import {
  AppSidebarHeader,
  SidebarTourButton,
  SidebarFavorites,
  SidebarNavGroup,
} from "@/components/sidebar"

// Extracted navigation config
import {
  getNavigationGroups,
  DEFAULT_EXPANDED_GROUPS,
  DEFAULT_BADGE_COUNTS,
  DEFAULT_BADGE_VISIBILITY,
  type NavigationItem,
  type BadgeKey,
} from "@/lib/sidebar-navigation"

interface AppSidebarProps {
  className?: string
}

export function AppSidebar({ className }: AppSidebarProps) {
  const { t } = useTranslation()
  const pathname = usePathname()
  const router = useRouter()
  const { currentUser } = useUser()
  const { currentPractice } = usePractice()
  const { singleGroupMode } = useSidebarSettings()
  const betaFlags = useFeatureBetaFlags()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const hasRestoredScroll = useRef(false)
  const [expandedGroups, setExpandedGroupsRaw] = useState<string[]>(() => {
    // Instant restore from localStorage to avoid flash
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

  // Wrapper that saves to localStorage on every change
  const setExpandedGroups = (updater: string[] | ((prev: string[]) => string[])) => {
    setExpandedGroupsRaw((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater
      try {
        localStorage.setItem("sidebar_expanded_groups", JSON.stringify(next))
      } catch {}
      return next
    })
  }
  const [lastActivePath, setLastActivePath] = useState<string | null>(null)
  const { open: sidebarOpen, setOpen: setSidebarOpen } = useSidebar()
  const [favorites, setFavorites] = useState<string[]>([])
  const [badgeCounts, setBadgeCounts] = useState<Record<BadgeKey, number>>(DEFAULT_BADGE_COUNTS)
  const [badgeVisibility, setBadgeVisibility] = useState<Record<string, boolean>>(DEFAULT_BADGE_VISIBILITY)
  const [preferencesLoaded, setPreferencesLoaded] = useState(false)
  const initialLoadDone = useRef(false)
  const { checkPermission } = usePermissions()
  
  // Favorites edit dialog state



  const isAdmin = isPracticeAdminRole(currentUser?.role) || isSuperAdminRole(currentUser?.role)
  const isSuperAdmin = isSuperAdminRole(currentUser?.role) || currentUser?.is_super_admin === true
  const sidebarGroups = getNavigationGroups(t)

  // Map sidebar navigation keys to permission_key in role_permissions table
  const SIDEBAR_TO_PERMISSION_KEY: Record<string, string> = {
    dashboard: "dashboard",
    aiAnalysis: "ai_analysis",
    academy: "academy",
    calendar: "calendar",
    dienstplan: "dienstplan",
    zeiterfassung: "zeiterfassung",
    tasks: "tasks",
    goals: "goals",
    workflows: "workflows",
    responsibilities: "responsibilities",
    analytics: "analytics",
    documents: "documents",
    journal: "practice_journals",
    knowledge: "knowledge",
    protocols: "protocols",
    cirs: "cirs",
    hygieneplan: "hygieneplan",
    strategy_journey: "strategy_journey",
    leadership: "leadership",
    wellbeing: "wellbeing",
    leitbild: "leitbild",
    roi_analysis: "roi_analysis",
    igel: "igel_analysis",
    competitor_analysis: "competitor_analysis",
    wunschpatient: "wunschpatient",
    hiring: "hiring",
    team: "team",
    mitarbeitergespraeche: "mitarbeitergespraeche",
    selbst_check: "selbst_check",
    skills: "skills",
    organigramm: "organigramm",
    training: "training",
    contacts: "contacts",
    surveys: "surveys",
    arbeitsplaetze: "arbeitsplaetze",
    rooms: "rooms",
    arbeitsmittel: "arbeitsmittel",
    inventory: "inventory",
    devices: "devices",
    settings: "settings",
  }

  // Build sidebarPermissions from role_permissions via usePermissions hook
  const sidebarPermissions: Record<string, boolean> = {}
  for (const group of sidebarGroups) {
    for (const item of group.items) {
      if (item.key) {
        const permKey = SIDEBAR_TO_PERMISSION_KEY[item.key] || item.key
        sidebarPermissions[item.key] = checkPermission(permKey, "can_view")
      }
    }
  }

  // Fetch sidebar badge counts
  useEffect(() => {
    const loadBadgeCounts = async () => {
      const practiceId = currentPractice?.id
      if (!practiceId) return

      try {
        const response = await fetch(`/api/practices/${practiceId}/sidebar-badges`)
        if (response.ok) {
          const data = await response.json()
          setBadgeCounts((prev) => ({
            ...prev,
            ...data,
          }))
        }
      } catch (error) {
        Logger.warn("sidebar", "Error loading badge counts", { error })
      }
    }

    loadBadgeCounts()
    
    // Refresh badge counts every 2 minutes
    const interval = setInterval(loadBadgeCounts, 120000)
    return () => clearInterval(interval)
  }, [currentPractice?.id])

  // Load badge visibility preferences
  useEffect(() => {
    const loadBadgeVisibility = async () => {
      if (!currentUser?.id) return

      try {
        const response = await fetch(`/api/user/preferences?userId=${currentUser.id}`)
        if (response.ok) {
          const data = await response.json()
          if (data.preferences?.badge_visibility) {
            setBadgeVisibility((prev) => ({
              ...prev,
              ...data.preferences.badge_visibility,
            }))
          }
        }
      } catch (error) {
        Logger.warn("sidebar", "Error loading badge visibility preferences", { error })
      }
    }

    loadBadgeVisibility()

    // Listen for badge visibility changes from profile settings
    const handleBadgeVisibilityChange = (event: CustomEvent<Record<string, boolean>>) => {
      setBadgeVisibility((prev) => ({
        ...prev,
        ...event.detail,
      }))
    }

    window.addEventListener("badge-visibility-changed", handleBadgeVisibilityChange as EventListener)

    // Listen for favorites updates from profile settings
    const handleFavoritesUpdated = (event: CustomEvent<string[]>) => {
      setFavorites(event.detail)
    }
    window.addEventListener("favorites-updated", handleFavoritesUpdated as EventListener)

    return () => {
      window.removeEventListener("badge-visibility-changed", handleBadgeVisibilityChange as EventListener)
      window.removeEventListener("favorites-updated", handleFavoritesUpdated as EventListener)
    }
  }, [currentUser?.id])

  useEffect(() => {
    const loadSidebarPreferences = async () => {
      const practiceId = currentPractice?.id 
      if (!currentUser?.id) return
      if (initialLoadDone.current) return

      // Always load favorites from localStorage first for instant restore
      try {
        const localFavorites = localStorage.getItem(`sidebar_favorites_${currentUser.id}`)
        if (localFavorites) {
          const parsed = JSON.parse(localFavorites)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setFavorites(parsed)
          }
        }
      } catch (e) { /* localStorage not available */ }
      
      try {
        const response = await fetch(`/api/users/${currentUser.id}/sidebar-preferences?practice_id=${practiceId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.preferences) {
            if (data.preferences.expanded_groups && Array.isArray(data.preferences.expanded_groups)) {
              setExpandedGroups(data.preferences.expanded_groups)
            } else {
              setExpandedGroups(["overview", "planning", "data", "strategy", "team-personal", "praxis-einstellungen"])
            }

  // Load favorites from database with localStorage fallback
  try {
  const favoritesResponse = await fetch(`/api/users/${currentUser.id}/favorites?practice_id=${practiceId}`)
  if (favoritesResponse.ok) {
  const favoritesData = await favoritesResponse.json()
  if (favoritesData.favorites && Array.isArray(favoritesData.favorites) && favoritesData.favorites.length > 0) {
  setFavorites(favoritesData.favorites)
  // Sync to localStorage
  try {
    localStorage.setItem(`sidebar_favorites_${currentUser.id}`, JSON.stringify(favoritesData.favorites))
  } catch (e) {}
  } else if (favoritesData.useLocalStorage) {
  // API indicated to use localStorage, try to load from there
  try {
    const localFavorites = localStorage.getItem(`sidebar_favorites_${currentUser.id}`)
    if (localFavorites) {
      setFavorites(JSON.parse(localFavorites))
    }
  } catch (e) {}
  } else {
    // Try localStorage as fallback
    try {
      const localFavorites = localStorage.getItem(`sidebar_favorites_${currentUser.id}`)
      if (localFavorites) {
        setFavorites(JSON.parse(localFavorites))
      }
    } catch (e) {}
  }
  } else {
    // API failed, try localStorage
    try {
      const localFavorites = localStorage.getItem(`sidebar_favorites_${currentUser.id}`)
      if (localFavorites) {
        setFavorites(JSON.parse(localFavorites))
      }
    } catch (e) {}
  }
  } catch (error) {
  Logger.warn("sidebar", "Error loading favorites", { error })
  // Try localStorage as fallback
  try {
    const localFavorites = localStorage.getItem(`sidebar_favorites_${currentUser?.id || 'guest'}`)
    if (localFavorites) {
      setFavorites(JSON.parse(localFavorites))
    }
  } catch (e) {}
  }

            if (data.preferences.expanded_items) {
              if (data.preferences.expanded_items.lastPath) {
                setLastActivePath(data.preferences.expanded_items.lastPath)
                const allItems = getAllNavItems()
                const activeItem = allItems.find((item) => item.href === data.preferences.expanded_items.lastPath)
                if (activeItem) {
                  const navGroups = getNavigationGroups(t)
                  const activeGroup = navGroups.find((group) =>
                    group.items.some((item) => item.href === data.preferences.expanded_items.lastPath),
                  )
                  if (activeGroup && !expandedGroups.includes(activeGroup.id)) {
                    setExpandedGroups((prev) => (Array.isArray(prev) ? [...prev, activeGroup.id] : [activeGroup.id]))
                  }
                }
              }

              if (data.preferences.expanded_items.scrollPosition !== undefined && !hasRestoredScroll.current) {
                hasRestoredScroll.current = true
                const targetPosition = data.preferences.expanded_items.scrollPosition

                const restoreScrollWhenReady = () => {
                  const container = scrollContainerRef.current
                  if (!container) {
                    requestAnimationFrame(restoreScrollWhenReady)
                    return
                  }

                  const observer = new MutationObserver(() => {
                    const canScroll = container.scrollHeight > container.clientHeight
                    const positionValid = targetPosition <= container.scrollHeight - container.clientHeight

                    if (canScroll && positionValid) {
                      container.scrollTop = targetPosition
                      observer.disconnect()
                    } else if (canScroll) {
                      container.scrollTop = Math.max(0, container.scrollHeight - container.clientHeight)
                      observer.disconnect()
                    }
                  })

                  observer.observe(container, { childList: true, subtree: true })

                  setTimeout(() => {
                    observer.disconnect()
                    if (container.scrollHeight > container.clientHeight) {
                      container.scrollTop = Math.min(targetPosition, container.scrollHeight - container.clientHeight)
                    }
                  }, 2000)
                }

                requestAnimationFrame(() => {
                  requestAnimationFrame(restoreScrollWhenReady)
                })
              }
            }
          } else {
            setExpandedGroups(["overview", "planning", "data", "strategy", "team-personal", "praxis-einstellungen"])
          }
        } else {
          setExpandedGroups(["overview", "planning", "data", "strategy", "team-personal", "praxis-einstellungen"])
        }
      } catch (error) {
        console.error("Error loading sidebar preferences:", error)
        setExpandedGroups(["overview", "planning", "data", "strategy", "team-personal", "praxis-einstellungen"])
      } finally {
        initialLoadDone.current = true
        setPreferencesLoaded(true)
      }
    }

    loadSidebarPreferences()
  }, [currentUser?.id, currentPractice?.id])

  useEffect(() => {
    const practiceId = currentPractice?.id 
    if (!currentUser?.id || !preferencesLoaded) return

    const saveExpandedGroups = async () => {
      try {
        await fetch(`/api/users/${currentUser.id}/sidebar-preferences`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            practice_id: practiceId,
            expanded_groups: expandedGroups,
            favorites: favorites, // Include favorites to prevent overwriting
          }),
        })
      } catch (error) {
        // Silently fail - not critical
      }
    }

    const timeoutId = setTimeout(saveExpandedGroups, 500)
    return () => clearTimeout(timeoutId)
  }, [expandedGroups, currentUser?.id, currentPractice?.id, preferencesLoaded, favorites])

  // Favorites are now saved immediately in toggleFavorite function

  useEffect(() => {
    const practiceId = currentPractice?.id 
    if (!currentUser?.id || !scrollContainerRef.current) return

    let scrollTimeout: NodeJS.Timeout

    const handleScroll = () => {
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(async () => {
        if (!scrollContainerRef.current) return
        const scrollPosition = scrollContainerRef.current.scrollTop

        try {
          await fetch(`/api/users/${currentUser.id}/sidebar-preferences`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              practice_id: practiceId,
              expanded_items: {
                lastPath: pathname,
                scrollPosition,
                selectedItem: pathname,
              },
              favorites: favorites, // Include favorites to prevent overwriting
            }),
          })
        } catch (error) {
          // Silently fail
        }
      }, 500)
    }

    const container = scrollContainerRef.current
    container.addEventListener("scroll", handleScroll, { passive: true })

    return () => {
      clearTimeout(scrollTimeout)
      container.removeEventListener("scroll", handleScroll)
    }
  }, [currentUser?.id, currentPractice?.id, pathname])

  useEffect(() => {
    const practiceId = currentPractice?.id 
    if (!currentUser?.id || !pathname || !preferencesLoaded) return

    const saveSelectedItem = async () => {
      try {
        const scrollPosition = scrollContainerRef.current?.scrollTop || 0

        await fetch(`/api/users/${currentUser.id}/sidebar-preferences`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            practice_id: practiceId,
            expanded_items: {
              lastPath: pathname,
              scrollPosition,
              selectedItem: pathname,
            },
            favorites: favorites, // Include favorites to prevent overwriting
          }),
        })
      } catch (error) {
        // Silently fail
      }
    }

    const timeoutId = setTimeout(saveSelectedItem, 300)
    return () => clearTimeout(timeoutId)
  }, [pathname, currentUser?.id, currentPractice?.id, preferencesLoaded, favorites])

  const getAllNavItems = () => {
    const items: Array<{ name: string; href: string; icon: any; key?: string; badge?: string }> = []
    sidebarGroups.forEach((group) => {
      group.items.forEach((item) => {
        if (!item.key || sidebarPermissions[item.key] !== false) {
          items.push(item)
        }
      })
    })
    return items
  }

  const allNavItems = getAllNavItems()
  const favoriteItems = allNavItems.filter((item) => favorites.includes(item.href))

  const handleNavigation = (href: string) => {
    router.push(href)
  }

const toggleFavorite = async (href: string, e?: React.MouseEvent) => {
  if (e) {
  e.preventDefault()
  e.stopPropagation()
  }
  
  const isAdding = !favorites.includes(href)
  const newFavorites = isAdding ? [...favorites, href] : favorites.filter((f) => f !== href)
  
  // Update state immediately for responsive UI
  setFavorites(newFavorites)
  
  // Always save to localStorage as backup
  try {
    localStorage.setItem(`sidebar_favorites_${currentUser?.id || 'guest'}`, JSON.stringify(newFavorites))
  } catch (e) {
    // localStorage not available
  }
  
  // Save to database
  if (currentUser?.id) {
  const practiceId = currentPractice?.id 
  try {
  const response = await fetch(`/api/users/${currentUser.id}/favorites`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
  item_path: href,
  action: isAdding ? "add" : "remove",
  practice_id: practiceId,
          }),
        })

        if (!response.ok) {
          Logger.warn("sidebar", "Failed to save favorite", { status: response.status })
          setFavorites(favorites)
        }
      } catch (error) {
        Logger.warn("sidebar", "Error saving favorite", { error })
        setFavorites(favorites)
      }
    }
  }

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prevGroups) => {
      if (prevGroups.includes(groupId)) {
        // Closing the group
        return prevGroups.filter((group) => group !== groupId)
      } else {
        // Opening the group
        if (singleGroupMode) {
          // In single group mode, close all other groups and only open this one
          return [groupId]
        } else {
          // Normal mode, just add to the list
          return [...prevGroups, groupId]
        }
      }
    })
  }

  return (
    <TooltipProvider>
      <Sidebar className={cn("border-r border-sidebar-border", className)}>
        <AppSidebarHeader
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          isSuperAdmin={isSuperAdmin}
          pathname={pathname}
        />

        <SidebarTourButton sidebarOpen={sidebarOpen} />

        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto sidebar-scrollbar">
          <div className="py-2">
            <SidebarFavorites
              favoriteItems={favoriteItems as NavigationItem[]}
              pathname={pathname}
              sidebarOpen={sidebarOpen}
              badgeCounts={badgeCounts}
              badgeVisibility={badgeVisibility}
              onNavigate={handleNavigation}
              onToggleFavorite={toggleFavorite}
              t={t}
            />

            {sidebarGroups.map((group) => (
              <SidebarNavGroup
                key={group.id}
                group={group}
                isExpanded={expandedGroups.includes(group.id)}
                sidebarOpen={sidebarOpen}
                pathname={pathname}
                favorites={favorites}
                badgeCounts={badgeCounts}
                badgeVisibility={badgeVisibility}
                sidebarPermissions={sidebarPermissions}
                betaFlags={betaFlags}
                onToggleGroup={toggleGroup}
                onNavigate={handleNavigation}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        </div>


      </Sidebar>
    </TooltipProvider>
  )
}

export default AppSidebar
