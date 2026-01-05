"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/contexts/user-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Shield, Key, Clock, Activity, UserCog } from "lucide-react"

interface SecuritySettings {
  passwordPolicy: {
    minLength: number
    requireUppercase: boolean
    requireLowercase: boolean
    requireNumbers: boolean
    requireSpecialChars: boolean
    expiryDays: number
  }
  sessionPolicy: {
    timeoutMinutes: number
    maxConcurrentSessions: number
    requireMfa: boolean
  }
  accessControl: {
    allowGuestAccess: boolean
    ipWhitelist: string[]
    restrictByTime: boolean
    allowedHours: { start: string; end: string }
  }
  auditLogging: {
    logLogins: boolean
    logDataChanges: boolean
    logFileAccess: boolean
    retentionDays: number
  }
}

interface UserPermission {
  userId: string
  userName: string
  email: string
  role: string
  lastLogin: string | null
  mfaEnabled: boolean
  isActive: boolean
  permissions: string[]
}

function SecurityPermissionsManager() {
  const { currentUser, currentPractice } = useUser()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: false,
      expiryDays: 90,
    },
    sessionPolicy: {
      timeoutMinutes: 30,
      maxConcurrentSessions: 3,
      requireMfa: false,
    },
    accessControl: {
      allowGuestAccess: false,
      ipWhitelist: [],
      restrictByTime: false,
      allowedHours: { start: "08:00", end: "18:00" },
    },
    auditLogging: {
      logLogins: true,
      logDataChanges: true,
      logFileAccess: true,
      retentionDays: 365,
    },
  })
  const [users, setUsers] = useState<UserPermission[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [newIp, setNewIp] = useState("")

  useEffect(() => {
    if (currentPractice?.id) {
      loadSecuritySettings()
      loadUsers()
      loadAuditLogs()
    } else {
      setLoading(false)
    }
  }, [currentPractice])

  const loadSecuritySettings = async () => {
    if (!currentPractice?.id) {
      console.log("[v0] SecurityPermissionsManager: Skipping settings load - no practice selected")
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/settings`)
      if (response.ok) {
        const data = await response.json()
        if (data.security_settings) {
          setSecuritySettings(data.security_settings)
        }
      }
    } catch (error) {
      console.error("Error loading security settings:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    if (!currentPractice?.id) {
      console.log("[v0] SecurityPermissionsManager: Skipping users load - no practice selected")
      return
    }

    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/team-members`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error("Error loading users:", error)
    }
  }

  const loadAuditLogs = async () => {
    try {
      const response = await fetch(`/api/audit-logs?limit=50`)
      if (response.ok) {
        const data = await response.json()
        setAuditLogs(data)
      }
    } catch (error) {
      console.error("Error loading audit logs:", error)
    }
  }

  const saveSecuritySettings = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/practices/${currentPractice?.id}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ security_settings: securitySettings }),
      })

      if (response.ok) {
        toast.success("Sicherheitseinstellungen gespeichert")
      } else {
        toast.error("Fehler beim Speichern der Einstellungen")
      }
    } catch (error) {
      console.error("Error saving security settings:", error)
      toast.error("Fehler beim Speichern der Einstellungen")
    } finally {
      setSaving(false)
    }
  }

  const toggleUserMfa = async (userId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/users/${userId}/mfa`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mfa_enabled: enabled }),
      })

      if (response.ok) {
        toast.success(`MFA ${enabled ? "aktiviert" : "deaktiviert"}`)
        loadUsers()
      } else {
        toast.error("Fehler beim Aktualisieren der MFA-Einstellung")
      }
    } catch (error) {
      console.error("Error toggling MFA:", error)
      toast.error("Fehler beim Aktualisieren der MFA-Einstellung")
    }
  }

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: isActive }),
      })

      if (response.ok) {
        toast.success(`Benutzer ${isActive ? "aktiviert" : "deaktiviert"}`)
        loadUsers()
      } else {
        toast.error("Fehler beim Aktualisieren des Benutzerstatus")
      }
    } catch (error) {
      console.error("Error toggling user status:", error)
      toast.error("Fehler beim Aktualisieren des Benutzerstatus")
    }
  }

  const addIpToWhitelist = () => {
    if (newIp && /^(\d{1,3}\.){3}\d{1,3}$/.test(newIp)) {
      setSecuritySettings({
        ...securitySettings,
        accessControl: {
          ...securitySettings.accessControl,
          ipWhitelist: [...securitySettings.accessControl.ipWhitelist, newIp],
        },
      })
      setNewIp("")
    } else {
      toast.error("Ungültige IP-Adresse")
    }
  }

  const removeIpFromWhitelist = (ip: string) => {
    setSecuritySettings({
      ...securitySettings,
      accessControl: {
        ...securitySettings.accessControl,
        ipWhitelist: securitySettings.accessControl.ipWhitelist.filter((i) => i !== ip),
      },
    })
  }

  if (loading) {
    return <div className="flex items-center justify-center p-8">Laden...</div>
  }

  return (
    <Tabs defaultValue="password" className="space-y-4">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="password">
          <Key className="h-4 w-4 mr-2" />
          Passwort-Richtlinien
        </TabsTrigger>
        <TabsTrigger value="session">
          <Clock className="h-4 w-4 mr-2" />
          Sitzungen
        </TabsTrigger>
        <TabsTrigger value="access">
          <Shield className="h-4 w-4 mr-2" />
          Zugriffskontrolle
        </TabsTrigger>
        <TabsTrigger value="users">
          <UserCog className="h-4 w-4 mr-2" />
          Benutzerberechtigungen
        </TabsTrigger>
        <TabsTrigger value="audit">
          <Activity className="h-4 w-4 mr-2" />
          Audit-Protokoll
        </TabsTrigger>
      </TabsList>

      {/* Password Policy Tab */}
      <TabsContent value="password" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Passwort-Richtlinien
            </CardTitle>
            <CardDescription>Legen Sie Anforderungen für sichere Passwörter fest</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Minimale Länge</Label>
                  <div className="text-sm text-muted-foreground">Mindestanzahl der Zeichen für Passwörter</div>
                </div>
                <Input
                  type="number"
                  min="6"
                  max="32"
                  className="w-20"
                  value={securitySettings.passwordPolicy.minLength}
                  onChange={(e) =>
                    setSecuritySettings({
                      ...securitySettings,
                      passwordPolicy: {
                        ...securitySettings.passwordPolicy,
                        minLength: Number.parseInt(e.target.value),
                      },
                    })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Großbuchstaben erforderlich</Label>
                  <div className="text-sm text-muted-foreground">Mindestens ein Großbuchstabe (A-Z)</div>
                </div>
                <Switch
                  checked={securitySettings.passwordPolicy.requireUppercase}
                  onCheckedChange={(checked) =>
                    setSecuritySettings({
                      ...securitySettings,
                      passwordPolicy: {
                        ...securitySettings.passwordPolicy,
                        requireUppercase: checked,
                      },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Kleinbuchstaben erforderlich</Label>
                  <div className="text-sm text-muted-foreground">Mindestens ein Kleinbuchstabe (a-z)</div>
                </div>
                <Switch
                  checked={securitySettings.passwordPolicy.requireLowercase}
                  onCheckedChange={(checked) =>
                    setSecuritySettings({
                      ...securitySettings,
                      passwordPolicy: {
                        ...securitySettings.passwordPolicy,
                        requireLowercase: checked,
                      },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Zahlen erforderlich</Label>
                  <div className="text-sm text-muted-foreground">Mindestens eine Ziffer (0-9)</div>
                </div>
                <Switch
                  checked={securitySettings.passwordPolicy.requireNumbers}
                  onCheckedChange={(checked) =>
                    setSecuritySettings({
                      ...securitySettings,
                      passwordPolicy: {
                        ...securitySettings.passwordPolicy,
                        requireNumbers: checked,
                      },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sonderzeichen erforderlich</Label>
                  <div className="text-sm text-muted-foreground">Mindestens ein Sonderzeichen (!@#$%^&*)</div>
                </div>
                <Switch
                  checked={securitySettings.passwordPolicy.requireSpecialChars}
                  onCheckedChange={(checked) =>
                    setSecuritySettings({
                      ...securitySettings,
                      passwordPolicy: {
                        ...securitySettings.passwordPolicy,
                        requireSpecialChars: checked,
                      },
                    })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Passwort-Ablauf (Tage)</Label>
                  <div className="text-sm text-muted-foreground">
                    Benutzer müssen ihr Passwort nach dieser Zeit ändern
                  </div>
                </div>
                <Input
                  type="number"
                  min="0"
                  max="365"
                  className="w-24"
                  value={securitySettings.passwordPolicy.expiryDays}
                  onChange={(e) =>
                    setSecuritySettings({
                      ...securitySettings,
                      passwordPolicy: {
                        ...securitySettings.passwordPolicy,
                        expiryDays: Number.parseInt(e.target.value),
                      },
                    })
                  }
                />
              </div>
            </div>

            <Button onClick={saveSecuritySettings} disabled={saving}>
              {saving ? "Speichern..." : "Einstellungen speichern"}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Session Policy Tab */}
      <TabsContent value="session" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Sitzungsverwaltung
            </CardTitle>
            <CardDescription>Konfigurieren Sie Sitzungszeitlimits und Sicherheit</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sitzungs-Timeout (Minuten)</Label>
                  <div className="text-sm text-muted-foreground">Automatisches Abmelden nach Inaktivität</div>
                </div>
                <Input
                  type="number"
                  min="5"
                  max="480"
                  className="w-24"
                  value={securitySettings.sessionPolicy.timeoutMinutes}
                  onChange={(e) =>
                    setSecuritySettings({
                      ...securitySettings,
                      sessionPolicy: {
                        ...securitySettings.sessionPolicy,
                        timeoutMinutes: Number.parseInt(e.target.value),
                      },
                    })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Max. gleichzeitige Sitzungen</Label>
                  <div className="text-sm text-muted-foreground">Anzahl der erlaubten parallelen Anmeldungen</div>
                </div>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  className="w-20"
                  value={securitySettings.sessionPolicy.maxConcurrentSessions}
                  onChange={(e) =>
                    setSecuritySettings({
                      ...securitySettings,
                      sessionPolicy: {
                        ...securitySettings.sessionPolicy,
                        maxConcurrentSessions: Number.parseInt(e.target.value),
                      },
                    })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Zwei-Faktor-Authentifizierung erzwingen</Label>
                  <div className="text-sm text-muted-foreground">Alle Benutzer müssen MFA aktivieren</div>
                </div>
                <Switch
                  checked={securitySettings.sessionPolicy.requireMfa}
                  onCheckedChange={(checked) =>
                    setSecuritySettings({
                      ...securitySettings,
                      sessionPolicy: {
                        ...securitySettings.sessionPolicy,
                        requireMfa: checked,
                      },
                    })
                  }
                />
              </div>
            </div>

            <Button onClick={saveSecuritySettings} disabled={saving}>
              {saving ? "Speichern..." : "Einstellungen speichern"}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Access Control Tab */}
      <TabsContent value="access" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Zugriffskontrolle
            </CardTitle>
            <CardDescription>Verwalten Sie IP-Whitelist und Zugriffszeiten</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Gastzugriff erlauben</Label>
                  <div className="text-sm text-muted-foreground">Anonyme Benutzer können bestimmte Bereiche sehen</div>
                </div>
                <Switch
                  checked={securitySettings.accessControl.allowGuestAccess}
                  onCheckedChange={(checked) =>
                    setSecuritySettings({
                      ...securitySettings,
                      accessControl: {
                        ...securitySettings.accessControl,
                        allowGuestAccess: checked,
                      },
                    })
                  }
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>IP-Whitelist</Label>
                <div className="text-sm text-muted-foreground mb-2">
                  Nur diese IP-Adressen dürfen auf das System zugreifen
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="z.B. 192.168.1.100"
                    value={newIp}
                    onChange={(e) => setNewIp(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        addIpToWhitelist()
                      }
                    }}
                  />
                  <Button onClick={addIpToWhitelist}>Hinzufügen</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {securitySettings.accessControl.ipWhitelist.map((ip) => (
                    <Badge key={ip} variant="secondary">
                      {ip}
                      <button onClick={() => removeIpFromWhitelist(ip)} className="ml-2 hover:text-destructive">
                        ×
                      </button>
                    </Badge>
                  ))}
                  {securitySettings.accessControl.ipWhitelist.length === 0 && (
                    <div className="text-sm text-muted-foreground">
                      Keine IP-Adressen in der Whitelist (alle IPs erlaubt)
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Zeitbasierte Zugriffskontrolle</Label>
                    <div className="text-sm text-muted-foreground">Zugriff nur zu bestimmten Zeiten erlauben</div>
                  </div>
                  <Switch
                    checked={securitySettings.accessControl.restrictByTime}
                    onCheckedChange={(checked) =>
                      setSecuritySettings({
                        ...securitySettings,
                        accessControl: {
                          ...securitySettings.accessControl,
                          restrictByTime: checked,
                        },
                      })
                    }
                  />
                </div>

                {securitySettings.accessControl.restrictByTime && (
                  <div className="flex gap-4 items-center">
                    <div className="flex-1">
                      <Label>Von</Label>
                      <Input
                        type="time"
                        value={securitySettings.accessControl.allowedHours.start}
                        onChange={(e) =>
                          setSecuritySettings({
                            ...securitySettings,
                            accessControl: {
                              ...securitySettings.accessControl,
                              allowedHours: {
                                ...securitySettings.accessControl.allowedHours,
                                start: e.target.value,
                              },
                            },
                          })
                        }
                      />
                    </div>
                    <div className="flex-1">
                      <Label>Bis</Label>
                      <Input
                        type="time"
                        value={securitySettings.accessControl.allowedHours.end}
                        onChange={(e) =>
                          setSecuritySettings({
                            ...securitySettings,
                            accessControl: {
                              ...securitySettings.accessControl,
                              allowedHours: {
                                ...securitySettings.accessControl.allowedHours,
                                end: e.target.value,
                              },
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Button onClick={saveSecuritySettings} disabled={saving}>
              {saving ? "Speichern..." : "Einstellungen speichern"}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Users & Permissions Tab */}
      <TabsContent value="users" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              Benutzerberechtigungen
            </CardTitle>
            <CardDescription>Verwalten Sie Benutzerzugriff und MFA-Einstellungen</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.userId} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{user.userName}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline">{user.role}</Badge>
                      {user.mfaEnabled && (
                        <Badge variant="secondary">
                          <Key className="h-3 w-3 mr-1" />
                          MFA
                        </Badge>
                      )}
                      {!user.isActive && <Badge variant="destructive">Deaktiviert</Badge>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => toggleUserMfa(user.userId, !user.mfaEnabled)}>
                      {user.mfaEnabled ? "MFA deaktivieren" : "MFA aktivieren"}
                    </Button>
                    <Button
                      variant={user.isActive ? "destructive" : "default"}
                      size="sm"
                      onClick={() => toggleUserStatus(user.userId, !user.isActive)}
                    >
                      {user.isActive ? "Deaktivieren" : "Aktivieren"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Audit Log Tab */}
      <TabsContent value="audit" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Audit-Protokoll
            </CardTitle>
            <CardDescription>Sicherheitsrelevante Ereignisse und Zugriffe</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Anmeldungen protokollieren</Label>
                  <div className="text-sm text-muted-foreground">Erfolgreiche und fehlgeschlagene Anmeldeversuche</div>
                </div>
                <Switch
                  checked={securitySettings.auditLogging.logLogins}
                  onCheckedChange={(checked) =>
                    setSecuritySettings({
                      ...securitySettings,
                      auditLogging: {
                        ...securitySettings.auditLogging,
                        logLogins: checked,
                      },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Datenänderungen protokollieren</Label>
                  <div className="text-sm text-muted-foreground">Alle CRUD-Operationen aufzeichnen</div>
                </div>
                <Switch
                  checked={securitySettings.auditLogging.logDataChanges}
                  onCheckedChange={(checked) =>
                    setSecuritySettings({
                      ...securitySettings,
                      auditLogging: {
                        ...securitySettings.auditLogging,
                        logDataChanges: checked,
                      },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Dateizugriffe protokollieren</Label>
                  <div className="text-sm text-muted-foreground">Dokument-Downloads und -Ansichten</div>
                </div>
                <Switch
                  checked={securitySettings.auditLogging.logFileAccess}
                  onCheckedChange={(checked) =>
                    setSecuritySettings({
                      ...securitySettings,
                      auditLogging: {
                        ...securitySettings.auditLogging,
                        logFileAccess: checked,
                      },
                    })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Aufbewahrungsdauer (Tage)</Label>
                  <div className="text-sm text-muted-foreground">Wie lange Protokolle gespeichert werden</div>
                </div>
                <Input
                  type="number"
                  min="30"
                  max="365"
                  className="w-24"
                  value={securitySettings.auditLogging.retentionDays}
                  onChange={(e) =>
                    setSecuritySettings({
                      ...securitySettings,
                      auditLogging: {
                        ...securitySettings.auditLogging,
                        retentionDays: Number.parseInt(e.target.value),
                      },
                    })
                  }
                />
              </div>
            </div>

            <Button onClick={saveSecuritySettings} disabled={saving}>
              {saving ? "Speichern..." : "Einstellungen speichern"}
            </Button>

            <Separator />

            <div className="space-y-2">
              <h4 className="font-medium">Letzte Ereignisse</h4>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {auditLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <Activity className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="font-medium">{log.action}</div>
                      <div className="text-sm text-muted-foreground">{log.details}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(log.timestamp).toLocaleString("de-DE")}
                      </div>
                    </div>
                  </div>
                ))}
                {auditLogs.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">Keine Audit-Protokolle vorhanden</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

export default SecurityPermissionsManager
