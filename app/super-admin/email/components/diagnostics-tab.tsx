"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle2, XCircle, AlertTriangle, RefreshCw, Loader2,
  Server, Shield, Mail, Zap
} from "lucide-react"

interface EmailConfig {
  configured: boolean
  smtpHost: string
  smtpPort: number
  smtpHasAuth: boolean
  smtpSource: string
  resendProvider: boolean
  resendFromEmail: string
  hasApiKey?: boolean
  fromEmail?: string
}

function StatusIcon({ ok }: { ok: boolean }) {
  return ok ? (
    <CheckCircle2 className="h-5 w-5 text-green-500" />
  ) : (
    <XCircle className="h-5 w-5 text-red-500" />
  )
}

export function DiagnosticsTab() {
  const [config, setConfig] = useState<EmailConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null)

  async function fetchConfig() {
    setLoading(true)
    try {
      const [configRes, statusRes] = await Promise.all([
        fetch("/api/super-admin/email-config"),
        fetch("/api/super-admin/email-config").catch(() => null),
      ])
      const configData = await configRes.json()

      setConfig({
        configured: configData.configured ?? configData.hasApiKey ?? false,
        smtpHost: configData.smtpHost || "",
        smtpPort: configData.smtpPort || 587,
        smtpHasAuth: configData.smtpHasAuth ?? false,
        smtpSource: configData.smtpSource || "none",
        resendProvider: configData.resendProvider ?? false,
        resendFromEmail: configData.resendFromEmail || "",
        hasApiKey: configData.hasApiKey,
        fromEmail: configData.fromEmail,
      })
    } catch {
      setConfig(null)
    } finally {
      setLoading(false)
    }
  }

  async function runSmtpTest() {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch("/api/super-admin/smtp-test", { method: "POST" })
      const data = await res.json()
      setTestResult(data)
    } catch {
      setTestResult({ success: false, error: "Netzwerkfehler" })
    } finally {
      setTesting(false)
    }
  }

  useEffect(() => { fetchConfig() }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const checks = [
    {
      label: "SMTP-Server konfiguriert",
      ok: !!(config?.smtpHost),
      detail: config?.smtpHost ? `${config.smtpHost}:${config.smtpPort}` : "Nicht konfiguriert",
      icon: Server,
    },
    {
      label: "SMTP-Authentifizierung",
      ok: !!config?.smtpHasAuth,
      detail: config?.smtpHasAuth ? "Benutzername & Passwort gesetzt" : "Keine Zugangsdaten",
      icon: Shield,
    },
    {
      label: "Resend Provider",
      ok: !!config?.resendProvider,
      detail: config?.resendProvider ? `Konfiguriert (${config.resendFromEmail})` : "Nicht konfiguriert (optional)",
      icon: Zap,
    },
    {
      label: "E-Mail-Versand bereit",
      ok: !!config?.configured,
      detail: config?.configured ? "Mindestens ein Provider aktiv" : "Kein Provider konfiguriert",
      icon: Mail,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Status overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {checks.map((check) => (
          <Card key={check.label} className={check.ok ? "border-green-200 dark:border-green-800/40" : "border-red-200 dark:border-red-800/40"}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${check.ok ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
                  <check.icon className={`h-4 w-4 ${check.ok ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{check.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{check.detail}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed checks */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Diagnose-Checks</CardTitle>
              <CardDescription>Detaillierter Status aller E-Mail-Komponenten</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchConfig}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Aktualisieren
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {checks.map((check) => (
              <div key={check.label} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <StatusIcon ok={check.ok} />
                  <div>
                    <p className="text-sm font-medium">{check.label}</p>
                    <p className="text-xs text-muted-foreground">{check.detail}</p>
                  </div>
                </div>
                <Badge variant={check.ok ? "default" : "destructive"} className={check.ok ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : ""}>
                  {check.ok ? "OK" : "Fehlt"}
                </Badge>
              </div>
            ))}

            {config?.smtpSource && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="text-sm font-medium">Konfigurations-Quelle</p>
                    <p className="text-xs text-muted-foreground">
                      {config.smtpSource === "configured" ? "Umgebungsvariablen oder Datenbank" : "Keine Konfiguration gefunden"}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">{config.smtpSource === "configured" ? "Aktiv" : "Inaktiv"}</Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Connection test */}
      <Card>
        <CardHeader>
          <CardTitle>Verbindungstest</CardTitle>
          <CardDescription>Testen Sie die SMTP-Verbindung zu Ihrem Mail-Server</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={runSmtpTest} disabled={testing}>
            {testing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
            SMTP-Verbindung testen
          </Button>

          {testResult && (
            <div className={`p-4 rounded-lg border ${testResult.success ? "bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800/40" : "bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800/40"}`}>
              <div className="flex items-center gap-2">
                <StatusIcon ok={testResult.success} />
                <p className="text-sm font-medium">
                  {testResult.success ? "Verbindung erfolgreich!" : "Verbindung fehlgeschlagen"}
                </p>
              </div>
              {testResult.error && (
                <p className="text-xs text-muted-foreground mt-1 ml-7">{testResult.error}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
