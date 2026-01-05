export const dynamic = "force-dynamic"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, Mail } from "lucide-react"
import Link from "next/link"

export default function PendingApprovalPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
              <Clock className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
            <CardTitle className="text-2xl">Konto wartet auf Genehmigung</CardTitle>
            <CardDescription className="text-base">Ihre Registrierung wurde erfolgreich abgeschlossen</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Ihr Konto muss von einem Administrator genehmigt werden, bevor Sie sich anmelden können.
              </p>
              <p className="text-sm text-muted-foreground">
                Sie erhalten eine E-Mail-Benachrichtigung, sobald Ihr Konto aktiviert wurde.
              </p>
            </div>

            <div className="border rounded-lg p-4 bg-muted/50 space-y-2">
              <div className="flex items-start gap-2">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Was passiert als nächstes?</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Ein Administrator wird Ihre Registrierung überprüfen</li>
                    <li>• Sie erhalten eine E-Mail, sobald Ihr Konto genehmigt wurde</li>
                    <li>• Danach können Sie sich mit Ihren Zugangsdaten anmelden</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="pt-4 space-y-2">
              <Link href="/auth/login" className="block">
                <Button variant="outline" className="w-full bg-transparent">
                  Zurück zur Anmeldung
                </Button>
              </Link>
              <p className="text-xs text-center text-muted-foreground">
                Bei Fragen wenden Sie sich bitte an Ihren Administrator
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
