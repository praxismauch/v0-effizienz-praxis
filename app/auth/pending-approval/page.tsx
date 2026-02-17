"use client"

export const dynamic = "force-dynamic"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, Mail, Send, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

export default function PendingApprovalPage() {
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""
  const [requestSent, setRequestSent] = useState(false)
  const [isRequesting, setIsRequesting] = useState(false)

  async function handleRequestActivation() {
    if (!email || requestSent) return
    setIsRequesting(true)
    try {
      await fetch("/api/auth/request-activation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      setRequestSent(true)
    } catch {
      // Silently handle - don't reveal errors
    } finally {
      setIsRequesting(false)
    }
  }

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
                    <li>{"• Ein Administrator wird Ihre Registrierung überprüfen"}</li>
                    <li>{"• Sie erhalten eine E-Mail, sobald Ihr Konto genehmigt wurde"}</li>
                    <li>{"• Danach können Sie sich mit Ihren Zugangsdaten anmelden"}</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="pt-4 space-y-2">
              {email && (
                <Button
                  className="w-full"
                  onClick={handleRequestActivation}
                  disabled={requestSent || isRequesting}
                >
                  {requestSent ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Anfrage gesendet
                    </>
                  ) : isRequesting ? (
                    "Wird gesendet..."
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Aktivierung anfragen
                    </>
                  )}
                </Button>
              )}
              {requestSent && (
                <p className="text-xs text-center text-green-600 dark:text-green-400">
                  Ihr Administrator wurde benachrichtigt. Sie erhalten eine E-Mail, sobald Ihr Konto aktiviert wurde.
                </p>
              )}
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
