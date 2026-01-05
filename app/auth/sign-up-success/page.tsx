import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Clock, Mail } from "lucide-react"
import Link from "next/link"

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              <CardTitle className="text-2xl">Registrierung erfolgreich!</CardTitle>
            </div>
            <CardDescription>Ihr Konto wurde erstellt und wartet auf Genehmigung</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-orange-900 dark:text-orange-100">Genehmigung ausstehend</p>
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    Ihr Konto muss von einem Administrator genehmigt werden, bevor Sie sich anmelden können.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">E-Mail-Benachrichtigung</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Sie erhalten eine E-Mail, sobald Ihr Konto aktiviert wurde. Danach können Sie sich anmelden.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                <strong>Was passiert als nächstes?</strong>
              </p>
              <ul className="text-sm text-muted-foreground space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Ein Administrator wird Ihre Registrierung überprüfen</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Sie erhalten eine E-Mail-Benachrichtigung bei Genehmigung</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Nach der Genehmigung können Sie sich mit Ihren Zugangsdaten anmelden</span>
                </li>
              </ul>
            </div>

            <div className="pt-2">
              <Link href="/auth/login" className="block">
                <Button variant="outline" className="w-full bg-transparent">
                  Zurück zur Anmeldung
                </Button>
              </Link>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Bei Fragen wenden Sie sich bitte an Ihren Administrator
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
