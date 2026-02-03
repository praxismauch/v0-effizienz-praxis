"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, RefreshCw, Home, LogIn } from "lucide-react"
import Link from "next/link"
import Logger from "@/lib/logger"

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function DashboardError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    Logger.error("ui", "Dashboard route error", error, { digest: error.digest })
  }, [error])

  // Check if it's an auth-related error
  const isAuthError =
    error.message?.includes("Auth") ||
    error.message?.includes("session") ||
    error.message?.includes("authentifiziert") ||
    error.message?.includes("401")

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>{isAuthError ? "Sitzung abgelaufen" : "Ein Fehler ist aufgetreten"}</CardTitle>
          <CardDescription>
            {isAuthError
              ? "Ihre Sitzung ist abgelaufen oder ungültig. Bitte melden Sie sich erneut an."
              : "Beim Laden dieser Seite ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isAuthError ? (
            <Button asChild className="w-full">
              <Link href="/auth/login">
                <LogIn className="mr-2 h-4 w-4" />
                Zur Anmeldung
              </Link>
            </Button>
          ) : (
            <Button onClick={reset} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Erneut versuchen
            </Button>
          )}
          <Button variant="outline" asChild className="w-full">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Zur Startseite
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
