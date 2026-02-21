"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Shield, Cog, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
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
  Building2,
  Mail,
  Settings,
  CreditCard,
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  GraduationCap,
  LayoutPanelLeft,
  Users,
  FolderKanban,
  FileText,
  Workflow,
  ClipboardCheck,
  Award,
  MapIcon,
  ListTodo,
  ArrowLeft,
  ToggleLeft,
  TestTube,
  MessageSquare,
  Share2,
  BarChart3,
  Camera,
  X,
  ExternalLink,
  AlertTriangle,
  HardDrive,
  MailCheck,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

type SuperAdminSidebarProps = {}

interface MenuItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  href?: string
  badge?: boolean
  badgeType?:
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
  subitems?: MenuItem[]
}

interface MenuSection {
  id: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  items: MenuItem[]
}

export function SuperAdminSidebar({}: SuperAdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { currentUser } = useUser()
  const [collapsed, setCollapsed] = useState(false)
  const [openSections, setOpenSections] = useState<string[]>(["overview", "praxen-benutzer"])
  const [expandedItems, setExpandedItems] = useState<string[]>([])
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
  const [mounted, setMounted] = useState(false)
  const [favorites, setFavorites] = useState<string[]>([])
  const [isEditingFavorites, setIsEditingFavorites] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    
    const loadSidebarState = async () => {
      // Always load from localStorage first for instant restore
      try {
        const savedSections = localStorage.getItem("superAdminSidebarSections")
        const savedExpanded = localStorage.getItem("superAdminExpandedItems")
        const savedCollapsed = localStorage.getItem("superAdminSidebarCollapsed")
        const savedFavorites = localStorage.getItem("superAdminFavorites")
        if (savedSections) {
          const parsed = JSON.parse(savedSections)
          if (Array.isArray(parsed) && parsed.length > 0) setOpenSections(parsed)
        }
        if (savedExpanded) {
          const parsed = JSON.parse(savedExpanded)
          if (Array.isArray(parsed) && parsed.length > 0) setExpandedItems(parsed)
        }
        if (savedCollapsed) {
          setCollapsed(savedCollapsed === "true")
        }
        if (savedFavorites) {
          const parsed = JSON.parse(savedFavorites)
          if (Array.isArray(parsed)) setFavorites(parsed)
        }
      } catch (e) {
        console.warn("[v0] Failed to parse sidebar state from localStorage:", e)
      }

      // Then try API for database-backed state (overrides localStorage if available)
      if (currentUser?.id) {
        try {
          const response = await fetch(`/api/super-admin/sidebar-preferences`)
          if (response.ok) {
            const data = await response.json()
            if (Array.isArray(data.expanded_groups) && data.expanded_groups.length > 0) {
              setOpenSections(data.expanded_groups)
            }
            if (Array.isArray(data.expanded_items) && data.expanded_items.length > 0) {
              setExpandedItems(data.expanded_items)
            }
            if (typeof data.sidebar_collapsed === "boolean") {
              setCollapsed(data.sidebar_collapsed)
            }
            if (Array.isArray(data.favorites) && data.favorites.length > 0) {
              setFavorites(data.favorites)
              try { localStorage.setItem("superAdminFavorites", JSON.stringify(data.favorites)) } catch (e) {}
            }
          }
        } catch (error) {
          console.debug("[v0] Error loading super admin sidebar state from API:", error)
        }
      }
    }

    loadSidebarState()
  }, [mounted, currentUser?.id])

  useEffect(() => {
    const loadWaitlistCount = async () => {
      try {
        const response = await fetch("/api/admin/waitlist/count")
        const contentType = response.headers.get("content-type")
        if (!response.ok || !contentType?.includes("application/json")) {
          setWaitlistCount(0)
          return
        }
        const text = await response.text()
        if (text && text.trim()) {
          try {
            const data = JSON.parse(text)
            setWaitlistCount(data.count || 0)
          } catch (parseError) {
            setWaitlistCount(0)
          }
        } else {
          setWaitlistCount(0)
        }
      } catch (error) {
        setWaitlistCount(0)
      }
    }

    const loadTicketCount = async () => {
      try {
        const response = await fetch("/api/tickets/count")
        if (response.ok) {
          const text = await response.text()
          if (text && text.trim()) {
            try {
              const data = JSON.parse(text)
              setTicketCount(data.count || 0)
            } catch (parseError) {
              console.debug("Failed to parse ticket data:", parseError)
              setTicketCount(0)
            }
          } else {
            setTicketCount(0)
          }
        }
      } catch (error) {
        console.debug("Error loading ticket count:", error)
        setTicketCount(0)
      }
    }

    const loadBackupCount = async () => {
      try {
        const response = await fetch("/api/super-admin/backups/count")
        if (response.ok) {
          const text = await response.text()
          if (text && text.trim()) {
            try {
              const data = JSON.parse(text)
              setBackupCount(data.count || 0)
            } catch (parseError) {
              console.debug("Failed to parse backup data:", parseError)
              setBackupCount(0)
            }
          } else {
            setBackupCount(0)
          }
        }
      } catch (error) {
        console.debug("Error loading backup count:", error)
        setBackupCount(0)
      }
    }

    const loadPendingUsersCount = async () => {
      try {
        const response = await fetch("/api/super-admin/pending-users/count")
        if (response.ok) {
          const text = await response.text()
          if (text && text.trim()) {
            try {
              const data = JSON.parse(text)
              setPendingUsersCount(data.count || 0)
            } catch (parseError) {
              console.debug("Failed to parse pending users data:", parseError)
              setPendingUsersCount(0)
            }
          } else {
            setPendingUsersCount(0)
          }
        }
      } catch (error) {
        console.debug("Error loading pending users count:", error)
        setPendingUsersCount(0)
      }
    }

    const loadTotalUsersCount = async () => {
      try {
        const response = await fetch("/api/super-admin/users/count")
        if (response.ok) {
          const text = await response.text()
          if (text && text.trim()) {
            try {
              const data = JSON.parse(text)
              setTotalUsersCount(data.count || 0)
            } catch (parseError) {
              console.debug("Failed to parse total users data:", parseError)
              setTotalUsersCount(0)
            }
          } else {
            setTotalUsersCount(0)
          }
        }
      } catch (error) {
        console.debug("Error loading total users count:", error)
        setTotalUsersCount(0)
      }
    }

    const loadActivePopupsCount = async () => {
      try {
        const response = await fetch("/api/popups")
        if (response.ok) {
          const text = await response.text()
          if (text && text.trim()) {
            try {
              const data = JSON.parse(text)
              const activeCount = data.popups?.filter((popup: any) => popup.is_active).length || 0
              setActivePopupsCount(activeCount)
            } catch (parseError) {
              console.debug("Failed to parse popups data:", parseError)
              setActivePopupsCount(0)
            }
          } else {
            setActivePopupsCount(0)
          }
        }
      } catch (error) {
        console.debug("Error loading active popups count:", error)
        setActivePopupsCount(0)
      }
    }

    const loadActiveSubscriptionsCount = async () => {
      try {
        const response = await fetch("/api/superadmin/subscriptions/count")
        if (response.ok) {
          const text = await response.text()
          if (text && text.trim()) {
            try {
              const data = JSON.parse(text)
              setActiveSubscriptionsCount(data.count || 0)
            } catch (parseError) {
              console.debug("Failed to parse subscriptions data:", parseError)
              setActiveSubscriptionsCount(0)
            }
          } else {
            setActiveSubscriptionsCount(0)
          }
        }
      } catch (error) {
        console.debug("Error loading active subscriptions count:", error)
        setActiveSubscriptionsCount(0)
      }
    }

    const loadCriticalLogsCount = async () => {
      try {
        const response = await fetch("/api/super-admin/logs/count")
        if (response.ok) {
          const text = await response.text()
          if (text && text.trim()) {
            try {
              const data = JSON.parse(text)
              setCriticalLogsCount(data.count || 0)
            } catch (parseError) {
              console.debug("Failed to parse critical logs data:", parseError)
              setCriticalLogsCount(0)
            }
          } else {
            setCriticalLogsCount(0)
          }
        }
      } catch (error) {
        console.debug("Error loading critical logs count:", error)
        setCriticalLogsCount(0)
      }
    }

    const loadActivePracticesCount = async () => {
      try {
        const response = await fetch("/api/practices/count")
        if (response.ok) {
          const text = await response.text()
          if (text && text.trim()) {
            try {
              const data = JSON.parse(text)
              setActivePracticesCount(data.count || 0)
            } catch (parseError) {
              console.debug("Failed to parse practices data:", parseError)
              setActivePracticesCount(0)
            }
          } else {
            setActivePracticesCount(0)
          }
        }
      } catch (error) {
        console.debug("Error loading active practices count:", error)
        setActivePracticesCount(0)
      }
    }

    const loadRecommendationsCount = async () => {
      try {
        const response = await fetch("/api/super-admin/optimization-metrics")
        if (response.ok) {
          const data = await response.json()
          setRecommendationsCount(data.recommendations?.length || 0)
        }
      } catch (error) {
        console.debug("Error loading recommendations count:", error)
        setRecommendationsCount(0)
      }
    }

    const loadKpiCategoriesCount = async () => {
      try {
        const response = await fetch("/api/global-parameter-groups")
        if (response.ok) {
          const data = await response.json()
          setKpiCategoriesCount(data.categories?.length || 0)
        }
      } catch (error) {
        console.debug("Error loading KPI categories count:", error)
        setKpiCategoriesCount(0)
      }
    }

    const loadFeaturesCount = async () => {
      try {
        const response = await fetch("/api/super-admin/features")
        if (response.ok) {
          const data = await response.json()
          setFeaturesCount(data.features?.length || 0)
        }
      } catch (error) {
        console.debug("Error loading features count:", error)
        setFeaturesCount(0)
      }
    }

    const loadChatLogsCount = async () => {
      try {
        const response = await fetch("/api/super-admin/chat-logs/count")
        if (response.ok) {
          const data = await response.json()
          setChatLogsCount(data.count || 0)
        }
      } catch (error) {
        console.debug("Error loading chat logs count:", error)
        setChatLogsCount(0)
      }
    }

    const loadLandingpagesCount = async () => {
      try {
        const response = await fetch("/api/super-admin/landingpages/count")
        if (response.ok) {
          const data = await response.json()
          setLandingpagesCount(data.count || 0)
        }
      } catch (error) {
        console.debug("Error loading landingpages count:", error)
        setLandingpagesCount(0)
      }
    }

    const loadAcademyCount = async () => {
      try {
        const response = await fetch("/api/super-admin/academy/count")
        if (response.ok) {
          const data = await response.json()
          setAcademyCount(data.count || 0)
        }
      } catch (error) {
        console.debug("Error loading academy count:", error)
        setAcademyCount(0)
      }
    }

    const loadTemplatesCount = async () => {
      try {
        const response = await fetch("/api/super-admin/content/counts")
        if (response.ok) {
          const data = await response.json()
          setSkillsCount(data.skills || 0)
          setWorkflowsCount(data.workflows || 0)
          setChecklistsCount(data.checklists || 0)
          setDocumentsCount(data.documents || 0)
          setTeamsCount(data.teams || 0)
          setEventTypesCount(data.eventTypes || 0)
        }
      } catch (error) {
        console.debug("Error loading templates count:", error)
      }
    }

    loadWaitlistCount()
    loadTicketCount()
    loadBackupCount()
    loadPendingUsersCount()
    loadTotalUsersCount()
    loadActivePopupsCount()
    loadActiveSubscriptionsCount()
    loadCriticalLogsCount()
    loadActivePracticesCount()
    loadRecommendationsCount()
    loadKpiCategoriesCount()
    loadFeaturesCount()
    loadChatLogsCount()
    loadLandingpagesCount()
    loadAcademyCount()
    loadTemplatesCount()

    const interval = setInterval(() => {
      loadWaitlistCount()
      loadTicketCount()
      loadBackupCount()
      loadPendingUsersCount()
      loadTotalUsersCount()
      loadActivePopupsCount()
      loadActiveSubscriptionsCount()
      loadCriticalLogsCount()
      loadActivePracticesCount()
      loadRecommendationsCount()
      loadKpiCategoriesCount()
      loadFeaturesCount()
      loadChatLogsCount()
      loadLandingpagesCount()
      loadAcademyCount()
      loadTemplatesCount()
    }, 30000)
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
        console.debug("Error saving super admin sidebar collapsed state:", error)
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
        console.debug("Error saving super admin sidebar sections state:", error)
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
        console.debug("Error saving super admin expanded items state:", error)
      }
    } else if (mounted) {
      localStorage.setItem("superAdminExpandedItems", JSON.stringify(newExpandedItems))
    }
  }

  const toggleFavorite = async (href: string) => {
    const isAdding = !favorites.includes(href)
    const newFavorites = isAdding ? [...favorites, href] : favorites.filter((f) => f !== href)
    setFavorites(newFavorites)

    // Always save to localStorage for reliable persistence
    if (mounted) {
      try {
        localStorage.setItem("superAdminFavorites", JSON.stringify(newFavorites))
      } catch (e) { /* localStorage not available */ }
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
        console.debug("Error saving super admin favorites:", error)
      }
    }
  }

  // Get all menu items with hrefs for favorites
  const getAllMenuItems = (): MenuItem[] => {
    const items: MenuItem[] = []
    menuSections.forEach((section) => {
      section.items.forEach((item) => {
        if (item.href) {
          items.push(item)
        }
        if (item.subitems) {
          item.subitems.forEach((subitem) => {
            if (subitem.href) {
              items.push(subitem)
            }
          })
        }
      })
    })
    return items
  }

  const favoriteItems = getAllMenuItems().filter((item) => item.href && favorites.includes(item.href))

  const getBadgeCount = (badgeType?: MenuItem["badgeType"]): number => {
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
    if (item.href) {
      return pathname === item.href || pathname.startsWith(item.href + "/")
    }
    return false
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
      id: "praxen-benutzer",
      label: "Praxen & Benutzer",
      items: [
        {
          id: "practices",
          label: "Praxen Verwaltung",
          icon: Building2,
          href: "/super-admin/verwaltung",
          badge: true,
          badgeType: "practices" as const,
        },
        {
          id: "users",
          label: "Benutzer",
          icon: Users,
          href: "/super-admin/users",
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
      id: "content",
      label: "Inhalte & Vorlagen",
      items: [
        {
          id: "vorlagen",
          label: "Vorlagen",
          icon: FolderKanban,
          href: "/super-admin/content",
        },
        {
          id: "academy",
          label: "Academy",
          icon: GraduationCap,
          href: "/super-admin/academy",
          badge: true,
          badgeType: "academy" as const,
        },
        {
          id: "kpi-kategorien",
          label: "KPI Global",
          icon: BarChart3,
          href: "/super-admin/kpi-kategorien",
          badge: true,
          badgeType: "kpiCategories" as const,
        },
      ],
    },
    {
      id: "marketing",
      label: "Marketing",
      items: [
        {
          id: "landingpages",
          label: "Landingpages",
          icon: LayoutPanelLeft,
          href: "/super-admin/landingpages",
          badge: true,
          badgeType: "landingpages" as const,
        },
        {
          id: "social-media",
          label: "Social Media Posts",
          icon: Share2,
          href: "/super-admin/social-media",
        },
        {
          id: "roadmap",
          label: "Roadmap & Ideen",
          icon: MapIcon,
          href: "/super-admin/roadmap",
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
      id: "monitoring",
      label: "Monitoring & Logs",
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
          id: "chat-logs",
          label: "Chat-Protokolle",
          icon: MessageSquare,
          href: "/super-admin/chat-logs",
          badge: true,
          badgeType: "chatLogs" as const,
        },
        {
          id: "error-logs",
          label: "Fehlerprotokoll",
          icon: AlertTriangle,
          href: "/super-admin/logging",
          badge: true,
          badgeType: "criticalLogs" as const,
        },
      ],
    },
    {
      id: "system",
      label: "System & Einstellungen",
      items: [
        {
          id: "system",
          label: "Systemverwaltung",
          icon: Settings,
          href: "/super-admin/system",
        },
        {
          id: "email",
          label: "E-Mail Verwaltung",
          icon: MailCheck,
          href: "/super-admin/email",
        },
        {
          id: "backups",
          label: "Backup",
          icon: HardDrive,
          href: "/super-admin/backups",
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
          id: "admin-settings",
          label: "Admin-Einstellungen",
          icon: Cog,
          href: "/super-admin/settings",
        },
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
  ]

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-slate-900 border-r border-slate-700/50 transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-700/50">
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

      <div className="px-2 py-2 border-b border-slate-700/50">
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
            "text-slate-300 hover:text-white hover:bg-slate-700/50",
            collapsed && "justify-center",
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          {!collapsed && <span>Zurück zur App</span>}
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
                <ContextMenu key={`fav-${item.href}`}>
                  <ContextMenuTrigger asChild>
                    <div className="relative group">
                      {collapsed ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link
                              href={item.href || "#"}
                              className={cn(
                                "flex items-center justify-center rounded-md py-2 px-2 text-sm transition-all",
                                active
                                  ? "bg-blue-600 text-white"
                                  : "text-slate-300 hover:bg-slate-800/50 hover:text-white",
                              )}
                            >
                              <Icon className="h-4 w-4" />
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent side="right">{item.label}</TooltipContent>
                        </Tooltip>
                      ) : (
                        <Link
                          href={item.href || "#"}
                          className={cn(
                            "flex items-center gap-3 rounded-md py-2 text-sm transition-all hover:translate-x-0.5",
                            "pl-6 pr-3",
                            active
                              ? "bg-blue-600 text-white shadow-sm"
                              : "text-slate-300 hover:bg-slate-800/50 hover:text-white",
                            badgeCount > 0 && "pr-10",
                          )}
                        >
                          <Icon className="h-4 w-4 flex-shrink-0" />
                          <span className="flex-1 truncate">{item.label}</span>
                        </Link>
                      )}
                      {!collapsed && badgeCount > 0 && (
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-semibold text-white">
                          {badgeCount > 99 ? "99+" : badgeCount}
                        </span>
                      )}
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent className="w-48">
                    <ContextMenuItem
                      onClick={() => item.href && toggleFavorite(item.href)}
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

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-2">
          {menuSections.map((section) => (
            <Collapsible
              key={section.id}
              open={openSections.includes(section.id)}
              onOpenChange={() => toggleSection(section.id)}
            >
              <div className="space-y-1">
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "w-full justify-start gap-2 text-slate-400 hover:text-white hover:bg-slate-800/50 h-8 px-2",
                      collapsed && "justify-center px-2",
                    )}
                  >
                    <ChevronRight
                      className={cn(
                        "h-3.5 w-3.5 transition-transform shrink-0",
                        openSections.includes(section.id) && "rotate-90",
                        collapsed && "hidden",
                      )}
                    />
                    {section.icon && !collapsed && <section.icon className="h-4 w-4 text-yellow-500" />}
                    {!collapsed && <span className="text-xs font-medium uppercase tracking-wide">{section.label}</span>}
                  </Button>
                </CollapsibleTrigger>

                <CollapsibleContent className="space-y-0.5">
                  {section.items.map((item) => {
                    const active = isActive(item)
                    const badgeCount = item.badge ? getBadgeCount(item.badgeType) : 0
                    const hasSubitems = item.subitems && item.subitems.length > 0
                    const isExpanded = expandedItems.includes(item.id)

                    if (hasSubitems) {
                      return (
                        <div key={item.id} className="space-y-0.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpandedItem(item.id)}
                            className={cn(
                              "w-full justify-start gap-2 text-slate-300 hover:text-white hover:bg-slate-800/50 h-9 pl-8 pr-3",
                              collapsed && "justify-center px-2",
                            )}
                          >
                            {!collapsed && (
                              <>
                                <item.icon className="h-4 w-4 shrink-0" />
                                <span className="flex-1 text-left text-sm">{item.label}</span>
                                <ChevronDown
                                  className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")}
                                />
                              </>
                            )}
                            {collapsed && <item.icon className="h-4 w-4" />}
                          </Button>

                          {!collapsed && isExpanded && (
                            <div className="ml-6 space-y-0.5 border-l border-slate-700/30 pl-2">
                              {item.subitems!.map((subitem) => {
                                const subActive = isActive(subitem)
                                const isFavorite = favorites.includes(subitem.href || "")
                                return (
                                  <ContextMenu key={subitem.id}>
                                    <ContextMenuTrigger asChild>
                                      <Link href={subitem.href || "#"}>
                                        <Button
                                          variant={subActive ? "secondary" : "ghost"}
                                          size="sm"
                                          className={cn(
                                            "w-full justify-start gap-2 h-8 px-2",
                                            subActive
                                              ? "bg-blue-600 text-white hover:bg-blue-700"
                                              : "text-slate-400 hover:text-white hover:bg-slate-800/50",
                                          )}
                                        >
                                          <subitem.icon className="h-3.5 w-3.5 shrink-0" />
                                          <span className="text-xs">{subitem.label}</span>
                                        </Button>
                                      </Link>
                                    </ContextMenuTrigger>
                                    <ContextMenuContent className="w-48">
                                      <ContextMenuItem
                                        onClick={() => subitem.href && toggleFavorite(subitem.href)}
                                      >
                                        <Star className={cn("mr-2 h-4 w-4", isFavorite && "fill-amber-500 text-amber-500")} />
                                        {isFavorite ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
                                      </ContextMenuItem>
                                      <ContextMenuSeparator />
                                      <ContextMenuItem onClick={() => window.open(subitem.href, "_blank")}>
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
                    }

                    return (
                      <ContextMenu key={item.id}>
                        <ContextMenuTrigger asChild>
                          <Link href={item.href || "#"}>
                            <Button
                              variant={active ? "secondary" : "ghost"}
                              size="sm"
                              className={cn(
                                "w-full justify-start gap-2 relative h-9 pl-8 pr-3",
                                active
                                  ? "bg-blue-600 text-white hover:bg-blue-700"
                                  : "text-slate-300 hover:text-white hover:bg-slate-800/50",
                                collapsed && "justify-center px-2",
                              )}
                            >
                              {!collapsed ? (
                                <>
                                  <item.icon className="h-4 w-4 shrink-0" />
                                  <span className="flex-1 text-left text-sm">{item.label}</span>
                                  {badgeCount > 0 && (
                                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[10px] font-semibold text-white">
                                      {badgeCount > 99 ? "99+" : badgeCount}
                                    </span>
                                  )}
                                </>
                              ) : (
                                <item.icon className="h-4 w-4" />
                              )}
                            </Button>
                          </Link>
                        </ContextMenuTrigger>
                        <ContextMenuContent className="w-48">
                          <ContextMenuItem
                            onClick={() => item.href && toggleFavorite(item.href)}
                          >
                            <Star className={cn("mr-2 h-4 w-4", favorites.includes(item.href || "") && "fill-amber-500 text-amber-500")} />
                            {favorites.includes(item.href || "") ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
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
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))}
        </nav>
      </ScrollArea>

      {/* Footer at bottom of sidebar */}
      <div className={cn(
        "mt-auto border-t border-slate-700/50 p-3",
        collapsed ? "px-2" : "px-4"
      )}>
        {!collapsed ? (
          <div className="text-center">
            <p className="text-xs text-slate-500">&copy; {new Date().getFullYear()} Praxis Effizienz</p>
          </div>
        ) : (
          <div className="flex justify-center">
            <Shield className="h-4 w-4 text-slate-500" />
          </div>
        )}
      </div>
    </div>
  )
}

export default SuperAdminSidebar
