"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/contexts/user-context"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import PracticesManager from "@/components/super-admin/practices-manager"

export default function PracticesPageClient() {
  const { isSuperAdmin, loading, currentUser } = useUser()
  const router = useRouter()

  // Redirect if not super admin
  useEffect(() => {
    if (!loading && !isSuperAdmin) {
      router.push("/dashboard?error=access_denied")
    }
  }, [isSuperAdmin, loading, router])

  // Show loading skeleton while checking auth
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  // Show access denied while redirecting
  if (!isSuperAdmin) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Zugriff verweigert</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Sie haben keine Berechtigung für diesen Bereich.
            </p>
            <Button asChild>
              <Link href="/dashboard">Zurück zum Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Render practices manager for super admins
  return <PracticesManager />
}
