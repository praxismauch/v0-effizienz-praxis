"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Home, Search, ArrowLeft, Mail } from "lucide-react"
import { useEffect } from "react"

export default function NotFound() {
  // Send rich context notification on mount
  useEffect(() => {
    const context = {
      // Timing
      timestamp: new Date().toISOString(),

      // URL details
      url: window.location.href,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      origin: window.location.origin,
      referrer: document.referrer || null,

      // Browser & device
      userAgent: navigator.userAgent,
      language: navigator.language,
      languages: navigator.languages ? Array.from(navigator.languages) : [],
      platform: (navigator as any).userAgentData?.platform || navigator.platform || null,
      vendor: navigator.vendor || null,
      cookiesEnabled: navigator.cookieEnabled,
      online: navigator.onLine,
      touchPoints: navigator.maxTouchPoints || 0,
      deviceMemory: (navigator as any).deviceMemory || null,
      hardwareConcurrency: navigator.hardwareConcurrency || null,

      // Screen & viewport
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
      colorDepth: window.screen.colorDepth,
      orientation: window.screen.orientation?.type || null,

      // Network
      connectionType: (navigator as any).connection?.effectiveType || null,
      connectionDownlink: (navigator as any).connection?.downlink || null,

      // Time & locale
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: new Date().getTimezoneOffset(),

      // Navigation context
      historyLength: window.history.length,

      // Performance
      performance: (() => {
        try {
          const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined
          if (nav) {
            return {
              type: nav.type,
              redirectCount: nav.redirectCount,
              ttfb: Math.round(nav.responseStart - nav.requestStart),
              domContentLoaded: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
              loadTime: nav.loadEventEnd > 0 ? Math.round(nav.loadEventEnd - nav.startTime) : null,
            }
          }
          return null
        } catch {
          return null
        }
      })(),
    }

    fetch("/api/system/404-notification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(context),
    }).catch(() => {})
  }, [])

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4 z-50">
      <Card className="w-full max-w-2xl border-2 shadow-xl">
        <CardContent className="pt-12 pb-8">
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="text-9xl font-bold text-muted-foreground/10 select-none">404</div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-7xl">🩺</div>
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">Hier ist der Patient wohl abgebogen!</h1>
              <p className="text-lg text-muted-foreground max-w-md mx-auto">
                Diese Seite ist wie ein Phantom-Patient: nicht auffindbar. Vermutlich hat sie sich ins Wartezimmer
                verirrt oder macht gerade Mittagspause.
              </p>
            </div>

            <div className="flex items-start gap-3 text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg max-w-md mx-auto">
              <Mail className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <p className="text-left">
                Keine Sorge! Unsere Digital-Ärzte wurden alarmiert und suchen bereits mit der Lupe nach dieser
                vermissten Seite. Kaffee steht schon bereit.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button asChild size="lg" className="gap-2">
                <Link href="/">
                  <Home className="h-4 w-4" />
                  Zur Startseite
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="gap-2 bg-transparent">
                <Link href="/dashboard">
                  <Search className="h-4 w-4" />
                  Zum Dashboard
                </Link>
              </Button>
              <Button variant="ghost" size="lg" onClick={() => window.history.back()} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Zurück
              </Button>
            </div>

            {/* Help Text */}
            <div className="pt-6 border-t">
              <p className="text-sm text-muted-foreground">
                Benötigen Sie Hilfe?{" "}
                <Link href="/info" className="text-primary hover:underline font-medium">
                  System-Info anzeigen
                </Link>{" "}
                oder{" "}
                <Link href="/settings" className="text-primary hover:underline font-medium">
                  Einstellungen öffnen
                </Link>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
