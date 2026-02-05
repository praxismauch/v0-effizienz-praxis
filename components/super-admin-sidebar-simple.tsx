"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronRight } from "lucide-react"
import {
  LayoutDashboard,
  Building2,
  Users,
  Settings,
  BarChart3,
  ShieldCheck,
  Mail,
  Lightbulb,
  Package,
  Share2,
  MessageSquare,
  UserCog,
  Database,
  Globe,
  GraduationCap,
  ListTodo,
  CreditCard,
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
  href?: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  badge?: boolean
  badgeType?: BadgeType
  subitems?: MenuItem[]
}

interface MenuSection {
  title: string
  items: MenuItem[]
}

export function SuperAdminSidebarSimple() {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  
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

  const menuSections: MenuSection[] = [
    {
      title: "Übersicht",
      items: [
        {
          id: "dashboard",
          href: "/super-admin",
          icon: LayoutDashboard,
          label: "Dashboard",
        },
      ],
    },
    {
      title: "Verwaltung",
      items: [
        {
          id: "tickets",
          href: "/super-admin/tickets",
          icon: Mail,
          label: "Tickets",
          badge: true,
          badgeType: "tickets",
        },
        {
          id: "practices",
          href: "/super-admin/verwaltung?tab=practices",
          icon: Building2,
          label: "Praxen",
          badge: true,
          badgeType: "practices",
        },
        {
          id: "users",
          href: "/super-admin/verwaltung?tab=users",
          icon: Users,
          label: "Benutzer",
          badge: true,
          badgeType: "totalUsers",
        },
        {
          id: "user-rights",
          href: "/super-admin/user-rights",
          icon: Shield,
          label: "Benutzerrechte",
        },
        {
          id: "kpi-kategorien",
          href: "/super-admin/kpi-kategorien",
          icon: BarChart3,
          label: "KPI-Kategorien",
          badge: true,
          badgeType: "kpiCategories",
        },
        {
          id: "vorlagen",
          icon: FolderKanban,
          label: "Vorlagen",
          subitems: [
            {
              id: "skills",
              href: "/super-admin/content?tab=skills",
              icon: Award,
              label: "Skills",
              badge: true,
              badgeType: "skills",
            },
            {
              id: "workflows",
              href: "/super-admin/content?tab=workflows",
              icon: Workflow,
              label: "Workflows",
              badge: true,
              badgeType: "workflows",
            },
            {
              id: "checklisten",
              href: "/super-admin/content?tab=checklisten",
              icon: ClipboardCheck,
              label: "Checklisten",
              badge: true,
              badgeType: "checklists",
            },
            {
              id: "dokumente",
              href: "/super-admin/content?tab=dokumente",
              icon: FileText,
              label: "Dokumente",
              badge: true,
              badgeType: "documents",
            },
            {
              id: "teams",
              href: "/super-admin/content?tab=teams",
              icon: Users,
              label: "Teams / Gruppen",
              badge: true,
              badgeType: "teams",
            },
            {
              id: "event-types",
              href: "/super-admin/content?tab=event-types",
              icon: ClipboardCheck,
              label: "Event-Typen",
              badge: true,
              badgeType: "eventTypes",
            },
          ],
        },
      ],
    },
    {
      title: "Content",
      items: [
        {
          id: "academy",
          href: "/super-admin/academy",
          icon: GraduationCap,
          label: "Academy",
          badge: true,
          badgeType: "academy",
        },
        {
          id: "waitlist",
          href: "/super-admin/waitlist",
          icon: ListTodo,
          label: "Warteliste",
          badge: true,
          badgeType: "waitlist",
        },
      ],
    },
    {
      title: "Finanzen",
      items: [
        {
          id: "zahlungen",
          href: "/super-admin/zahlungen",
          icon: CreditCard,
          label: "Zahlungen",
          badge: true,
          badgeType: "subscriptions",
        },
      ],
    },
    {
      title: "Super Admin",
      items: [
        {
          id: "roadmap",
          href: "/super-admin/roadmap",
          icon: MapIcon,
          label: "Roadmap & Ideen",
        },
      ],
    },
    {
      title: "Marketing",
      items: [
        {
          id: "social-media",
          href: "/super-admin/social-media",
          icon: Share2,
          label: "Social Media Posts",
        },
      ],
    },
    {
      title: "Seiten",
      items: [
        {
          id: "landingpages",
          href: "/super-admin/landingpages",
          icon: FileText,
          label: "Landingpages",
          badge: true,
          badgeType: "landingpages",
        },
      ],
    },
    {
      title: "Testing",
      items: [
        {
          id: "testing",
          href: "/super-admin/testing",
          icon: TestTube,
          label: "UI-Tests",
        },
        {
          id: "screenshots",
          href: "/super-admin/screenshots",
          icon: Camera,
          label: "Screenshots",
        },
      ],
    },
    {
      title: "System",
      items: [
        {
          id: "system",
          href: "/super-admin/system",
          icon: Settings,
          label: "Systemverwaltung",
          badge: true,
          badgeType: "backup",
        },
        {
          id: "features",
          href: "/super-admin/features",
          icon: ToggleLeft,
          label: "Feature-Verwaltung",
          badge: true,
          badgeType: "features",
        },
        {
          id: "chat-logs",
          href: "/super-admin/chat-logs",
          icon: MessageSquare,
          label: "Chat-Protokolle",
          badge: true,
          badgeType: "chatLogs",
        },
        {
          id: "error-logs",
          href: "/super-admin/logging",
          icon: AlertTriangle,
          label: "Error Logging",
          badge: true,
          badgeType: "criticalLogs",
        },
        {
          id: "admin-settings",
          href: "/super-admin/settings",
          icon: Settings,
          label: "Admin-Einstellungen",
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

  const toggleExpandedItem = (itemId: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    )
  }

  const isActive = (item: MenuItem): boolean => {
    if (item.href) {
      return pathname === item.href || pathname.startsWith(item.href + "/")
    }
    return false
  }

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const Icon = item.icon
    const isItemActive = isActive(item)
    const badgeCount = item.badge ? getBadgeCount(item.badgeType) : 0
    const hasSubitems = item.subitems && item.subitems.length > 0
    const isExpanded = expandedItems.includes(item.id)

    if (hasSubitems) {
      return (
        <div key={item.id}>
          <button
            onClick={() => toggleExpandedItem(item.id)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-left">{item.label}</span>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0" />
            )}
          </button>
          {isExpanded && (
            <div className="ml-4 mt-1 space-y-1">
              {item.subitems.map((subitem) => renderMenuItem(subitem, level + 1))}
            </div>
          )}
        </div>
      )
    }

    return (
      <Link
        key={item.id}
        href={item.href || "#"}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
          level > 0 && "pl-6",
          isItemActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1">{item.label}</span>
        {badgeCount > 0 && (
          <Badge variant={isItemActive ? "secondary" : "default"} className="ml-auto shrink-0">
            {badgeCount}
          </Badge>
        )}
      </Link>
    )
  }

  return (
    <aside className="fixed left-0 top-0 z-30 h-screen w-64 border-r bg-background">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/super-admin" className="flex items-center gap-2 font-semibold">
            <ShieldCheck className="h-6 w-6" />
            <span>Super Admin</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-6">
            {menuSections.map((section) => (
              <div key={section.title}>
                <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.title}
                </h3>
                <div className="space-y-1">{section.items.map((item) => renderMenuItem(item))}</div>
              </div>
            ))}
          </div>
        </nav>
      </div>
    </aside>
  )
}
