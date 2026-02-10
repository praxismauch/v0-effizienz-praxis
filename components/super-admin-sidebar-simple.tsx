"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useUser } from "@/contexts/user-context"
import {
  ChevronDown,
  ChevronRight,
  Star,
  X,
  ExternalLink,
  ArrowLeft,
  LayoutGrid,
  Building2,
  Mail,
  Users,
  Settings,
  BarChart3,
  CreditCard,
  GraduationCap,
  ListTodo,
  MapIcon,
  FileText,
  Camera,
  TestTube,
  ToggleLeft,
  AlertTriangle,
  Shield,
  FolderKanban,
  Award,
  Workflow,
  ClipboardCheck,
  Share2,
  LayoutPanelLeft,
  MessageSquare,
  Cog,
} from "lucide-react"

type BadgeType =
  | "tickets"
  | "practices"
  | "pendingUsers"
  | "waitlist"
  | "subscriptions"
  | "popups"
  | "backup"
  | "criticalLogs"
  | "recommendations"
  | "totalUsers"
  | "kpiCategories"
  | "features"
  | "chatLogs"
  | "landingpages"
  | "academy"
  | "skills"
  | "workflows"
  | "checklists"
  | "documents"
  | "teams"
  | "eventTypes"

interface MenuItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  href?: string
  badge?: boolean
  badgeType?: BadgeType
  subitems?: MenuItem[]
}

interface MenuSection {
  id: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  items: MenuItem[]
}

export function SuperAdminSidebarSimple() {
  const pathname = usePathname()
  const { currentUser } = useUser()
  const [collapsed, setCollapsed] = useState(false)
  const [openSections, setOpenSections] = useState<string[]>(["overview", "management"])
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [mounted, setMounted] = useState(false)
  const [favorites, setFavorites] = useState<string[]>([])
  const [isEditingFavorites, setIsEditingFavorites] = useState(false)

  // Badge counts state
  const [waitlistCount, setWaitlistCount] = useState(0)
  const [ticketCount, setTicketCount] = useState(0)
  const [backupCount, setBackupCount] = useState(0)
  const [pendingUsersCount, setPendingUsersCount] = useState(0)
  const [activePopupsCount, setActivePopupsCount] = useState(0)
  const [activeSubscriptionsCount, setActiveSubscriptionsCount] = useState(0)
  const [criticalLogsCount, setCriticalLogsCount] = useState(0)
  const [activePracticesCount, setActivePracticesCount] = useState(0)
  const [recommendationsCount, setRecommendationsCount] = useState(0)
  const [totalUsersCount, setTotalUsersCount] = useState(0)
  const [kpiCategoriesCount, setKpiCategoriesCount] = useState(0)
  const [featuresCount, setFeaturesCount] = useState(0)
  const [chatLogsCount, setChatLogsCount] = useState(0)
  const [landingpagesCount, setLandingpagesCount] = useState(0)
  const [academyCount, setAcademyCount] = useState(0)
  const [skillsCount, setSkillsCount] = useState(0)
  const [workflowsCount, setWorkflowsCount] = useState(0)
  const [checklistsCount, setChecklistsCount] = useState(0)
  const [documentsCount, setDocumentsCount] = useState(0)
  const [teamsCount, setTeamsCount] = useState(0)
  const [eventTypesCount, setEventTypesCount] = useState(0)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Load sidebar state (collapsed, sections, expanded items, favorites)
  useEffect(() => {
    if (!mounted) return

    const loadSidebarState = async () => {
      // Always load from localStorage first for instant restore
      try {
        const savedSections = localStorage.getItem("superAdminSidebarSections")
        const savedExpanded = localStorage.getItem("superAdminExpandedItems")
        const savedCollapsed = localStorage.getItem("superAdminSidebarCollapsed")
        const savedFavorites = localStorage.getItem("superAdminFavorites")
        console.log("[v0] Simple sidebar load - localStorage favorites raw:", savedFavorites)
        if (savedSections) {
          const parsed = JSON.parse(savedSections)
          if (Array.isArray(parsed) && parsed.length > 0) setOpenSections(parsed)
        }
        if (savedExpanded) {
          const parsed = JSON.parse(savedExpanded)
          if (Array.isArray(parsed)) setExpandedItems(parsed)
        }
        if (savedCollapsed) {
          setCollapsed(savedCollapsed === "true")
        }
        if (savedFavorites) {
          const parsed = JSON.parse(savedFavorites)
          console.log("[v0] Simple sidebar load - parsed favorites:", parsed)
          if (Array.isArray(parsed)) setFavorites(parsed)
        }
      } catch (e) {
        console.warn("[v0] Failed to parse sidebar state from localStorage:", e)
      }

      // Then try API for database-backed state (overrides localStorage if available)
      if (currentUser?.id) {
        try {
          const res = await fetch(`/api/users/${currentUser.id}/sidebar-preferences?practice_id=super-admin`)
          console.log("[v0] Simple sidebar API response status:", res.status)
          if (res.ok) {
            const data = await res.json()
            const prefs = data.preferences || data
            console.log("[v0] Simple sidebar API favorites:", prefs.favorites)
            if (prefs.expanded_groups && Array.isArray(prefs.expanded_groups)) {
              setOpenSections(prefs.expanded_groups)
            }
            if (prefs.expanded_items && Array.isArray(prefs.expanded_items)) {
              setExpandedItems(prefs.expanded_items)
            }
            if (typeof prefs.is_collapsed === "boolean") {
              setCollapsed(prefs.is_collapsed)
            }
            if (prefs.favorites && Array.isArray(prefs.favorites) && prefs.favorites.length > 0) {
              setFavorites(prefs.favorites)
              try { localStorage.setItem("superAdminFavorites", JSON.stringify(prefs.favorites)) } catch (e) {}
            }
          }
        } catch (error) {
          console.debug("[v0] Error loading super admin sidebar state:", error)
        }
      }
    }

    loadSidebarState()
  }, [currentUser?.id, mounted])

  // Load all badge counts
  useEffect(() => {
    const loadAllCounts = async () => {
      try {
        const [
          waitlistRes,
          ticketsRes,
          backupRes,
          pendingUsersRes,
          totalUsersRes,
          popupsRes,
          subscriptionsRes,
          logsRes,
          practicesRes,
          recommendationsRes,
          kpiRes,
          featuresRes,
          chatLogsRes,
          landingpagesRes,
          academyRes,
          templatesRes,
        ] = await Promise.allSettled([
          fetch("/api/admin/waitlist/count"),
          fetch("/api/tickets/count"),
          fetch("/api/super-admin/backups/count"),
          fetch("/api/super-admin/pending-users/count"),
          fetch("/api/super-admin/users/count"),
          fetch("/api/popups"),
          fetch("/api/superadmin/subscriptions/count"),
          fetch("/api/super-admin/logs/count"),
          fetch("/api/practices/count"),
          fetch("/api/super-admin/optimization-metrics"),
          fetch("/api/global-parameter-groups"),
          fetch("/api/super-admin/features"),
          fetch("/api/super-admin/chat-logs/count"),
          fetch("/api/super-admin/landingpages/count"),
          fetch("/api/super-admin/academy/count"),
          fetch("/api/super-admin/content/counts"),
        ])

        if (waitlistRes.status === "fulfilled" && waitlistRes.value.ok) {
          const data = await waitlistRes.value.json()
          setWaitlistCount(data.count || 0)
        }

        if (ticketsRes.status === "fulfilled" && ticketsRes.value.ok) {
          const data = await ticketsRes.value.json()
          setTicketCount(data.count || 0)
        }

        if (backupRes.status === "fulfilled" && backupRes.value.ok) {
          const data = await backupRes.value.json()
          setBackupCount(data.count || 0)
        }

        if (pendingUsersRes.status === "fulfilled" && pendingUsersRes.value.ok) {
          const data = await pendingUsersRes.value.json()
          setPendingUsersCount(data.count || 0)
        }

        if (totalUsersRes.status === "fulfilled" && totalUsersRes.value.ok) {
          const data = await totalUsersRes.value.json()
          setTotalUsersCount(data.count || 0)
        }

        if (popupsRes.status === "fulfilled" && popupsRes.value.ok) {
          const data = await popupsRes.value.json()
          const activeCount = data.popups?.filter((popup: any) => popup.is_active).length || 0
          setActivePopupsCount(activeCount)
        }

        if (subscriptionsRes.status === "fulfilled" && subscriptionsRes.value.ok) {
          const data = await subscriptionsRes.value.json()
          setActiveSubscriptionsCount(data.count || 0)
        }

        if (logsRes.status === "fulfilled" && logsRes.value.ok) {
          const data = await logsRes.value.json()
          setCriticalLogsCount(data.count || 0)
        }

        if (practicesRes.status === "fulfilled" && practicesRes.value.ok) {
          const data = await practicesRes.value.json()
          setActivePracticesCount(data.count || 0)
        }

        if (recommendationsRes.status === "fulfilled" && recommendationsRes.value.ok) {
          const data = await recommendationsRes.value.json()
          setRecommendationsCount(data.recommendations?.length || 0)
        }

        if (kpiRes.status === "fulfilled" && kpiRes.value.ok) {
          const data = await kpiRes.value.json()
          setKpiCategoriesCount(data.categories?.length || 0)
        }

        if (featuresRes.status === "fulfilled" && featuresRes.value.ok) {
          const data = await featuresRes.value.json()
          setFeaturesCount(data.features?.length || 0)
        }

        if (chatLogsRes.status === "fulfilled" && chatLogsRes.value.ok) {
          const data = await chatLogsRes.value.json()
          setChatLogsCount(data.count || 0)
        }

        if (landingpagesRes.status === "fulfilled" && landingpagesRes.value.ok) {
          const data = await landingpagesRes.value.json()
          setLandingpagesCount(data.count || 0)
        }

        if (academyRes.status === "fulfilled" && academyRes.value.ok) {
          const data = await academyRes.value.json()
          setAcademyCount(data.count || 0)
        }

        if (templatesRes.status === "fulfilled" && templatesRes.value.ok) {
          const data = await templatesRes.value.json()
          setSkillsCount(data.skills || 0)
          setWorkflowsCount(data.workflows || 0)
          setChecklistsCount(data.checklists || 0)
          setDocumentsCount(data.documents || 0)
          setTeamsCount(data.teams || 0)
          setEventTypesCount(data.eventTypes || 0)
        }
      } catch (error) {
        console.error("[v0] Error loading badge counts:", error)
      }
    }

    loadAllCounts()
    const interval = setInterval(loadAllCounts, 30000)
    return () => clearInterval(interval)
  }, [])

  const toggleCollapsed = async () => {
    const newCollapsed = !collapsed
    setCollapsed(newCollapsed)

    if (currentUser?.id) {
      try {
        await fetch(`/api/users/${currentUser.id}/sidebar-preferences`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            practice_id: "super-admin",
            is_collapsed: newCollapsed,
          }),
        })
      } catch (error) {
        console.debug("[v0] Error saving super admin sidebar collapsed state:", error)
      }
    } else if (mounted) {
      localStorage.setItem("superAdminSidebarCollapsed", String(newCollapsed))
    }
  }

  const toggleSection = async (sectionId: string) => {
    const newSections = openSections.includes(sectionId)
      ? openSections.filter((s) => s !== sectionId)
      : [...openSections, sectionId]
    setOpenSections(newSections)

    if (currentUser?.id) {
      try {
        await fetch(`/api/users/${currentUser.id}/sidebar-preferences`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            practice_id: "super-admin",
            expanded_groups: newSections,
          }),
        })
      } catch (error) {
        console.debug("[v0] Error saving super admin sidebar sections state:", error)
      }
    } else if (mounted) {
      localStorage.setItem("superAdminSidebarSections", JSON.stringify(newSections))
    }
  }

  const toggleExpandedItem = async (itemId: string) => {
    const newExpandedItems = expandedItems.includes(itemId)
      ? expandedItems.filter((id) => id !== itemId)
      : [...expandedItems, itemId]
    setExpandedItems(newExpandedItems)

    if (currentUser?.id) {
      try {
        await fetch(`/api/users/${currentUser.id}/sidebar-preferences`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            practice_id: "super-admin",
            expanded_items: newExpandedItems,
          }),
        })
      } catch (error) {
        console.debug("[v0] Error saving super admin expanded items state:", error)
      }
    } else if (mounted) {
      localStorage.setItem("superAdminExpandedItems", JSON.stringify(newExpandedItems))
    }
  }

  const toggleFavorite = async (href: string) => {
    const isAdding = !favorites.includes(href)
    const newFavorites = isAdding ? [...favorites, href] : favorites.filter((f) => f !== href)
    console.log("[v0] Simple toggleFavorite:", href, "newFavorites:", newFavorites)
    setFavorites(newFavorites)

    // Always save to localStorage for reliable persistence
    if (mounted) {
      try { 
        localStorage.setItem("superAdminFavorites", JSON.stringify(newFavorites))
        console.log("[v0] Simple saved to localStorage:", JSON.stringify(newFavorites))
        // Verify it was saved
        const verify = localStorage.getItem("superAdminFavorites")
        console.log("[v0] Simple localStorage verify:", verify)
      } catch (e) { console.log("[v0] Simple localStorage save failed:", e) }
    }

    // Also try to save to database if authenticated
    if (currentUser?.id) {
      try {
        await fetch(`/api/users/${currentUser.id}/sidebar-preferences`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            practice_id: "super-admin",
            favorites: newFavorites,
          }),
        })
      } catch (error) {
        console.debug("[v0] Error saving super admin favorites:", error)
      }
    }
  }

  const menuSections: MenuSection[] = [
    {
      id: "overview",
      label: "Übersicht",
      items: [
        {
          id: "dashboard",
          label: "Dashboard",
          icon: LayoutGrid,
          href: "/super-admin",
        },
      ],
    },
    {
      id: "management",
      label: "Verwaltung",
      items: [
        {
          id: "tickets",
          label: "Tickets",
          icon: Mail,
          href: "/super-admin/tickets",
          badge: true,
          badgeType: "tickets" as const,
        },
        {
          id: "practices",
          label: "Praxen",
          icon: Building2,
          href: "/super-admin/verwaltung?tab=practices",
          badge: true,
          badgeType: "practices" as const,
        },
        {
          id: "users",
          label: "Benutzer",
          icon: Users,
          href: "/super-admin/verwaltung?tab=users",
          badge: true,
          badgeType: "totalUsers" as const,
        },
        {
          id: "user-rights",
          label: "Benutzerrechte",
          icon: Shield,
          href: "/super-admin/user-rights",
        },
        {
          id: "kpi-kategorien",
          label: "KPI-Kategorien",
          icon: BarChart3,
          href: "/super-admin/kpi-kategorien",
          badge: true,
          badgeType: "kpiCategories" as const,
        },
        {
          id: "vorlagen",
          label: "Vorlagen",
          icon: FolderKanban,
          subitems: [
            {
              id: "skills",
              label: "Skills",
              icon: Award,
              href: "/super-admin/content?tab=skills",
              badge: true,
              badgeType: "skills" as const,
            },
            {
              id: "workflows",
              label: "Workflows",
              icon: Workflow,
              href: "/super-admin/content?tab=workflows",
              badge: true,
              badgeType: "workflows" as const,
            },
            {
              id: "checklisten",
              label: "Checklisten",
              icon: ClipboardCheck,
              href: "/super-admin/content?tab=checklisten",
              badge: true,
              badgeType: "checklists" as const,
            },
            {
              id: "dokumente",
              label: "Dokumente",
              icon: FileText,
              href: "/super-admin/content?tab=dokumente",
              badge: true,
              badgeType: "documents" as const,
            },
            {
              id: "teams",
              label: "Teams / Gruppen",
              icon: Users,
              href: "/super-admin/content?tab=teams",
              badge: true,
              badgeType: "teams" as const,
            },
            {
              id: "event-types",
              label: "Event-Typen",
              icon: ClipboardCheck,
              href: "/super-admin/content?tab=event-types",
              badge: true,
              badgeType: "eventTypes" as const,
            },
          ],
        },
      ],
    },
    {
      id: "content",
      label: "Content",
      items: [
        {
          id: "academy",
          label: "Academy",
          icon: GraduationCap,
          href: "/super-admin/academy",
          badge: true,
          badgeType: "academy" as const,
        },
        {
          id: "waitlist",
          label: "Warteliste",
          icon: ListTodo,
          href: "/super-admin/waitlist",
          badge: true,
          badgeType: "waitlist" as const,
        },
      ],
    },
    {
      id: "finance",
      label: "Finanzen",
      items: [
        {
          id: "zahlungen",
          label: "Zahlungen",
          icon: CreditCard,
          href: "/super-admin/zahlungen",
          badge: true,
          badgeType: "subscriptions" as const,
        },
      ],
    },
    {
      id: "super-admin-menu",
      label: "Management",
      items: [
        {
          id: "roadmap",
          label: "Roadmap & Ideen",
          icon: MapIcon,
          href: "/super-admin/roadmap",
        },
      ],
    },
    {
      id: "marketing",
      label: "Marketing",
      items: [
        {
          id: "social-media",
          label: "Social Media Posts",
          icon: Share2,
          href: "/super-admin/social-media",
        },
      ],
    },
    {
      id: "pages",
      label: "Seiten",
      items: [
        {
          id: "landingpages",
          label: "Landingpages",
          icon: LayoutPanelLeft,
          href: "/super-admin/landingpages",
          badge: true,
          badgeType: "landingpages" as const,
        },
      ],
    },
    {
      id: "testing",
      label: "Testing",
      items: [
        {
          id: "testing",
          label: "UI-Tests",
          icon: TestTube,
          href: "/super-admin/testing",
        },
        {
          id: "screenshots",
          label: "Screenshots",
          icon: Camera,
          href: "/super-admin/screenshots",
        },
      ],
    },
    {
      id: "system",
      label: "System",
      items: [
        {
          id: "system",
          label: "Systemverwaltung",
          icon: Settings,
          href: "/super-admin/system",
          badge: true,
          badgeType: "backup" as const,
        },
        {
          id: "features",
          label: "Feature-Verwaltung",
          icon: ToggleLeft,
          href: "/super-admin/features",
          badge: true,
          badgeType: "features" as const,
        },
        {
          id: "chat-logs",
          label: "Chat-Protokolle",
          icon: MessageSquare,
          href: "/super-admin/chat-logs",
          badge: true,
          badgeType: "chatLogs" as const,
        },
        {
          id: "error-logs",
          label: "Error Logging",
          icon: AlertTriangle,
          href: "/super-admin/logging",
          badge: true,
          badgeType: "criticalLogs" as const,
        },
        {
          id: "admin-settings",
          label: "Admin-Einstellungen",
          icon: Cog,
          href: "/super-admin/settings",
        },
      ],
    },
  ]

  const getBadgeCount = (badgeType?: BadgeType): number => {
    if (!badgeType) return 0
    const counts = {
      tickets: ticketCount,
      practices: activePracticesCount,
      pendingUsers: pendingUsersCount,
      waitlist: waitlistCount,
      subscriptions: activeSubscriptionsCount,
      popups: activePopupsCount,
      backup: backupCount,
      criticalLogs: criticalLogsCount,
      recommendations: recommendationsCount,
      totalUsers: totalUsersCount,
      kpiCategories: kpiCategoriesCount,
      features: featuresCount,
      chatLogs: chatLogsCount,
      landingpages: landingpagesCount,
      academy: academyCount,
      skills: skillsCount,
      workflows: workflowsCount,
      checklists: checklistsCount,
      documents: documentsCount,
      teams: teamsCount,
      eventTypes: eventTypesCount,
    }
    return counts[badgeType] || 0
  }

  const isActive = (item: MenuItem): boolean => {
    if (!item.href) return false
    return pathname === item.href || pathname.startsWith(item.href + "/")
  }

  // Get favorite items from menu
  const favoriteItems: MenuItem[] = []
  menuSections.forEach((section) => {
    section.items.forEach((item) => {
      if (item.href && favorites.includes(item.href)) {
        favoriteItems.push(item)
      }
      if (item.subitems) {
        item.subitems.forEach((subitem) => {
          if (subitem.href && favorites.includes(subitem.href)) {
            favoriteItems.push(subitem)
          }
        })
      }
    })
  })

  const renderMenuItem = (item: MenuItem) => {
    const Icon = item.icon
    const active = isActive(item)
    const badgeCount = item.badge ? getBadgeCount(item.badgeType) : 0
    const hasSubitems = item.subitems && item.subitems.length > 0
    const isExpanded = expandedItems.includes(item.id)

    if (hasSubitems) {
      return (
        <div key={item.id}>
          <button
            onClick={() => toggleExpandedItem(item.id)}
            className={cn(
              "flex w-full items-center rounded-md py-2 px-3 text-sm transition-all",
              collapsed ? "justify-center" : "gap-2",
              "text-slate-300 hover:bg-slate-800/50 hover:text-white",
            )}
          >
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Icon className="h-4 w-4 shrink-0" />
                </TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            ) : (
              <>
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate text-left">{item.label}</span>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0" />
                )}
              </>
            )}
          </button>
          {isExpanded && !collapsed && (
            <div className="ml-4 mt-1 space-y-0.5">
              {item.subitems!.map((subitem) => renderMenuItem(subitem))}
            </div>
          )}
        </div>
      )
    }

    const content = (
      <Link
        key={item.id}
        href={item.href || "#"}
        className={cn(
          "flex items-center rounded-md py-2 px-3 text-sm transition-all",
          collapsed ? "justify-center" : "gap-2",
          active ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800/50 hover:text-white",
        )}
      >
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Icon className="h-4 w-4 shrink-0" />
            </TooltipTrigger>
            <TooltipContent side="right">{item.label}</TooltipContent>
          </Tooltip>
        ) : (
          <>
            <Icon className="h-4 w-4 shrink-0" />
            <span className="flex-1 truncate">{item.label}</span>
            {badgeCount > 0 && (
              <Badge
                variant={active ? "secondary" : "default"}
                className="ml-auto shrink-0 bg-blue-500 text-white"
              >
                {badgeCount}
              </Badge>
            )}
          </>
        )}
      </Link>
    )

    if (item.href && !collapsed) {
      return (
        <ContextMenu key={item.id}>
          <ContextMenuTrigger asChild>{content}</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onClick={() => item.href && toggleFavorite(item.href)}>
              <Star className="mr-2 h-4 w-4" />
              {favorites.includes(item.href) ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={() => window.open(item.href, "_blank")}>
              <ExternalLink className="mr-2 h-4 w-4" />
              In neuem Tab öffnen
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      )
    }

    return content
  }

  return (
    <div
      className={cn(
        "flex h-full w-64 flex-col bg-slate-900 border-r border-slate-700/50 transition-all duration-300",
        collapsed && "w-16",
      )}
    >
      {/* Header */}
      <div className="flex h-16 shrink-0 items-center justify-between px-4 border-b border-slate-700/50">
        {!collapsed && <h2 className="text-lg font-semibold text-white">Super Admin</h2>}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapsed}
          className="text-slate-300 hover:text-white hover:bg-slate-700/50"
        >
          <ChevronRight className={cn("h-4 w-4 transition-transform", collapsed ? "" : "rotate-180")} />
        </Button>
      </div>

      {/* Back to App Button */}
      <div className="px-2 py-2 border-b border-slate-700/50">
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
            "text-slate-300 hover:text-white hover:bg-slate-700/50",
            collapsed && "justify-center",
          )}
        >
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <ArrowLeft className="h-4 w-4" />
              </TooltipTrigger>
              <TooltipContent side="right">Zurück zur App</TooltipContent>
            </Tooltip>
          ) : (
            <>
              <ArrowLeft className="h-4 w-4" />
              <span>Zurück zur App</span>
            </>
          )}
        </Link>
      </div>

      {/* Favorites Section */}
      {favoriteItems.length > 0 && (
        <div className="px-3 py-2 border-b border-slate-700/50">
          <div className="flex items-center justify-between px-2 py-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-500">
              <Star className="h-3.5 w-3.5 fill-amber-500" />
              {!collapsed && <span className="uppercase tracking-wide">Favoriten</span>}
            </div>
            {!collapsed && (
              <button
                onClick={() => setIsEditingFavorites(!isEditingFavorites)}
                className="text-xs text-slate-400 hover:text-amber-500 hover:underline transition-colors font-medium"
              >
                {isEditingFavorites ? "Fertig" : "Bearbeiten"}
              </button>
            )}
          </div>
          <div className="mt-1 space-y-0.5">
            {favoriteItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item)
              const badgeCount = item.badge ? getBadgeCount(item.badgeType) : 0

              if (isEditingFavorites && !collapsed) {
                return (
                  <div
                    key={`fav-edit-${item.href}`}
                    className="flex items-center justify-between rounded-md py-2 pl-6 pr-3 text-sm bg-slate-800/50"
                  >
                    <span className="flex-1 truncate text-slate-300">{item.label}</span>
                    <button
                      onClick={() => item.href && toggleFavorite(item.href)}
                      className="text-red-500 hover:text-red-400 transition-colors p-1"
                      title="Aus Favoriten entfernen"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )
              }

              return (
                <Link
                  key={`fav-${item.href}`}
                  href={item.href || "#"}
                  className={cn(
                    "flex items-center rounded-md py-2 px-3 text-sm transition-all",
                    collapsed ? "justify-center" : "gap-2",
                    active ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800/50 hover:text-white",
                  )}
                >
                  {collapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Icon className="h-4 w-4" />
                      </TooltipTrigger>
                      <TooltipContent side="right">{item.label}</TooltipContent>
                    </Tooltip>
                  ) : (
                    <>
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {badgeCount > 0 && (
                        <Badge variant={active ? "secondary" : "default"} className="ml-auto shrink-0">
                          {badgeCount}
                        </Badge>
                      )}
                    </>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-2">
        <div className="space-y-4">
          {menuSections.map((section) => {
            const SectionIcon = section.icon
            const isSectionOpen = openSections.includes(section.id)

            return (
              <div key={section.id}>
                <button
                  onClick={() => toggleSection(section.id)}
                  className={cn(
                    "flex w-full items-center px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors",
                    collapsed ? "justify-center" : "gap-2",
                    "text-slate-400 hover:text-slate-200",
                  )}
                >
                  {collapsed ? (
                    <>
                      {SectionIcon && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <SectionIcon className="h-3.5 w-3.5" />
                          </TooltipTrigger>
                          <TooltipContent side="right">{section.label}</TooltipContent>
                        </Tooltip>
                      )}
                    </>
                  ) : (
                    <>
                      {SectionIcon && <SectionIcon className="h-3.5 w-3.5 shrink-0" />}
                      <span className="flex-1 text-left">{section.label}</span>
                      {isSectionOpen ? (
                        <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                      )}
                    </>
                  )}
                </button>
                {(isSectionOpen || collapsed) && (
                  <div className="mt-1 space-y-0.5">{section.items.map((item) => renderMenuItem(item))}</div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-slate-700/50 p-4">
        {collapsed ? (
          <div className="flex justify-center">
            <Shield className="h-5 w-5 text-slate-400" />
          </div>
        ) : (
          <p className="text-xs text-slate-400 text-center">© 2026 Praxis Effizienz</p>
        )}
      </div>
    </div>
  )
}
