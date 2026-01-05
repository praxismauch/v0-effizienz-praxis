"use client"

import { useState, useEffect } from "react"
import { usePractice } from "@/contexts/practice-context"
import { useTranslation } from "@/contexts/translation-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, Mail, CheckCircle2, Info } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

export function EmailUploadSettings() {
  const { currentPractice } = usePractice()
  const { t } = useTranslation()
  const [emailAddress, setEmailAddress] = useState("")
  const [webhookUrl, setWebhookUrl] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (currentPractice?.id) {
      // Generate practice-specific email address
      const domain = process.env.NEXT_PUBLIC_EMAIL_DOMAIN || "documents.effizienz-praxis.de"
      setEmailAddress(`documents-${currentPractice.id}@${domain}`)

      // Generate webhook URL
      const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
      setWebhookUrl(`${baseUrl}/api/email/inbound`)
    }
  }, [currentPractice?.id])

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success(`${label} kopiert`)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error(t("documents.emailCopyError", "Fehler beim Kopieren"))
    }
  }

  if (!currentPractice) return null

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <CardTitle>{t("documents.emailUpload", "E-Mail Upload")}</CardTitle>
          </div>
          <CardDescription>
            {t(
              "documents.emailUploadDescription",
              "Senden Sie Dokumente per E-Mail direkt an Ihre Dokumentenverwaltung",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted/50 p-4 space-y-3">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-1">{t("documents.howItWorks", "So funktioniert's:")}</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>
                    {t("documents.emailStep1", "Senden Sie eine E-Mail mit Anhängen an die untenstehende Adresse")}
                  </li>
                  <li>
                    {t(
                      "documents.emailStep2",
                      "Alle Anhänge werden automatisch im Ordner 'Email Dokumente' gespeichert",
                    )}
                  </li>
                  <li>{t("documents.emailStep3", "Die Dokumente sind sofort für alle Teammitglieder verfügbar")}</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-address">{t("documents.practiceEmailAddress", "Ihre Praxis-E-Mail-Adresse")}</Label>
            <div className="flex gap-2">
              <Input id="email-address" value={emailAddress} readOnly className="font-mono text-sm" />
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleCopy(emailAddress, "E-Mail-Adresse")}
                className="flex-shrink-0"
              >
                {copied ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("documents.emailAddressNote", "Diese E-Mail-Adresse ist einzigartig für Ihre Praxis")}
            </p>
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t("documents.supportedFormats", "Unterstützte Formate")}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("documents.allFormatsSupported", "Alle gängigen Dokumentformate werden unterstützt")}
                </p>
              </div>
              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary" className="text-xs">
                  PDF
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  DOC
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  XLS
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  JPG
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  PNG
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default EmailUploadSettings
