"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Key,
  Eye,
  EyeOff,
  ExternalLink,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Save,
  Loader2,
  MapPin,
  Database,
} from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { toast } from "sonner"

interface ApiKeyConfig {
  key: string
  name: string
  envVar: string
  description: string
  helpUrl?: string
  icon: React.ReactNode
  category: "integrations" | "ai" | "storage" | "payments"
}

const API_KEY_CONFIGS: ApiKeyConfig[] = [
  {
    key: "google_places_api_key",
    name: "Google Places API Key",
    envVar: "GOOGLE_PLACES_API_KEY",
    description:
      "Erforderlich für Live-Bewertungen von Google für alle Praxen. Jede Praxis konfiguriert nur ihre eigene Place ID.",
    helpUrl: "https://console.cloud.google.com/apis/credentials",
    icon: <MapPin className="h-4 w-4" />,
    category: "integrations",
  },
]

export default function ApiKeysManager() {
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({})
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
  const [showHelp, setShowHelp] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchApiKeys()
  }, [])

  const fetchApiKeys = async () => {
    try {
      const response = await fetch("/api/super-admin/api-keys")
      if (response.ok) {
        const data = await response.json()
        setApiKeys(data.keys || {})
      }
    } catch (error) {
      console.error("Error fetching API keys:", error)
    } finally {
      setLoading(false)
    }
  }

  const saveApiKey = async (keyName: string, value: string) => {
    setSaving(true)
    try {
      const response = await fetch("/api/super-admin/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: keyName, value }),
      })

      if (response.ok) {
        toast.success("API-Key gespeichert")
        setApiKeys((prev) => ({ ...prev, [keyName]: value }))
      } else {
        toast.error("Fehler beim Speichern")
      }
    } catch (error) {
      console.error("Error saving API key:", error)
      toast.error("Fehler beim Speichern")
    } finally {
      setSaving(false)
    }
  }

  const toggleShowKey = (key: string) => {
    setShowKeys((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleShowHelp = (key: string) => {
    setShowHelp((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const integrationKeys = API_KEY_CONFIGS.filter((k) => k.category === "integrations")

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Externe Integrationen
          </CardTitle>
          <CardDescription>
            API-Keys für externe Dienste. Diese Keys gelten für das gesamte System (alle Praxen).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {integrationKeys.map((config) => {
            const value = apiKeys[config.key] || ""
            const isConfigured = value.length > 10

            return (
              <div key={config.key} className="space-y-3 p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-base font-medium">
                    {config.icon}
                    {config.name}
                  </Label>
                  {isConfigured ? (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Konfiguriert
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-amber-600 border-amber-600">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Nicht konfiguriert
                    </Badge>
                  )}
                </div>

                <p className="text-sm text-muted-foreground">{config.description}</p>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showKeys[config.key] ? "text" : "password"}
                      value={value}
                      onChange={(e) => setApiKeys((prev) => ({ ...prev, [config.key]: e.target.value }))}
                      placeholder={config.envVar}
                      className="pr-10 font-mono text-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                      onClick={() => toggleShowKey(config.key)}
                    >
                      {showKeys[config.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Button onClick={() => saveApiKey(config.key, value)} disabled={saving} size="sm">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  </Button>
                </div>

                {config.key === "google_places_api_key" && (
                  <Collapsible open={showHelp[config.key]} onOpenChange={() => toggleShowHelp(config.key)}>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full justify-between bg-transparent">
                        <span className="flex items-center gap-2">
                          <HelpCircle className="h-4 w-4" />
                          So erhalten Sie einen Google Places API Key
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {showHelp[config.key] ? "Ausblenden" : "Anzeigen"}
                        </span>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3">
                      <Alert>
                        <AlertDescription className="space-y-3 text-sm">
                          <ol className="list-decimal list-inside space-y-2">
                            <li>
                              Öffnen Sie die{" "}
                              <a
                                href="https://console.cloud.google.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline inline-flex items-center gap-1"
                              >
                                Google Cloud Console
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </li>
                            <li>Erstellen Sie ein neues Projekt oder wählen Sie ein bestehendes</li>
                            <li>
                              Aktivieren Sie die{" "}
                              <a
                                href="https://console.cloud.google.com/apis/library/places-backend.googleapis.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline inline-flex items-center gap-1"
                              >
                                Places API (New)
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </li>
                            <li>
                              Gehen Sie zu{" "}
                              <a
                                href="https://console.cloud.google.com/apis/credentials"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline inline-flex items-center gap-1"
                              >
                                APIs & Services → Credentials
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </li>
                            <li>Klicken Sie auf "Create Credentials" → "API Key"</li>
                            <li>Kopieren Sie den erstellten API Key und fügen Sie ihn hier ein</li>
                          </ol>

                          <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-950/30 rounded-md border border-amber-200 dark:border-amber-800">
                            <p className="text-xs text-amber-800 dark:text-amber-200">
                              <strong>Wichtig:</strong> Es können Kosten entstehen. Google bietet ein kostenloses
                              Kontingent von $200/Monat. Wir empfehlen, ein Budget-Limit in der Cloud Console
                              einzurichten.
                            </p>
                          </div>

                          <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded-md border border-blue-200 dark:border-blue-800">
                            <p className="text-xs text-blue-800 dark:text-blue-200">
                              <strong>Hinweis:</strong> Dieser API-Key gilt für alle Praxen. Jede Praxis konfiguriert
                              nur ihre eigene Google Place ID in den Praxis-Einstellungen.
                            </p>
                          </div>
                        </AlertDescription>
                      </Alert>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Umgebungsvariablen (Nur-Lesen)
          </CardTitle>
          <CardDescription>
            Diese API-Keys werden über Umgebungsvariablen konfiguriert und können hier nicht geändert werden.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { name: "Supabase", env: "SUPABASE_URL", configured: true },
              { name: "Stripe", env: "STRIPE_SECRET_KEY", configured: true },
              { name: "OpenAI", env: "OPENAI_API_KEY", configured: true },
              { name: "Anthropic", env: "ANTHROPIC_API_KEY", configured: true },
              { name: "Groq", env: "GROQ_API_KEY", configured: true },
              { name: "Resend", env: "RESEND_API_KEY", configured: true },
              { name: "Upstash Redis", env: "KV_REST_API_URL", configured: true },
              { name: "Vercel Blob", env: "BLOB_READ_WRITE_TOKEN", configured: true },
            ].map((item) => (
              <div key={item.env} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{item.env}</p>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Konfiguriert
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
