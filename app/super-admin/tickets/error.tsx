"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"
import Logger from "@/lib/logger"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Logger.error("ui", "SuperAdmin Tickets error", error, { digest: error.digest })
  }, [error])

  return (
    <div className="flex h-full items-center justify-center p-6">
      <Card className="max-w-md">
        <CardContent className="p-8 text-center space-y-4">
          <AlertTriangle className="h-12 w-12 mx-auto text-destructive" />
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Fehler beim Laden der Tickets</h2>
            <p className="text-sm text-muted-foreground">
              {error.message || "Ein unerwarteter Fehler ist aufgetreten"}
            </p>
          </div>
          <div className="flex gap-2 justify-center">
            <Button onClick={reset}>Erneut versuchen</Button>
            <Button variant="outline" onClick={() => (window.location.href = "/super-admin")}>
              Zurück zum Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
