"use client"
// Force rebuild - Dialog imports added
import { Sidebar } from "@/components/ui/sidebar"
import { useSidebar } from "@/components/ui/sidebar"
import { useState, useEffect, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useUser } from "@/contexts/user-context"
import { useTranslation } from "@/contexts/translation-context"
import { usePractice } from "@/contexts/practice-context"
import { TooltipProvider } from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Star, GripVertical, Trash2 } from "lucide-react"
import { isSuperAdminRole, isPracticeAdminRole } from "@/lib/auth-utils"
import { useSidebarSettings } from "@/contexts/sidebar-settings-context"
import Logger from "@/lib/logger"

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
  HARDCODED_PRACTICE_ID,
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
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const hasRestoredScroll = useRef(false)
  const [expandedGroups, setExpandedGroups] = useState<string[]>(DEFAULT_EXPANDED_GROUPS)
  const [lastActivePath, setLastActivePath] = useState<string | null>(null)
  const { open: sidebarOpen, setOpen: setSidebarOpen } = useSidebar()
  const [sidebarPermissions, setSidebarPermissions] = useState<Record<string, boolean>>({})
  const [favorites, setFavorites] = useState<string[]>([])
  const [badgeCounts, setBadgeCounts] = useState<Record<BadgeKey, number>>(DEFAULT_BADGE_COUNTS)
  const [badgeVisibility, setBadgeVisibility] = useState<Record<string, boolean>>(DEFAULT_BADGE_VISIBILITY)
  const [preferencesLoaded, setPreferencesLoaded] = useState(false)
  const initialLoadDone = useRef(false)
  
  // Favorites edit dialog state
  const [showFavoritesEditDialog, setShowFavoritesEditDialog] = useState(false)
  const [editingFavorites, setEditingFavorites] = useState<string[]>([])
  const [draggedFavoriteIndex, setDraggedFavoriteIndex] = useState<number | null>(null)
  const [isSavingFavorites, setIsSavingFavorites] = useState(false)

  const isAdmin = isPracticeAdminRole(currentUser?.role) || isSuperAdminRole(currentUser?.role)
  const isSuperAdmin = isSuperAdminRole(currentUser?.role) || currentUser?.is_super_admin === true
  const sidebarGroups = getNavigationGroups(t)

  // Fetch sidebar badge counts
  useEffect(() => {
    const loadBadgeCounts = async () => {
      const practiceId = currentPractice?.id || HARDCODED_PRACTICE_ID
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
      const practiceId = currentPractice?.id || HARDCODED_PRACTICE_ID
      if (!currentUser?.id) return
      if (initialLoadDone.current) return
      
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
  const favoritesResponse = await fetch(`/api/users/${currentUser.id}/favorites`)
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
                  const navGroups = getNavigationGroups(isAdmin, isSuperAdmin, t)
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
    const practiceId = currentPractice?.id || HARDCODED_PRACTICE_ID
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
    const practiceId = currentPractice?.id || HARDCODED_PRACTICE_ID
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
    const practiceId = currentPractice?.id || HARDCODED_PRACTICE_ID
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
  try {
  const response = await fetch(`/api/users/${currentUser.id}/favorites`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
  item_path: href,
  action: isAdding ? "add" : "remove",
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

  // Favorites editing functions
  const openFavoritesEditDialog = () => {
    setEditingFavorites([...favorites])
    setShowFavoritesEditDialog(true)
  }

  const handleFavoriteDragStart = (index: number) => {
    setDraggedFavoriteIndex(index)
  }

  const handleFavoriteDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedFavoriteIndex === null || draggedFavoriteIndex === index) return

    const newFavorites = [...editingFavorites]
    const draggedItem = newFavorites[draggedFavoriteIndex]
    newFavorites.splice(draggedFavoriteIndex, 1)
    newFavorites.splice(index, 0, draggedItem)
    setEditingFavorites(newFavorites)
    setDraggedFavoriteIndex(index)
  }

  const handleFavoriteDragEnd = () => {
    setDraggedFavoriteIndex(null)
  }

  const moveFavoriteUp = (index: number) => {
    if (index === 0) return
    const newFavorites = [...editingFavorites]
    ;[newFavorites[index - 1], newFavorites[index]] = [newFavorites[index], newFavorites[index - 1]]
    setEditingFavorites(newFavorites)
  }

  const moveFavoriteDown = (index: number) => {
    if (index === editingFavorites.length - 1) return
    const newFavorites = [...editingFavorites]
    ;[newFavorites[index], newFavorites[index + 1]] = [newFavorites[index + 1], newFavorites[index]]
    setEditingFavorites(newFavorites)
  }

  const removeEditingFavorite = (href: string) => {
    setEditingFavorites(editingFavorites.filter((f) => f !== href))
  }

  const saveFavoritesOrder = async () => {
    setIsSavingFavorites(true)
    
    // Update state immediately
    setFavorites(editingFavorites)
    
    // Save to localStorage
    try {
      localStorage.setItem(`sidebar_favorites_${currentUser?.id || 'guest'}`, JSON.stringify(editingFavorites))
    } catch (e) {}

    // Dispatch event to update other components
    window.dispatchEvent(new CustomEvent("favorites-updated", { detail: editingFavorites }))

    // Save to database
    if (currentUser?.id) {
      try {
        await fetch(`/api/users/${currentUser.id}/favorites`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "reorder", favorites: editingFavorites }),
        })
      } catch (error) {
        console.error("[v0] Error saving favorites order:", error)
      }
    }

    setIsSavingFavorites(false)
    setShowFavoritesEditDialog(false)
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
                onToggleGroup={toggleGroup}
                onNavigate={handleNavigation}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        </div>

        {/* Favorites Edit Dialog - Updated */}
        <Dialog open={showFavoritesEditDialog} onOpenChange={setShowFavoritesEditDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                {t("favorites.edit", "Favoriten bearbeiten")}
              </DialogTitle>
              <DialogDescription>
                {t("favorites.edit_desc", "Ordnen Sie Ihre Favoriten per Drag & Drop neu an oder entfernen Sie sie")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {editingFavorites.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                  <Star className="h-12 w-12 mb-4 opacity-30" />
                  <p className="font-medium">{t("favorites.empty", "Keine Favoriten vorhanden")}</p>
                  <p className="text-sm mt-1">
                    {t("favorites.empty_hint", "Klicken Sie mit der rechten Maustaste auf einen Menüpunkt, um ihn als Favorit hinzuzufügen")}
                  </p>
                </div>
              ) : (
                editingFavorites.map((href, index) => {
                  const item = allNavItems.find((i) => i.href === href)
                  if (!item) return null
                  const Icon = item.icon

                  return (
                    <div
                      key={href}
                      draggable
                      onDragStart={() => handleFavoriteDragStart(index)}
                      onDragOver={(e) => handleFavoriteDragOver(e, index)}
                      onDragEnd={handleFavoriteDragEnd}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border bg-card transition-all cursor-move",
                        draggedFavoriteIndex === index && "opacity-50 border-primary"
                      )}
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="p-1.5 rounded-md bg-amber-500/10">
                          <Icon className="h-4 w-4 text-amber-600" />
                        </div>
                        <span className="font-medium truncate">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => moveFavoriteUp(index)}
                          disabled={index === 0}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m18 15-6-6-6 6"/>
                          </svg>
                          <span className="sr-only">Nach oben</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => moveFavoriteDown(index)}
                          disabled={index === editingFavorites.length - 1}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m6 9 6 6 6-6"/>
                          </svg>
                          <span className="sr-only">Nach unten</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => removeEditingFavorite(href)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Entfernen</span>
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
            {editingFavorites.length > 0 && (
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowFavoritesEditDialog(false)}>
                  {t("common.cancel", "Abbrechen")}
                </Button>
                <Button onClick={saveFavoritesOrder} disabled={isSavingFavorites}>
                  {isSavingFavorites ? t("common.saving", "Speichern...") : t("common.save", "Speichern")}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </Sidebar>
    </TooltipProvider>
  )
}

export default AppSidebar
