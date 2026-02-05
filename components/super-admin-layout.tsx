"use client"

import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Shield, LayoutGrid, Users, Settings, Moon, Sun } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

interface SuperAdminLayoutProps {
  children: ReactNode
}

/**
 * Simplified super-admin layout without complex dependencies.
 * Auth checks are handled in page-client components.
 */
export function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()

  const navItems = [
    { href: "/super-admin", label: "Dashboard", icon: LayoutGrid },
    { href: "/super-admin/practices", label: "Praxen", icon: Users },
    { href: "/super-admin/settings", label: "Einstellungen", icon: Settings },
  ]

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Simplified Sidebar */}
      <aside className="w-64 border-r bg-card">
        <div className="flex h-12 items-center gap-2 border-b px-4">
          <Shield className="h-5 w-5 text-primary" />
          <span className="font-semibold">Super Admin</span>
        </div>
        <ScrollArea className="h-[calc(100vh-3rem)]">
          <nav className="space-y-1 p-4">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Button
                  key={item.href}
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn("w-full justify-start", isActive && "bg-secondary")}
                  asChild
                >
                  <Link href={item.href}>
                    <Icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Link>
                </Button>
              )
            })}
          </nav>
        </ScrollArea>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Simplified Header */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
          <div className="flex h-12 items-center justify-between px-6">
            <h1 className="text-lg font-semibold">Super Admin Dashboard</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-8 w-8"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="w-full min-h-full flex flex-col">
            <div className="flex-1 px-6 py-6">{children}</div>
            <footer className="px-6 py-4 border-t bg-muted/30 text-center text-sm text-muted-foreground">
              <p>&copy; {new Date().getFullYear()} Praxis Effizienz. Alle Rechte vorbehalten.</p>
            </footer>
          </div>
        </main>
      </div>
    </div>
  )
}

export default SuperAdminLayout
