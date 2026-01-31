"use client"

import type React from "react"
import { Logo } from "@/components/logo"
import { Sidebar, SidebarHeader } from "@/components/ui/sidebar"
import { useSidebar } from "@/components/ui/sidebar"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useUser } from "@/contexts/user-context"
import { useTranslation } from "@/contexts/translation-context"
import { usePractice } from "@/contexts/practice-context"
import { useOnboarding } from "@/contexts/onboarding-context"
import { PracticeSelector } from "@/components/practice-selector"
import {
  LayoutDashboard,
  Users,
  Calendar,
  Settings,
  FileText,
  BarChart3,
  ClipboardList,
  Target,
  BookOpen,
  MessageSquare,
  Contact,
  Workflow,
  CalendarDays,
  Crown,
  FolderKanban,
  LineChart,
  Package,
  Stethoscope,
  Lightbulb,
  BriefcaseBusiness,
  Star,
  ChevronRight,
  Pin,
  Sparkles,
  Network,
  Wrench,
  ClipboardCheck,
  Compass,
  Award,
  ChevronDown,

  ExternalLink,
  CalendarClock,
  Clock,
  Heart,
  CircleDot,
  MessageCircle,
  GraduationCap,
  AlertCircle,
  BookMarked,
  TrendingUp,
  FileCheck,
  HelpCircle,
  Shield,
} from "lucide-react"
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { isSuperAdminRole, isPracticeAdminRole } from "@/lib/auth-utils"

const HARDCODED_PRACTICE_ID = "1"

const getNavigationGroups = (isAdmin: boolean, isSuperAdmin: boolean, t: (key: string, fallback: string) => string) => [
  {
    id: "overview",
    label: t("sidebar.group.overview", "Übersicht"),
    items: [
      {
        name: t("sidebar.dashboard", "Dashboard"),
        href: "/dashboard",
        icon: LayoutDashboard,
        key: "dashboard",
      },
      {
        name: t("sidebar.aiAnalysis", "KI-Analyse"),
        href: "/analysis",
        icon: BarChart3,
        key: "aiAnalysis",
      },
      {
        name: t("sidebar.academy", "Academy"),
        href: "/academy",
        icon: GraduationCap,
        key: "academy",
      },
      {
        name: t("sidebar.training", "Fortbildung"),
        href: "/training",
        icon: Award,
        key: "training",
      },
    ],
  },
  {
    id: "planning",
    label: t("sidebar.group.planning", "Planung & Organisation"),
    items: [
      {
        name: t("sidebar.calendar", "Kalender"),
        href: "/calendar",
        icon: CalendarDays,
        key: "calendar",
        badge: "calendar",
      },
      {
        name: t("sidebar.dienstplan", "Dienstplan"),
        href: "/dienstplan",
        icon: CalendarClock,
        key: "dienstplan",
      },
      {
        name: t("sidebar.zeiterfassung", "Zeiterfassung"),
        href: "/zeiterfassung",
        icon: Clock,
        key: "zeiterfassung",
      },
      {
        name: t("sidebar.tasks", "Aufgaben"),
        href: "/todos",
        icon: ClipboardList,
        key: "tasks",
        badge: "tasks",
      },
      {
        name: t("sidebar.goals", "Ziele"),
        href: "/goals",
        icon: Target,
        key: "goals",
        badge: "goals",
      },
      {
        name: t("sidebar.workflows", "Workflows"),
        href: "/workflows",
        icon: Workflow,
        key: "workflows",
        badge: "workflows",
      },
      {
        name: t("sidebar.responsibilities", "Zuständigkeiten"),
        href: "/responsibilities",
        icon: ClipboardCheck,
        key: "responsibilities",
        badge: "responsibilities",
      },
    ],
  },
  {
    id: "data",
    label: t("sidebar.group.data", "Daten & Dokumente"),
    items: [
      {
        name: t("sidebar.analytics", "Kennzahlen"),
        href: "/analytics",
        icon: LineChart,
        key: "analytics",
      },
      {
        name: t("sidebar.documents", "Dokumente"),
        href: "/documents",
        icon: FileText,
        key: "documents",
        badge: "documents",
      },
      {
        name: t("sidebar.praxis_auswertung", "Praxis-Auswertung"),
        href: "/praxis-auswertung",
        icon: BarChart3,
        key: "praxis_auswertung",
      },
      {
        name: t("sidebar.journal", "Journal"),
        href: "/practice-insights",
        icon: TrendingUp,
        key: "journal",
      },
      {
        name: t("sidebar.knowledge", "Wissen"),
        href: "/knowledge",
        icon: BookOpen,
        key: "knowledge",
      },
      {
        name: t("sidebar.protocols", "Protokolle"),
        href: "/protocols",
        icon: FileCheck,
        key: "protocols",
      },
      {
        name: t("sidebar.cirs", "Verbesserungsmeldung"),
        href: "/cirs",
        icon: Shield,
        key: "cirs",
        badge: "cirs",
      },
    ],
  },
  {
    id: "quality-management",
    label: t("sidebar.group.quality_management", "Qualitäts-Management"),
    items: [
      {
        name: t("sidebar.hygieneplan", "Hygieneplan"),
        href: "/hygieneplan",
        icon: Shield,
        key: "hygieneplan",
      },
    ],
  },
  {
    id: "strategy",
    label: t("sidebar.group.strategy", "Strategie & Führung"),
    items: [
      {
        name: t("sidebar.strategy_journey", "Strategiepfad"),
        href: "/strategy-journey",
        icon: Compass,
        key: "strategy_journey",
      },
      {
        name: "Leadership",
        href: "/leadership",
        icon: Crown,
        key: "leadership",
      },
      {
        name: t("sidebar.wellbeing", "Mitarbeiter-Wellbeing"),
        href: "/wellbeing",
        icon: Heart,
        key: "wellbeing",
      },
      {
        name: t("sidebar.leitbild", "Leitbild"),
        href: "/leitbild",
        icon: Sparkles,
        key: "leitbild",
      },
      {
        name: t("sidebar.roi_analysis", "Lohnt-es-sich-Analyse"),
        href: "/roi-analysis",
        icon: LineChart,
        key: "roi_analysis",
      },
      {
        name: "Selbstzahler-Analyse",
        href: "/igel-analysis",
        icon: Lightbulb,
        key: "igel",
      },
      {
        name: "Konkurrenzanalyse",
        href: "/competitor-analysis",
        icon: Network,
        key: "competitor_analysis",
      },
      {
        name: t("sidebar.wunschpatient", "Wunschpatient"),
        href: "/wunschpatient",
        icon: Target,
        key: "wunschpatient",
      },
    ],
  },
  {
    id: "team-personal",
    label: t("sidebar.group.team_personal", "Team & Personal"),
    items: [
      {
        name: t("sidebar.hiring", "Personalsuche"),
        href: "/hiring",
        icon: BriefcaseBusiness,
        key: "hiring",
        badge: "candidates",
      },
      {
        name: t("sidebar.team", "Team"),
        href: "/team",
        icon: Users,
        key: "team",
        badge: "teamMembers",
      },
      {
        name: t("sidebar.mitarbeitergespraeche", "Mitarbeitergespräche"),
        href: "/mitarbeitergespraeche",
        icon: MessageCircle,
        key: "mitarbeitergespraeche",
      },
      {
        name: t("sidebar.selbst_check", "Selbst-Check"),
        href: "/selbst-check",
        icon: Heart,
        key: "selbst_check",
      },
      {
        name: t("sidebar.skills", "Kompetenzen"),
        href: "/skills",
        icon: Award,
        key: "skills",
      },
      {
        name: t("sidebar.organigramm", "Organigramm"),
        href: "/organigramm",
        icon: FolderKanban,
        key: "organigramm",
      },
    ],
  },
  {
    id: "praxis-einstellungen",
    label: t("sidebar.group.praxis_einstellungen", "Praxis & Einstellungen"),
    items: [
      {
        name: t("sidebar.contacts", "Kontakte"),
        href: "/contacts",
        icon: Contact,
        key: "contacts",
        badge: "contacts",
      },
      {
        name: t("sidebar.surveys", "Umfragen"),
        href: "/surveys",
        icon: ClipboardList,
        key: "surveys",
        badge: "surveys",
      },
      {
        name: t("sidebar.arbeitsplaetze", "Arbeitsplätze"),
        href: "/arbeitsplaetze",
        icon: BriefcaseBusiness,
        key: "arbeitsplaetze",
      },
      {
        name: t("sidebar.rooms", "Räume"),
        href: "/rooms",
        icon: Pin,
        key: "rooms",
      },
      {
        name: t("sidebar.arbeitsmittel", "Arbeitsmittel"),
        href: "/arbeitsmittel",
        icon: Wrench,
        key: "arbeitsmittel",
      },
      {
        name: t("sidebar.inventory", "Material"),
        href: "/inventory",
        icon: Package,
        key: "inventory",
        badge: "inventory",
      },
      {
        name: t("sidebar.devices", "Geräte"),
        href: "/devices",
        icon: Stethoscope,
        key: "devices",
        badge: "devices",
      },
      {
        name: t("sidebar.hygiene", "Hygieneplan"),
        href: "/hygiene",
        icon: Sparkles,
        key: "hygiene",
        badge: "hygiene",
      },
      {
        name: t("sidebar.settings", "Einstellungen"),
        href: "/settings",
        icon: Settings,
        key: "settings",
      },
    ],
  },
]

interface AppSidebarProps {
  className?: string
}

export function AppSidebar({ className }: AppSidebarProps) {
  const { t } = useTranslation()
  const pathname = usePathname()
  const router = useRouter()
  const { currentUser } = useUser()
  const { currentPractice } = usePractice()
  const { onboardingComplete } = useOnboarding()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const hasRestoredScroll = useRef(false)
  const pendingScrollPosition = useRef<number | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<string[]>([])
  const [lastActivePath, setLastActivePath] = useState<string | null>(null)
  const { open: sidebarOpen, setOpen: setSidebarOpen, setOpenMobile, isMobile } = useSidebar()
  const [sidebarPermissions, setSidebarPermissions] = useState<{ [key: string]: boolean }>({})
  const [favorites, setFavorites] = useState<string[]>([])
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [badgeCounts, setBadgeCounts] = useState<{
    tasks: number
    goals: number
    workflows: number
    candidates: number
    tickets: number
    waitlist: number
    teamMembers: number
    responsibilities: number
    surveys: number
    inventory: number
    devices: number
    calendar: number
    documents: number
    cirs: number
    contacts: number
    hygiene: number
  }>({
    tasks: 0,
    goals: 0,
    workflows: 0,
    candidates: 0,
    tickets: 0,
    waitlist: 0,
    teamMembers: 0,
    responsibilities: 0,
    surveys: 0,
    inventory: 0,
    devices: 0,
    calendar: 0,
    documents: 0,
    cirs: 0,
    contacts: 0,
    hygiene: 0,
  })
  const [badgeSettings, setBadgeSettings] = useState({ tasks: true, goals: true, workflows: true, candidates: true })
  const [mounted, setMounted] = useState(false)
  const [missionStatement, setMissionStatement] = useState<string | null>(null)
  const [loadingMission, setLoadingMission] = useState(false)
  const [preferencesLoaded, setPreferencesLoaded] = useState(false)
  const initialLoadDone = useRef(false)

  const isAdmin = isPracticeAdminRole(currentUser?.role) || currentUser?.role === "admin"
  const isSuperAdmin = isSuperAdminRole(currentUser?.role) || currentUser?.is_super_admin === true
  const sidebarGroups = getNavigationGroups(isAdmin, isSuperAdmin, t)

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

            // Try to load favorites from database first, fallback to localStorage
            if (data.preferences.favorites && Array.isArray(data.preferences.favorites)) {
              setFavorites(data.preferences.favorites)
            } else {
              // Fallback to localStorage if database doesn't have favorites
              const localStorageKey = `sidebar_favorites_${currentUser.id}_${practiceId}`
              try {
                const localFavorites = localStorage.getItem(localStorageKey)
                if (localFavorites) {
                  const parsed = JSON.parse(localFavorites)
                  if (Array.isArray(parsed)) {
                    setFavorites(parsed)
                  }
                }
              } catch (storageError) {
                console.error("[v0] Failed to load from localStorage:", storageError)
              }
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
          }),
        })
      } catch (error) {
        // Silently fail - not critical
      }
    }

    const timeoutId = setTimeout(saveExpandedGroups, 500)
    return () => clearTimeout(timeoutId)
  }, [expandedGroups, currentUser?.id, currentPractice?.id, preferencesLoaded])

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
            }),
          })
        } catch (error) {
          // Silently fail - scroll position is not critical
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
          }),
        })
      } catch (error) {
        // Silently fail
      }
    }

    const timeoutId = setTimeout(saveSelectedItem, 300)
    return () => clearTimeout(timeoutId)
  }, [pathname, currentUser?.id, currentPractice?.id, preferencesLoaded])

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

    const newFavorites = favorites.includes(href) ? favorites.filter((f) => f !== href) : [...favorites, href]
    
    console.log("[v0] toggleFavorite called - href:", href)
    console.log("[v0] newFavorites:", newFavorites)
    console.log("[v0] currentUser?.id:", currentUser?.id)
    console.log("[v0] preferencesLoaded:", preferencesLoaded)
    
    // Update state first
    setFavorites(newFavorites)
    
    // Save immediately to ensure it persists
    const practiceId = currentPractice?.id || HARDCODED_PRACTICE_ID
    console.log("[v0] practiceId:", practiceId)
    
    if (currentUser?.id && preferencesLoaded) {
      console.log("[v0] Saving to database...")
      try {
        const response = await fetch(`/api/users/${currentUser.id}/sidebar-preferences`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            practice_id: practiceId,
            favorites: newFavorites,
          }),
        })
        console.log("[v0] Response status:", response.status)
        if (!response.ok) {
          console.error("[v0] Failed to save favorite, status:", response.status)
        } else {
          console.log("[v0] Favorite saved successfully!")
        }
      } catch (error) {
        console.error("[v0] Error saving favorite:", error)
      }
    } else {
      console.log("[v0] NOT saving - currentUser?.id:", currentUser?.id, "preferencesLoaded:", preferencesLoaded)
    }
  }

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prevGroups) =>
      prevGroups.includes(groupId) ? prevGroups.filter((group) => group !== groupId) : [...prevGroups, groupId],
    )
  }

  function TourButton({ sidebarOpen }: { sidebarOpen: boolean }) {
    const { isNewPractice, daysRemaining, setIsOnboardingOpen, shouldShowOnboarding } = useOnboarding()

    if (!shouldShowOnboarding) return null

    const buttonContent = (
      <Button
        variant="outline"
        size={sidebarOpen ? "default" : "icon"}
        onClick={() => setIsOnboardingOpen(true)}
        className={cn(
          "w-full gap-2 bg-gradient-to-r from-primary/10 to-primary/5",
          "border-primary/20 hover:border-primary/40 hover:bg-primary/15",
          "text-primary transition-all duration-200",
          !sidebarOpen && "h-10 w-10 p-0",
        )}
      >
        <Calendar className="h-4 w-4" />
        {sidebarOpen && (
          <span className="flex-1 text-left">
            Tour starten
            {isNewPractice && daysRemaining > 0 && (
              <span className="ml-1 text-xs opacity-70">({daysRemaining} Tage)</span>
            )}
          </span>
        )}
      </Button>
    )

    if (!sidebarOpen) {
      return (
        <div className="px-2 py-2 border-b border-sidebar-border/30 shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
            <TooltipContent side="right">
              <p>
                Tour starten
                {isNewPractice && daysRemaining > 0 && ` (${daysRemaining} Tage übrig)`}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      )
    }

    return <div className="px-3 py-2 border-b border-sidebar-border/30 shrink-0">{buttonContent}</div>
  }

  return (
    <TooltipProvider>
      <Sidebar className={cn("border-r border-sidebar-border", className)}>
        <SidebarHeader>
          <div
            className={cn(
              "flex h-16 items-center border-b border-sidebar-border/40 shrink-0",
              !sidebarOpen ? "justify-center px-2" : "justify-between px-4",
            )}
          >
            {sidebarOpen && (
              <Link href="/dashboard" className="flex items-center gap-2">
                <Logo className="h-8 w-8 rounded-lg" />
                <span className="text-base font-bold text-sidebar-foreground">Effizienz Praxis</span>
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={cn(
                "text-sidebar-foreground hover:bg-sidebar-accent",
                !sidebarOpen ? "h-10 w-10" : "h-8 w-8 p-0",
              )}
            >
              {!sidebarOpen ? <Logo className="h-8 w-8 rounded-lg" /> : <ChevronRight className="h-5 w-5" />}
            </Button>
          </div>
        </SidebarHeader>

        {sidebarOpen && (
          <div className="px-3 py-2 border-b border-sidebar-border/30 shrink-0">
            {isSuperAdmin && (
              <Link
                href="/super-admin"
                className="flex items-center gap-2 px-2 py-1.5 mb-2 text-sm font-medium text-sidebar-primary hover:text-sidebar-primary/80 transition-colors"
              >
                <Star className="h-4 w-4 fill-amber-500" />
                <span>Super Admin</span>
              </Link>
            )}
            <PracticeSelector />
          </div>
        )}

        <TourButton sidebarOpen={sidebarOpen} />

        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto sidebar-scrollbar">
          <div className="py-2">
            {favoriteItems.length > 0 && (
              <div className="px-3 py-2 relative border-b border-sidebar-border/20">
                <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-amber-500">
                  <Star className="h-3.5 w-3.5 fill-amber-500" />
                  {sidebarOpen && <span>{t("sidebar.favorites", "Favoriten")}</span>}
                </div>
                <div className="mt-1 space-y-0.5">
                  {favoriteItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    const badgeCount = badgeCounts[item.badge || item.key || ""]

                    return (
                      <ContextMenu key={`fav-${item.href}`}>
                        <ContextMenuTrigger asChild>
                          <div className="relative group">
                            <Link
                              href={item.href}
                              onClick={() => handleNavigation(item.href)}
                              className={cn(
                                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all hover:translate-x-0.5",
                                isActive
                                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                !sidebarOpen && "justify-center px-2",
                                sidebarOpen && badgeCount > 0 && "pr-10",
                              )}
                            >
                              <Icon className="h-4 w-4 flex-shrink-0" />
                              {sidebarOpen && <span className="flex-1 truncate">{item.name}</span>}
                            </Link>
                            {sidebarOpen && badgeCount !== undefined && badgeCount > 0 && (
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                                {badgeCount > 99 ? "99+" : badgeCount}
                              </span>
                            )}
                          </div>
                        </ContextMenuTrigger>
                        <ContextMenuContent className="w-48">
                          <ContextMenuItem
                            onClick={() => toggleFavorite(item.href)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Star className="mr-2 h-4 w-4" />
                            Aus Favoriten entfernen
                          </ContextMenuItem>
                          <ContextMenuSeparator />
                          <ContextMenuItem onClick={() => window.open(item.href, "_blank")}>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            In neuem Tab öffnen
                          </ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    )
                  })}
                </div>
              </div>
            )}

            {sidebarGroups.map((group) => {
              const isExpanded = expandedGroups.includes(group.id)

              return (
                <div key={group.id} className="px-3 py-2 relative border-b border-sidebar-border/20 last:border-b-0">
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="flex w-full items-center justify-between px-2 py-1.5 text-xs font-semibold text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
                  >
                    {sidebarOpen && <span>{group.label}</span>}
                    <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isExpanded && "rotate-180")} />
                  </button>

                  {isExpanded && (
                    <div className="mt-1 space-y-0.5">
                      {group.items.map((item) => {
                        if (item.key && sidebarPermissions[item.key] === false) return null

                        const Icon = item.icon
                        const isActive = pathname === item.href
                        const badgeCount = badgeCounts[item.badge || item.key || ""]
                        const isFavorite = favorites.includes(item.href)

                        return (
                          <ContextMenu key={item.href}>
                            <ContextMenuTrigger asChild>
                              <div className="relative group">
                                <Link
                                  href={item.href}
                                  onClick={() => handleNavigation(item.href)}
                                  className={cn(
                                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all hover:translate-x-0.5",
                                    isActive
                                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                    !sidebarOpen && "justify-center px-2",
                                    sidebarOpen && badgeCount > 0 && "pr-10",
                                  )}
                                >
                                  <Icon className="h-4 w-4 flex-shrink-0" />
                                  {sidebarOpen && (
                                    <span className="flex-1 truncate flex items-center gap-2">
                                      {item.name}
                                      {isFavorite && (
                                        <Star className="h-3 w-3 fill-amber-500 text-amber-500 flex-shrink-0" />
                                      )}
                                    </span>
                                  )}
                                </Link>
                                {sidebarOpen && badgeCount !== undefined && badgeCount > 0 && (
                                  <span className="absolute right-2 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                                    {badgeCount > 99 ? "99+" : badgeCount}
                                  </span>
                                )}
                              </div>
                            </ContextMenuTrigger>
                            <ContextMenuContent className="w-48">
                              <ContextMenuItem onClick={() => toggleFavorite(item.href)}>
                                {isFavorite ? (
                                  <>
                                    <Star className="mr-2 h-4 w-4 text-destructive" />
                                    <span className="text-destructive">Aus Favoriten entfernen</span>
                                  </>
                                ) : (
                                  <>
                                    <Star className="mr-2 h-4 w-4 text-amber-500" />
                                    Zu Favoriten hinzufügen
                                  </>
                                )}
                              </ContextMenuItem>
                              <ContextMenuSeparator />
                              <ContextMenuItem onClick={() => window.open(item.href, "_blank")}>
                                <ExternalLink className="mr-2 h-4 w-4" />
                                In neuem Tab öffnen
                              </ContextMenuItem>
                            </ContextMenuContent>
                          </ContextMenu>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </Sidebar>
    </TooltipProvider>
  )
}

export default AppSidebar
