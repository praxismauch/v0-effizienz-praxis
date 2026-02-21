"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import {
  Loader2, Save, Zap, Server, CheckCircle2, XCircle
} from "lucide-react"

const PRESETS = [
  { name: "Hostinger", host: "smtp.hostinger.com", port: "465", ssl: true },
  { name: "Gmail", host: "smtp.gmail.com", port: "587", ssl: false },
  { name: "Outlook", host: "smtp-mail.outlook.com", port: "587", ssl: false },
  { name: "IONOS", host: "smtp.ionos.de", port: "587", ssl: false },
  { name: "Strato", host: "smtp.strato.de", port: "465", ssl: true },
]

interface SmtpForm {
  host: string
  port: string
  username: string
  password: string
  use_ssl: boolean
  from_email: string
}

export function SmtpConfigTab() {
  const [form, setForm] = useState<SmtpForm>({
    host: "", port: "587", username: "", password: "", use_ssl: false, from_email: ""
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null)
  const [source, setSource] = useState<string>("none")
  const { toast } = useToast()

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/super-admin/email-config")
        const data = await res.json()
        if (data.smtpHost) {
          setForm((prev) => ({
            ...prev,
            host: data.smtpHost || "",
            port: String(data.smtpPort || "587"),
          }))
          setSource(data.smtpSource || "none")
        }
      } catch { /* ignore */ }
      setLoading(false)
    }
    load()
  }, [])

  function applyPreset(preset: typeof PRESETS[0]) {
    setForm((prev) => ({ ...prev, host: preset.host, port: preset.port, use_ssl: preset.ssl }))
    toast({ title: "Preset angewendet", description: `${preset.name} SMTP-Einstellungen geladen.` })
  }

  async function handleTest() {
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

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch("/api/super-admin/smtp-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast({ title: "Gespeichert", description: "SMTP-Konfiguration wurde gespeichert." })
      } else {
        const data = await res.json()
        toast({ title: "Fehler", description: data.error || "Speichern fehlgeschlagen", variant: "destructive" })
      }
    } catch {
      toast({ title: "Fehler", description: "Netzwerkfehler", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="space-y-6">
      {/* Source indicator */}
      {source !== "none" && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200 dark:bg-blue-900/10 dark:border-blue-800/40">
          <Server className="h-4 w-4 text-blue-600" />
          <p className="text-sm text-blue-700 dark:text-blue-400">
            Aktive Konfiguration stammt aus: <strong>{source === "configured" ? "Umgebungsvariablen / Datenbank" : source}</strong>
          </p>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Config form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>SMTP-Einstellungen</CardTitle>
            <CardDescription>Konfigurieren Sie Ihren ausgehenden E-Mail-Server</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>SMTP-Host</Label>
                <Input value={form.host} onChange={(e) => setForm((p) => ({ ...p, host: e.target.value }))} placeholder="smtp.example.com" />
              </div>
              <div className="space-y-2">
                <Label>Port</Label>
                <Input value={form.port} onChange={(e) => setForm((p) => ({ ...p, port: e.target.value }))} placeholder="587" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Benutzername</Label>
                <Input value={form.username} onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))} placeholder="user@example.com" />
              </div>
              <div className="space-y-2">
                <Label>Passwort</Label>
                <Input type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} placeholder="Passwort" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Absender-E-Mail</Label>
              <Input value={form.from_email} onChange={(e) => setForm((p) => ({ ...p, from_email: e.target.value }))} placeholder="noreply@example.com" />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <p className="text-sm font-medium">SSL/TLS verwenden</p>
                <p className="text-xs text-muted-foreground">Port 465 verwendet SSL, Port 587 verwendet STARTTLS</p>
              </div>
              <Switch checked={form.use_ssl} onCheckedChange={(v) => setForm((p) => ({ ...p, use_ssl: v }))} />
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Speichern
              </Button>
              <Button variant="outline" onClick={handleTest} disabled={testing}>
                {testing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
                Verbindung testen
              </Button>
            </div>

            {testResult && (
              <div className={`p-4 rounded-lg border ${testResult.success ? "bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800/40" : "bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800/40"}`}>
                <div className="flex items-center gap-2">
                  {testResult.success ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
                  <p className="text-sm font-medium">{testResult.success ? "Verbindung erfolgreich!" : "Verbindung fehlgeschlagen"}</p>
                </div>
                {testResult.error && <p className="text-xs text-muted-foreground mt-1 ml-7">{testResult.error}</p>}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Presets sidebar */}
        <Card>
          <CardHeader>
            <CardTitle>Schnell-Presets</CardTitle>
            <CardDescription>Vorkonfigurierte Anbieter-Einstellungen</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => applyPreset(preset)}
                className="w-full flex items-center justify-between p-3 rounded-lg border hover:border-primary/40 hover:bg-muted/50 transition-colors text-left"
              >
                <div>
                  <p className="text-sm font-medium">{preset.name}</p>
                  <p className="text-xs text-muted-foreground">{preset.host}:{preset.port}</p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {preset.ssl ? "SSL" : "STARTTLS"}
                </Badge>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
