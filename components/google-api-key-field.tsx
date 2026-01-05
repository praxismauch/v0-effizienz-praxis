"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Key, Eye, EyeOff, ExternalLink, HelpCircle, CheckCircle2, AlertCircle } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface GoogleApiKeyFieldProps {
  value: string
  onChange: (value: string) => void
}

export function GoogleApiKeyField({ value, onChange }: GoogleApiKeyFieldProps) {
  const [showKey, setShowKey] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  const isKeyConfigured = value && value.length > 10

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label htmlFor="google-places-api-key" className="flex items-center gap-2">
          <Key className="h-4 w-4 text-muted-foreground" />
          Google Places API Key
        </Label>
        {isKeyConfigured ? (
          <span className="flex items-center gap-1 text-xs text-green-600">
            <CheckCircle2 className="h-3 w-3" />
            Konfiguriert
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-amber-600">
            <AlertCircle className="h-3 w-3" />
            Nicht konfiguriert
          </span>
        )}
      </div>

      <div className="relative">
        <Input
          id="google-places-api-key"
          type={showKey ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="AIza..."
          className="pr-10 font-mono text-sm"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
          onClick={() => setShowKey(!showKey)}
        >
          {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Erforderlich für Live-Bewertungen von Google. Ohne API-Key werden nur manuell importierte Bewertungen angezeigt.
      </p>

      <Collapsible open={showHelp} onOpenChange={setShowHelp}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="sm" className="w-full justify-between bg-transparent">
            <span className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              So erhalten Sie einen Google Places API Key
            </span>
            <span className="text-xs text-muted-foreground">{showHelp ? "Ausblenden" : "Anzeigen"}</span>
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
                  <strong>Wichtig:</strong> Es können Kosten entstehen. Google bietet ein kostenloses Kontingent von
                  $200/Monat. Wir empfehlen, ein Budget-Limit in der Cloud Console einzurichten.
                </p>
              </div>

              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded-md border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  <strong>Tipp:</strong> Schränken Sie den API-Key auf "Places API (New)" ein für mehr Sicherheit.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

export default GoogleApiKeyField
