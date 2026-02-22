"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, RefreshCw, Shield } from "lucide-react"

export function PermissionsLoading() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Lade Benutzerrechte...</p>
      </div>
    </div>
  )
}

interface PermissionsErrorProps {
  error: string
  onRetry: () => void
  onInitialize: () => void
  initializing: boolean
}

export function PermissionsError({ error, onRetry, onInitialize, initializing }: PermissionsErrorProps) {
  return (
    <div className="space-y-6">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-semibold">Fehler beim Laden der Benutzerrechte</p>
            <p className="text-sm">{error}</p>
            <p className="text-sm text-muted-foreground">
              {"Moeglicherweise existiert die Tabelle \"role_permissions\" noch nicht. Fuehren Sie das Script "}
              <code className="bg-muted px-1 rounded">scripts/072_update_role_permissions_all_roles.sql</code> aus.
            </p>
          </div>
        </AlertDescription>
      </Alert>
      <div className="flex gap-2">
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Erneut versuchen
        </Button>
        <Button onClick={onInitialize} disabled={initializing}>
          <Shield className={`h-4 w-4 mr-2 ${initializing ? "animate-spin" : ""}`} />
          {initializing ? "Initialisiert..." : "Berechtigungen erstellen"}
        </Button>
      </div>
    </div>
  )
}

interface PermissionsEmptyProps {
  onInitialize: () => void
  initializing: boolean
}

export function PermissionsEmpty({ onInitialize, initializing }: PermissionsEmptyProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Benutzerrechte Verwaltung
          </CardTitle>
          <CardDescription>Keine Berechtigungen gefunden</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-semibold">Keine Benutzerrechte vorhanden</p>
              <p className="text-sm mt-2">
                Klicken Sie auf die Schaltfläche unten, um die Standard-Berechtigungen für alle 7 Rollen (Super Admin,
                Praxis Admin, Admin, Manager, Mitglied, Betrachter, Extern) zu initialisieren.
              </p>
            </AlertDescription>
          </Alert>
          <div className="flex gap-2 mt-4">
            <Button onClick={onInitialize} disabled={initializing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${initializing ? "animate-spin" : ""}`} />
              {initializing ? "Initialisiert..." : "Standard-Berechtigungen initialisieren"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
