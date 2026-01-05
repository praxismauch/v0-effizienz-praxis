"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Send,
  RefreshCw,
  ExternalLink,
  Info,
  Shield,
  Zap,
  FileText,
  Server,
} from "lucide-react"
import { toast } from "sonner"

interface EmailConfig {
  configured: boolean
  host: string
  port: number
  hasAuth: boolean
  source: string
}

interface DiagnosticResult {
  status: "success" | "warning" | "error" | "info"
  title: string
  message: string
  action?: string
  actionLink?: string
}

export function EmailDiagnostics() {
  const [activeTab, setActiveTab] = useState("overview")
  const [config, setConfig] = useState<EmailConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [testEmailAddress, setTestEmailAddress] = useState("")
  const [sendingTest, setSendingTest] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [emailLogs, setEmailLogs] = useState<any[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)

  useEffect(() => {
    loadEmailConfig()
    loadEmailLogs()
  }, [])

  const loadEmailConfig = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/super-admin/email-config")
      if (response.ok) {
        const data = await response.json()
        setConfig(data.config || data)
        runDiagnostics(data.config || data)
      }
    } catch (error) {
      console.error("Error loading email config:", error)
      toast.error("Fehler beim Laden der E-Mail-Konfiguration")
    } finally {
      setLoading(false)
    }
  }

  const loadEmailLogs = async () => {
    try {
      setLoadingLogs(true)
      const response = await fetch("/api/super-admin/email-logs")
      if (response.ok) {
        const data = await response.json()
        setEmailLogs(data.logs || [])
      }
    } catch (error) {
      console.error("Error loading email logs:", error)
    } finally {
      setLoadingLogs(false)
    }
  }

  const runDiagnostics = (configData: EmailConfig) => {
    const results: DiagnosticResult[] = []

    if (!configData.configured) {
      results.push({
        status: "error",
        title: "SMTP nicht konfiguriert",
        message: "Bitte konfigurieren Sie Ihre SMTP-Einstellungen für den E-Mail-Versand.",
        action: "SMTP konfigurieren",
      })
    } else {
      results.push({
        status: "success",
        title: "SMTP konfiguriert",
        message: `Server: ${configData.host}:${configData.port}`,
      })

      if (!configData.hasAuth) {
        results.push({
          status: "warning",
          title: "Keine Authentifizierung",
          message: "SMTP-Server ohne Authentifizierung konfiguriert. Einige Server benötigen Login-Daten.",
        })
      }
    }

    setDiagnostics(results)
  }

  const handleSendTest = async () => {
    if (!testEmailAddress || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmailAddress)) {
      toast.error("Bitte geben Sie eine gültige E-Mail-Adresse ein")
      return
    }

    try {
      setSendingTest(true)
      setTestResult(null)

      const response = await fetch("/api/super-admin/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testEmailAddress }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setTestResult("success")
        toast.success(`Test-E-Mail erfolgreich an ${testEmailAddress} gesendet!`)
        loadEmailLogs()
      } else {
        setTestResult("error")
        toast.error(data.error || "Fehler beim Senden der Test-E-Mail")
      }
    } catch (error) {
      console.error("Error sending test email:", error)
      setTestResult("error")
      toast.error("Fehler beim Senden der Test-E-Mail")
    } finally {
      setSendingTest(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([loadEmailConfig(), loadEmailLogs()])
    setRefreshing(false)
    toast.success("Daten aktualisiert")
  }

  const getStatusIcon = (status: DiagnosticResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-600" />
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      case "info":
        return <Info className="h-5 w-5 text-blue-600" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">E-Mail-Diagnose</h2>
          <p className="text-muted-foreground">Überprüfen und testen Sie Ihre SMTP-Konfiguration</p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Aktualisieren
        </Button>
      </div>

      {/* Status Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SMTP-Status</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {config?.configured ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="text-2xl font-bold text-green-600">Aktiv</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="text-2xl font-bold text-red-600">Inaktiv</span>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {config?.host ? `${config.host}:${config.port}` : "Nicht konfiguriert"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Authentifizierung</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {config?.hasAuth ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-semibold">Konfiguriert</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm font-semibold">Nicht gesetzt</span>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {config?.hasAuth ? "Benutzer und Passwort gesetzt" : "Keine Anmeldedaten"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Letzte E-Mails</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{emailLogs.length}</div>
            <p className="text-xs text-muted-foreground">In den letzten 24 Stunden</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="test">Test senden</TabsTrigger>
          <TabsTrigger value="logs">E-Mail-Logs</TabsTrigger>
          <TabsTrigger value="troubleshooting">Fehlerbehebung</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Diagnose-Ergebnisse</CardTitle>
              <CardDescription>Automatische Überprüfung Ihrer SMTP-Konfiguration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {diagnostics.length === 0 ? (
                <p className="text-muted-foreground">Keine Diagnose-Ergebnisse verfügbar</p>
              ) : (
                diagnostics.map((diagnostic, index) => (
                  <div key={index}>
                    <div className="flex items-start gap-3">
                      {getStatusIcon(diagnostic.status)}
                      <div className="flex-1">
                        <h4 className="font-semibold">{diagnostic.title}</h4>
                        <p className="text-sm text-muted-foreground">{diagnostic.message}</p>
                      </div>
                    </div>
                    {index < diagnostics.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SMTP-Konfiguration</CardTitle>
              <CardDescription>Aktuelle Server-Einstellungen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-900 dark:text-blue-200">
                    <strong>Hinweis:</strong> E-Mail-Versand erfolgt über SMTP. Gehen Sie zu Einstellungen {">"} SMTP,
                    um Ihre Server-Einstellungen zu verwalten.
                  </p>
                </div>

                {config?.configured && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Server:</span>
                      <span className="ml-2 font-mono">{config.host}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Port:</span>
                      <span className="ml-2 font-mono">{config.port}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Test Tab */}
        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test-E-Mail senden</CardTitle>
              <CardDescription>Senden Sie eine Test-E-Mail, um die SMTP-Konfiguration zu überprüfen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="test-email">E-Mail-Adresse</Label>
                <Input
                  id="test-email"
                  type="email"
                  placeholder="test@example.com"
                  value={testEmailAddress}
                  onChange={(e) => setTestEmailAddress(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendTest()}
                />
                <p className="text-xs text-muted-foreground">
                  Geben Sie die E-Mail-Adresse ein, an die die Test-E-Mail gesendet werden soll
                </p>
              </div>

              <Button onClick={handleSendTest} disabled={sendingTest || !config?.configured}>
                {sendingTest ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sendet...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Test-E-Mail senden
                  </>
                )}
              </Button>

              {testResult === "success" && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Erfolgreich gesendet</AlertTitle>
                  <AlertDescription>
                    Die Test-E-Mail wurde erfolgreich gesendet. Überprüfen Sie den Posteingang (und Spam-Ordner) von{" "}
                    {testEmailAddress}.
                  </AlertDescription>
                </Alert>
              )}

              {testResult === "error" && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>Fehler beim Senden</AlertTitle>
                  <AlertDescription>
                    Die Test-E-Mail konnte nicht gesendet werden. Überprüfen Sie die SMTP-Konfiguration und Logs.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>E-Mail-Logs</CardTitle>
              <CardDescription>Letzte E-Mail-Aktivitäten und Zustellungsstatus</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingLogs ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : emailLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Keine E-Mail-Logs verfügbar</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {emailLogs.slice(0, 50).map((log, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium truncate">{log.message}</span>
                          {log.level === "error" && (
                            <Badge variant="destructive" className="shrink-0">
                              Fehler
                            </Badge>
                          )}
                          {log.level === "warn" && (
                            <Badge variant="secondary" className="shrink-0">
                              Warnung
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.created_at).toLocaleString("de-DE")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Troubleshooting Tab */}
        <TabsContent value="troubleshooting" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fehlerbehebung</CardTitle>
              <CardDescription>Häufige SMTP-Probleme und deren Lösungen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">E-Mails kommen nicht an</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Überprüfen Sie den Spam-Ordner des Empfängers</li>
                    <li>Stellen Sie sicher, dass SPF, DKIM und DMARC DNS-Einträge korrekt sind</li>
                    <li>Prüfen Sie, ob der SMTP-Server erreichbar ist</li>
                    <li>Überprüfen Sie Firewall-Regeln (Port 587/465)</li>
                  </ul>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">Verbindungsfehler</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Überprüfen Sie Host und Port des SMTP-Servers</li>
                    <li>Stellen Sie sicher, dass TLS/SSL korrekt konfiguriert ist</li>
                    <li>Prüfen Sie Benutzername und Passwort</li>
                    <li>Einige Provider erfordern App-Passwörter statt regulärer Passwörter</li>
                  </ul>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">Gängige SMTP-Server</h4>
                  <div className="space-y-2 text-sm">
                    <div className="p-2 bg-muted rounded">
                      <strong>Gmail:</strong> smtp.gmail.com, Port 587 (TLS)
                    </div>
                    <div className="p-2 bg-muted rounded">
                      <strong>Outlook/Office 365:</strong> smtp.office365.com, Port 587 (TLS)
                    </div>
                    <div className="p-2 bg-muted rounded">
                      <strong>IONOS:</strong> smtp.ionos.de, Port 587 (TLS)
                    </div>
                    <div className="p-2 bg-muted rounded">
                      <strong>Strato:</strong> smtp.strato.de, Port 465 (SSL)
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">Nützliche Tools</h4>
                  <div className="flex flex-col gap-2 mt-2">
                    <Button variant="outline" onClick={() => window.open("https://mxtoolbox.com/", "_blank")}>
                      MXToolbox - DNS/SPF/DKIM prüfen
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                    <Button variant="outline" onClick={() => window.open("https://www.mail-tester.com/", "_blank")}>
                      Mail-Tester - E-Mail-Zustellbarkeit
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default EmailDiagnostics
