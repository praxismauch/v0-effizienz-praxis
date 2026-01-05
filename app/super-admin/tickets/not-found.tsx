import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FileQuestion } from "lucide-react"
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <Card className="max-w-md">
        <CardContent className="p-8 text-center space-y-4">
          <FileQuestion className="h-12 w-12 mx-auto text-muted-foreground" />
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Ticket nicht gefunden</h2>
            <p className="text-sm text-muted-foreground">Das gesuchte Ticket existiert nicht oder wurde gelöscht</p>
          </div>
          <Button asChild>
            <Link href="/super-admin/tickets">Zurück zur Übersicht</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
