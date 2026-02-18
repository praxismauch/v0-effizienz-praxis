"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Star, AlertCircle, Settings, RefreshCw, Info, MoreHorizontal } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface GoogleReviewsWidgetProps {
  practiceId: string
  practiceName: string
  practiceWebsiteUrl?: string
}

export function GoogleReviewsWidget({ practiceId, practiceName, practiceWebsiteUrl }: GoogleReviewsWidgetProps) {
  const [placeId, setPlaceId] = useState("")
  const [averageRating, setAverageRating] = useState(0)
  const [totalReviews, setTotalReviews] = useState(0)
  const [isConfigured, setIsConfigured] = useState(false)
  const [showSetup, setShowSetup] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [dataSource, setDataSource] = useState<"google_api" | "local" | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  useEffect(() => {
    loadConfiguration()
  }, [practiceId])

  const loadConfiguration = async () => {
    try {
      const response = await fetch(`/api/practices/${practiceId}/google-reviews-config`)

      if (!response.ok) {
        if (response.status === 429) {
          console.warn("[v0] Rate limited when fetching Google Reviews configuration")
        } else {
          console.warn(`[v0] Google Reviews config returned status: ${response.status}`)
        }
        return
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        console.warn("[v0] Google Reviews config returned non-JSON response:", contentType)
        return
      }

      let data
      try {
        const text = await response.text()
        if (!text || text.startsWith("Too Many") || text.includes("rate limit") || text.includes("Too Many Requests")) {
          console.warn("[v0] Google Reviews config rate limited (text response)")
          return
        }
        if (text.trim() === "" || text === "null" || text === "undefined") {
          return
        }
        data = JSON.parse(text)
      } catch (parseError) {
        console.warn("[v0] Failed to parse Google Reviews config JSON:", parseError)
        return
      }

      if (data?.placeId) {
        setPlaceId(data.placeId)
        setIsConfigured(true)
        setTimeout(() => fetchGoogleReviews(), 500)
      }
    } catch (error) {
      console.warn("[v0] Failed to load Google Reviews configuration:", error)
    }
  }

  const fetchGoogleReviews = async () => {
    setIsLoading(true)
    setStatusMessage(null)
    try {
      const response = await fetch(`/api/practices/${practiceId}/google-reviews/fetch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("[v0] Failed to fetch Google reviews:", errorData)
        setStatusMessage(errorData.message || "Fehler beim Laden der Bewertungen")
        return
      }

      const data = await response.json()
      setTotalReviews(data.totalReviews || 0)
      setAverageRating(data.averageRating || 0)
      setDataSource(data.source || null)

      if (data.message) {
        setStatusMessage(data.message)
      }

      if (data.source === "google_api") {
        toast.success("Bewertungen von Google aktualisiert")
      }
    } catch (error) {
      console.error("[v0] Error fetching Google reviews:", error)
      setStatusMessage("Fehler beim Laden der Bewertungen")
    } finally {
      setIsLoading(false)
    }
  }

  const loadReviewsData = async (configPlaceId: string) => {
    fetchGoogleReviews()
  }

  const handleSaveConfiguration = async () => {
    if (!placeId.trim()) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/practices/${practiceId}/google-reviews-config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId: placeId.trim() }),
      })

      if (response.ok) {
        setIsConfigured(true)
        setShowSetup(false)
        toast.success("Google Place ID gespeichert")
        fetchGoogleReviews()
      } else {
        toast.error("Fehler beim Speichern")
      }
    } catch (error) {
      console.error("Failed to save configuration:", error)
      toast.error("Fehler beim Speichern")
    } finally {
      setIsSaving(false)
    }
  }

  const handleRefresh = () => {
    if (isConfigured) {
      fetchGoogleReviews()
    }
  }

  return (
    <Dialog open={showSetup} onOpenChange={setShowSetup}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Google Bewertungen einrichten</DialogTitle>
          <DialogDescription>Konfigurieren Sie die Google Bewertungen für {practiceName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Wichtige Information</AlertTitle>
            <AlertDescription>
              Um Google Bewertungen anzuzeigen, benötigen Sie Ihre Google Place ID. Diese können Sie über Ihr Google
              Business Profil finden.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="website-url">Praxis-Website</Label>
              <Input
                id="website-url"
                value={practiceWebsiteUrl || ""}
                readOnly
                disabled
                placeholder="https://ihre-praxis.de"
              />
              <p className="text-xs text-muted-foreground">
                Die Website-URL aus Ihren Praxiseinstellungen. Aktualisieren Sie diese unter Einstellungen → Praxis.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="place-id">Google Place ID</Label>
              <Input
                id="place-id"
                value={placeId}
                onChange={(e) => setPlaceId(e.target.value)}
                placeholder="z.B. ChIJN1t_tDeuEmsRUsoyG83frY4"
              />
              <p className="text-xs text-muted-foreground">Ihre eindeutige Google Place ID für diese Praxis-Standort</p>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
            <h4 className="font-semibold text-sm">So finden Sie Ihre Google Place ID:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>
                Öffnen Sie{" "}
                <a
                  href="https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  Google Place ID Finder
                </a>
              </li>
              <li>Suchen Sie nach Ihrer Praxisadresse oder Namen</li>
              <li>Wählen Sie Ihre Praxis aus den Suchergebnissen</li>
              <li>Kopieren Sie die angezeigte "Place ID"</li>
              <li>Fügen Sie die Place ID oben ein und speichern Sie</li>
            </ol>
          </div>

          <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
            <h4 className="font-semibold text-sm">Alternative: Google Maps</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>
                Öffnen Sie{" "}
                <a
                  href="https://www.google.de/maps"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  Google Maps
                </a>
              </li>
              <li>Suchen Sie nach Ihrer Praxis</li>
              <li>Die Place ID ist in der URL nach "1s" zu finden (z.B. ...!1sChIJb7YNRGFrn...)</li>
            </ol>
          </div>

          <Alert variant="default" className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800">Hinweis für Administratoren</AlertTitle>
            <AlertDescription className="text-blue-700">
              <p className="mb-2">
                Für Live-Bewertungen von Google muss der Administrator die Umgebungsvariable{" "}
                <code className="bg-blue-100 px-1 rounded">GOOGLE_PLACES_API_KEY</code> konfigurieren.
              </p>
              <p className="text-xs">
                Den API-Key erhalten Sie über die{" "}
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  Google Cloud Console
                </a>{" "}
                → APIs & Services → Credentials → API Key erstellen → Places API aktivieren.
              </p>
            </AlertDescription>
          </Alert>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowSetup(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSaveConfiguration} disabled={!placeId.trim() || isSaving}>
              {isSaving ? "Speichere..." : "Speichern"}
            </Button>
          </div>
        </div>
      </DialogContent>

      <Card className="p-5 h-full">
        {isLoading ? (
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-50 text-yellow-600">
              <RefreshCw className="h-5 w-5 animate-spin" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Google Bewertungen</p>
              <p className="text-3xl font-bold tracking-tight mt-1 text-muted-foreground/30">--</p>
            </div>
          </div>
        ) : !isConfigured ? (
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-50 text-yellow-600">
              <Star className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">Google Bewertungen</p>
              <p className="text-xs text-muted-foreground mt-1">Google Place ID nicht konfiguriert</p>
              <Button onClick={() => setShowSetup(true)} size="sm" variant="outline" className="mt-2 h-7 text-xs">
                Jetzt einrichten
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-50 text-yellow-600">
              <Star className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Google Bewertungen</p>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 -mr-1">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleRefresh} disabled={isLoading}>
                      <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                      Aktualisieren
                    </DropdownMenuItem>
                    <DialogTrigger asChild>
                      <DropdownMenuItem>
                        <Settings className="h-4 w-4 mr-2" />
                        Einstellungen
                      </DropdownMenuItem>
                    </DialogTrigger>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-3xl font-bold tracking-tight">{averageRating.toFixed(1)}</p>
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= Math.round(averageRating)
                          ? "text-yellow-500 fill-yellow-500"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{totalReviews} Bewertungen</p>
            </div>
          </div>
        )}
      </Card>
    </Dialog>
  )
}

export default GoogleReviewsWidget
