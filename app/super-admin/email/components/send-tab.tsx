"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  Send, Loader2, CheckCircle2, XCircle, Eye, Code, Mail
} from "lucide-react"

interface SendTabProps {
  prefillHtml?: string
  prefillSubject?: string
}

export function SendTab({ prefillHtml, prefillSubject }: SendTabProps) {
  const [recipients, setRecipients] = useState("")
  const [subject, setSubject] = useState(prefillSubject || "Test-E-Mail")
  const [htmlContent, setHtmlContent] = useState(prefillHtml || `<h2>Test-E-Mail</h2>\n<p>Dies ist eine Test-E-Mail von Effizienz Praxis.</p>`)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit")
  const { toast } = useToast()

  const prevPrefillRef = useRef(prefillHtml)
  useEffect(() => {
    if (prefillHtml && prefillHtml !== prevPrefillRef.current) {
      setHtmlContent(prefillHtml)
      if (prefillSubject) setSubject(prefillSubject)
      prevPrefillRef.current = prefillHtml
    }
  }, [prefillHtml, prefillSubject])

  async function handleSendTest() {
    if (!recipients.trim()) {
      toast({ title: "Fehler", description: "Bitte geben Sie mindestens eine E-Mail-Adresse ein.", variant: "destructive" })
      return
    }

    setSending(true)
    setResult(null)
    try {
      const to = recipients.split(",").map((r) => r.trim()).filter(Boolean)
      const res = await fetch("/api/super-admin/send-custom-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, html: htmlContent }),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        setResult({ success: true, message: data.message || "E-Mail erfolgreich gesendet!" })
        toast({ title: "Gesendet", description: data.message })
      } else {
        setResult({ success: false, message: data.error || "Fehler beim Senden" })
        toast({ title: "Fehler", description: data.error, variant: "destructive" })
      }
    } catch {
      setResult({ success: false, message: "Netzwerkfehler" })
    } finally {
      setSending(false)
    }
  }

  async function handleSendTestEmail() {
    if (!recipients.trim()) {
      toast({ title: "Fehler", description: "Bitte geben Sie eine E-Mail-Adresse ein.", variant: "destructive" })
      return
    }

    setSending(true)
    setResult(null)
    try {
      const res = await fetch("/api/super-admin/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient: recipients.split(",")[0].trim() }),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        setResult({ success: true, message: "Test-E-Mail erfolgreich gesendet!" })
        toast({ title: "Gesendet", description: "Test-E-Mail wurde gesendet." })
      } else {
        setResult({ success: false, message: data.error || "Fehler" })
      }
    } catch {
      setResult({ success: false, message: "Netzwerkfehler" })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      {/* Send form */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>E-Mail senden</CardTitle>
          <CardDescription>Senden Sie eine benutzerdefinierte oder Template-basierte E-Mail</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Empfaenger</Label>
            <Input
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              placeholder="email@example.com, email2@example.com"
            />
            <p className="text-xs text-muted-foreground">Mehrere Empfaenger mit Komma trennen</p>
          </div>

          <div className="space-y-2">
            <Label>Betreff</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Betreff der E-Mail"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>HTML-Inhalt</Label>
              <div className="flex gap-1 rounded-lg border p-0.5">
                <Button variant={viewMode === "edit" ? "default" : "ghost"} size="sm" className="h-7 text-xs" onClick={() => setViewMode("edit")}>
                  <Code className="h-3 w-3 mr-1" />
                  Editor
                </Button>
                <Button variant={viewMode === "preview" ? "default" : "ghost"} size="sm" className="h-7 text-xs" onClick={() => setViewMode("preview")}>
                  <Eye className="h-3 w-3 mr-1" />
                  Vorschau
                </Button>
              </div>
            </div>
            {viewMode === "edit" ? (
              <Textarea
                rows={16}
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                className="font-mono text-xs"
                placeholder="<h1>Ihre E-Mail</h1>"
              />
            ) : (
              <div className="border rounded-lg overflow-hidden bg-white">
                <iframe
                  srcDoc={htmlContent}
                  className="w-full h-[400px] border-0"
                  sandbox="allow-same-origin"
                  title="Vorschau"
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={handleSendTestEmail} variant="outline" disabled={sending}>
              {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
              System-Test senden
            </Button>
            <Button onClick={handleSendTest} disabled={sending}>
              {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Custom E-Mail senden
            </Button>
          </div>

          {result && (
            <div className={`p-4 rounded-lg border ${result.success ? "bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800/40" : "bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800/40"}`}>
              <div className="flex items-center gap-2">
                {result.success ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
                <p className="text-sm font-medium">{result.message}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick actions sidebar */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Schnellaktionen</CardTitle>
          <CardDescription>Haeufig verwendete E-Mail-Aktionen</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => {
              setSubject("Test-E-Mail von Effizienz Praxis")
              setHtmlContent(`<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
  <h2 style="color:#3b82f6;">Test-E-Mail</h2>
  <p>Diese Test-E-Mail bestaetigt, dass Ihr E-Mail-System korrekt konfiguriert ist.</p>
  <p style="color:#6b7280;font-size:14px;">Zeitstempel: ${new Date().toLocaleString("de-DE")}</p>
</div>`)
            }}
          >
            <Mail className="h-4 w-4 mr-2" />
            Test-Template laden
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => {
              setSubject("Willkommen bei Effizienz Praxis!")
              setHtmlContent(`<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
  <div style="background-color:#3b82f6;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
    <h1 style="color:#fff;margin:0;">Willkommen!</h1>
  </div>
  <div style="padding:32px;background:#fff;border:1px solid #e2e8f0;">
    <p>Vielen Dank fuer Ihre Registrierung.</p>
    <p>Ihr Account wurde erfolgreich erstellt.</p>
    <div style="text-align:center;margin:24px 0;">
      <a href="#" style="background:#3b82f6;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">Jetzt einloggen</a>
    </div>
  </div>
  <div style="padding:16px;text-align:center;background:#f8fafc;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;border-top:none;">
    <p style="color:#94a3b8;font-size:12px;">Effizienz Praxis GmbH</p>
  </div>
</div>`)
            }}
          >
            <Mail className="h-4 w-4 mr-2" />
            Willkommens-Template laden
          </Button>

          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Hinweise</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>- "System-Test" sendet eine einfache Bestaetigungs-Mail</li>
              <li>- "Custom E-Mail" sendet den eingegebenen HTML-Inhalt</li>
              <li>- Nutzen Sie den Template-Designer fuer komplexe Layouts</li>
              <li>- Testen Sie immer zuerst mit Ihrer eigenen Adresse</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
