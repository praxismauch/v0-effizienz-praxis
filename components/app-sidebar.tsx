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
import { createClient as createBrowserClient } from "@/lib/supabase/client"
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
  UserCog,
  Award,
  ChevronDown,
  StarOff,
  ExternalLink,
  CalendarClock,
  Clock,
  Heart,
  CircleDot,
  MessageCircle,
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
      },
      {
        name: t("sidebar.goals", "Ziele"),
        href: "/goals",
        icon: Target,
        key: "goals",
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
        name: "Praxis-Journal",
        href: "/practice-journals",
        icon: BookOpen,
        key: "practice-journals",
      },
      {
        name: t("sidebar.documents", "Dokumente"),
        href: "/documents",
        icon: FileText,
        key: "documents",
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
        icon: MessageSquare,
        key: "protocols",
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
        name: t("sidebar.qualitaetszirkel", "Qualitätszirkel"),
        href: "/qualitaetszirkel",
        icon: CircleDot,
        key: "qualitaetszirkel",
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
        name: t("sidebar.skills", "Kompetenzen"),
        href: "/skills",
        icon: Award,
        key: "skills",
      },
      {
        name: t("sidebar.profile", "Profil"),
        href: "/profile",
        icon: UserCog,
        key: "profile",
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
      },
      {
        name: t("sidebar.surveys", "Umfragen"),
        href: "/surveys",
        icon: ClipboardList, // Updated icon
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
      },
      {
        name: t("sidebar.devices", "Geräte"),
        href: "/devices",
        icon: Stethoscope,
        key: "devices",
        badge: "devices",
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
  const [expandedGroups, setExpandedGroups] = useState<string[]>([
    "overview",
    "planning",
    "data",
    "strategy",
    "team-personal",
    "praxis-einstellungen",
  ])
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
  })
  const [badgeSettings, setBadgeSettings] = useState({ tasks: true, goals: true, workflows: true, candidates: true })
  const [mounted, setMounted] = useState(false)
  const [missionStatement, setMissionStatement] = useState<string | null>(null)
  const [loadingMission, setLoadingMission] = useState(false)

  const isAdmin = isPracticeAdminRole(currentUser?.role) || currentUser?.role === "admin"
  const isSuperAdmin = isSuperAdminRole(currentUser?.role) || currentUser?.is_super_admin === true
  const sidebarGroups = getNavigationGroups(isAdmin, isSuperAdmin, t)

  useEffect(() => {
    const loadSidebarState = async () => {
      if (!currentUser?.id || !currentPractice?.id) return

      try {
        const supabase = createBrowserClient()
        const { data, error } = await supabase
          .from("user_sidebar_preferences")
          .select("expanded_groups, expanded_items")
          .eq("user_id", currentUser.id)
          .eq("practice_id", currentPractice.id)
          .maybeSingle()

        if (data && !error) {
          if (Array.isArray(data.expanded_groups)) {
            setExpandedGroups(data.expanded_groups)
          } else {
            setExpandedGroups(["overview", "planning", "data", "strategy", "team-personal", "praxis-einstellungen"])
          }

          if (data.expanded_items?.lastPath) {
            setLastActivePath(data.expanded_items.lastPath)
            const activeGroup = sidebarGroups.find((group) =>
              group.items?.some((item) => item.href === data.expanded_items.lastPath),
            )
            if (activeGroup && !expandedGroups.includes(activeGroup.id)) {
              setExpandedGroups((prev) => (Array.isArray(prev) ? [...prev, activeGroup.id] : [activeGroup.id]))
            }
          }

          if (data.expanded_items?.scrollPosition !== undefined && !hasRestoredScroll.current) {
            hasRestoredScroll.current = true
            setTimeout(() => {
              if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollTop = data.expanded_items.scrollPosition
              }
            }, 100)
          }
        } else {
          setExpandedGroups(["overview", "planning", "data", "strategy", "team-personal", "praxis-einstellungen"])
        }
      } catch (error) {
        console.error("Error loading sidebar state:", error)
        setExpandedGroups(["overview", "planning", "data", "strategy", "team-personal", "praxis-einstellungen"])
      }
    }

    loadSidebarState()
  }, [currentUser?.id, currentPractice?.id])

  useEffect(() => {
    if (!pathname || !currentUser?.id || !currentPractice?.id) return

    const activeGroup = sidebarGroups.find((group) => group.items?.some((item) => item.href === pathname))

    if (activeGroup && !expandedGroups.includes(activeGroup.id)) {
      setExpandedGroups((prev) => [...prev, activeGroup.id])
    }

    const saveLastPath = async () => {
      try {
        await fetch(`/api/users/${currentUser.id}/sidebar-preferences`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            practice_id: currentPractice.id,
            expanded_items: { lastPath: pathname },
          }),
        })
      } catch (error) {
        console.error("Error saving last path:", error)
      }
    }

    saveLastPath()
  }, [pathname, currentUser?.id, currentPractice?.id])

  const toggleGroup = async (groupId: string) => {
    const currentGroups = Array.isArray(expandedGroups) ? expandedGroups : ["overview"]
    const newExpandedGroups = currentGroups.includes(groupId)
      ? currentGroups.filter((group) => group !== groupId)
      : [...currentGroups, groupId]
    setExpandedGroups(newExpandedGroups)

    if (!currentUser?.id || !currentPractice?.id) return

    try {
      await fetch(`/api/users/${currentUser.id}/sidebar-preferences`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          practice_id: currentPractice.id,
          expanded_groups: newExpandedGroups,
        }),
      })
    } catch (error) {
      console.error("Error saving sidebar state:", error)
    }
  }

  useEffect(() => {
    const loadSidebarPermissions = async () => {
      if (!currentUser?.id) return

      try {
        const response = await fetch(`/api/users/${currentUser.id}/sidebar-permissions`)
        if (response.ok) {
          const data = await response.json()
          const permissionsMap: { [key: string]: boolean } = {}
          data.permissions?.forEach((perm: any) => {
            permissionsMap[perm.sidebar_item] = perm.is_visible
          })
          setSidebarPermissions(permissionsMap)
        }
      } catch (error) {
        console.error("[v0] Error loading sidebar permissions:", error)
      }
    }

    loadSidebarPermissions()
  }, [currentUser?.id])

  useEffect(() => {
    const loadBadgeData = async () => {
      if (!currentPractice?.id) return

      try {
        if (mounted) {
          const savedDisplaySettings = localStorage.getItem("displaySettings")
          if (savedDisplaySettings) {
            const displaySettings = JSON.parse(savedDisplaySettings)
            if (displaySettings.sidebarBadges) {
              setBadgeSettings(displaySettings.sidebarBadges)
            }
          }
        }

        const fetchPromises: Promise<any>[] = [
          fetch(`/api/practices/${currentPractice.id}/sidebar-badges`)
            .then((res) => (res.ok ? res.json() : null))
            .catch(() => null),
        ]

        if (isSuperAdminRole(currentUser?.role)) {
          fetchPromises.push(
            fetch("/api/admin/waitlist/count")
              .then((res) => (res.ok ? res.json() : null))
              .catch(() => null),
          )
        }

        const [badgeData, waitlistData] = await Promise.all(fetchPromises)

        setBadgeCounts((prev) => ({
          ...prev,
          tasks: badgeData?.tasks || 0,
          goals: badgeData?.goals || 0,
          workflows: badgeData?.workflows || 0,
          candidates: badgeData?.candidates || 0,
          tickets: badgeData?.tickets || 0,
          teamMembers: badgeData?.teamMembers || 0,
          responsibilities: badgeData?.responsibilities || 0,
          surveys: badgeData?.surveys || 0,
          inventory: badgeData?.inventory || 0,
          devices: badgeData?.devices || 0,
          ...(waitlistData && { waitlist: waitlistData.count || 0 }),
        }))
      } catch (error) {
        console.error("[v0] Error loading badge data:", error)
      }
    }

    loadBadgeData()

    const interval = setInterval(loadBadgeData, 300000)
    return () => clearInterval(interval)
  }, [currentPractice?.id, currentUser?.role, mounted])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const loadFavoritesFromLocalStorage = () => {
      if (!currentPractice?.id) return

      const localFavorites = localStorage.getItem(`sidebar_favorites_${currentPractice.id}`)
      if (localFavorites) {
        try {
          setFavorites(JSON.parse(localFavorites))
        } catch {
          // Ignore parse errors
        }
      }
    }

    loadFavoritesFromLocalStorage()
  }, [currentPractice?.id])

  const toggleFavorite = async (href: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    const newFavorites = favorites.includes(href) ? favorites.filter((f) => f !== href) : [...favorites, href]

    setFavorites(newFavorites)

    if (currentPractice?.id) {
      localStorage.setItem(`sidebar_favorites_${currentPractice.id}`, JSON.stringify(newFavorites))
    }
  }

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

  useEffect(() => {
    if (!scrollContainerRef.current || !currentUser?.id || !currentPractice?.id) return

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
              practice_id: currentPractice.id,
              expanded_items: { lastPath: pathname, scrollPosition },
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
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
                  <Logo className="h-4 w-4 text-primary" />
                </div>
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
              {!sidebarOpen ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
                  <Logo className="h-4 w-4 text-primary" />
                </div>
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
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
                                    <StarOff className="mr-2 h-4 w-4 text-amber-500" />
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
