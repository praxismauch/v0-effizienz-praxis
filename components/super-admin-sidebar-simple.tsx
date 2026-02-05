"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Building2,
  Users,
  Calendar,
  FileText,
  Settings,
  BarChart3,
  ShieldCheck,
  Bell,
  Mail,
  FileCheck,
  Lightbulb,
  Package,
  Share2,
  MessageSquare,
  UserCog,
  Database,
  Globe,
} from "lucide-react"

const menuSections = [
  {
    title: "Übersicht",
    items: [
      {
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
        href: "/super-admin/tickets",
        icon: Mail,
        label: "Tickets",
      },
      {
        href: "/super-admin/verwaltung?tab=practices",
        icon: Building2,
        label: "Praxen",
      },
      {
        href: "/super-admin/verwaltung?tab=users",
        icon: Users,
        label: "Benutzer",
      },
      {
        href: "/super-admin/user-rights",
        icon: UserCog,
        label: "Benutzerrechte",
      },
      {
        href: "/super-admin/kpi-kategorien",
        icon: BarChart3,
        label: "KPI-Kategorien",
      },
      {
        href: "/super-admin/content",
        icon: FileCheck,
        label: "Vorlagen",
      },
    ],
  },
  {
    title: "Content",
    items: [
      {
        href: "/super-admin/academy",
        icon: Globe,
        label: "Academy",
      },
      {
        href: "/super-admin/waitlist",
        icon: Package,
        label: "Warteliste",
      },
    ],
  },
  {
    title: "Finanzen",
    items: [
      {
        href: "/super-admin/zahlungen",
        icon: MessageSquare,
        label: "Zahlungen",
      },
    ],
  },
  {
    title: "Super Admin",
    items: [
      {
        href: "/super-admin/roadmap",
        icon: Lightbulb,
        label: "Roadmap & Ideen",
      },
    ],
  },
  {
    title: "Marketing",
    items: [
      {
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
        href: "/super-admin/landingpages",
        icon: FileText,
        label: "Landingpages",
      },
    ],
  },
  {
    title: "Testing",
    items: [
      {
        href: "/super-admin/testing",
        icon: Database,
        label: "UI-Tests",
      },
      {
        href: "/super-admin/screenshots",
        icon: Bell,
        label: "Screenshots",
      },
    ],
  },
  {
    title: "System",
    items: [
      {
        href: "/super-admin/system",
        icon: Settings,
        label: "Systemverwaltung",
      },
      {
        href: "/super-admin/features",
        icon: ShieldCheck,
        label: "Feature-Verwaltung",
      },
      {
        href: "/super-admin/chat-logs",
        icon: MessageSquare,
        label: "Chat-Protokolle",
      },
      {
        href: "/super-admin/logging",
        icon: Calendar,
        label: "Error Logging",
      },
      {
        href: "/super-admin/settings",
        icon: Settings,
        label: "Admin-Einstellungen",
      },
    ],
  },
]

export function SuperAdminSidebarSimple() {
  const pathname = usePathname()

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
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>
      </div>
    </aside>
  )
}
