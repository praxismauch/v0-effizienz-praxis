"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import Link from "next/link"

export default function SuperAdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[v0] SuperAdmin Error:", error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-md">
        <div className="flex justify-center">
          <AlertTriangle className="h-16 w-16 text-destructive" />
        </div>
        <h2 className="text-xl font-semibold">Fehler im Super Admin Dashboard</h2>
        <p className="text-muted-foreground">{error.message || "Ein unerwarteter Fehler ist aufgetreten."}</p>
        <div className="flex gap-2 justify-center">
          <Button onClick={reset}>Erneut versuchen</Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard">Zum Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
