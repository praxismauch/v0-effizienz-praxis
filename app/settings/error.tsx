"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, RefreshCw, Home, Settings } from "lucide-react"
import Link from "next/link"
import Logger from "@/lib/logger"

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function SettingsError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    Logger.error("ui", "Settings page error", error, { digest: error.digest })
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>Einstellungen konnten nicht geladen werden</CardTitle>
          <CardDescription>
            Beim Laden Ihrer Einstellungen ist ein Fehler aufgetreten.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={reset} className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Erneut versuchen
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link href="/dashboard">
              <Home className="mr-2 h-4 w-4" />
              Zum Dashboard
            </Link>
          </Button>
          {process.env.NODE_ENV === "development" && error.message && (
            <pre className="mt-4 rounded-md bg-muted p-3 text-xs overflow-auto max-h-24">
              {error.message}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
