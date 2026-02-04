"use client"

import type { ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/contexts/user-context"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { TooltipProvider } from "@/components/ui/tooltip"
import dynamic from "next/dynamic"
import { useState, useEffect } from "react"

const SuperAdminSidebar = dynamic(() => import("@/components/super-admin-sidebar").then((mod) => ({ default: mod.SuperAdminSidebar })), {
  ssr: false,
})

const SuperAdminHeader = dynamic(() => import("@/components/super-admin-header").then((mod) => ({ default: mod.SuperAdminHeader })), {
  ssr: false,
})

interface SuperAdminLayoutProps {
  children: ReactNode
}

function SuperAdminLayoutInner({ children }: SuperAdminLayoutProps) {
  const router = useRouter()
  const { isSuperAdmin, loading, currentUser } = useUser()

  console.log(
    "[v0] SuperAdminLayout - loading:",
    loading,
    "isSuperAdmin:",
    isSuperAdmin,
    "currentUser:",
    currentUser?.email,
    "role:",
    currentUser?.role,
  )

  // Loading state
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
          <p className="mt-4 text-sm text-muted-foreground">Authentifizierung wird überprüft...</p>
        </div>
      </div>
    )
  }

  // Access denied state
  if (!isSuperAdmin) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Zugriff verweigert</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Sie haben keine Berechtigung, auf diesen Bereich zuzugreifen.
            </p>
            {currentUser && (
              <div className="text-xs text-muted-foreground mb-4 p-2 bg-muted rounded">
                <p>Angemeldet als: {currentUser.email || "Unbekannt"}</p>
                <p>Rolle: {currentUser.role || "Unbekannt"}</p>
                <p className="mt-1 text-orange-500">
                  Debug: isSuperAdmin={String(isSuperAdmin)}, role="{currentUser.role}"
                </p>
              </div>
            )}
            <Button asChild>
              <Link href="/dashboard">Zurück zum Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main layout - full browser width
  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-screen w-screen overflow-hidden bg-background">
        {/* Sidebar - fixed width */}
        <SuperAdminSidebar />

        {/* Main content area - takes remaining width */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header - full width of content area */}
          <SuperAdminHeader />

          {/* Content - scrollable, full width with consistent padding */}
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
    </TooltipProvider>
  )
}

export function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Show loading state until mounted to prevent TDZ errors
  if (!mounted) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
          <p className="mt-4 text-sm text-muted-foreground">Wird geladen...</p>
        </div>
      </div>
    )
  }

  return <SuperAdminLayoutInner>{children}</SuperAdminLayoutInner>
}

export default SuperAdminLayout
