import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import Link from "next/link"

export default function SuperAdminTicketNotFound() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-warning" />
            Ticket nicht gefunden
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Das angeforderte Ticket existiert nicht oder Sie haben keine Berechtigung darauf zuzugreifen.
          </p>
          <Button asChild>
            <Link href="/super-admin/tickets">Zurück zur Übersicht</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
