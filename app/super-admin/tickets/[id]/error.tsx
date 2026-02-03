"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import Logger from "@/lib/logger"

export default function SuperAdminTicketDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    Logger.error("ui", "SuperAdmin Ticket Detail error", error, { digest: error.digest })
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Fehler beim Laden des Tickets
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{error.message || "Das Ticket konnte nicht geladen werden."}</p>
          <div className="flex gap-2">
            <Button onClick={reset} variant="outline">
              Erneut versuchen
            </Button>
            <Button onClick={() => router.push("/super-admin/tickets")}>Zurück zur Übersicht</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
