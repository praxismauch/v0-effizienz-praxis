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
  FileBarChart,
  MessageSquare,
  UserCog,
  Database,
  Globe,
  Megaphone,
} from "lucide-react"

const menuSections = [
  {
    title: "Overview",
    items: [
      {
        href: "/super-admin",
        icon: LayoutDashboard,
        label: "Dashboard",
      },
      {
        href: "/super-admin/analytics",
        icon: BarChart3,
        label: "Analytics",
      },
    ],
  },
  {
    title: "Management",
    items: [
      {
        href: "/super-admin/practices",
        icon: Building2,
        label: "Practices",
      },
      {
        href: "/super-admin/users",
        icon: Users,
        label: "Users",
      },
      {
        href: "/super-admin/roles",
        icon: UserCog,
        label: "Roles & Permissions",
      },
      {
        href: "/super-admin/holiday-requests",
        icon: Calendar,
        label: "Holiday Requests",
      },
      {
        href: "/super-admin/documents",
        icon: FileText,
        label: "Documents",
      },
      {
        href: "/super-admin/templates",
        icon: FileCheck,
        label: "Templates",
      },
    ],
  },
  {
    title: "Content & Features",
    items: [
      {
        href: "/super-admin/widgets",
        icon: Package,
        label: "Widgets",
      },
      {
        href: "/super-admin/ai-suggestions",
        icon: Lightbulb,
        label: "AI Suggestions",
      },
      {
        href: "/super-admin/reports",
        icon: FileBarChart,
        label: "Reports",
      },
      {
        href: "/super-admin/feedback",
        icon: MessageSquare,
        label: "Feedback",
      },
    ],
  },
  {
    title: "System",
    items: [
      {
        href: "/super-admin/audit-logs",
        icon: ShieldCheck,
        label: "Audit Logs",
      },
      {
        href: "/super-admin/notifications",
        icon: Bell,
        label: "Notifications",
      },
      {
        href: "/super-admin/email-logs",
        icon: Mail,
        label: "Email Logs",
      },
      {
        href: "/super-admin/backups",
        icon: Database,
        label: "Backups",
      },
      {
        href: "/super-admin/settings",
        icon: Settings,
        label: "Settings",
      },
    ],
  },
  {
    title: "Marketing",
    items: [
      {
        href: "/super-admin/social-media",
        icon: Share2,
        label: "Social Media",
      },
      {
        href: "/super-admin/campaigns",
        icon: Megaphone,
        label: "Campaigns",
      },
      {
        href: "/super-admin/landing-pages",
        icon: Globe,
        label: "Landing Pages",
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
