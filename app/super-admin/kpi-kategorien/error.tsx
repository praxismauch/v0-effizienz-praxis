"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, RefreshCw } from "lucide-react"
import Logger from "@/lib/logger"

export default function KpiKategorienError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Logger.error("ui", "KPI-Kategorien error", error, { digest: error.digest })
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>Fehler beim Laden</CardTitle>
          <CardDescription>
            Die KPI-Kategorien konnten nicht geladen werden. Bitte versuchen Sie es erneut.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button onClick={reset} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Erneut versuchen
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
