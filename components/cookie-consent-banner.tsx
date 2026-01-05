"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { X, Settings, Shield, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface CookiePreferences {
  necessary: boolean
  functional: boolean
  analytics: boolean
  marketing: boolean
}

export function CookieConsentBanner() {
  const [show, setShow] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always required
    functional: true,
    analytics: false,
    marketing: false,
  })

  useEffect(() => {
    setHasMounted(true)
    const consent = localStorage.getItem("cookie-consent")
    if (!consent) {
      const timer = setTimeout(() => setShow(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const savePreferences = (prefs: CookiePreferences) => {
    if (typeof window === "undefined") return
    localStorage.setItem("cookie-consent", JSON.stringify(prefs))
    localStorage.setItem("cookie-consent-date", new Date().toISOString())

    if (!prefs.analytics) {
      localStorage.setItem("analytics-disabled", "true")
    } else {
      localStorage.removeItem("analytics-disabled")
    }

    setShow(false)
    setShowSettings(false)
  }

  const acceptAll = () => {
    const allAccepted = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
    }
    setPreferences(allAccepted)
    savePreferences(allAccepted)
  }

  const acceptNecessary = () => {
    const necessaryOnly = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    }
    setPreferences(necessaryOnly)
    savePreferences(necessaryOnly)
  }

  const saveCustomPreferences = () => {
    savePreferences(preferences)
  }

  if (!hasMounted || !show) return null

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 pointer-events-none">
        <Card className="max-w-4xl mx-auto pointer-events-auto shadow-2xl border-2">
          <div className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-2 flex-1">
                  <h3 className="font-semibold text-lg">Datenschutz & Cookies</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Wir verwenden Cookies und ähnliche Technologien, um Ihnen die bestmögliche Erfahrung zu bieten,
                    unsere Dienste zu verbessern und relevante Inhalte anzuzeigen. Sie können Ihre Präferenzen jederzeit
                    anpassen.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Weitere Informationen finden Sie in unserer{" "}
                    <Link href="/datenschutz" className="text-primary hover:underline font-medium">
                      Datenschutzerklärung
                    </Link>
                    .
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => acceptNecessary()}
                className="shrink-0"
                title="Nur notwendige Cookies"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={acceptAll} className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Alle akzeptieren
              </Button>
              <Button onClick={acceptNecessary} variant="outline">
                Nur notwendige
              </Button>
              <Button onClick={() => setShowSettings(true)} variant="outline" className="gap-2">
                <Settings className="h-4 w-4" />
                Einstellungen
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Cookie-Einstellungen
            </DialogTitle>
            <DialogDescription>
              Verwalten Sie Ihre Cookie-Präferenzen. Sie können jederzeit in den Einstellungen ändern.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Necessary Cookies */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1 flex-1">
                  <Label className="text-base font-semibold">Notwendige Cookies</Label>
                  <p className="text-sm text-muted-foreground">
                    Erforderlich für grundlegende Funktionen wie Navigation und Authentifizierung. Können nicht
                    deaktiviert werden.
                  </p>
                </div>
                <Switch checked={true} disabled />
              </div>
            </div>

            {/* Functional Cookies */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1 flex-1">
                  <Label htmlFor="functional" className="text-base font-semibold">
                    Funktionale Cookies
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Ermöglichen erweiterte Funktionen wie Spracheinstellungen und personalisierte Inhalte.
                  </p>
                </div>
                <Switch
                  id="functional"
                  checked={preferences.functional}
                  onCheckedChange={(checked) => setPreferences((prev) => ({ ...prev, functional: checked }))}
                />
              </div>
            </div>

            {/* Analytics Cookies */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1 flex-1">
                  <Label htmlFor="analytics" className="text-base font-semibold">
                    Analyse-Cookies
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Helfen uns zu verstehen, wie Sie unsere Website nutzen, um sie zu verbessern. Anonymisierte Daten.
                  </p>
                </div>
                <Switch
                  id="analytics"
                  checked={preferences.analytics}
                  onCheckedChange={(checked) => setPreferences((prev) => ({ ...prev, analytics: checked }))}
                />
              </div>
            </div>

            {/* Marketing Cookies */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1 flex-1">
                  <Label htmlFor="marketing" className="text-base font-semibold">
                    Marketing-Cookies
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Werden verwendet, um Ihnen relevante Werbung und personalisierte Inhalte anzuzeigen.
                  </p>
                </div>
                <Switch
                  id="marketing"
                  checked={preferences.marketing}
                  onCheckedChange={(checked) => setPreferences((prev) => ({ ...prev, marketing: checked }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Abbrechen
            </Button>
            <Button onClick={saveCustomPreferences}>Einstellungen speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default CookieConsentBanner
