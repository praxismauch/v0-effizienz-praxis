"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ROLE_CONFIG, AVAILABLE_ROLES, type NormalizedRoleKey } from "@/lib/roles"
import { Shield, Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

const HIERARCHY_DESCRIPTIONS: Record<NormalizedRoleKey, string[]> = {
  superadmin: [
    "Vollzugriff auf alle Systeme und Praxen",
    "Kann alle Rollen verwalten",
    "Zugriff auf das Super-Admin-Panel",
    "Kann Praxen erstellen und löschen",
    "Kann globale Einstellungen ändern",
  ],
  practiceadmin: [
    "Volle Kontrolle über die eigene Praxis",
    "Kann Benutzer einladen und Rollen zuweisen",
    "Kann Praxis-Einstellungen ändern",
    "Kann Abonnements und Abrechnungen verwalten",
    "Kann Teams und Abteilungen erstellen",
  ],
  admin: [
    "Administrativer Zugriff (ähnlich wie Praxis Admin)",
    "Kann Benutzer verwalten (keine Löschung)",
    "Kann Einstellungen bearbeiten",
    "Kann Berichte einsehen und exportieren",
    "Kein Zugriff auf Abrechnungen",
  ],
  manager: [
    "Erweiterte Berechtigungen für Teamführung",
    "Kann Dienstpläne erstellen und bearbeiten",
    "Kann Mitarbeitergespräche führen",
    "Kann Aufgaben zuweisen und verwalten",
    "Kann Team-Berichte einsehen",
  ],
  member: [
    "Standard-Benutzer mit normalen Funktionen",
    "Kann eigene Daten bearbeiten",
    "Kann Kalender und Dienstplan einsehen",
    "Kann Aufgaben bearbeiten",
    "Kann Dokumente einsehen",
  ],
  viewer: [
    "Nur-Lese-Zugriff auf freigegebene Bereiche",
    "Kann Dashboard und Berichte einsehen",
    "Kann keine Daten ändern",
    "Ideal für Aufsichtsbehörden oder Berater",
  ],
  extern: [
    "Eingeschränkter externer Zugriff",
    "Kann nur freigegebene Dokumente sehen",
    "Kein Zugriff auf Personalinformationen",
    "Ideal für externe Dienstleister",
  ],
}

export function RolesOverview() {
  const roles = Object.values(ROLE_CONFIG).sort((a, b) => a.order - b.order)

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Die 7 Standardrollen sind systemweit definiert und bilden die Grundlage für die Rechteverwaltung.
          Die Berechtigungen je Rolle können im Tab &quot;Berechtigungen&quot; konfiguriert werden.
        </AlertDescription>
      </Alert>

      {/* Roles Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Rollen-Übersicht
          </CardTitle>
          <CardDescription>
            Alle {roles.length} Systemrollen mit Hierarchie und Beschreibung
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Rang</TableHead>
                <TableHead>Rolle</TableHead>
                <TableHead>Beschreibung</TableHead>
                <TableHead className="w-28 text-center">Hierarchie</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => {
                const RoleIcon = role.icon
                return (
                  <TableRow key={role.key}>
                    <TableCell className="text-muted-foreground tabular-nums font-medium">{role.order}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`h-9 w-9 rounded-lg ${role.color} flex items-center justify-center`}>
                          <RoleIcon className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <Badge className={role.badgeColor}>{role.label}</Badge>
                          <p className="text-xs text-muted-foreground mt-1">{role.labelEn}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{role.description}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-lg font-bold tabular-nums">{role.hierarchy}</span>
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${role.color}`}
                            style={{ width: `${role.hierarchy}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detailed Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {roles.map((role) => {
          const RoleIcon = role.icon
          const descriptions = HIERARCHY_DESCRIPTIONS[role.key] || []

          return (
            <Card key={role.key} className="relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-1 h-full ${role.color}`} />
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg ${role.color} flex items-center justify-center`}>
                    <RoleIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{role.label}</CardTitle>
                    <CardDescription className="text-xs">
                      Hierarchie: {role.hierarchy} / 100
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground mb-3">{role.description}</p>
                <ul className="space-y-1.5">
                  {descriptions.map((desc, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className={`mt-1.5 h-1.5 w-1.5 rounded-full ${role.color} shrink-0`} />
                      {desc}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Hierarchy Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Hierarchie-Vergleich</CardTitle>
          <CardDescription>
            Höhere Hierarchie-Werte bedeuten mehr Berechtigungen. Eine Rolle kann nur Benutzer mit niedrigerer Hierarchie verwalten.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {roles.map((role) => {
              const RoleIcon = role.icon
              return (
                <div key={role.key} className="flex items-center gap-4">
                  <div className="w-32 flex items-center gap-2 shrink-0">
                    <div className={`h-6 w-6 rounded ${role.color} flex items-center justify-center`}>
                      <RoleIcon className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-sm font-medium truncate">{role.label}</span>
                  </div>
                  <div className="flex-1">
                    <div className="w-full bg-muted rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${role.color} transition-all`}
                        style={{ width: `${role.hierarchy}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-mono text-muted-foreground w-8 text-right">{role.hierarchy}</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
