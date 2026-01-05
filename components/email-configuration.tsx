"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Mail, Send, AlertCircle, Loader2, Server, Eye, EyeOff, ShieldCheck, FileSignature } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

export function EmailConfiguration() {
  const [testEmailRecipient, setTestEmailRecipient] = useState("")
  const [testEmailStatus, setTestEmailStatus] = useState<{
    loading: boolean
    success: boolean | null
    message: string
  }>({ loading: false, success: null, message: "" })
  const [smtpConfig, setSmtpConfig] = useState({
    host: "",
    port: "587",
    username: "",
    password: "",
    secure: true,
    protocol: "smtp" as "smtp" | "pop3",
    emailSignature: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isSavingSmtp, setIsSavingSmtp] = useState(false)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchSmtpConfig()
  }, [])

  const fetchSmtpConfig = async () => {
    try {
      const response = await fetch("/api/super-admin/smtp-config")

      if (!response.ok) {
        console.error("SMTP config API error:", response.status, response.statusText)
        return
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        console.error("SMTP config API returned non-JSON response")
        return
      }

      const data = await response.json()
      if (data.config) {
        setSmtpConfig({
          ...data.config,
          emailSignature: data.config.emailSignature || "",
        })
      }
    } catch (error) {
      console.error("Error fetching SMTP config:", error)
    }
  }

  const sendTestEmail = async () => {
    if (!testEmailRecipient || !testEmailRecipient.includes("@")) {
      setTestEmailStatus({
        loading: false,
        success: false,
        message: "Bitte geben Sie eine gültige E-Mail-Adresse ein",
      })
      return
    }

    setTestEmailStatus({ loading: true, success: null, message: "" })

    try {
      const response = await fetch("/api/super-admin/smtp-test-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: testEmailRecipient,
          smtpConfig,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setTestEmailStatus({
          loading: false,
          success: false,
          message: data.error || "Fehler beim Senden der Test-E-Mail",
        })
      } else {
        setTestEmailStatus({
          loading: false,
          success: true,
          message: "Test-E-Mail erfolgreich über SMTP gesendet!",
        })
      }
    } catch (error) {
      setTestEmailStatus({
        loading: false,
        success: false,
        message: error instanceof Error ? error.message : "Unbekannter Fehler",
      })
    }
  }

  const saveSmtpConfig = async () => {
    setIsSavingSmtp(true)
    try {
      const response = await fetch("/api/super-admin/smtp-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(smtpConfig),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to save SMTP config")
      }

      toast({
        title: "Konfiguration gespeichert",
        description: "Die E-Mail-Server-Einstellungen wurden erfolgreich gespeichert.",
      })
    } catch (error) {
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Konfiguration konnte nicht gespeichert werden",
        variant: "destructive",
      })
    } finally {
      setIsSavingSmtp(false)
    }
  }

  const skipSmtpConfig = () => {
    toast({
      title: "Konfiguration übersprungen",
      description: "Sie können die E-Mail-Konfiguration später in den Einstellungen vornehmen.",
    })
  }

  const testSmtpConnection = async () => {
    setIsTestingConnection(true)
    try {
      const response = await fetch("/api/super-admin/smtp-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(smtpConfig),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Connection test failed")
      }

      toast({
        title: "Verbindung erfolgreich",
        description: data.message || "Die Verbindung zum E-Mail-Server wurde erfolgreich hergestellt.",
      })
    } catch (error) {
      toast({
        title: "Verbindung fehlgeschlagen",
        description: error instanceof Error ? error.message : "Verbindung konnte nicht hergestellt werden",
        variant: "destructive",
      })
    } finally {
      setIsTestingConnection(false)
    }
  }

  const applyPreset = (preset: "gmail" | "outlook") => {
    if (preset === "gmail") {
      setSmtpConfig({
        ...smtpConfig,
        host: "smtp.gmail.com",
        port: "587",
        secure: true,
        protocol: "smtp",
      })
    } else if (preset === "outlook") {
      setSmtpConfig({
        ...smtpConfig,
        host: "smtp-mail.outlook.com",
        port: "587",
        secure: true,
        protocol: "smtp",
      })
    }
    toast({
      title: "Voreinstellung angewendet",
      description: `${preset === "gmail" ? "Gmail" : "Outlook"} SMTP-Einstellungen wurden geladen.`,
    })
  }

  const applySignatureTemplate = (template: "professional" | "simple" | "minimal") => {
    const templates = {
      professional: `--
Mit freundlichen Grüßen

Ihr Praxisteam
Effizienz-Praxis

Tel: [Ihre Telefonnummer]
E-Mail: [Ihre E-Mail-Adresse]
Web: [Ihre Website]

Diese E-Mail wurde automatisch generiert.`,
      simple: `--
Mit freundlichen Grüßen
Ihr Praxisteam

Diese E-Mail wurde automatisch versendet.`,
      minimal: `--
Effizienz-Praxis
Automatische Benachrichtigung`,
    }

    setSmtpConfig({
      ...smtpConfig,
      emailSignature: templates[template],
    })

    toast({
      title: "Vorlage angewendet",
      description: "Die Signaturvorlage wurde eingefügt.",
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">E-Mail Konfiguration (POP/SMTP)</h2>
        <p className="text-muted-foreground">Verwalten Sie Ihre E-Mail-Server-Einstellungen für SMTP und POP3</p>
      </div>

      <Tabs defaultValue="smtp" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="smtp">SMTP Konfiguration</TabsTrigger>
          <TabsTrigger value="signature">E-Mail Signatur</TabsTrigger>
          <TabsTrigger value="test">Test E-Mail senden</TabsTrigger>
        </TabsList>

        <TabsContent value="smtp" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                POP/SMTP Server-Einstellungen
              </CardTitle>
              <CardDescription>
                Konfigurieren Sie Ihren E-Mail-Server für den Versand und Empfang von E-Mails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertTitle className="text-blue-900 dark:text-blue-100">Hinweis</AlertTitle>
                <AlertDescription className="text-blue-800 dark:text-blue-200">
                  Alle Felder sind optional. Sie können die Konfiguration jederzeit später vornehmen.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="protocol">Protokoll</Label>
                    <Select
                      value={smtpConfig.protocol}
                      onValueChange={(value: "smtp" | "pop3") => setSmtpConfig({ ...smtpConfig, protocol: value })}
                    >
                      <SelectTrigger id="protocol">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="smtp">SMTP (Senden)</SelectItem>
                        <SelectItem value="pop3">POP3 (Empfangen)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="host">Server Host</Label>
                    <Input
                      id="host"
                      placeholder="smtp.beispiel.de"
                      value={smtpConfig.host}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="port">Port</Label>
                    <Input
                      id="port"
                      placeholder="587"
                      value={smtpConfig.port}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, port: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Benutzername</Label>
                    <Input
                      id="username"
                      placeholder="email@beispiel.de"
                      value={smtpConfig.username}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, username: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Passwort</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={smtpConfig.password}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, password: e.target.value })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
                  <div className="space-y-0.5">
                    <Label htmlFor="secure" className="text-base">
                      SSL/TLS Verschlüsselung
                    </Label>
                    <p className="text-sm text-muted-foreground">Sichere Verbindung verwenden (empfohlen)</p>
                  </div>
                  <Switch
                    id="secure"
                    checked={smtpConfig.secure}
                    onCheckedChange={(checked) => setSmtpConfig({ ...smtpConfig, secure: checked })}
                  />
                </div>
              </div>

              <div className="pt-4 border-t space-y-3">
                <p className="text-sm font-medium">Schnelleinstellungen:</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => applyPreset("gmail")}>
                    Gmail Einstellungen
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => applyPreset("outlook")}>
                    Outlook Einstellungen
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={saveSmtpConfig} disabled={isSavingSmtp} className="flex-1">
                  {isSavingSmtp ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Speichert...
                    </>
                  ) : (
                    "Konfiguration speichern"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={testSmtpConnection}
                  disabled={isTestingConnection || !smtpConfig.host}
                >
                  {isTestingConnection ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testet...
                    </>
                  ) : (
                    "Verbindung testen"
                  )}
                </Button>
                <Button variant="ghost" onClick={skipSmtpConfig}>
                  Später konfigurieren
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="signature" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSignature className="h-5 w-5" />
                E-Mail Signatur
              </CardTitle>
              <CardDescription>
                Definieren Sie eine Signatur, die an alle automatisch versendeten E-Mails angehängt wird
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                <FileSignature className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertTitle className="text-amber-900 dark:text-amber-100">Globale Signatur</AlertTitle>
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  Diese Signatur wird automatisch an alle System-E-Mails angehängt (Benachrichtigungen, Erinnerungen,
                  Wochenzusammenfassungen, etc.)
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="emailSignature">Signaturtext</Label>
                  <Textarea
                    id="emailSignature"
                    placeholder="--&#10;Mit freundlichen Grüßen&#10;Ihr Praxisteam"
                    value={smtpConfig.emailSignature}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, emailSignature: e.target.value })}
                    rows={10}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Tipp: Beginnen Sie mit &quot;--&quot; um die Signatur vom Haupttext zu trennen
                  </p>
                </div>

                <div className="pt-4 border-t space-y-3">
                  <p className="text-sm font-medium">Signaturvorlagen:</p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => applySignatureTemplate("professional")}>
                      Professionell
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => applySignatureTemplate("simple")}>
                      Einfach
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => applySignatureTemplate("minimal")}>
                      Minimal
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSmtpConfig({ ...smtpConfig, emailSignature: "" })}
                    >
                      Leeren
                    </Button>
                  </div>
                </div>

                {smtpConfig.emailSignature && (
                  <div className="pt-4 border-t space-y-3">
                    <p className="text-sm font-medium">Vorschau:</p>
                    <div className="p-4 rounded-lg border bg-muted/50">
                      <p className="text-sm text-muted-foreground mb-2">[E-Mail Inhalt]</p>
                      <pre className="text-sm whitespace-pre-wrap font-sans">{smtpConfig.emailSignature}</pre>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={saveSmtpConfig} disabled={isSavingSmtp} className="flex-1">
                  {isSavingSmtp ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Speichert...
                    </>
                  ) : (
                    "Signatur speichern"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Test-E-Mail senden
              </CardTitle>
              <CardDescription>Senden Sie eine Test-E-Mail über Ihren konfigurierten SMTP-Server</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>SMTP-Konfiguration erforderlich</AlertTitle>
                <AlertDescription>
                  Stellen Sie sicher, dass Sie Ihre SMTP-Einstellungen im vorherigen Tab konfiguriert und gespeichert
                  haben.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="test-email-recipient">Empfänger E-Mail</Label>
                <Input
                  id="test-email-recipient"
                  type="email"
                  placeholder="test@beispiel.de"
                  value={testEmailRecipient}
                  onChange={(e) => setTestEmailRecipient(e.target.value)}
                />
              </div>

              <Button onClick={sendTestEmail} disabled={testEmailStatus.loading || !smtpConfig.host} className="w-full">
                {testEmailStatus.loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sendet...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Test-E-Mail via SMTP senden
                  </>
                )}
              </Button>

              {testEmailStatus.success !== null && (
                <div
                  className={cn(
                    "p-3 rounded-lg border",
                    testEmailStatus.success
                      ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                      : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
                  )}
                >
                  <p
                    className={cn(
                      "text-sm",
                      testEmailStatus.success ? "text-green-900 dark:text-green-200" : "text-red-900 dark:text-red-200",
                    )}
                  >
                    {testEmailStatus.message}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default EmailConfiguration
