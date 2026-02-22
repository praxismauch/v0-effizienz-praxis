"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  ExternalLink, 
  Eye, 
  EyeOff,
  AlertTriangle,
  MapPin,
  Star,
  Building2
} from "lucide-react"
import { usePractice } from "@/contexts/practice-context"
import { toast } from "sonner"

interface GoogleBusinessSettings {
  id?: string
  practice_id: number
  api_key: string
  place_id: string
  location_name: string
  is_connected: boolean
  last_sync_at: string | null
  last_sync_status: string | null
  last_sync_error: string | null
  auto_sync_enabled: boolean
  sync_frequency_hours: number
  average_rating: number | null
  total_reviews: number | null
}

export function InterfacesTab() {
  const { currentPractice } = usePractice()
  const practiceId = currentPractice?.id

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)

  const [settings, setSettings] = useState<GoogleBusinessSettings>({
    practice_id: practiceId || 0,
    api_key: "",
    place_id: "",
    location_name: "",
    is_connected: false,
    last_sync_at: null,
    last_sync_status: null,
    last_sync_error: null,
    auto_sync_enabled: false,
    sync_frequency_hours: 24,
    average_rating: null,
    total_reviews: null,
  })

  useEffect(() => {
    if (practiceId) {
      fetchSettings()
    }
  }, [practiceId])

  const fetchSettings = async () => {
    if (!practiceId) return
    setIsLoading(true)
    try {
      const response = await fetch(`/api/practices/${practiceId}/integrations/google-business`)
      if (response.ok) {
        const data = await response.json()
        if (data) {
          setSettings((prev) => ({ ...prev, ...data }))
        }
      }
    } catch (error) {
      console.error("Error fetching Google Business settings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!practiceId) return
    setIsSaving(true)
    try {
      const response = await fetch(`/api/practices/${practiceId}/integrations/google-business`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: settings.api_key,
          place_id: settings.place_id,
          auto_sync_enabled: settings.auto_sync_enabled,
          sync_frequency_hours: settings.sync_frequency_hours,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save settings")
      }

      toast.success("Einstellungen gespeichert", {
        description: "Die Google Business API Einstellungen wurden erfolgreich gespeichert.",
      })
      
      await fetchSettings()
    } catch (error) {
      console.error("Error saving settings:", error)
      toast.error("Fehler beim Speichern", {
        description: "Die Einstellungen konnten nicht gespeichert werden.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleTestConnection = async () => {
    if (!settings.api_key || !settings.place_id) {
      toast.error("Bitte geben Sie API Key und Place ID ein.")
      return
    }
    setIsTesting(true)
    try {
      // Test directly with Google Places API
      const url = `https://places.googleapis.com/v1/places/${settings.place_id}?languageCode=de&key=${settings.api_key}`
      const response = await fetch(url, {
        headers: {
          "X-Goog-FieldMask": "displayName,rating,userRatingCount",
        },
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error?.message || `API Fehler (${response.status})`)
      }

      const data = await response.json()
      toast.success("Verbindung erfolgreich", {
        description: `Gefunden: ${data.displayName?.text || "Standort"} (${data.rating || "?"} Sterne, ${data.userRatingCount || 0} Bewertungen)`,
      })
      setSettings((prev) => ({
        ...prev,
        is_connected: true,
        location_name: data.displayName?.text || prev.location_name,
        average_rating: data.rating || null,
        total_reviews: data.userRatingCount || 0,
      }))
    } catch (error: any) {
      console.error("Error testing connection:", error)
      toast.error("Verbindung fehlgeschlagen", {
        description: error.message || "Die Verbindung konnte nicht hergestellt werden. Pruefen Sie API Key und Place ID.",
      })
      setSettings((prev) => ({ ...prev, is_connected: false }))
    } finally {
      setIsTesting(false)
    }
  }

  const handleSyncReviews = async () => {
    if (!practiceId) return
    setIsSyncing(true)
    try {
      if (!settings.api_key || !settings.place_id) {
        toast.error("Konfiguration fehlt", {
          description: "Bitte geben Sie zuerst den API Key und die Place ID ein und speichern Sie.",
        })
        return
      }

      const response = await fetch(`/api/practices/${practiceId}/reviews/import/google-business`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: settings.api_key,
          placeId: settings.place_id,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success("Bewertungen synchronisiert", {
          description: `${data.imported} neue Bewertungen importiert, ${data.skipped} uebersprungen. Gesamt bei Google: ${data.totalReviews || "?"}`,
        })
        setSettings((prev) => ({ ...prev, is_connected: true }))
        await fetchSettings()
      } else {
        throw new Error(data.error || "Sync failed")
      }
    } catch (error: any) {
      console.error("Error syncing reviews:", error)
      toast.error("Synchronisation fehlgeschlagen", {
        description: error.message || "Die Bewertungen konnten nicht synchronisiert werden.",
      })
    } finally {
      setIsSyncing(false)
    }
  }

  if (!practiceId) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            Keine Praxis ausgewählt. Bitte wählen Sie zuerst eine Praxis aus.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Einstellungen werden geladen...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Google Business Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Building2 className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Google Business Profile API
                  {settings.is_connected ? (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Verbunden
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <XCircle className="h-3 w-3 mr-1" />
                      Nicht verbunden
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Verbinden Sie Ihr Google Business Profil um Bewertungen automatisch zu importieren
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <a
                  href="https://business.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Google Business Profil
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Cloud Console
                </a>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Setup Instructions */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Einrichtungsanleitung</AlertTitle>
            <AlertDescription className="mt-2 space-y-2">
              <p>Um Google Bewertungen automatisch abzurufen, brauchen Sie nur 2 Dinge:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Erstellen Sie einen API Key in der <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-primary underline">Google Cloud Console</a></li>
                <li>Aktivieren Sie die <strong>Places API (New)</strong> in Ihrem Projekt</li>
                <li>Suchen Sie Ihre <strong>Place ID</strong> auf <a href="https://developers.google.com/maps/documentation/places/web-service/place-id" target="_blank" rel="noopener noreferrer" className="text-primary underline">Place ID Finder</a></li>
              </ol>
            </AlertDescription>
          </Alert>

          <Separator />

          {/* API Key */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Google API Zugangsdaten</h3>
            
            <div className="space-y-2">
              <Label htmlFor="api_key">API Key</Label>
              <div className="relative">
                <Input
                  id="api_key"
                  type={showApiKey ? "text" : "password"}
                  placeholder="AIzaSy..."
                  value={settings.api_key}
                  onChange={(e) => setSettings({ ...settings, api_key: e.target.value })}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Erstellt in der Google Cloud Console unter APIs & Dienste &gt; Anmeldedaten
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="place_id">Place ID</Label>
              <Input
                id="place_id"
                placeholder="ChIJ..."
                value={settings.place_id}
                onChange={(e) => setSettings({ ...settings, place_id: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Die eindeutige Google Place ID Ihrer Praxis. Finden Sie diese im{" "}
                <a href="https://developers.google.com/maps/documentation/places/web-service/place-id" target="_blank" rel="noopener noreferrer" className="text-primary underline">Place ID Finder</a>.
              </p>
            </div>

            {settings.location_name && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Verbundener Standort: <strong>{settings.location_name}</strong>
                  {settings.average_rating && (
                    <span className="ml-2 text-muted-foreground">
                      ({settings.average_rating} Sterne, {settings.total_reviews} Bewertungen)
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>

          <Separator />

          {/* Auto-Sync Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Automatische Synchronisation</h3>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto_sync">Automatisch synchronisieren</Label>
                <p className="text-xs text-muted-foreground">
                  Bewertungen werden automatisch in regelmäßigen Abständen importiert
                </p>
              </div>
              <Switch
                id="auto_sync"
                checked={settings.auto_sync_enabled}
                onCheckedChange={(checked) => setSettings({ ...settings, auto_sync_enabled: checked })}
              />
            </div>

            {settings.auto_sync_enabled && (
              <div className="space-y-2">
                <Label htmlFor="sync_frequency">Synchronisations-Intervall (Stunden)</Label>
                <Input
                  id="sync_frequency"
                  type="number"
                  min={1}
                  max={168}
                  value={settings.sync_frequency_hours}
                  onChange={(e) => setSettings({ ...settings, sync_frequency_hours: parseInt(e.target.value) || 24 })}
                  className="w-32"
                />
              </div>
            )}
          </div>

          {/* Last Sync Status */}
          {settings.last_sync_at && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Letzte Synchronisation</h3>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">
                    {new Date(settings.last_sync_at).toLocaleDateString("de-DE", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {settings.last_sync_status === "success" ? (
                    <Badge variant="default" className="bg-green-500">Erfolgreich</Badge>
                  ) : settings.last_sync_status === "error" ? (
                    <Badge variant="destructive">Fehlgeschlagen</Badge>
                  ) : (
                    <Badge variant="secondary">{settings.last_sync_status}</Badge>
                  )}
                </div>
                {settings.last_sync_error && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertDescription>{settings.last_sync_error}</AlertDescription>
                  </Alert>
                )}
              </div>
            </>
          )}

          <Separator />

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Einstellungen speichern
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleTestConnection} 
              disabled={isTesting || !settings.api_key || !settings.place_id}
            >
              {isTesting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Verbindung testen
            </Button>
            
            <Button 
              variant="secondary" 
              onClick={handleSyncReviews} 
              disabled={isSyncing || !settings.api_key || !settings.place_id}
            >
              {isSyncing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Bewertungen jetzt synchronisieren
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Verfügbare Funktionen
          </CardTitle>
          <CardDescription>
            Nach erfolgreicher Verbindung können Sie folgende Funktionen nutzen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-1">Bewertungen importieren</h4>
              <p className="text-sm text-muted-foreground">
                Automatischer Import aller Google Bewertungen in Ihre Praxis-Übersicht
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-1">Bewertungs-Analyse</h4>
              <p className="text-sm text-muted-foreground">
                KI-gestützte Analyse von Bewertungstrends und Stimmungen
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-1">Antwort-Vorschläge</h4>
              <p className="text-sm text-muted-foreground">
                KI-generierte Antwortvorschläge für neue Bewertungen
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
