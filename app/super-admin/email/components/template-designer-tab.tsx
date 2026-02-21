"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Mail, UserPlus, ClipboardList, Bell, CalendarCheck, FileText,
  Palette, Eye, Code, Sparkles
} from "lucide-react"

const TEMPLATES = [
  { id: "welcome", name: "Willkommen", description: "Aktivierungs- & Willkommens-E-Mail", icon: UserPlus, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  { id: "reminder", name: "Aufgaben-Erinnerung", description: "Erinnerung an offene Aufgaben", icon: Bell, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  { id: "weekly", name: "Wochenzusammenfassung", description: "Wöchentlicher Status-Bericht", icon: CalendarCheck, color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  { id: "waitlist", name: "Warteliste", description: "Bestätigung der Warteliste", icon: ClipboardList, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  { id: "invite", name: "Einladung", description: "Team- oder Patienten-Einladung", icon: Mail, color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" },
  { id: "custom", name: "Benutzerdefiniert", description: "Eigenes Template erstellen", icon: Sparkles, color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" },
]

const COLOR_PRESETS = [
  { name: "Blau (Standard)", primary: "#3b82f6", bg: "#f0f7ff", text: "#1e293b" },
  { name: "Gruen Medical", primary: "#10b981", bg: "#f0fdf4", text: "#1e293b" },
  { name: "Indigo Premium", primary: "#6366f1", bg: "#f5f3ff", text: "#1e293b" },
  { name: "Orange Warm", primary: "#f97316", bg: "#fff7ed", text: "#1e293b" },
  { name: "Dunkel Elegant", primary: "#3b82f6", bg: "#1e293b", text: "#f8fafc" },
]

function generateHtml(config: TemplateConfig): string {
  const { subject, headerText, bodyContent, ctaText, ctaUrl, footerText, colors, logoUrl } = config
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background-color:${colors.bg};color:${colors.text};">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <!-- Header -->
    <div style="background-color:${colors.primary};border-radius:12px 12px 0 0;padding:32px 24px;text-align:center;">
      ${logoUrl ? `<img src="${logoUrl}" alt="Logo" style="height:40px;margin-bottom:16px;" />` : ""}
      <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">${headerText || subject}</h1>
    </div>
    <!-- Body -->
    <div style="background-color:#ffffff;padding:32px 24px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
      ${bodyContent.split("\n").map(line => `<p style="margin:0 0 16px;line-height:1.6;color:${colors.text};">${line}</p>`).join("\n      ")}
      ${ctaText ? `
      <div style="text-align:center;margin:32px 0;">
        <a href="${ctaUrl || "#"}" style="display:inline-block;background-color:${colors.primary};color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">${ctaText}</a>
      </div>` : ""}
    </div>
    <!-- Footer -->
    <div style="background-color:#f8fafc;border-radius:0 0 12px 12px;padding:24px;text-align:center;border:1px solid #e2e8f0;border-top:none;">
      <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.5;">${footerText}</p>
    </div>
  </div>
</body>
</html>`
}

interface TemplateConfig {
  templateId: string
  subject: string
  headerText: string
  bodyContent: string
  ctaText: string
  ctaUrl: string
  footerText: string
  colors: { primary: string; bg: string; text: string }
  logoUrl: string
}

const DEFAULT_CONFIG: TemplateConfig = {
  templateId: "custom",
  subject: "Betreff der E-Mail",
  headerText: "Willkommen bei Effizienz Praxis",
  bodyContent: "Vielen Dank, dass Sie sich registriert haben.\n\nWir freuen uns, Sie in unserem Team willkommen zu heissen. Hier finden Sie alle wichtigen Informationen fuer den Einstieg.",
  ctaText: "Zum Dashboard",
  ctaUrl: "https://effizienz-praxis.de/dashboard",
  footerText: "Effizienz Praxis GmbH | Diese E-Mail wurde automatisch versendet.",
  colors: COLOR_PRESETS[0],
  logoUrl: "",
}

const TEMPLATE_DEFAULTS: Record<string, Partial<TemplateConfig>> = {
  welcome: {
    subject: "Willkommen bei Effizienz Praxis!",
    headerText: "Herzlich Willkommen!",
    bodyContent: "wir freuen uns sehr, Sie bei Effizienz Praxis begruessen zu duerfen!\n\nIhr Account wurde erfolgreich erstellt. Sie koennen sich ab sofort einloggen und alle Funktionen nutzen.\n\nBei Fragen stehen wir Ihnen jederzeit zur Verfuegung.",
    ctaText: "Jetzt einloggen",
    ctaUrl: "https://effizienz-praxis.de/login",
  },
  reminder: {
    subject: "Erinnerung: Offene Aufgaben",
    headerText: "Aufgaben-Erinnerung",
    bodyContent: "Sie haben offene Aufgaben, die Ihre Aufmerksamkeit erfordern.\n\nBitte ueberpruefen Sie Ihre Aufgabenliste und schliessen Sie die faelligen Eintraege ab.",
    ctaText: "Aufgaben ansehen",
    ctaUrl: "https://effizienz-praxis.de/todos",
  },
  weekly: {
    subject: "Ihre Wochenzusammenfassung",
    headerText: "Wochenbericht",
    bodyContent: "Hier ist Ihre Zusammenfassung der letzten Woche.\n\nAlle wichtigen Kennzahlen und Aktivitaeten auf einen Blick.",
    ctaText: "Vollstaendigen Bericht ansehen",
    ctaUrl: "https://effizienz-praxis.de/analytics",
  },
  waitlist: {
    subject: "Warteliste-Bestaetigung",
    headerText: "Sie sind auf der Warteliste!",
    bodyContent: "Vielen Dank fuer Ihr Interesse an Effizienz Praxis.\n\nWir haben Sie auf unsere Warteliste gesetzt und benachrichtigen Sie, sobald ein Platz verfuegbar ist.",
    ctaText: "",
    ctaUrl: "",
  },
  invite: {
    subject: "Sie wurden eingeladen!",
    headerText: "Einladung zu Effizienz Praxis",
    bodyContent: "Sie wurden eingeladen, dem Team beizutreten.\n\nKlicken Sie auf den Button unten, um Ihre Einladung anzunehmen und Ihren Account einzurichten.",
    ctaText: "Einladung annehmen",
    ctaUrl: "https://effizienz-praxis.de/invite",
  },
}

export function TemplateDesignerTab({ onUseTemplate }: { onUseTemplate?: (html: string, subject: string) => void }) {
  const [config, setConfig] = useState<TemplateConfig>(DEFAULT_CONFIG)
  const [viewMode, setViewMode] = useState<"design" | "preview" | "code">("design")

  const html = generateHtml(config)

  function selectTemplate(id: string) {
    const defaults = TEMPLATE_DEFAULTS[id]
    if (defaults) {
      setConfig((prev) => ({ ...prev, ...defaults, templateId: id }))
    } else {
      setConfig((prev) => ({ ...prev, templateId: id }))
    }
  }

  return (
    <div className="space-y-6">
      {/* Template Gallery */}
      <Card>
        <CardHeader>
          <CardTitle>Template-Vorlagen</CardTitle>
          <CardDescription>Waehlen Sie eine Vorlage als Ausgangspunkt</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => selectTemplate(t.id)}
                className={`p-4 rounded-lg border-2 text-left transition-all hover:shadow-md ${config.templateId === t.id ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/40"}`}
              >
                <div className={`p-2 rounded-lg w-fit ${t.color}`}>
                  <t.icon className="h-5 w-5" />
                </div>
                <p className="font-medium text-sm mt-2">{t.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{t.description}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Editor + Preview */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Editor Panel */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Layout-Editor</CardTitle>
                <CardDescription>Passen Sie Inhalt und Design an</CardDescription>
              </div>
              <div className="flex gap-1 rounded-lg border p-1">
                {[
                  { mode: "design" as const, icon: Palette, label: "Design" },
                  { mode: "code" as const, icon: Code, label: "HTML" },
                ].map(({ mode, icon: Icon, label }) => (
                  <Button
                    key={mode}
                    variant={viewMode === mode ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode(mode)}
                    className="gap-1.5"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {viewMode === "design" ? (
              <>
                <div className="space-y-2">
                  <Label>Betreff</Label>
                  <Input value={config.subject} onChange={(e) => setConfig((p) => ({ ...p, subject: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Header-Text</Label>
                  <Input value={config.headerText} onChange={(e) => setConfig((p) => ({ ...p, headerText: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Inhalt</Label>
                  <Textarea rows={6} value={config.bodyContent} onChange={(e) => setConfig((p) => ({ ...p, bodyContent: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Button-Text</Label>
                    <Input value={config.ctaText} onChange={(e) => setConfig((p) => ({ ...p, ctaText: e.target.value }))} placeholder="Leer lassen zum Ausblenden" />
                  </div>
                  <div className="space-y-2">
                    <Label>Button-URL</Label>
                    <Input value={config.ctaUrl} onChange={(e) => setConfig((p) => ({ ...p, ctaUrl: e.target.value }))} placeholder="https://..." />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Footer</Label>
                  <Input value={config.footerText} onChange={(e) => setConfig((p) => ({ ...p, footerText: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Logo-URL (optional)</Label>
                  <Input value={config.logoUrl} onChange={(e) => setConfig((p) => ({ ...p, logoUrl: e.target.value }))} placeholder="https://example.com/logo.png" />
                </div>

                {/* Color scheme */}
                <div className="space-y-2">
                  <Label>Farbschema</Label>
                  <Select
                    value={COLOR_PRESETS.findIndex((p) => p.primary === config.colors.primary && p.bg === config.colors.bg).toString()}
                    onValueChange={(v) => setConfig((p) => ({ ...p, colors: COLOR_PRESETS[parseInt(v)] || COLOR_PRESETS[0] }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COLOR_PRESETS.map((preset, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: preset.primary }} />
                            {preset.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Primaerfarbe</Label>
                    <div className="flex gap-2 items-center">
                      <input type="color" value={config.colors.primary} onChange={(e) => setConfig((p) => ({ ...p, colors: { ...p.colors, primary: e.target.value } }))} className="h-8 w-8 rounded cursor-pointer" />
                      <Input value={config.colors.primary} onChange={(e) => setConfig((p) => ({ ...p, colors: { ...p.colors, primary: e.target.value } }))} className="font-mono text-xs" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Hintergrund</Label>
                    <div className="flex gap-2 items-center">
                      <input type="color" value={config.colors.bg} onChange={(e) => setConfig((p) => ({ ...p, colors: { ...p.colors, bg: e.target.value } }))} className="h-8 w-8 rounded cursor-pointer" />
                      <Input value={config.colors.bg} onChange={(e) => setConfig((p) => ({ ...p, colors: { ...p.colors, bg: e.target.value } }))} className="font-mono text-xs" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Textfarbe</Label>
                    <div className="flex gap-2 items-center">
                      <input type="color" value={config.colors.text} onChange={(e) => setConfig((p) => ({ ...p, colors: { ...p.colors, text: e.target.value } }))} className="h-8 w-8 rounded cursor-pointer" />
                      <Input value={config.colors.text} onChange={(e) => setConfig((p) => ({ ...p, colors: { ...p.colors, text: e.target.value } }))} className="font-mono text-xs" />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Textarea
                  rows={24}
                  value={html}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(html)}
                >
                  HTML kopieren
                </Button>
              </div>
            )}

            {onUseTemplate && (
              <Button className="w-full" onClick={() => onUseTemplate(html, config.subject)}>
                <Mail className="h-4 w-4 mr-2" />
                Template zum Versand verwenden
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Live Preview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Vorschau</CardTitle>
                <CardDescription>Live-Vorschau der E-Mail</CardDescription>
              </div>
              <Badge variant="secondary">
                <Eye className="h-3 w-3 mr-1" />
                Live
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden bg-white">
              <div className="bg-muted/50 px-4 py-2 border-b flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                </div>
                <span className="text-xs text-muted-foreground ml-2 truncate">Betreff: {config.subject}</span>
              </div>
              <iframe
                srcDoc={html}
                className="w-full h-[600px] border-0"
                sandbox="allow-same-origin"
                title="E-Mail Vorschau"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
